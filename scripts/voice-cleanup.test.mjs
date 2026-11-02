import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import { afterEach, beforeEach, mock, test } from "node:test";
import ts from "typescript";

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
const noProviderCalls = () => { throw new Error("Redis/LiveKit calls are forbidden in this test"); };
const { scheduleVoiceCleanup, cleanupCallbackUrl } = loadTypeScript("../lib/voice-cleanup.ts", {
  "./voice-session": {
    ACTIVE_KEY: "unused",
    createRedis: noProviderCalls,
    createLiveKitApi: noProviderCalls,
  },
  "./qstash-diagnostics": { qstashErrorDiagnostics },
});

const sessionId = "abcdefghijklmnopqrstuvwx";
const callbackUrl = "https://portfolio.example/api/voice/cleanup";
const testEnvironment = {
  QSTASH_TOKEN: "synthetic-publish-secret",
  QSTASH_CURRENT_SIGNING_KEY: "synthetic-current-secret",
  QSTASH_NEXT_SIGNING_KEY: "synthetic-next-secret",
  VOICE_SESSION_HMAC_SECRET: "synthetic-hmac-secret",
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
});

afterEach(() => {
  mock.restoreAll();
  for (const [name, value] of Object.entries(previousEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

function response(body, status = 200, headers = {}) {
  fetch.mock.mockImplementation(async () => new Response(body, { status, headers }));
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
  assert.equal(options.headers.get("Upstash-Deduplication-Id"), `${sessionId}:initial`);
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
    assert.equal(options.headers.get("Upstash-Deduplication-Id"), `${sessionId}:${tag}`);
  }
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
  const sensitive = [...Object.values(testEnvironment).filter((value) => value?.startsWith("synthetic-")), sessionId, `${sessionId}:initial`, opaque];
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
