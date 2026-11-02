# Temporary owner-only QStash probe

This isolates the QStash publish failure from voice admission. It does not start a voice
session, verify Turnstile, reserve a lease, access Redis, or call LiveKit. The probe does not
consume the shared voice allowance or a concurrency slot. A successful probe does consume a QStash
message/delivery allowance; it does not bypass QStash limits. Do not loop the command.

The protected production probe confirmed HTTP 400 with
`DeduplicationId cannot [redacted] ':'`: the `<sessionId>:<tag>` separator was rejected.
The shared cleanup publisher now uses `<sessionId>-<tag>`, requires non-empty components
containing only ASCII letters, digits, `_` and `-`, and retains the 100-character bound.
This is a conservative application alphabet, not a claim that these are the only characters
the service accepts. The same builder serves every cleanup/probe publish and diagnostic
redaction. Offline regressions check the actual SDK-emitted header; production acceptance
of the corrected ID still needs the single controlled validation below.

## Protection and message behavior

- `POST /api/voice/diagnostic` is disabled unless the **server-only, non-secret** setting
  `VOICE_QSTASH_DIAGNOSTIC_ENABLED` is exactly `1`. There is no browser UI or admin cookie.
- Authorization requires the existing `VOICE_SESSION_HMAC_SECRET` (at least 32 characters),
  held by a trusted project owner/server operator. No new credential is required or created.
  Never put this secret in `NEXT_PUBLIC_*`, a browser, a URL, command arguments, chat, or logs.
  This is possession-based server-secret authorization; it is not a new Vercel account role
  check. Anyone entrusted with this existing server secret has this diagnostic capability.
- The terminal signs the method, HTTPS origin, fixed path, timestamp and 128-bit random nonce
  with a domain-separated HMAC-SHA256 key derived from that secret. Only the scoped signature
  is sent. The server uses constant-time comparison and a 60-second clock-skew window.
  Requests with browser `Origin` headers are rejected. No request body fields are used.
- Disabled, anonymous, malformed, expired and forged requests return 404 before publishing.
  The terminal refuses redirects. Keep the computer clock synchronized.
- Each authorized invocation calls the existing `scheduleVoiceCleanup` once, with the existing
  QStash URL/token configuration, canonical cleanup callback, 75-second delay and three retries.
  The timestamp/nonce makes a stable deduplication ID for that authorization. Replays within
  its lifetime hit QStash's existing ten-minute deduplication window, rather than enqueueing
  another message. A fresh invocation intentionally creates a new diagnostic attempt.
- The body contains only the reserved ID `qstash-diagnostic-noop-v1`. Generated real session IDs
  are 24 base64url characters; this reserved ID is 25 characters. It cannot identify a session
  produced by the current session generator. The cleanup callback first performs its existing
  signature (including destination/body hash) and payload validation, then acknowledges this
  exact reserved ID before calling Redis or LiveKit. This no-op remains active when the publish
  endpoint is disabled, so already queued probes can finish safely.

## Run once from an owner terminal

1. When ready, manually deploy **both** the owner endpoint and the signed cleanup no-op, with
   `VOICE_QSTASH_DIAGNOSTIC_ENABLED=1` in Vercel's server-side Production environment. Use the
   canonical deployment origin, not a redirecting alias. Do not change any existing credential,
   signing key, origin list, quota or rate setting. Nothing in this implementation deploys itself.
   For this fix, first verify the active Vercel Production deployment contains the commit that
   changes the separator to `-`. If Git integration deployed it, no additional deployment is
   needed. Keep the existing owner enablement available for this one validation.
