import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import { createHash } from "node:crypto";
import { afterEach, beforeEach, mock, test } from "node:test";
import ts from "typescript";
import { diagnoseQstash } from "./diagnose-qstash.mjs";

const require = createRequire(import.meta.url);
const { QstashError, QstashDailyRatelimitError } = require("@upstash/qstash");

// Compile the production TS in memory using the project's existing compiler.
// Exercise the installed SDK; replace only Redis/LiveKit, which must never run.
function loadTypeScript(relativePath, overrides = {}) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const compiledModule = { exports: {} };
  const wrapper = runInThisContext(`(function(require, module, exports) {${compiled}\n})`, { filename });
  wrapper((name) => Object.hasOwn(overrides, name) ? overrides[name] : require(name), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

const { qstashErrorDiagnostics } = loadTypeScript("../lib/qstash-diagnostics.ts");
const ownerAuth = loadTypeScript("../lib/qstash-owner-auth.ts");
const { ownerDiagnosticSignature, authorizeOwnerDiagnostic, QSTASH_DIAGNOSTIC_SESSION_ID, QSTASH_DIAGNOSTIC_PATH } = ownerAuth;
const noProviderCalls = () => { throw new Error("Redis/LiveKit calls are forbidden in this test"); };
const { scheduleVoiceCleanup, cleanupDeduplicationId, cleanupCallbackUrl, qstashReceiver } = loadTypeScript("../lib/voice-cleanup.ts", {
  "./voice-session": {
    ACTIVE_KEY: "unused",
    createRedis: noProviderCalls,
    createLiveKitApi: noProviderCalls,
  },
  "./qstash-diagnostics": { qstashErrorDiagnostics },
});
const { POST: publishProbe } = loadTypeScript("../app/api/voice/diagnostic/route.ts", {
  "../../../../lib/voice-cleanup": { scheduleVoiceCleanup, cleanupDeduplicationId },
  "../../../../lib/qstash-diagnostics": { qstashErrorDiagnostics },
  "../../../../lib/qstash-owner-auth": ownerAuth,
});
const cleanupSession = mock.fn();
const { POST: cleanupCallback } = loadTypeScript("../app/api/voice/cleanup/route.ts", {
  "../../../../lib/voice-cleanup": {
    cleanupCallbackUrl, qstashReceiver, cleanupExpiredVoiceSession: cleanupSession,
  },
  "../../../../lib/qstash-owner-auth": ownerAuth,
});

const sessionId = "abcdefghijklmnopqrstuvwx";
const callbackUrl = "https://portfolio.example/api/voice/cleanup";
const testEnvironment = {
  QSTASH_TOKEN: "synthetic-publish-secret",
  QSTASH_CURRENT_SIGNING_KEY: "synthetic-current-secret",
  QSTASH_NEXT_SIGNING_KEY: "synthetic-next-secret",
  VOICE_SESSION_HMAC_SECRET: "synthetic-hmac-secret-at-least-32-characters",
  VOICE_QSTASH_DIAGNOSTIC_ENABLED: undefined,
  VOICE_CLEANUP_URL: callbackUrl,
  QSTASH_URL: undefined,
  QSTASH_REGION: undefined,
  QSTASH_DEV: "false",
};
let previousEnvironment;

beforeEach(() => {
  previousEnvironment = Object.fromEntries(Object.keys(testEnvironment).map((name) => [name, process.env[name]]));
  for (const [name, value] of Object.entries(testEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  // An unconditional network guard: no test can use the real fetch implementation.
  mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected external call"); });
  mock.method(console, "error", () => {});
  mock.method(console, "warn", () => {});
  cleanupSession.mock.resetCalls();
  cleanupSession.mock.mockImplementation(noProviderCalls);
});

afterEach(() => {
  mock.restoreAll();
  for (const [name, value] of Object.entries(previousEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

function response(body, status = 200, headers = {}) {
  fetch.mock.mockImplementation(async (_url, options) => {
    // Check the actual SDK-emitted header on every mocked QStash publish,
    // including rejection, reconciliation, retry and protected-probe cases.
    assert.match(options.headers.get("Upstash-Deduplication-Id"), /^[A-Za-z0-9_-]{1,100}$/);
    return new Response(body, { status, headers });
  });
}

function diagnostic() {
  const calls = console.error.mock.calls.filter(({ arguments: args }) => args[0] === "[voice-cleanup] QStash publish failed");
  assert.equal(calls.length, 1);
  return calls[0].arguments[1];
}

test("installed SDK sends the full destination URL, seconds, retries and stable deduplication ID", async () => {
  response('{"messageId":"offline-message"}');
  assert.deepEqual(await scheduleVoiceCleanup(sessionId, 75, "initial"), { messageId: "offline-message" });
  assert.equal(fetch.mock.callCount(), 1);
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url, `https://qstash.upstash.io/v2/publish/${callbackUrl}`);
  assert.equal(options.method, "POST");
  assert.equal(options.headers.get("Upstash-Method"), "POST");
  assert.equal(options.headers.get("Content-Type"), "application/json");
  assert.equal(options.headers.get("Authorization"), `Bearer ${testEnvironment.QSTASH_TOKEN}`);
  assert.equal(options.headers.get("Upstash-Delay"), "75s");
  assert.equal(options.headers.get("Upstash-Retries"), "3");
  assert.equal(options.headers.get("Upstash-Deduplication-Id"), `${sessionId}-initial`);
  assert.equal(options.body, JSON.stringify({ sessionId }));
  assert.equal(console.error.mock.callCount(), 0);
});

test("reconciliation, heartbeat and bounded cleanup retry delays retain their scheduling", async () => {
  response('{"messageId":"offline-message"}');
  for (const [delay, tag, header] of [
    [1, "legacy-reconcile", "1s"], [74.9, "lease-123", "74s"],
    [15, "retry-1", "15s"], [3600, "retry-12", "3600s"], [0, "initial", "1s"],
  ]) {
    await scheduleVoiceCleanup(sessionId, delay, tag);
    const options = fetch.mock.calls.at(-1).arguments[1];
    assert.equal(options.headers.get("Upstash-Delay"), header);
    assert.equal(options.headers.get("Upstash-Retries"), "3");
    assert.equal(options.headers.get("Upstash-Deduplication-Id"), `${sessionId}-${tag}`);
  }
});

test("cleanup IDs use a stable bounded format for base64url sessions and distinct cleanup purposes", async () => {
  response('{"messageId":"offline-message"}');
  const base64urlSession = "AbCdEfGhIjKlMnOpQrStUv_-";
  const tags = ["initial", "lease-1800000075", "legacy-reconcile", "retry-1", "retry-2", `probe-1800000000-${"a".repeat(32)}`];
  const ids = [];
  for (const tag of tags) {
    await scheduleVoiceCleanup(base64urlSession, 75, tag);
    const id = fetch.mock.calls.at(-1).arguments[1].headers.get("Upstash-Deduplication-Id");
    assert.equal(id, `${base64urlSession}-${tag}`);
    ids.push(id);
  }
  assert.equal(new Set(ids).size, tags.length);
  await scheduleVoiceCleanup(base64urlSession, 75, tags[0]);
  assert.equal(fetch.mock.calls.at(-1).arguments[1].headers.get("Upstash-Deduplication-Id"), ids[0]);
});

test("unexpected deduplication characters are rejected before any QStash request", async () => {
  for (const value of ["bad:component", "bad/component", "bad component", "bad.component", "bad\ncomponent", "badécomponent", ""]) {
    await assert.rejects(scheduleVoiceCleanup(value, 75, "initial"), /Invalid voice cleanup deduplication ID/);
    await assert.rejects(scheduleVoiceCleanup(sessionId, 75, value), /Invalid voice cleanup deduplication ID/);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("deduplication ID is bounded and 202 duplicate acceptance remains successful", async () => {
  response('{"messageId":"existing-message","deduplicated":true}', 202);
  const result = await scheduleVoiceCleanup(sessionId, 75, "retry-".repeat(30));
  assert.equal(result.deduplicated, true);
  assert.equal(fetch.mock.calls[0].arguments[1].headers.get("Upstash-Deduplication-Id").length, 100);
  assert.equal(console.error.mock.callCount(), 0);
});

test("HTTP 400 exposes sanitized service fields and is rethrown without retrying publish", async () => {
  const body = JSON.stringify({ code: "ERR_MAX_RETRIES", error: "Retries exceeds maximum allowed: 3" });
  response(body, 400);
  await assert.rejects(scheduleVoiceCleanup(sessionId, 75, "initial"), (error) => {
    assert.ok(error instanceof QstashError);
    assert.equal(error.name, "QstashError");
    assert.equal(error.status, 400);
    assert.equal(error.message, body);
    return true;
  });
  assert.equal(fetch.mock.callCount(), 1);
  assert.deepEqual(diagnostic(), {
    httpStatus: 400,
    serviceCode: "ERR_MAX_RETRIES",
    serviceReason: "Retries exceeds maximum allowed: 3",
    delaySeconds: 75,
    retries: 3,
    deduplicationIdLength: 32,
    deduplicationIdAscii: true,
    callbackProtocol: "https:",
    callbackPath: "/api/voice/cleanup",
    qstashUrlConfigured: false,
    qstashRegionConfigured: false,
  });
});

test("diagnostics redact credentials, identifiers, URLs, JWTs and ignored response fields", async () => {
  const opaque = "eyJhbGciOiJIUzI1NiJ9.eyJzZWNyZXQiOiJ0ZXN0In0.signature";
  const sensitive = [...Object.values(testEnvironment).filter((value) => value?.startsWith("synthetic-")), sessionId, `${sessionId}-initial`, opaque];
  response(JSON.stringify({
    code: "INVALID_REQUEST",
    error: `Invalid destination ${callbackUrl}?token=private ${sensitive.join(" ")} private-person@example.com arbitraryPayloadValue`,
    body: { sessionId, secret: "ignoredPayload" },
    headers: { Authorization: "ignoredAuthorization" },
  }), 400);
  await assert.rejects(scheduleVoiceCleanup(sessionId, 75, "initial"));
  const log = JSON.stringify(console.error.mock.calls);
  for (const secret of [...sensitive, callbackUrl, "private-person", "arbitraryPayloadValue", "ignoredPayload", "ignoredAuthorization"]) {
    assert.ok(!log.includes(secret), "Sensitive data must not appear in any failure log");
  }
  assert.equal(diagnostic().serviceCode, "INVALID_REQUEST");
  assert.match(diagnostic().serviceReason, /^Invalid destination \[redacted\]/);
});

test("known secrets are redacted even when they are short ordinary words", () => {
  process.env.QSTASH_CURRENT_SIGNING_KEY = "allowed";
  const details = qstashErrorDiagnostics(new QstashError('{"error":"Invalid key allowed"}', 400));
  assert.equal(details.serviceReason, "Invalid key [redacted]");
});

test("nested JSON, plain-text, empty and unexpected error bodies are handled safely", () => {
  const nested = qstashErrorDiagnostics(new QstashError('{"error":{"code":"INVALID_REQUEST","reason":"Invalid delay"},"payload":"secret"}', 400));
  assert.equal(nested.serviceCode, "INVALID_REQUEST");
  assert.equal(nested.serviceReason, "Invalid delay");
  assert.equal(qstashErrorDiagnostics(new QstashError("Invalid delay: maximum 7d", 400)).serviceReason, "Invalid delay: maximum 7d");
  for (const body of ["", "null", "42", "{}", '{"error":{"payload":"secret"}}']) {
    assert.equal(qstashErrorDiagnostics(new QstashError(body, 400)).serviceReason, undefined);
  }
  const long = qstashErrorDiagnostics(new QstashError("invalid ".repeat(1000), 400));
  assert.ok(long.serviceReason.length <= 300);
});

test("HTTP 429 remains a rate-limit failure with no bypass or republish", async () => {
  response('{"error":"Daily rate limit exceeded"}', 429, {
    "RateLimit-Limit": "1000", "RateLimit-Remaining": "0", "RateLimit-Reset": "1234567890",
  });
  await assert.rejects(scheduleVoiceCleanup(sessionId, 75, "initial"), QstashDailyRatelimitError);
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(diagnostic().httpStatus, 429);
});

test("SDK URL override is honored and indicated without logging its value", async () => {
  process.env.QSTASH_URL = "https://qstash-us-east-1.upstash.io";
  response('{"error":"Invalid request"}', 400);
  await assert.rejects(scheduleVoiceCleanup(sessionId, 75, "initial"));
  assert.equal(fetch.mock.calls[0].arguments[0], `https://qstash-us-east-1.upstash.io/v2/publish/${callbackUrl}`);
  assert.equal(diagnostic().qstashUrlConfigured, true);
});

test("invalid callback configuration fails before publishing", async () => {
  for (const url of ["http://portfolio.example/api/voice/cleanup", `${callbackUrl}/`, `${callbackUrl}?secret=value`, `${callbackUrl}#fragment`]) {
    process.env.VOICE_CLEANUP_URL = url;
    assert.throws(() => cleanupCallbackUrl(), /not configured/);
    await assert.rejects(scheduleVoiceCleanup(sessionId, 75, "initial"), /not configured/);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("unrelated errors do not expose their message or stack", () => {
  assert.deepEqual(qstashErrorDiagnostics(new Error("sensitive network error")), { httpStatus: null });
});

function ownerRequest({ origin = "https://portfolio.example", timestamp = String(Math.floor(Date.now() / 1000)), nonce = "a".repeat(32), secret = testEnvironment.VOICE_SESSION_HMAC_SECRET, headers = {}, ...options } = {}) {
  return new Request(`${origin}${QSTASH_DIAGNOSTIC_PATH}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ownerDiagnosticSignature(origin, timestamp, nonce, secret)}`,
      "X-Owner-Timestamp": timestamp,
      "X-Owner-Nonce": nonce,
      ...headers,
    },
    ...options,
  });
}

test("owner diagnostic is disabled by default, then denies anonymous or forged authorization without publishing", async () => {
  assert.equal((await publishProbe(ownerRequest())).status, 404);
  process.env.VOICE_QSTASH_DIAGNOSTIC_ENABLED = "1";
  for (const request of [
    new Request(`https://portfolio.example${QSTASH_DIAGNOSTIC_PATH}`, { method: "POST" }),
    ownerRequest({ secret: "wrong-owner-secret" }),
    ownerRequest({ headers: { Authorization: "Bearer invalid" } }),
    ownerRequest({ headers: { "X-Owner-Nonce": "not-a-nonce" } }),
    ownerRequest({ headers: { Origin: "https://portfolio.example" } }),
    ownerRequest({ headers: { "X-Owner-Timestamp": "NaN" } }),
  ]) assert.equal((await publishProbe(request)).status, 404);
  assert.equal(fetch.mock.callCount(), 0);
});

test("owner authorization binds origin/path/method/time and fails closed without a strong configured secret", () => {
  process.env.VOICE_QSTASH_DIAGNOSTIC_ENABLED = "1";
  const now = 1800000000000;
  const timestamp = String(Math.floor(now / 1000));
  assert.match(authorizeOwnerDiagnostic(ownerRequest({ timestamp }), now), /^probe-/);
  assert.equal(authorizeOwnerDiagnostic(ownerRequest({ timestamp }), now + 61000), null);
  assert.equal(authorizeOwnerDiagnostic(ownerRequest({ timestamp }), now - 61000), null);
  const signed = ownerRequest({ timestamp });
  for (const [url, method] of [
    [`https://other.example${QSTASH_DIAGNOSTIC_PATH}`, "POST"],
    ["https://portfolio.example/api/voice/session", "POST"],
    [`https://portfolio.example${QSTASH_DIAGNOSTIC_PATH}?delay=1`, "POST"],
    [`https://portfolio.example${QSTASH_DIAGNOSTIC_PATH}`, "GET"],
    [`http://portfolio.example${QSTASH_DIAGNOSTIC_PATH}`, "POST"],
  ]) assert.equal(authorizeOwnerDiagnostic(new Request(url, { method, headers: signed.headers }), now), null);
  for (const secret of ["", "short"]) {
    process.env.VOICE_SESSION_HMAC_SECRET = secret;
    assert.equal(authorizeOwnerDiagnostic(ownerRequest({ timestamp }), now), null);
  }
});

test("authorized probe publishes exactly one reserved message with normal delay/retries and replay deduplication", async () => {
  process.env.VOICE_QSTASH_DIAGNOSTIC_ENABLED = "1";
  response('{"messageId":"offline-probe"}');
  const timestamp = String(Math.floor(Date.now() / 1000));
  // A supplied body cannot change the fixed callback, session ID, or settings.
  const request = ownerRequest({ timestamp, body: '{"sessionId":"real-session","url":"https://other.example","delay":0}' });
  const result = await publishProbe(request);
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await result.json(), {
    ok: true, published: true, deduplicated: false,
    httpStatus: null, serviceCode: null, serviceReason: null,
  });
  assert.equal(fetch.mock.callCount(), 1);
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url, `https://qstash.upstash.io/v2/publish/${callbackUrl}`);
  assert.equal(options.body, JSON.stringify({ sessionId: QSTASH_DIAGNOSTIC_SESSION_ID }));
  assert.equal(options.headers.get("Upstash-Delay"), "75s");
  assert.equal(options.headers.get("Upstash-Retries"), "3");
  const dedupe = options.headers.get("Upstash-Deduplication-Id");
  assert.equal(dedupe, `${QSTASH_DIAGNOSTIC_SESSION_ID}-probe-${timestamp}-${"a".repeat(32)}`);
  assert.ok(dedupe.length <= 100);
  response('{"messageId":"offline-probe","deduplicated":true}', 202);
  const replay = await publishProbe(ownerRequest({ timestamp }));
  assert.equal((await replay.json()).deduplicated, true);
  assert.equal(fetch.mock.calls[1].arguments[1].headers.get("Upstash-Deduplication-Id"), dedupe);
  assert.equal(cleanupSession.mock.callCount(), 0);
});

test("owner probe returns only sanitized QStash rejection fields, including actual 400/429 status", async () => {
  process.env.VOICE_QSTASH_DIAGNOSTIC_ENABLED = "1";
  response(JSON.stringify({ code: "INVALID_REQUEST", error: `Invalid destination ${callbackUrl} ${testEnvironment.QSTASH_TOKEN}`, payload: "private-payload" }), 400);
  const result = await publishProbe(ownerRequest());
  assert.equal(result.status, 502);
  assert.equal(result.headers.get("Cache-Control"), "no-store");
  const body = await result.json();
  assert.equal(body.httpStatus, 400);
  assert.equal(body.serviceCode, "INVALID_REQUEST");
  assert.equal(body.ok, false);
  assert.match(body.serviceReason, /^Invalid destination/);
  const serialized = JSON.stringify(body);
  for (const value of [testEnvironment.QSTASH_TOKEN, testEnvironment.VOICE_SESSION_HMAC_SECRET, callbackUrl, "private-payload"]) assert.ok(!serialized.includes(value));
  assert.equal(fetch.mock.callCount(), 1);
  response('{"error":"Rate limit exceeded"}', 429);
  assert.equal((await (await publishProbe(ownerRequest())).json()).httpStatus, 429);
  assert.equal(fetch.mock.callCount(), 2);
});

test("owner probe redacts the complete hyphenated deduplication ID from service reasons", async () => {
  process.env.VOICE_QSTASH_DIAGNOSTIC_ENABLED = "1";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const id = `${QSTASH_DIAGNOSTIC_SESSION_ID}-probe-${timestamp}-${"a".repeat(32)}`;
  response(JSON.stringify({ error: `Invalid deduplication ID ${id}` }), 400);
  const result = await (await publishProbe(ownerRequest({ timestamp }))).json();
  assert.equal(result.httpStatus, 400);
  assert.equal(result.serviceReason, "Invalid deduplication ID [redacted]");
  assert.ok(!JSON.stringify(result).includes(id));
});

async function signedCleanupRequest(payload, { key = testEnvironment.QSTASH_CURRENT_SIGNING_KEY, destination = callbackUrl, signedBody } = {}) {
  const { SignJWT } = await import("jose");
  const body = JSON.stringify(payload);
  const signature = await new SignJWT({ body: createHash("sha256").update(signedBody ?? body).digest("base64url") })
    .setProtectedHeader({ alg: "HS256" }).setIssuer("Upstash").setSubject(destination)
    .setIssuedAt().setNotBefore("0s").setExpirationTime("1m")
    .sign(new TextEncoder().encode(key));
  return new Request(callbackUrl, {
    method: "POST", headers: { "Content-Type": "application/json", "Upstash-Signature": signature }, body,
  });
}

test("signed reserved cleanup is a true no-op before Redis or LiveKit; current and rotated keys work", async () => {
  assert.equal(QSTASH_DIAGNOSTIC_SESSION_ID.length, 25);
  assert.notEqual(QSTASH_DIAGNOSTIC_SESSION_ID.length, sessionId.length);
  for (const key of [testEnvironment.QSTASH_CURRENT_SIGNING_KEY, testEnvironment.QSTASH_NEXT_SIGNING_KEY]) {
    const result = await cleanupCallback(await signedCleanupRequest({ sessionId: QSTASH_DIAGNOSTIC_SESSION_ID }, { key }));
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { cleaned: true, diagnostic: true });
  }
  assert.equal(cleanupSession.mock.callCount(), 0);
  assert.equal(fetch.mock.callCount(), 0);
});

test("reserved cleanup cannot bypass QStash signatures, audience, body hash or normal payload validation", async () => {
  const payload = { sessionId: QSTASH_DIAGNOSTIC_SESSION_ID };
  const unsigned = new Request(callbackUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  assert.equal((await cleanupCallback(unsigned)).status, 401);
  for (const options of [
    { key: "wrong-key" }, { destination: "https://other.example/api/voice/cleanup" }, { signedBody: "tampered" },
  ]) assert.notEqual((await cleanupCallback(await signedCleanupRequest(payload, options))).status, 200);
  assert.equal((await cleanupCallback(await signedCleanupRequest({ sessionId: "bad" }))).status, 400);
  assert.equal(cleanupSession.mock.callCount(), 0);
  assert.equal(fetch.mock.callCount(), 0);
});

test("real-session cleanup still delegates unchanged after QStash verification", async () => {
  cleanupSession.mock.mockImplementation(async () => ({ cleaned: true }));
  const result = await cleanupCallback(await signedCleanupRequest({ sessionId }));
  assert.equal(result.status, 200);
  assert.deepEqual(cleanupSession.mock.calls[0].arguments, [sessionId]);
});

test("terminal runner interoperates with owner auth using a scoped signature, not a raw credential", async () => {
  process.env.VOICE_QSTASH_DIAGNOSTIC_ENABLED = "1";
  const capture = mock.fn(async (url, options) => {
    assert.equal(options.redirect, "error");
    assert.ok(!JSON.stringify(options).includes(testEnvironment.VOICE_SESSION_HMAC_SECRET));
    assert.ok(authorizeOwnerDiagnostic(new Request(url, options)));
    return new Response('{"ok":false,"published":false,"httpStatus":400,"serviceCode":"INVALID_REQUEST","serviceReason":"Invalid delay","ignored":"secret"}', { status: 502 });
  });
  const result = await diagnoseQstash("https://portfolio.example", { env: testEnvironment, fetchImpl: capture });
  assert.equal(capture.mock.callCount(), 1);
  assert.deepEqual(result, { endpointHttpStatus: 502, ok: false, published: false, deduplicated: false, httpStatus: 400, serviceCode: "INVALID_REQUEST", serviceReason: "Invalid delay" });
  assert.equal(fetch.mock.callCount(), 0);
});

test("terminal runner fails before any request for missing authorization or unsafe origins", async () => {
  const guard = mock.fn(noProviderCalls);
  for (const origin of ["http://portfolio.example", "https://user:pass@portfolio.example", "https://portfolio.example/other", "https://portfolio.example?token=value"]) {
    await assert.rejects(diagnoseQstash(origin, { env: testEnvironment, fetchImpl: guard }));
  }
  await assert.rejects(diagnoseQstash("https://portfolio.example", { env: {}, fetchImpl: guard }));
  assert.equal(guard.mock.callCount(), 0);
});
