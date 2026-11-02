# Portfolio voice assistant profile

The deployed conversational agent is a separate Python worker. The portfolio API creates
room-scoped microphone tokens and dispatches that worker; Next.js does not execute the
conversation. These changes require an approved update of the existing worker as well as
the portfolio frontend. No update is performed by the preparation command below.

## Causes and fixes

The worker's default opening was `user_first`, its ending tool was disabled by default,
and the generic prompt did not contain portfolio knowledge. Those reusable defaults stay
unchanged. The portfolio supplies an explicit public host profile enabling:

- Exact fixed greeting through `session.say`, with zero LLM generation calls.
- A browser acknowledgement after the subscribed agent audio element's `play()` succeeds
  and `Room.canPlaybackAudio` is true. The worker holds microphone input until it schedules
  the greeting, then restores normal native turn-taking. Reconnection does not re-greet.
- A 300 ms in-memory silent audio probe before the acknowledgement. Some browsers wait for
  real media before resolving `play()`; waiting for a greeting to supply that media would
  otherwise deadlock. The probe uses supplied PCM, with no TTS/LLM request or persisted audio.
- Whole-utterance deterministic exit detection in `on_user_turn_completed`, before Groq.
  Clear compound goodbyes produce the exact fixed farewell, wait for native speech playout,
  then shut down. A ten-second bound handles stalled/failed speech. New user speech cancels
  an interrupted farewell; duplicate end requests share one result. Quotes, negations,
  questions and continuing topic requests do not match. Unclear cases retain the existing
  guarded tool/normal conversation path. Preemptive LLM generation must remain off for this
  opt-in, so an obvious goodbye cannot start a speculative model request.
- A stable prompt containing the reviewed public portfolio facts, third-person identity,
  concise speech policy, follow-up context guidance and explicit uncertainty rules.

The greeting is:

> Hi! I'm Habiba's AI assistant. I can tell you about her skills, projects, experience, and professional background. What would you like to know?

The farewell is:

> Thanks for chatting! Have a great day!

Both use the same existing Cartesia configuration as conversational speech. No voice ID,
model, credentials or provider tuning are changed. Prerecorded audio was not generated:
doing so needs paid-provider and audio-persistence approval. Fixed-text TTS is the permitted
fallback and incurs normal TTS usage during actual conversations, with no opening/closing
LLM generation. Audible browser/device behavior still needs a controlled live check.

The browser token adds only `canUpdateOwnMetadata`, for its own readiness attribute.
It remains restricted to its room and microphone, without room-admin, recording, arbitrary
data publication or provider credentials. The worker accepts the exact readiness value
only from its linked participant. Attributes never become system instructions. The normal
startup deadline closes a client that never becomes ready.

## Knowledge and source conflicts

`voice-profile/knowledge.json` is the reviewed, concise public knowledge source;
`voice-profile/instructions.md` defines persona and grounding. The facts were extracted
offline from `public/Umm-e-Habiba-Imran-CV.pdf`, visually checked, and supplemented from
`lib/data.ts`. No personal phone number, address, email or identification number is copied.
No latency guarantee is inferred from CV testing claims.

The current unresolved differences are deliberately recorded:

| Detail | CV | Portfolio |
| --- | --- | --- |
| Finova current title | Software Developer, promoted from AI Intern | Full Stack Developer |
| Finova internship | February–March 2026 | February–April 2026 |
| SPS-NASTP internship | June–July 2025 | July–September 2025 |

Broad answers can describe the work and progression. Exact title/date questions must
acknowledge the conflicting sources. Resolve these entries when the owner confirms the
correct facts; do not silently choose one. Expected graduation is not a completed degree.

To update the assistant, review the CV and portfolio, edit the JSON, keep it concise, run
`npm run test:voice`, and regenerate the worker build context. No PDF parsing, vector store,
retrieval API, extra classifier or model request runs during a conversation. The generated
prompt is about 8 KiB, loaded into the worker's immutable prompt snapshot when a session
initializes. Existing bounded history preserves normal follow-ups. Real-model factual
accuracy and adherence to the unknown-information policy are live acceptance checks;
scripted tests do not prove them.

## Prepare an independently deployable worker context

From the portfolio repository:

```powershell
node scripts/prepare-voice-profile.mjs --worker "C:\Users\habiba\Desktop\voice-agent\voiceagent"
```

This creates a new `.qa/voice-worker-build-*` directory and prints its exact path. It copies
only the required public worker source/build files and writes:

```text
customization/host/agent.yaml  # public partial configuration, valid YAML/JSON
customization/host/prompt.md   # instructions plus compact structured knowledge
```

It does not modify the original worker checkout, copy `.env.local`, `.git`, LiveKit bindings,
provider IDs, caches or recordings, make network requests, or deploy. Re-running creates a
fresh directory rather than overwriting an existing build. The reusable worker Git history
contains no Habiba-specific profile; other hosts can supply their own public profile.

