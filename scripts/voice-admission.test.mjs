import assert from "node:assert/strict";
import { beforeEach, afterEach, mock, test } from "node:test";
import { createRequire } from "node:module";
import { loadTypeScript } from "./test-typescript.mjs";
import { lua, lauxlib, lualib, to_luastring, to_jsstring } from "fengari";

const scripts = loadTypeScript("../lib/voice-admission.ts");
const { RESERVE_VOICE_SESSION: RESERVE, COMMIT_VOICE_BUDGET: COMMIT, REFUND_FAILED_VOICE_BUDGET: REFUND, RELEASE_VOICE_RESERVATION: RELEASE } = scripts;
const require = createRequire(import.meta.url);
const { readJson } = loadTypeScript("../lib/voice-session.ts");

// Execute the production Lua in a real Lua VM. Only Redis's primitive commands
// are emulated; the admission/accounting algorithm itself is never reimplemented.
function redisHarness() {
  const data = new Map();
  const ttls = new Map();
  function entry(key) { if (!data.has(key)) data.set(key, new Map()); return data.get(key); }
  function command(name, key, ...args) {
    const values = data.get(key);
    switch (name) {
      case "HGET": return values?.get(args[0]) ?? false;
      case "HSET": for (let i = 0; i < args.length; i += 2) entry(key).set(args[i], String(args[i + 1])); return 1;
      case "HINCRBY": { const next = Number(values?.get(args[0]) ?? 0) + Number(args[1]); entry(key).set(args[0], String(next)); return next; }
      case "ZCARD": return values?.size ?? 0;
      case "ZADD": entry(key).set(args[1], Number(args[0])); return 1;
      case "ZREM": return values?.delete(args[0]) ? 1 : 0;
      case "DEL": ttls.delete(key); return data.delete(key) ? 1 : 0;
      case "EXISTS": return data.has(key) ? 1 : 0;
      case "EXPIRE": ttls.set(key, Number(args[0])); return 1;
      default: throw new Error(`Unexpected Redis command: ${name}`);
    }
  }
  function evalLua(script, keys, args) {
    const state = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(state);
    function push(value) {
      if (typeof value === "number") lua.lua_pushnumber(state, value);
      else if (value === false || value == null) lua.lua_pushboolean(state, false);
      else lua.lua_pushstring(state, to_luastring(String(value)));
    }
    function read(index) {
      return lua.lua_type(state, index) === lua.LUA_TNUMBER ? lua.lua_tonumber(state, index) : to_jsstring(lua.lua_tolstring(state, index));
    }
    for (const [name, values] of [["KEYS", keys], ["ARGV", args]]) {
      lua.lua_newtable(state);
      values.forEach((value, index) => { push(value); lua.lua_rawseti(state, -2, index + 1); });
      lua.lua_setglobal(state, to_luastring(name));
    }
    lua.lua_newtable(state);
    lua.lua_pushcfunction(state, () => {
      const values = Array.from({ length: lua.lua_gettop(state) }, (_, index) => read(index + 1));
      push(command(...values));
      return 1;
    });
    lua.lua_setfield(state, -2, to_luastring("call"));
    lua.lua_setglobal(state, to_luastring("redis"));
    try {
      assert.equal(lauxlib.luaL_loadstring(state, to_luastring(script)), lua.LUA_OK);
      const status = lua.lua_pcall(state, 0, 1, 0);
      assert.equal(status, lua.LUA_OK, status === lua.LUA_OK ? "" : read(-1));
      return read(-1);
    } finally { lua.lua_close(state); }
  }
  return { data, ttls, command, eval: evalLua };
}

