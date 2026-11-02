import { NextResponse } from "next/server";
import { ACTIVE_KEY, createRedis, getVoiceConfig, hashSecret, readJson } from "../../../../../lib/voice-session";
import { scheduleVoiceCleanup } from "../../../../../lib/voice-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEARTBEAT = `
local room = redis.call('HGET', KEYS[1], 'room')
local stored = redis.call('HGET', KEYS[1], 'controlHash')
local hardExpiry = tonumber(redis.call('HGET', KEYS[1], 'hardExpiry') or '0')
if not room or stored ~= ARGV[1] then return 0 end
local now = tonumber(ARGV[2])
if hardExpiry <= now then return 0 end
local lease = math.min(now + 75, hardExpiry)
local ipKey = redis.call('HGET', KEYS[1], 'ipKey')
redis.call('ZADD', KEYS[2], lease, ARGV[3])
if ipKey then redis.call('ZADD', ipKey, lease, ARGV[3]) end
redis.call('HSET', KEYS[1], 'lastSeen', now)
return 1
`;

export async function POST(request: Request) {
  try {
    const config = getVoiceConfig();
    if (!request.headers.get("origin") || !config.origins.includes(request.headers.get("origin")!)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await readJson<{ sessionId?: string; sessionKey?: string }>(request, 512);
    if (!body.sessionId || !body.sessionKey) return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    const now = Math.floor(Date.now() / 1000);
    const redis = createRedis();
    const key = `portfolio:voice:session:${body.sessionId}`;
    const stored = await redis.hgetall<{ controlHash?: string; hardExpiry?: string }>(key);
    const hardExpiry = Number(stored?.hardExpiry ?? "0");
    if (!stored?.controlHash || stored.controlHash !== hashSecret(body.sessionKey) || hardExpiry <= now) {
      return NextResponse.json({ error: "Session expired" }, { status: 410 });
    }
    const leaseExpiry = Math.min(now + 75, hardExpiry);
    await scheduleVoiceCleanup(body.sessionId, leaseExpiry - now, `lease-${leaseExpiry}`);
    const result = await redis.eval<unknown[], number>(HEARTBEAT, [
      key,
      ACTIVE_KEY,
    ], [hashSecret(body.sessionKey), now, body.sessionId]);
    return result === 1
      ? NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
      : NextResponse.json({ error: "Session expired" }, { status: 410 });
  } catch {
    return NextResponse.json({ error: "Voice session unavailable" }, { status: 503 });
  }
}