At runtime the worker merges the optional public host configuration over its selected base
YAML, before private dotenv/process environment/constructor overrides. Its existing direct
provider configuration and voice ID therefore continue to apply. Explicit prompt, greeting
or ending overrides can supersede this profile: review effective configuration offline
before any approved rollout. Never change credentials merely to activate the public profile.

The worker Dockerfile includes only the two allowlisted public host assets. The prepared
context has its own public `.gitignore`, because LiveKit uploads also honor `.gitignore`;
using the original worker checkout with ignored host files would omit the profile. Deploy
**the prepared context**, after separate approval, to the **existing** worker using its
existing approved project/agent binding. No new worker, deployment identity or secrets file
is created. Keep the original binding outside the source handoff and build context.
Actual CLI packaging, Linux image construction and Cloud rollout are not claimed as tested
when the CLI/Docker tooling is unavailable.

Reference: [LiveKit build context exclusions](https://docs.livekit.io/deploy/agents/builds/).

## Cleanup, safeguards and validation

After static farewell playout, native worker shutdown disconnects its agent participant.
The frontend's existing departure/disconnect handling turns off the microphone, releases
the authenticated server session and restores Ready. Concurrent end/disconnect events share
one frontend ending operation. Redis release remains atomic/idempotent; uncertain room
deletion retains capacity and existing signed QStash retries reconcile it. Tab-close,
heartbeat and maximum-duration fallbacks stay in place.

The 60-minute UTC daily allowance, five globally active sessions, one per network,
five-minute session maximum, Turnstile origin/hostname/action checks, private session
control keys and QStash deduplication/signature rules are preserved. The owner diagnostic
remains protected and available; it does not bypass voice admission. Do not reset quotas
for validation. Wait for the normal allowance to be available.

Offline checks:

```powershell
npm run test:voice
npm run typecheck
npm run lint
npm run build
```

In the worker repository, with its existing locked environment:

```powershell
uv sync --locked
uv run ruff check .
uv run python -m compileall -q src agent.py
uv run pytest -q
```

Worker tests block external Python networking and use scripted providers. The full suite
also performs a clean-copy locked install and reruns unit tests in that copy. Where the
existing verified wheelhouse is used, set `UV_OFFLINE=true`, the worker-local `UV_CACHE_DIR`,
`UV_FIND_LINKS`, and `VOICEAGENT_TEST_WHEELHOUSE` as recorded in its phase report.

After an approved portfolio/worker rollout, use one short normal-quota session per browser:

1. On desktop and mobile, click Talk to me, allow the mic, and remain silent. Hear the exact
   greeting once. If autoplay is blocked, use Tap to hear; no premature greeting should occur.
2. Ask who Habiba is, her skills, projects and experience, then “Tell me more about that
   project.” Ask an undocumented preference and an exact conflicting internship date.
3. Mention goodbye in a question; the call should continue. Briefly reconnect the network;
   the greeting should not repeat. Test mute/unmute.
4. Say “Goodbye, I don't want to know anything more.” Hear the exact full farewell before
   disconnection, see Ready return, and confirm one authenticated session end. Inspect safe
   worker/provider usage evidence for zero greeting/explicit-ending LLM generations.
5. Confirm Redis concurrency capacity is released after confirmed room deletion, daily
   committed allowance is not refunded for a successful call, and signed cleanup remains
   available. Do not clear keys, alter quotas, record audio or initiate extra calls.

Native server playout is not a measurement of speaker output on a real device. The live
check must establish audible opening/farewell timing, microphone recovery, actual Groq
answers, mobile autoplay and production teardown. No paid/live acceptance is performed by
the offline preparation or tests.

## Verification receipt — 2026-11-03

- `npm run test:voice`: 60 passed, no failures/skips. The final exact-phrase assertions
  were also rerun with `node --test scripts/voice-profile.test.mjs`: 3 passed.
- `npm run typecheck`, `npm run lint`, `npm run build`: exit 0. Generated sitemap-only
  timestamp changes were excluded from the commit.
- Worker `uv sync --locked`, `uv run ruff check .`, `uv run ruff format --check .`,
  and `uv run python -m compileall -q src agent.py scripts tests`: exit 0.
- Worker `uv run pytest -q --durations=5`: **517 passed in 411.51 seconds**, no failures
  or skips; independent clean-copy install/unit rerun took 261.01 seconds. Test timings
  are execution time, not voice latency. Existing Python lock/dependencies are unchanged.
- Prepared-context validation with the installed SDK loaded all intended host controls
  and prompt from 29 public files. Both ignore policies admit the profile; no credentials
  or deployment binding were copied. This is local loader/context verification, not an
  actual Linux image, CLI upload, Cloud rollout or audible browser test.
- Staged private-file/selected-key-pattern checks found no secrets or environment files.
  The staged portfolio files were also compared locally against the worker's five
  configured credential values without exposing them; no matches. These checks are
  limited to configured values, selected patterns and filename policies.

No production Redis access, provider requests, recording, credential change, quota reset,
force push or manual deployment was performed during implementation and verification.