const globalKey = "portfolio:voice:active";
const dayKey = "portfolio:voice:budget:2026-11-03";
const sessionKey = (sid) => `portfolio:voice:session:${sid}`;
function reserve(redis, sid, ip = sid, budget = 3600, cap = 5, day = dayKey) {
  return redis.eval(RESERVE, [globalKey, `ip:${ip}`, sessionKey(sid), day], [1000, 1075, 1300, sid, `room-${sid}`, `identity-${sid}`, "control-hash", 93600, cap, 300, budget]);
}
const value = (redis, field, key = dayKey) => Number(redis.data.get(key)?.get(field) ?? 0);

test("atomic Lua enforces one network/five global sessions without visitor attempt counters", () => {
  const redis = redisHarness();
  assert.equal(reserve(redis, "one", "same-network"), "OK");
  assert.equal(reserve(redis, "two", "same-network"), "ONE_ACTIVE");
  assert.equal(value(redis, "reserved"), 300);
  for (let i = 2; i <= 5; i++) assert.equal(reserve(redis, String(i)), "OK");
  assert.equal(reserve(redis, "six"), "BUSY");
  assert.equal(value(redis, "reserved"), 1500);
  assert.ok([...redis.data.keys()].every((key) => !key.includes(":rate:") && !key.includes(":quota:")));
});

test("repeated visits from the same network consume no per-visitor attempt quota", () => {
  const redis = redisHarness();
  for (let i = 0; i < 12; i++) {
    const sid = String(i);
    assert.equal(reserve(redis, sid, "repeat-network"), "OK");
    assert.equal(redis.eval(COMMIT, [sessionKey(sid)], []), 1);
    redis.eval(RELEASE, [globalKey, sessionKey(sid)], [sid]);
  }
  assert.equal(value(redis, "used"), 3600);
  assert.equal(value(redis, "reserved"), 0);
  assert.equal(reserve(redis, "thirteen", "repeat-network"), "BUDGET");
});

test("pending allocations share the daily cap; successful allocation commits exactly once", () => {
  const redis = redisHarness();
  assert.equal(reserve(redis, "one", "one", 600), "OK");
  assert.equal(reserve(redis, "two", "two", 600), "OK");
  assert.equal(reserve(redis, "three", "three", 600), "BUDGET");
  assert.equal(redis.eval(COMMIT, [sessionKey("one")], []), 1);
  assert.equal(redis.eval(COMMIT, [sessionKey("one")], []), 0);
  assert.equal(value(redis, "reserved"), 300);
  assert.equal(value(redis, "used"), 300);
  assert.equal(redis.ttls.get(dayKey), 93600);
});

test("failed provisioning refunds both pending and ambiguously committed budget idempotently", () => {
  for (const commitFirst of [false, true]) {
    const redis = redisHarness();
    reserve(redis, "failed");
    if (commitFirst) redis.eval(COMMIT, [sessionKey("failed")], []);
    redis.eval(REFUND, [globalKey, sessionKey("failed")], ["failed", "failed"]);
    redis.eval(REFUND, [globalKey, sessionKey("failed")], ["failed", "failed"]);
    assert.equal(value(redis, "reserved"), 0);
    assert.equal(value(redis, "used"), 0);
    assert.equal(redis.data.get(globalKey).size, 1, "uncertain room retains its concurrency lock");
    assert.equal(reserve(redis, "again", "failed"), "ONE_ACTIVE");
    redis.eval(RELEASE, [globalKey, sessionKey("failed")], ["failed"]);
    redis.eval(RELEASE, [globalKey, sessionKey("failed")], ["failed"]);
    assert.equal(reserve(redis, "again", "failed"), "OK");
  }
});

test("undispatched/stale reservations refund, successful calls remain charged, and legacy cleanup works", () => {
  const redis = redisHarness();
  reserve(redis, "pending");
  redis.eval(RELEASE, [globalKey, sessionKey("pending")], ["pending", "failed"]);
  assert.equal(value(redis, "reserved"), 0);
  reserve(redis, "success");
  redis.eval(COMMIT, [sessionKey("success")], []);
  redis.eval(RELEASE, [globalKey, sessionKey("success")], ["success"]);
  assert.equal(value(redis, "used"), 300);
  redis.command("HSET", sessionKey("legacy"), "room", "legacy-room", "ipKey", "legacy-ip");
  redis.command("ZADD", globalKey, 1, "legacy");
  redis.command("ZADD", "legacy-ip", 1, "legacy");
  redis.eval(RELEASE, [globalKey, sessionKey("legacy")], ["legacy"]);
  assert.equal(redis.data.has(sessionKey("legacy")), false);
  assert.equal(redis.data.has("legacy-ip"), false);
  assert.equal(value(redis, "used"), 300);
});