2. In the local repository, use Node **22.18+** (tested on 24) and installed project dependencies.
   The runner calls your deployed endpoint; it does not need your QStash or LiveKit keys locally.
   Obtain the existing `VOICE_SESSION_HMAC_SECRET` privately from the owner-accessible Vercel
   environment. Enter it using a hidden PowerShell prompt so the value is not in shell history:

   ```powershell
   Set-Location C:\my-portfolio
   $probeSecret = Read-Host "Existing VOICE_SESSION_HMAC_SECRET" -AsSecureString
   try {
     $env:VOICE_SESSION_HMAC_SECRET = [System.Net.NetworkCredential]::new('', $probeSecret).Password
     npm run diagnose:qstash -- --publish https://habiba-imran-portfolio.vercel.app
   } finally {
     Remove-Item Env:VOICE_SESSION_HMAC_SECRET -ErrorAction SilentlyContinue
     $probeSecret.Dispose()
   }
   ```

   Use a dedicated terminal with no pre-existing `VOICE_SESSION_HMAC_SECRET` variable; the
   example removes its temporary process-local copy afterward. It does not modify stored
   credentials. `npm run diagnose:qstash -- --help` prints usage without making requests.

3. Capture only the JSON result. For a publish rejection, expect an output such as:

   ```json
   {
     "endpointHttpStatus": 502,
     "ok": false,
     "published": false,
     "deduplicated": false,
     "httpStatus": 400,
     "serviceCode": null,
     "serviceReason": "Invalid destination [redacted]"
   }
   ```

   This is an illustrative shape, not a measured production result. `httpStatus` is QStash's
   actual rejection status, not the endpoint's 502. The service code may be absent (`null`)
   and unknown vocabulary is redacted by the existing sanitizer. HTTP 429 is reported without
   retrying around limits. No raw response body, credential, session identifier or signing key
   is returned. The existing `[voice-cleanup] QStash publish failed` server log remains available.

   On success, `ok` and `published` are true. `httpStatus` is null because the installed SDK
   exposes the transport status only on rejection; the endpoint's own status is 200. A replay
   may report `deduplicated: true`. This confirms acceptance, not delivery: check the delayed
   callback's successful delivery separately in the owner QStash console after 75 seconds.
   The signed callback returns `{ "cleaned": true, "diagnostic": true }`.
   Run the command **once**, wait at least 75 seconds, and verify that exact reserved probe
   body and successful no-op callback in the QStash console. Do not start a public voice
   session or repeat the probe automatically. If publishing fails, capture the sanitized JSON
   and inspect that rejection before another attempt. Retain the diagnostic until this check
   is complete; disable/remove it afterward using the steps below.

   A 404 means the endpoint is disabled, not yet deployed, or authorization failed. A 502 with
   null QStash status means no service rejection status was available (for example missing
   configuration or a transport failure). Keep raw SDK errors private.

## Disable and remove

Set `VOICE_QSTASH_DIAGNOSTIC_ENABLED=0` and deliberately redeploy to disable further publishing.
It is also disabled by default when the setting is absent. Let already accepted probe messages
finish while the signed no-op branch still exists; retain it until deliveries/retries are drained.

After diagnosis, remove `app/api/voice/diagnostic/route.ts`, `lib/qstash-owner-auth.ts`,
`scripts/diagnose-qstash.mjs`, and the `diagnose:qstash` package script. Remove the reserved-ID
import/no-op branch from `app/api/voice/cleanup/route.ts`, the owner-probe tests/imports from
`scripts/voice-cleanup.test.mjs`, this document/link, and the temporary enablement setting.
Retain the original cleanup and its signature checks. No credential rotation or Redis edits
are needed to remove this diagnostic. The earlier sanitized publish logger is independent.

## Offline verification

`npm run test:voice-cleanup` includes owner authorization, expiry/scope rejection, replay IDs,
fixed scheduling, the `[A-Za-z0-9_-]{1,100}` ID format across every mocked publish,
pre-publish rejection of unexpected characters, sanitized 400/429 output, and actual QStash signature verification with
synthetic current/rotated keys. It verifies the reserved callback never delegates to session
cleanup and normal session IDs still do. All fetches are mocked and Redis/LiveKit calls are
guarded. The terminal runner is tested against a mocked endpoint; no production probe runs.
