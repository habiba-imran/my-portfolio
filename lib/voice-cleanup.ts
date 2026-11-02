import { Client, Receiver } from "@upstash/qstash";
import { ACTIVE_KEY, createLiveKitApi, createRedis } from "./voice-session";
import { qstashErrorDiagnostics } from "./qstash-diagnostics";

const cleanupPath = "/api/voice/cleanup";
const RELEASE = `
local ipKey = redis.call('HGET', KEYS[2], 'ipKey')
redis.call('ZREM', KEYS[1], ARGV[1])
if ipKey then
  redis.call('ZREM', ipKey, ARGV[1])
  if redis.call('ZCARD', ipKey) == 0 then redis.call('DEL', ipKey) end
end
redis.call('DEL', KEYS[2])
return 1
`;

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error("Voice cleanup is not configured.");
  return value;
}

export function cleanupCallbackUrl() {
  const url = new URL(required("VOICE_CLEANUP_URL"));
  if (url.protocol !== "https:" || url.pathname !== cleanupPath || url.search || url.hash) {
    throw new Error("Voice cleanup is not configured.");
  }
  return url.toString();
}

export function qstashReceiver() {
  return new Receiver({
    currentSigningKey: required("QSTASH_CURRENT_SIGNING_KEY"),
    nextSigningKey: required("QSTASH_NEXT_SIGNING_KEY"),
  });
}

export async function scheduleVoiceCleanup(sessionId: string, delaySeconds: number, dedupeTag: string) {
  const client = new Client({ token: required("QSTASH_TOKEN") });
  const request = {
    url: cleanupCallbackUrl(),
    body: { sessionId },
    delay: Math.max(1, Math.floor(delaySeconds)),
    // QStash's default of three is available on its free tier. Persistent
    // cleanup retries are scheduled by Redis state below, not by raising this.
    retries: 3,
    deduplicationId: `${sessionId}:${dedupeTag}`.slice(0, 100),
  };
  try {
    return await client.publishJSON(request);
  } catch (error) {
    // Temporary, bounded diagnostics for the publish rejection. Keep the original
    // error/fail-closed behavior and omit the session ID, URL host and payload.
    console.error("[voice-cleanup] QStash publish failed", {
      ...qstashErrorDiagnostics(error, [sessionId, request.deduplicationId]),
      delaySeconds: request.delay,
      retries: request.retries,
      deduplicationIdLength: request.deduplicationId.length,
      deduplicationIdAscii: /^[\x21-\x7e]+$/.test(request.deduplicationId),
      callbackProtocol: new URL(request.url).protocol,
      callbackPath: cleanupPath,
      qstashUrlConfigured: Boolean(process.env.QSTASH_URL),
      qstashRegionConfigured: Boolean(process.env.QSTASH_REGION),
    });
    throw error;
  }
}

export async function scheduleExpiredVoiceReconciliation() {
  const redis = createRedis();
  const expired = await redis.zrange<string[]>(ACTIVE_KEY, "-inf", Math.floor(Date.now() / 1000), {
    byScore: true,
    offset: 0,
    count: 20,
  });
  for (const sessionId of expired) await scheduleVoiceCleanup(sessionId, 1, "legacy-reconcile");
}

export async function cleanupExpiredVoiceSession(sessionId: string, force = false) {
  const redis = createRedis();
  const key = `portfolio:voice:session:${sessionId}`;
  const session = await redis.hgetall<{
    room?: string;
    ipKey?: string;
    cleanupAttempts?: string;
  }>(key);
  if (!session?.room) return { cleaned: true, missing: true };

  const score = await redis.zscore(ACTIVE_KEY, sessionId);
  if (score === null) return { cleaned: true, missing: true };
  if (!force && Number(score) > Math.floor(Date.now() / 1000)) return { cleaned: true, stale: true };

  try {
    const api = createLiveKitApi();
    const rooms = await api.room.listRooms([session.room]);
    if (rooms.length) await api.room.deleteRoom(session.room);
  } catch (error) {
    const attempts = Number(session.cleanupAttempts ?? "0") + 1;
    const delay = Math.min(3600, 15 * 2 ** Math.min(attempts - 1, 8));
    await redis.hset(key, {
      cleanupState: "pending",
      cleanupAttempts: String(attempts),
      cleanupLastAttempt: String(Math.floor(Date.now() / 1000)),
      cleanupError: error instanceof Error ? error.name.slice(0, 48) : "LiveKitError",
    });
    // Publish another delayed reconciliation before acknowledging this delivery.
    // If publishing fails, throw so QStash retries the current signed delivery.
    await scheduleVoiceCleanup(sessionId, delay, `retry-${attempts}`);
    return { cleaned: false, pending: true };
  }

  const released = await redis.eval<unknown[], number>(RELEASE, [ACTIVE_KEY, key], [sessionId]);
  return { cleaned: released === 1, missing: released !== 1 };
}