test("UTC rollover refunds the original day's key and zero budget is a closed service", () => {
  const redis = redisHarness();
  assert.equal(reserve(redis, "closed", "closed", 0), "BUDGET");
  reserve(redis, "yesterday");
  const tomorrow = "portfolio:voice:budget:2026-11-04";
  reserve(redis, "today", "today", 3600, 5, tomorrow);
  redis.eval(RELEASE, [globalKey, sessionKey("yesterday")], ["yesterday"]);
  assert.equal(value(redis, "reserved"), 0);
  assert.equal(value(redis, "reserved", tomorrow), 300);
});

test("an owner can lower the global concurrency cap without adding per-network attempts", () => {
  const state = redisHarness();
  assert.equal(reserve(state, "one", "network-one", 3600, 2), "OK");
  assert.equal(reserve(state, "two", "network-two", 3600, 2), "OK");
  assert.equal(reserve(state, "three", "network-three", 3600, 2), "BUSY");
  assert.equal(value(state, "reserved"), 600);
});

let redis;
let failStage;
let dispatchCalls;
let cleanupCalls;
let id;
const config = { origins: ["https://portfolio.example"], hmacSecret: "synthetic-owner-secret", url: "wss://example.invalid", maxConcurrentSessions: 5, dailyBudgetSeconds: 3600 };
class ConfigError extends Error {}
const { POST } = loadTypeScript("../app/api/voice/session/route.ts", {
  "../../../../lib/voice-session": {
    ACTIVE_KEY: globalKey, SESSION_SECONDS: 300, VoiceConfigError: ConfigError,
    getVoiceConfig: () => config, createRedis: () => redis,
    getOrigin: (request) => request.headers.get("origin") === config.origins[0] ? config.origins[0] : null,
    getClientIp: () => "test-ip", hashValue: () => "network", hashSecret: () => "control-hash", newId: () => `synthetic-${++id}`,
    readJson, verifyTurnstile: async () => failStage !== "verification",
    issueLiveKitToken: async () => { if (failStage === "token") throw new Error("synthetic"); return "synthetic-participant-token"; },
    createLiveKitApi: () => ({ agentDispatch: { createDispatch: async (_room, name) => {
      assert.equal(name, "voiceagent"); dispatchCalls++;
      if (failStage === "dispatch") throw new Error("uncertain dispatch");
    } } }),
  },
  "../../../../lib/voice-cleanup": {
    scheduleExpiredVoiceReconciliation: async () => {},
    scheduleVoiceCleanup: async (_sid, delay, tag) => { assert.equal(delay, 75); assert.equal(tag, "initial"); cleanupCalls++; if (failStage === "cleanup") throw new Error("synthetic"); },
  },
});

beforeEach(() => {
  redis = redisHarness(); failStage = null; dispatchCalls = 0; cleanupCalls = 0; id = 0;
  mock.method(globalThis, "fetch", async () => { throw new Error("No real provider requests permitted"); });
  mock.method(console, "error", () => {});
});
afterEach(() => mock.restoreAll());

function request(origin = config.origins[0], token = "synthetic-proof") {
  return new Request("https://portfolio.example/api/voice/session", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ turnstileToken: token }) });
}

