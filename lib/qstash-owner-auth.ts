import { createHmac, timingSafeEqual } from "node:crypto";

export const QSTASH_DIAGNOSTIC_PATH = "/api/voice/diagnostic";
// Real session IDs are generated from 18 random bytes (24 base64url characters).
// This reserved 25-character ID cannot identify a generated voice session.
export const QSTASH_DIAGNOSTIC_SESSION_ID = "qstash-diagnostic-noop-v1";

export function ownerDiagnosticSignature(origin: string, timestamp: string, nonce: string, secret: string) {
  // Domain separation prevents using these signatures for session authentication.
  const key = createHmac("sha256", secret).update("portfolio:qstash-diagnostic:v1").digest();
  return createHmac("sha256", key)
    .update(["POST", origin, QSTASH_DIAGNOSTIC_PATH, timestamp, nonce].join("\n"))
    .digest("hex");
}

export function authorizeOwnerDiagnostic(request: Request, now = Date.now()) {
  const secret = process.env.VOICE_SESSION_HMAC_SECRET?.trim();
  if (process.env.VOICE_QSTASH_DIAGNOSTIC_ENABLED !== "1" || !secret || secret.length < 32) return null;
  // No browser flow, cookies, or caller-controlled publish parameters. Ignore the
  // body entirely: Next can represent even an empty POST as a non-null stream.
  if (request.method !== "POST" || request.headers.has("origin")) return null;
  const url = new URL(request.url);
  if (url.protocol !== "https:" || url.pathname !== QSTASH_DIAGNOSTIC_PATH || url.search) return null;
  const timestamp = request.headers.get("X-Owner-Timestamp") ?? "";
  const nonce = request.headers.get("X-Owner-Nonce") ?? "";
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^\d{10}$/.test(timestamp) || !/^[a-f0-9]{32}$/.test(nonce) ||
      !/^Bearer [a-f0-9]{64}$/.test(authorization)) return null;
  if (Math.abs(Math.floor(now / 1000) - Number(timestamp)) > 60) return null;
  const expected = ownerDiagnosticSignature(url.origin, timestamp, nonce, secret);
  if (!timingSafeEqual(Buffer.from(authorization.slice(7), "hex"), Buffer.from(expected, "hex"))) return null;
  // Replays within the 60-second authorization window use the same deduplication
  // ID, so QStash's ten-minute window prevents another message being enqueued.
  return `probe-${timestamp}-${nonce}`;
}
