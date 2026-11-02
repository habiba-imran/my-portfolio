import { createHash, createHmac, randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import { AccessToken, LiveKitAPI, TrackSource } from "livekit-server-sdk";

export const SESSION_SECONDS = 5 * 60;
const ACTIVE_KEY = "portfolio:voice:active";
const QUOTA_SECONDS = 26 * 60 * 60;

export class VoiceConfigError extends Error {}

export function getVoiceConfig() {
  const names = [
    "LIVEKIT_URL",
    "LIVEKIT_API_KEY",
    "LIVEKIT_API_SECRET",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "TURNSTILE_SECRET_KEY",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "VOICE_SESSION_HMAC_SECRET",
    "VOICE_ALLOWED_ORIGINS",
    "VOICE_CLEANUP_URL",
    "QSTASH_TOKEN",
    "QSTASH_CURRENT_SIGNING_KEY",
    "QSTASH_NEXT_SIGNING_KEY",
  ];
  const missing = names.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new VoiceConfigError("Voice service is not configured.");
  const hmacSecret = process.env.VOICE_SESSION_HMAC_SECRET!.trim();
  if (hmacSecret.length < 32) throw new VoiceConfigError("Voice service is not configured.");
  try {
    const cleanupUrl = new URL(process.env.VOICE_CLEANUP_URL!.trim());
    if (cleanupUrl.protocol !== "https:" || cleanupUrl.pathname !== "/api/voice/cleanup" || cleanupUrl.search || cleanupUrl.hash) {
      throw new Error("invalid cleanup url");
    }
  } catch {
    throw new VoiceConfigError("Voice service is not configured.");
  }
  return {
    url: process.env.LIVEKIT_URL!.trim(),
    key: process.env.LIVEKIT_API_KEY!.trim(),
    secret: process.env.LIVEKIT_API_SECRET!.trim(),
    redisUrl: process.env.UPSTASH_REDIS_REST_URL!.trim(),
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN!.trim(),
    turnstileSecret: process.env.TURNSTILE_SECRET_KEY!.trim(),
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!.trim(),
    hmacSecret,
    origins: process.env.VOICE_ALLOWED_ORIGINS!.split(",").map((v) => v.trim()).filter(Boolean),
  };
}

export function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) throw new VoiceConfigError("Voice service is not configured.");
  return new Redis({ url, token });
}

export function hashValue(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function newId() {
  return randomBytes(18).toString("base64url");
}

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getOrigin(request: Request, origins: string[]) {
  const origin = request.headers.get("origin");
  if (!origin || !origins.includes(origin)) return null;
  return origin;
}

export function getClientIp(request: Request) {
  // Vercel overwrites this platform header; never trust arbitrary X-Forwarded-For.
  if (process.env.NODE_ENV !== "production") return "127.0.0.1";
  const value = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (!value || value.length > 64) return null;
  return value;
}

export async function readJson<T>(request: Request, limit = 1024): Promise<T> {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  const length = Number(request.headers.get("content-length") ?? 0);
  if (contentType !== "application/json" || length > limit) throw new Error("invalid request");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid request");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error("invalid request");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as T;
}

export async function verifyTurnstile(token: string, ip: string, origin: string) {
  const config = getVoiceConfig();
  const body = new URLSearchParams({
    secret: config.turnstileSecret,
    response: token,
    remoteip: ip,
  });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean; hostname?: string; action?: string };
  return result.success === true && result.hostname === new URL(origin).hostname && result.action === "voice_session";
}

export async function issueLiveKitToken(roomName: string, identity: string) {
  const config = getVoiceConfig();
  const token = new AccessToken(config.key, config.secret, {
    identity,
    ttl: `${SESSION_SECONDS}s`,
  });
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublishSources: [TrackSource.MICROPHONE],
    canSubscribe: true,
    canPublishData: false,
  });
  return token.toJwt();
}

export function createLiveKitApi() {
  const host = process.env.LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const secret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!host || !apiKey || !secret) throw new VoiceConfigError("Voice service is not configured.");
  return new LiveKitAPI({
    host: host.replace(/^wss:/, "https:").replace(/^ws:/, "http:"),
    apiKey,
    secret,
    requestTimeout: 10,
  });
}

export { ACTIVE_KEY, QUOTA_SECONDS };