test("session route issues a scoped response only after signed scheduling, dispatch and budget commit", async () => {
  const result = await POST(request());
  assert.equal(result.status, 200);
  assert.equal((await result.json()).participantToken, "synthetic-participant-token");
  assert.equal(dispatchCalls, 1); assert.equal(cleanupCalls, 1);
  const budget = [...redis.data.keys()].find((key) => key.includes(":budget:"));
  assert.equal(value(redis, "used", budget), 300);
  assert.equal(value(redis, "reserved", budget), 0);
  assert.equal(fetch.mock.callCount(), 0);
});

test("session admission accepts the documented maximum Turnstile token size, but rejects oversized bodies", async () => {
  assert.equal((await POST(request(config.origins[0], "a".repeat(2048)))).status, 200);
  assert.equal(dispatchCalls, 1);
  assert.equal((await POST(request(config.origins[0], "a".repeat(2049)))).status, 400);
  assert.equal((await POST(request(config.origins[0], "a".repeat(5000)))).status, 503);
  assert.equal(dispatchCalls, 1);
});

test("cleanup/token failures refund budget and release safe reservations; ambiguous dispatch retains locks", async () => {
  for (const stage of ["cleanup", "token", "dispatch"]) {
    redis = redisHarness(); failStage = stage;
    const result = await POST(request());
    assert.equal(result.status, 503);
    const budget = [...redis.data.keys()].find((key) => key.includes(":budget:"));
    assert.equal(value(redis, "used", budget), 0);
    assert.equal(value(redis, "reserved", budget), 0);
    assert.equal(redis.data.get(globalKey)?.size ?? 0, stage === "dispatch" ? 1 : 0);
  }
});

test("a lost budget-commit acknowledgement is refunded without releasing an uncertain room", async () => {
  const evalNormally = redis.eval;
  redis.eval = (script, keys, args) => {
    const result = evalNormally(script, keys, args);
    if (script === COMMIT) throw new Error("synthetic lost acknowledgement");
    return result;
  };
  assert.equal((await POST(request())).status, 503);
  const budget = [...redis.data.keys()].find((key) => key.includes(":budget:"));
  assert.equal(value(redis, "used", budget), 0);
  assert.equal(value(redis, "reserved", budget), 0);
  assert.equal(redis.data.get(globalKey).size, 1);
});

test("real cleanup retries retain locks, then confirmed deletion releases pending budget exactly once", async () => {
  const previous = [process.env.QSTASH_TOKEN, process.env.VOICE_CLEANUP_URL];
  process.env.QSTASH_TOKEN = "synthetic-qstash-only";
  process.env.VOICE_CLEANUP_URL = "https://portfolio.example/api/voice/cleanup";
  try {
    for (const committed of [false, true]) {
      const state = redisHarness();
      const sid = "abcdefghijklmnopqrstuvwx";
      reserve(state, sid);
      if (committed) state.eval(COMMIT, [sessionKey(sid)], []);
      let deletionFails = true;
      const published = [];
      const cleanup = loadTypeScript("../lib/voice-cleanup.ts", {
        "./voice-session": {
          ACTIVE_KEY: globalKey,
          createRedis: () => ({
            hgetall: async (key) => state.data.has(key) ? Object.fromEntries(state.data.get(key)) : null,
            zscore: async (key, member) => state.data.get(key)?.get(member) ?? null,
            hset: async (key, fields) => state.command("HSET", key, ...Object.entries(fields).flat()),
            eval: state.eval,
          }),
          createLiveKitApi: () => ({ room: {
            listRooms: async () => [{ name: "synthetic-room" }],
            deleteRoom: async () => { if (deletionFails) throw new Error("synthetic room service failure"); },
          } }),
        },
        "@upstash/qstash": { ...require("@upstash/qstash"), Client: class { async publishJSON(request) { published.push(request); return { messageId: "synthetic-message" }; } } },
      });
      assert.equal((await cleanup.cleanupExpiredVoiceSession(sid)).pending, true);
      assert.equal(state.data.get(globalKey).size, 1);
      assert.equal(published[0].delay, 15);
      assert.equal(published[0].retries, 3);
      assert.equal(published[0].deduplicationId, `${sid}-retry-1`);
      deletionFails = false;
      assert.equal((await cleanup.cleanupExpiredVoiceSession(sid)).cleaned, true);
      assert.equal((await cleanup.cleanupExpiredVoiceSession(sid)).missing, true);
      assert.equal(state.data.get(globalKey).size, 0);
      assert.equal(value(state, "reserved"), 0);
      assert.equal(value(state, "used"), committed ? 300 : 0);
    }
    assert.equal(fetch.mock.callCount(), 0);
  } finally {
    for (const [index, name] of ["QSTASH_TOKEN", "VOICE_CLEANUP_URL"].entries()) {
      if (previous[index] === undefined) delete process.env[name]; else process.env[name] = previous[index];
    }
  }
});

