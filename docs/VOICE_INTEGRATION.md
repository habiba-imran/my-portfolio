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
   The app requests QStash's default three delivery retries, then persists and schedules
   another reconciliation attempt when room deletion fails.
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

## Production troubleshooting

No separate terminal or local worker is needed for the deployed site. The session and cleanup
handlers run as Vercel serverless routes. A 503 from `/api/voice/session` means admission
  failed closed. The response and Vercel log include a safe `code`/`stage` (no credential
  values or request contents). `configuration`
means a required environment variable is missing or malformed; `turnstile_verification`
means Siteverify could not complete; `cleanup_reconciliation` / `cleanup_schedule` points to
QStash or Redis; `redis_reservation` points to Redis; `token_issuance` or `agent_dispatch`
points to LiveKit. Confirm Vercel Production has all variables in the table above, including
the four QStash settings, then redeploy after changing them.

The response may also report `missing_environment` with names of unset variables,
`session_secret_too_short` for an HMAC secret under 32 characters, or `cleanup_url_invalid`
when `VOICE_CLEANUP_URL` is not HTTPS at the exact cleanup path. These diagnostics never
include environment values.

### Temporary QStash publish diagnostics

If public admission quota is exhausted, use the separately protected, terminal-only
[owner QStash probe](QSTASH_OWNER_DIAGNOSTIC.md). It publishes a signed no-op cleanup message
without starting a voice session. It is disabled by default and requires an explicit deployment.

The current lockfile and installed SDK are `@upstash/qstash` 2.12.1. Offline tests against
that SDK confirm that initial cleanup publishes to
`https://qstash.upstash.io/v2/publish/https://<callback-host>/api/voice/cleanup`, with
`Upstash-Delay: 75s`, `Upstash-Retries: 3`, and `Upstash-Deduplication-Id: <sessionId>-initial`
(32 characters for the generated 24-character session ID). The SDK appends the destination
directly; do not pre-encode it. It serializes `{ sessionId }` once and sets JSON content type.
It shortens destination paths in its own log output, so an abbreviated log URL is not proof
of an empty or malformed destination. `QSTASH_URL`, `QSTASH_REGION`, regional credentials,
and `QSTASH_DEV` can affect the SDK's effective endpoint/credentials; they are not set by
this function. The next production diagnostic indicates whether URL/region overrides exist,
without logging their values. Verify them privately against the selected Upstash region.

For a non-2xx response other than rate limiting, the SDK retains the HTTP status in
`QstashError.status` and the raw service response in `.message`. Its transport retries
apply to fetch/network exceptions, not HTTP 400 responses. The previous application log
discarded status and reason. The owner subsequently confirmed the production cause with the
protected probe: QStash returned HTTP 400 and `DeduplicationId cannot [redacted] ':'`.
The former `<sessionId>:<tag>` separator was rejected. `cleanupDeduplicationId` now builds
`<sessionId>-<tag>` IDs, requires non-empty `[A-Za-z0-9_-]+` components and retains the
100-character bound. Unexpected characters fail locally rather than being normalized into
colliding IDs. This builder covers initial cleanup, heartbeats, reconciliation, deletion
retries, and the owner diagnostic, including redaction of its complete ID from errors.
Existing ASCII-only diagnostics could not catch this restriction because a colon is ASCII.

Current [publish documentation](https://upstash.com/docs/qstash/api-reference/messages/publish-a-message)
specifies three delivery retries by default. The current
[free-plan limits](https://upstash.com/pricing/qstash) include 1,000 messages/day, a 1 MB
message limit and a seven-day maximum delay. Cleanup uses delays from one second to one
hour and a small JSON body. The ten-active-schedules limit concerns recurring schedules;
this code publishes individual delayed messages. The pricing table does not specify a
separate numeric retry maximum, so do not infer the account's maximum from its default.
The documented quota/rate-limit rejection uses 429; message-size rejection uses 412.
A bare 400 does not establish either problem. The protected probe identified the colon in
the deduplication ID, so this fix does not change delay, retry count, quotas, or plan settings.
[Deduplication](https://upstash.com/docs/qstash/features/deduplication) accepts duplicates
with 202 within a ten-minute window. The SDK passes the ID unchanged; application code must
generate a supported ID. Repeated scheduling of the same session/tag retains the same ID.

After a future deployment containing these diagnostics, capture the single Vercel
Production log entry `[voice-cleanup] QStash publish failed` and the deployment's Git SHA.
The entry contains `httpStatus`, `serviceCode` (if provided), `serviceReason`, `delaySeconds`,
`retries`, `deduplicationIdLength`, `deduplicationIdAscii`, `callbackProtocol`, `callbackPath`,
`qstashUrlConfigured`, and `qstashRegionConfigured`. For the initial request, expect delay
75, retries 3, ID length 32 and HTTPS at `/api/voice/cleanup`. Retain these diagnostics for
the controlled validation described in the owner probe guide, then disable/remove the probe.

Only top-level/nested service error code/reason fields are read. Diagnostics redact known
environment secrets and session identifiers, remove URLs, allowlist service vocabulary and
small numeric limits, collapse line breaks, and bound each text field to 300 characters.
Unknown words/codes become `[redacted]`; absent code/reason fields are omitted. If the
reason is fully redacted, inspect the corresponding error privately in Upstash rather than
enabling raw response logging. Do not share raw `.message`, error objects, headers, tokens,
signing keys, or payloads. Remove the temporary logging block and its helper after diagnosis.
Failures still propagate to admission/heartbeat/callback handlers; no cleanup, signature
verification, reservation, or rate-limit behavior has been disabled.

Run `npm run test:voice-cleanup` for offline regression checks. The suite transpiles the
production TypeScript in memory, uses the actual installed SDK and mocks every fetch;
Redis/LiveKit clients are replaced with guards that throw if called. It does not load local
environment files or contact any provider. Local tests cannot confirm live service acceptance.

If Turnstile remains on “Verifying”, use the displayed Turnstile error code and confirm the
site key authorizes the deployed hostname in Cloudflare. Retry after checking extensions,
VPN/proxy, browser clock, and network access to `challenges.cloudflare.com`. The console's
`normal?lang=auto` challenge CSP messages are emitted by Turnstile's challenge context; this
repository does not set a page CSP. Do not weaken the API's server-side Turnstile check to
work around a browser challenge failure.
