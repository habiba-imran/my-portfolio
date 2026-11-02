import { NextResponse } from "next/server";
import {
  ACTIVE_KEY,
  createLiveKitApi,
  createRedis,
  getClientIp,
  getOrigin,
  getVoiceConfig,
  hashSecret,
  hashValue,
  issueLiveKitToken,
  newId,
  QUOTA_SECONDS,
  SESSION_SECONDS,
  VoiceConfigError,
  verifyTurnstile,
  readJson,
} from "../../../../lib/voice-session";
import { scheduleExpiredVoiceReconciliation, scheduleVoiceCleanup } from "../../../../lib/voice-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESERVE = `
local now = tonumber(ARGV[1])
local lease = tonumber(ARGV[2])
local hardExpiry = tonumber(ARGV[3])
local sid = ARGV[4]
local room = ARGV[5]
local identity = ARGV[6]
local controlHash = ARGV[7]
local quotaTtl = tonumber(ARGV[8])
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then redis.call('EXPIRE', KEYS[1], 600) end
if hits > 3 then return 'RATE' end
local quota = redis.call('INCR', KEYS[2])
if quota == 1 then redis.call('EXPIRE', KEYS[2], quotaTtl) end
if quota > 5 then redis.call('DECR', KEYS[2]); return 'QUOTA' end
if redis.call('ZCARD', KEYS[3]) >= 5 then redis.call('DECR', KEYS[2]); return 'BUSY' end
if redis.call('ZCARD', KEYS[4]) >= 1 then redis.call('DECR', KEYS[2]); return 'ONE_ACTIVE' end
redis.call('ZADD', KEYS[3], lease, sid)
redis.call('ZADD', KEYS[4], lease, sid)
redis.call('HSET', KEYS[5], 'room', room, 'identity', identity, 'controlHash', controlHash, 'ipKey', KEYS[4], 'hardExpiry', hardExpiry)
return 'OK'
`;

const RELEASE_UNDISPATCHED = `
local ipKey = redis.call('HGET', KEYS[2], 'ipKey')
redis.call('ZREM', KEYS[1], ARGV[1])
if ipKey then
  redis.call('ZREM', ipKey, ARGV[1])
  if redis.call('ZCARD', ipKey) == 0 then redis.call('DEL', ipKey) end
end
redis.call('DEL', KEYS[2])
return 1
`;

export async function POST(request: Request) {
  let stage = "configuration";
  try {
    const config = getVoiceConfig();
    stage = "request_validation";
    const origin = getOrigin(request, config.origins);
    const ip = getClientIp(request);
    if (!origin || !ip) return NextResponse.json({ error: "Voice sessions are unavailable." }, { status: 403 });

    const payload = await readJson<{ turnstileToken?: string }>(request);
    if (typeof payload.turnstileToken !== "string" || payload.turnstileToken.length > 2048) {
      return NextResponse.json({ error: "Complete the security check to continue." }, { status: 400 });
    }
    stage = "turnstile_verification";
    if (!(await verifyTurnstile(payload.turnstileToken, ip, origin))) {
      return NextResponse.json({ error: "The security check expired. Please try again." }, { status: 403 });
    }

    // Also adopt any pre-QStash expired leases left by an earlier deployment.
    stage = "cleanup_reconciliation";
    await scheduleExpiredVoiceReconciliation();

    stage = "redis_reservation";
    const redis = createRedis();
    const ipHash = hashValue(ip, config.hmacSecret);
    const sessionId = newId();
    const sessionKey = newId() + newId();
    const roomName = `portfolio-${newId()}`;
    const identity = `visitor-${newId()}`;
    const now = Math.floor(Date.now() / 1000);
    const hardExpiry = now + SESSION_SECONDS;
    const leaseExpiry = Math.min(now + 75, hardExpiry);
    const result = await redis.eval<unknown[], string>(RESERVE, [
      `portfolio:voice:rate:${ipHash}`,
      `portfolio:voice:quota:${ipHash}:${new Date().toISOString().slice(0, 10)}`,
      ACTIVE_KEY,
      `portfolio:voice:ip-active:${ipHash}`,
      `portfolio:voice:session:${sessionId}`,
    ], [now, leaseExpiry, hardExpiry, sessionId, roomName, identity, hashSecret(sessionKey), QUOTA_SECONDS]);

    if (result !== "OK") {
      const status = result === "RATE" || result === "QUOTA" ? 429 : result === "ONE_ACTIVE" || result === "BUSY" ? 409 : 503;
      const messages: Record<string, string> = {
        RATE: "Too many attempts. Please wait a few minutes.",
        QUOTA: "You’ve reached today’s demo limit. Please come back tomorrow.",
        ONE_ACTIVE: "You already have a voice session open.",
        BUSY: "The voice demo is at capacity. Please try again shortly.",
      };
      return NextResponse.json({ error: messages[result] ?? "Voice sessions are unavailable." }, { status });
    }

    let cleanupScheduled = false;
    try {
      stage = "cleanup_schedule";
      await scheduleVoiceCleanup(sessionId, 75, "initial");
      cleanupScheduled = true;
      stage = "token_issuance";
      const token = await issueLiveKitToken(roomName, identity);
      stage = "agent_dispatch";
      const livekit = createLiveKitApi();
      await livekit.agentDispatch.createDispatch(roomName, "voiceagent");
      return NextResponse.json({
        serverUrl: config.url,
        participantToken: token,
        sessionId,
        sessionKey,
        expiresAt: hardExpiry,
      }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      console.error("[voice-session] provisioning failed", {
        stage,
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
      if (!cleanupScheduled) {
        await redis.eval<unknown[], number>(RELEASE_UNDISPATCHED, [ACTIVE_KEY, `portfolio:voice:session:${sessionId}`], [sessionId]);
      }
      // Dispatch may have succeeded even if its request timed out. Keep the lease
      // so scheduled cleanup can inspect and delete any room that was created.
      return NextResponse.json({
        error: "The voice agent could not be reached. Please try again.",
        code: stage,
      }, { status: 503 });
    }
  } catch (error) {
    // Keep credentials and request data out of logs; the stage pinpoints which
    // Vercel setting or dependency to inspect when admission fails closed.
    const configError = error instanceof VoiceConfigError ? error : null;
    console.error("[voice-session] admission unavailable", {
      stage,
      errorType: error instanceof Error ? error.name : "UnknownError",
      configIssue: configError?.issue,
      variables: configError?.variables,
    });
    return NextResponse.json({
      error: "Voice sessions are temporarily unavailable.",
      code: configError?.issue ?? stage,
      ...(configError?.variables.length ? { variables: configError.variables } : {}),
    }, { status: 503 });
  }
}
