import { NextResponse } from "next/server";
import { cleanupCallbackUrl, cleanupExpiredVoiceSession, qstashReceiver } from "../../../../lib/voice-cleanup";
import { QSTASH_DIAGNOSTIC_SESSION_ID } from "../../../../lib/qstash-owner-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readBoundedBody(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new Error("Invalid content type");
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 1024) throw new Error("Payload too large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024) {
        await reader.cancel();
        throw new Error("Payload too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("Upstash-Signature");
    if (!signature) return NextResponse.json({ error: "Forbidden" }, { status: 401 });
    const body = await readBoundedBody(request);
    const valid = await qstashReceiver().verify({
      signature,
      body,
      url: cleanupCallbackUrl(),
    });
    if (!valid) return NextResponse.json({ error: "Forbidden" }, { status: 401 });

    const payload: unknown = JSON.parse(body);
    if (!payload || typeof payload !== "object" || !("sessionId" in payload) ||
        typeof payload.sessionId !== "string" || !/^[A-Za-z0-9_-]{20,80}$/.test(payload.sessionId)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    // Temporary probe: acknowledge only after the normal QStash signature and
    // payload checks, before any Redis access or LiveKit room operation.
    if (payload.sessionId === QSTASH_DIAGNOSTIC_SESSION_ID) {
      return NextResponse.json({ cleaned: true, diagnostic: true }, { headers: { "Cache-Control": "no-store" } });
    }
    const result = await cleanupExpiredVoiceSession(payload.sessionId);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Non-2xx makes QStash retry. The handler persists failed cleanup state and
    // publishes a delayed reconciliation before this callback is acknowledged.
    return NextResponse.json({ error: "Cleanup will be retried" }, { status: 503 });
  }
}
