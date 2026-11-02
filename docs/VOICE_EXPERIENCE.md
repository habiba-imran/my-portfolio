# Portfolio voice experience

The voice assistant remains inside the hero “hi” panel. Its UI, Turnstile execution and
admission accounting changed; the existing LiveKit Cloud `voiceagent` dispatch and
Deepgram/Groq/Cartesia worker are not copied, hosted or modified in this repository.

## Conversation and accessibility

“Talk to me” starts one flow: unlock browser audio during the click, obtain a fresh
Turnstile proof, ask the protected session API for scoped credentials, join LiveKit,
and request microphone permission. Mute/Unmute and End remain native keyboard-operable
buttons with visible focus and 44px-or-larger targets. Status changes are announced by a
polite live region; failures use a separate alert. The “A note on privacy” link opens `/privacy`.

Ready, verification, connecting, waiting, listening, speaking, muted, reconnecting, ending
and error states are explicit. Listening requires a connected room and an agent participant.
Speaking reads LiveKit agent `isSpeaking`, through actual active-speaker events; simply
subscribing to a remote audio track no longer changes the UI to Speaking. The orb/level bars
use SDK audio levels. No random signal or timer fabricates speech. Reduced-motion users
retain text states with static visuals. Browser-blocked playback has an explicit recovery button.

Cancellation retains a late session-creation response so its private control key can close
the reservation. A microphone grant arriving after cancellation immediately stops its track.
Unmount, End, the five-minute deadline and heartbeat failure all close local audio and
request server cleanup. Failed cleanup leaves a retry action and the signed QStash fallback.
No frontend timer replaces server-side cleanup, and a disconnected browser cannot extend a lease.

## Invisible Cloudflare Turnstile: owner configuration

The integration uses [documented execution and appearance options](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/):
`execution: "execute"`, `appearance: "interaction-only"`, action `voice_session`, manual
expiration refresh, and no automatic challenge retry loop. A click waits for the script if
necessary, then executes the challenge. One expired/duplicate Siteverify rejection renews
the proof once without requiring another click. Challenge errors/timeouts show a friendly retry.

Appearance is separate from widget mode: it does **not** turn a Managed key into Invisible.
There is no CSS scaling, clipping, `display:none`, `hidden`, or `aria-hidden` around the widget.
A Managed widget may legitimately show an interactive challenge if Cloudflare requires it.
For a fully invisible normal experience, configure the widget itself:

1. Open **Cloudflare Dashboard → Turnstile**, select the portfolio widget, then **Settings/Edit**.
2. Set **Widget mode → Invisible**. If the current widget cannot be changed, create an Invisible
   widget with the same intended hostname restrictions. Do not disable Siteverify.
3. Include `habiba.is-a.dev` in allowed hostnames. Include the existing Vercel hostname
   `habiba-imran-portfolio.vercel.app` only if visitors also use that origin; add other actual
   aliases individually as needed. Use hostname entries, not URL paths or wildcard access.
4. Editing the existing widget's mode does not require rotating credentials. If a new widget
   is created, its key pair must be kept together: set **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** to
   its public sitekey and **`TURNSTILE_SECRET_KEY`** to its secret, in the intended Vercel
   Production environment (and Preview only if voice use there is intended). The secret must
   stay server-only. Do not change LiveKit, Redis, QStash or HMAC credentials for this work.
5. If environment values change, a new portfolio build/deployment must load them; the public
   sitekey is embedded at build time. Confirm the existing **`VOICE_ALLOWED_ORIGINS`** already
   contains `https://habiba.is-a.dev` and the exact origins you support. Keep the working,
   signed **`VOICE_CLEANUP_URL`** unchanged. No production configuration or manual deployment
   is changed by the local implementation/tests; apply dashboard/environment changes yourself
   or approve them separately.

