# LiveKit voice demo operations

The portfolio connects directly to the existing LiveKit Cloud worker and explicitly
dispatches `voiceagent`. It does not copy, build, or deploy the Python worker and does not
run its SQLite gateway in Vercel. The browser receives only a short-lived, room-scoped
microphone token from the Next.js server.

## Required configuration

Copy `.env.example` to `.env.local` for local server work. Set the same production values in
Vercel Project Settings → Environment Variables. Never commit `.env.local` or add any
Deepgram, Groq, or Cartesia provider credentials to this project.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `LIVEKIT_URL` | Server | LiveKit Cloud `wss://` URL |
| `LIVEKIT_API_KEY` | Server | Token signing and room/agent dispatch API |
| `LIVEKIT_API_SECRET` | Server | Token signing and LiveKit API authentication |
| `UPSTASH_REDIS_REST_URL` | Server | Redis REST endpoint used for quotas, session leases, and reconciliation state |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Redis REST credential |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Browser | Cloudflare Turnstile widget site key |
| `TURNSTILE_SECRET_KEY` | Server | Turnstile Siteverify credential |
| `VOICE_SESSION_HMAC_SECRET` | Server | Independent random HMAC secret, minimum 32 characters |
| `VOICE_ALLOWED_ORIGINS` | Server | Exact comma-separated origins; no trailing slash |
| `QSTASH_TOKEN` | Server | Sends authenticated delayed cleanup messages |
| `QSTASH_CURRENT_SIGNING_KEY` | Server | Verifies current QStash callback signatures |
| `QSTASH_NEXT_SIGNING_KEY` | Server | Verifies QStash key rotation callbacks |
| `VOICE_CLEANUP_URL` | Server | Canonical public HTTPS URL ending exactly in `/api/voice/cleanup` |

Upstash Redis integration may populate the standard `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` names automatically. Confirm the names shown in Vercel and add
them explicitly if needed. The QStash token and both signing keys are separate from Redis
credentials. Obtain them from the Upstash QStash console. Keep all variables server-side
except the Turnstile site key. The server checks Turnstile success, expected `voice_session`
action, and hostname matching the request origin.

## Configure delayed cleanup for Vercel Hobby

Minute-level Vercel Cron is not used. QStash is required and checked before voice sessions
can start. Configure it before any microphone test:

1. In Upstash, create or select a QStash account/workspace and copy its `QSTASH_TOKEN`,
   `QSTASH_CURRENT_SIGNING_KEY`, and `QSTASH_NEXT_SIGNING_KEY` into local `.env.local` and
   Vercel Production (and Preview only if preview voice use is intended).
   Confirm the QStash plan accepts the five delivery retries requested by this app; otherwise
   adjust `retries` in `lib/voice-cleanup.ts` to the plan's permitted maximum before enabling
   sessions.
2. Set `VOICE_CLEANUP_URL` in Vercel to the canonical production origin plus
   `/api/voice/cleanup`, for example `https://portfolio.example/api/voice/cleanup`. Do not
   point it at a preview deployment or redirecting URL.
3. Add the same public HTTPS endpoint to local `.env.local` only if you intentionally test
   delayed cleanup through a public HTTPS tunnel. A localhost URL cannot receive QStash
   callbacks. Without all QStash values, the voice API returns unavailable by design.
4. Redeploy manually after entering Vercel environment values so the server functions load
   them. This repository change does not deploy or make the service active.

The app queues a signed cleanup callback before issuing a token/dispatch and queues another
callback before each heartbeat extends a lease. Each callback verifies the QStash signature
against the fixed canonical endpoint. Stale callbacks are harmless. Expired callbacks delete
the LiveKit room idempotently; Redis concurrency/IP reservations are released only after
successful room deletion. On LiveKit failure, the record persists in Redis and the callback
schedules another delayed reconciliation with bounded backoff; QStash delivery retries cover
transient callback failures. A failed schedule prevents admission or lease extension. There
is no browser timer or cron dependency.

If QStash exhausts retries or is unavailable, the reservation intentionally remains active
and counts against the five-session global and one-session-per-network concurrency limits.
This fails closed and may require inspecting QStash delivery logs and retrying the signed
callback after restoring service. Do not manually delete Redis session keys unless the
corresponding LiveKit room has been confirmed removed. Retain QStash retries and monitor its
delivery/dead-letter state before enabling public use.

## Enforced admission and cleanup

- Missing LiveKit, Redis, Turnstile, HMAC, origin, or QStash configuration fails closed.
- A valid Turnstile token is required before each session. Redis atomically enforces at most
  five portfolio-wide sessions, one active session per trusted network IP, three starts per
  ten minutes, and five starts per UTC day per network.
- Session tokens are room-scoped, microphone-only, and expire after five minutes. Heartbeats
  use a private control key and extend a 75-second cleanup lease only after scheduling works.
- Explicit End authenticates the session control key and deletes the room before releasing
  active-session reservations. The daily start quota remains consumed. Repeated cleanup
  callbacks and End requests are safe.
- Redis pseudonymizes network identifiers with HMAC. Production IP identity comes only from
  Vercel's platform-overwritten `x-vercel-forwarded-for`; absent identity denies admission.
- Set `VOICE_ALLOWED_ORIGINS` to the exact production origin(s). Add a preview origin only
  when intentionally enabling preview voice traffic. Configure Turnstile for each permitted
  hostname.

Local offline builds and tests cannot prove microphone permission, LiveKit dispatch, worker
readiness, audible playback, QStash delivery, or production abuse limits. The first real
microphone test should happen only after the configuration checklist above is complete.