test("origin and Siteverify rejection happen before reservation, cleanup scheduling or dispatch", async () => {
  assert.equal((await POST(request("https://untrusted.example"))).status, 403);
  failStage = "verification";
  const response = await POST(request());
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, "verification_failed");
  assert.equal(redis.data.size, 0);
  assert.equal(dispatchCalls, 0); assert.equal(cleanupCalls, 0);
});

test("real configuration validates default/global limits without weakening Siteverify hostname/action checks", async () => {
  const { verifyTurnstile, getVoiceConfig, VoiceConfigError, issueLiveKitToken } = loadTypeScript("../lib/voice-session.ts", {
    "@upstash/redis": require("@upstash/redis"),
  });
  const names = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY", "VOICE_SESSION_HMAC_SECRET", "VOICE_ALLOWED_ORIGINS", "VOICE_CLEANUP_URL", "QSTASH_TOKEN", "QSTASH_CURRENT_SIGNING_KEY", "QSTASH_NEXT_SIGNING_KEY", "VOICE_DAILY_BUDGET_SECONDS", "VOICE_MAX_CONCURRENT_SESSIONS"];
  const previous = names.map((name) => [name, process.env[name]]);
  try {
    for (const name of names) process.env[name] = "synthetic-only";
    process.env.VOICE_SESSION_HMAC_SECRET = "synthetic-secret-at-least-32-characters";
    process.env.VOICE_CLEANUP_URL = "https://portfolio.example/api/voice/cleanup";
    process.env.VOICE_ALLOWED_ORIGINS = "https://portfolio.example";
    delete process.env.VOICE_DAILY_BUDGET_SECONDS;
    delete process.env.VOICE_MAX_CONCURRENT_SESSIONS;
    assert.equal(getVoiceConfig().dailyBudgetSeconds, 3600);
    assert.equal(getVoiceConfig().maxConcurrentSessions, 5);
    const token = await issueLiveKitToken("synthetic-room", "synthetic-visitor");
    const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    assert.deepEqual(claims.video, {
      roomJoin: true, room: "synthetic-room", canPublishSources: ["microphone"],
      canSubscribe: true, canPublishData: false, canUpdateOwnMetadata: true,
    });
    assert.equal(claims.sub, "synthetic-visitor");
    assert.equal(claims.exp - claims.nbf, 300);
    for (const [name, value] of [["VOICE_DAILY_BUDGET_SECONDS", "-1"], ["VOICE_MAX_CONCURRENT_SESSIONS", "6"]]) {
      process.env[name] = value;
      assert.throws(() => getVoiceConfig(), VoiceConfigError);
      delete process.env[name];
    }
    for (const [hostname, action, accepted] of [["portfolio.example", "voice_session", true], ["other.example", "voice_session", false], ["portfolio.example", "other_action", false]]) {
      fetch.mock.mockImplementation(async () => new Response(JSON.stringify({ success: true, hostname, action })));
      assert.equal(await verifyTurnstile("synthetic-token", "127.0.0.1", "https://portfolio.example"), accepted);
    }
  } finally {
    for (const [name, value] of previous) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
});