The server still calls Siteverify and requires `success`, the expected `voice_session`
action and the allowed origin's hostname. Used/expired proofs cannot create sessions. The
official [widget documentation](https://developers.cloudflare.com/turnstile/concepts/widget/)
requires Invisible users to reference Cloudflare's Turnstile Privacy Addendum in their own
privacy policy. `/privacy` now includes that disclosure and a direct link to the
[Addendum](https://www.cloudflare.com/turnstile-privacy-policy/), alongside factual voice/session
processing information. The hero links to it without interrupting the call flow.

## Shared abuse and cost safeguards

The owner selected **60 minutes of maximum session time across all visitors per UTC day**.
There is no per-network daily or short-window attempt counter. Admission still requires
an allowed origin, Vercel's trusted IP header and a valid single-use Turnstile proof.

| Setting | Default | Behavior |
| --- | --- | --- |
| `VOICE_DAILY_BUDGET_SECONDS` | `3600` | Shared UTC-day allowance, integer `0`–`86400`; `0` pauses new sessions |
| `VOICE_MAX_CONCURRENT_SESSIONS` | `5` | Global concurrent reservation cap, integer `1`–`5` |
| Per-network concurrency | `1` | Another session cannot start until the first is safely released |
| Maximum session duration | `300` seconds | Existing hard expiry, heartbeat checks and browser deadline remain |
| Lease | `75` seconds | Heartbeats every 30 seconds schedule signed cleanup before extending it |

Missing optional settings use defaults. Invalid numeric limits fail closed with safe server
configuration diagnostics. These settings are server-only and do not change provider keys.

Each start atomically reserves its full five-minute maximum from
`portfolio:voice:budget:YYYY-MM-DD`, considering both pending and committed allocations.
At 3,600 seconds, this allows 12 successful starts, even if some end early. It does not
measure spoken seconds, refund the unused portion of a successful call, or promise a fixed
provider invoice. A successful dispatch commits once before its token is returned. Failed
provisioning refunds its allocation. Failed checks and busy responses do not allocate budget.

If no dispatch was attempted, failure releases both the allocation and concurrency immediately.
If dispatch/commit timed out, the failure refunds its allocation but **keeps concurrency locks**:
the provider might already have created a room. Signed cleanup must confirm room removal before
releasing those locks. A provider failure can still have consumed resources even if the app
refunds its allowance; this counter is not provider billing telemetry.

Deletion failure retains Redis state and publishes another signed retry using the existing
bounded backoff and QStash delivery retries. Cleanup releases a pending allocation once;
committed successful-session usage remains charged. A subsequent verified admission adopts
expired leases, including a crash before initial scheduling. Expired leases are never simply
removed from concurrency sets before cleanup confirms safety. When Redis/QStash is unavailable,
admission fails closed. If all signed retries fail, operator reconciliation is still required;
do not manually clear reservations or reset production quotas to reopen capacity.

Budget metadata is kept on each session so a refund across UTC midnight affects its original
day. Aggregate budget keys expire after 26 hours of inactivity. Legacy session records without
budget metadata still clean up normally. Old per-network counter keys are untouched and expire
under their existing TTLs; they no longer affect admission.

## Verification and remaining production checks

- `npm run test:voice`: production Lua executed in a local Lua VM with Redis command primitives,
  route-level provisioning/refund tests, QStash diagnostics/signature tests, and React controls
  in jsdom with mocked Turnstile, LiveKit, microphone, playback and HTTP boundaries.
- `npm run typecheck`, `npm run lint`, `npm run build`.
- `npm run test:browser`: local Chromium only, responsive layouts including 375px/landscape,
  keyboard/focus, accessible naming, control target sizes, privacy disclosure and reduced motion.
  It submits an invalid proof shape, which rejects before any provider provisioning.

Tests use synthetic keys and no real voice providers. The Lua harness executes production
scripts but is not a live Redis/provider load test. Browser/jsdom checks do not demonstrate
PSTN behavior, production challenge success, real microphone quality, worker readiness or
caller-heard latency. After the owner verifies Invisible configuration and the new portfolio
commit is active, make one controlled real conversation: start once, verify microphone/playback,
agent speech vs silence, mute/unmute, reconnect recovery if practical, End, and signed cleanup.
Inspect the shared ledger and room deletion privately; never paste credentials or reset keys.
