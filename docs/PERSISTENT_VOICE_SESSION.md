# Persistent portfolio voice session

The homepage previously owned the LiveKit room, private session control key and
timers inside `VoiceCallControls`. Removing that view destroyed its session state.
The privacy link also used a plain anchor, causing a full document navigation.
Server reservations can outlive the browser until authenticated or signed lease
cleanup confirms room deletion, producing the one-active-session network error.

## Ownership and navigation

`app/layout.tsx` mounts one `VoiceSessionProvider` around all routes. It owns the
room, subscribed audio elements, in-flight admission and ending operations, private
session key, playback acknowledgement, heartbeat, hard deadline and countdown.
Only one user-triggered start can run at a time. No token or control key is stored
in browser storage or exposed through the controls context.

The homepage controls and `FloatingVoiceControls` consume the same context. Route
changes and project dialogs do not create a room, issue a token, dispatch a worker,
re-enable a muted microphone, reset the deadline or acknowledge playback again.
The privacy link uses Next.js Link to preserve the root layout. Returning home
shows the existing session; it never automatically starts a conversation.

The floating panel appears while a call is starting, active or ending when the
homepage action buttons are outside the viewport or absent. It also retains a
cleanup retry if room deletion has not been confirmed. It has the same mute,
ending and audio-recovery actions, state and remaining time as the homepage.
Safe-area offsets, measured bottom spacing and keyboard focus scrolling keep
content reachable. The panel disappears after confirmed cleanup.

## Recovery and ending

- LiveKit performs recovery within the same room, with at most four retry delays
  (0, 1, 3 and 5 seconds), plus a 30-second application grace deadline. Recovery
  cannot extend the original server expiry or five-minute maximum. No application
  code calls admission again to reconnect.
- A transient failed heartbeat during SDK recovery waits for that bounded grace.
  A failed heartbeat outside recovery, a final SDK disconnect or expired grace
  stops local capture and initiates authenticated cleanup.
- Agent departure after the worker's existing farewell flow ends the frontend
  session. Navigation does not invoke ending or replay the greeting. Worker
  prompts, providers, farewell generation and playout behavior are unchanged.
- End, disconnect, deadline and page-hide actions share one ending promise.
  Concurrent cleanup shares one authenticated request. Cancellation retains a
  pending admission response so its control key can close a late-created room.
  It does not wait indefinitely for a microphone permission prompt. Late capture
  or connection completion is stopped, including after cancellation.
- Refresh, tab close and full-document navigation use `pagehide` and authenticated
  keepalive cleanup. Back-forward-cache restoration never resumes or starts a call.
  Browser delivery is best effort; the existing signed 75-second lease cleanup and
  hard server expiry remain the resource fallback.
- Failed cleanup retains the private key and blocks a new call until an explicit
  retry succeeds. A 404 is not treated as confirmation of room deletion. Redis
  reservations and locks are never cleared by the browser.
- A lost admission response can leave a reservation whose private key never
  reached the browser. The UI reports that uncertainty and pauses retries; it
  never claims cleanup succeeded or tries to reclaim the room by network identity.
- `ONE_ACTIVE` and `BUSY` display their actual admission state and pause manual
  retries for 15 seconds. Expiry of that pause does not trigger an API request.
  Network identity is never used to recover or take over another session.

No Python worker, admission API, Redis script, QStash signing, provider configuration,
production secret, quota or deployment setting is changed. Existing room-deletion
safeguards continue to gate release of concurrency locks.

## Verification and limits

`scripts/voice-controls.test.mjs` uses mocked LiveKit, Turnstile, media and fetch
boundaries. It covers route-view replacement, preserved room/mute/timer/readiness,
both controls, bounded recovery, page hide and restoration, concurrent ending,
pending cleanup and authorization errors, admission retry pauses, late permission
and connection completion, and Strict Mode effect replay.

Run `npm run test:voice`, `npm run typecheck`,
`npm run lint -- --ignore-pattern '.qa/**'`, `npm run build --ignore-scripts` and
the existing local Chromium `npm run test:browser` checks. Build lifecycle scripts
are skipped only to avoid unrelated sitemap timestamp changes.

These checks use no billable voice calls and do not prove production network
recovery, real microphone or speaker output, provider answers, or audible farewell
completion. Cross-refresh resumption is intentionally unsupported. The existing
separately deployed Python worker needs no update for this frontend change.

## Verification receipt — 2026-11-03

- `npm run test:voice`: 73 passed; no failures or skips. This includes 32 frontend
  control/lifecycle tests and the existing admission, cleanup and profile checks.
- `npm run typecheck`, lint excluding generated `.qa` artifacts, and the production
  build without sitemap lifecycle scripts: passed.
- Local Chromium: passed at 360, 375, 390, 430, 768, 1024, 1440 and 1920 pixels.
  The real client-side privacy-page round trip retained the same root widget DOM
  element. Synthetic floating controls also fit a 667-by-375 landscape viewport.
  Existing keyboard, theme, dialog, reduced-motion and asset checks passed with
  no captured browser errors. Desktop/mobile dock screenshots were reviewed.
- Actual active-call continuity is covered with mocked LiveKit and route-view
  replacement, not a paid production conversation. No live provider, production
  Redis, manual deployment, credential or quota change was performed.
