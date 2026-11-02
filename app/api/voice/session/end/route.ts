import { NextResponse } from "next/server";
import { getVoiceConfig, hashSecret, readJson, createRedis } from "../../../../../lib/voice-session";
import { cleanupExpiredVoiceSession } from "../../../../../lib/voice-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const config = getVoiceConfig();
    const origin = request.headers.get("origin");
    if (!origin || !config.origins.includes(origin)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await readJson<{ sessionId?: string; sessionKey?: string }>(request, 512);
    if (!body.sessionId || !body.sessionKey || !/^[A-Za-z0-9_-]{20,80}$/.test(body.sessionId)) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }
    const session = await createRedis().hgetall<{ controlHash?: string }>(`portfolio:voice:session:${body.sessionId}`);
    if (!session?.controlHash) return NextResponse.json({ ok: true });
    if (session.controlHash !== hashSecret(body.sessionKey)) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const result = await cleanupExpiredVoiceSession(body.sessionId, true);
    if (!result.cleaned) return NextResponse.json({ error: "Session cleanup pending" }, { status: 503 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Session cleanup pending" }, { status: 503 });
  }
}
