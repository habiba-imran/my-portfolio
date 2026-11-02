import { NextResponse } from "next/server";
import {
  ACTIVE_KEY,
  createLiveKitApi,
  createRedis,
  getClientIp,
  getOrigin,
  getVoiceConfig,
  hashSecret,
  hashValue,
  issueLiveKitToken,
  newId,
  SESSION_SECONDS,
  VoiceConfigError,
  verifyTurnstile,
  readJson,
} from "../../../../lib/voice-session";
import { scheduleExpiredVoiceReconciliation, scheduleVoiceCleanup } from "../../../../lib/voice-cleanup";
import { BUDGET_TTL_SECONDS, COMMIT_VOICE_BUDGET, REFUND_FAILED_VOICE_BUDGET, RELEASE_VOICE_RESERVATION, RESERVE_VOICE_SESSION } from "../../../../lib/voice-admission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let stage = "configuration";
  try {
    const config = getVoiceConfig();
    stage = "request_validation";
    const origin = getOrigin(request, config.origins);
    const ip = getClientIp(request);
    if (!origin || !ip) return NextResponse.json({ error: "Voice sessions are unavailable." }, { status: 403 });

    // Turnstile supports 2,048-character tokens; allow the JSON envelope too.
    const payload = await readJson<{ turnstileToken?: string }>(request, 4096);
    if (typeof payload.turnstileToken !== "string" || payload.turnstileToken.length > 2048) {
      return NextResponse.json({ error: "Complete the security check to continue." }, { status: 400 });
    }
    stage = "turnstile_verification";
    if (!(await verifyTurnstile(payload.turnstileToken, ip, origin))) {
      return NextResponse.json({ error: "The security check expired. Please try again.", code: "verification_failed" }, { status: 403 });
    }

    // Also adopt any pre-QStash expired leases left by an earlier deployment.
    stage = "cleanup_reconciliation";
    await scheduleExpiredVoiceReconciliation();

    stage = "redis_reservation";
    const redis = createRedis();
    const ipHash = hashValue(ip, config.hmacSecret);
    const sessionId = newId();
    const sessionKey = newId() + newId();
    const roomName = `portfolio-${newId()}`;
    const identity = `visitor-${newId()}`;
    const now = Math.floor(Date.now() / 1000);
    const hardExpiry = now + SESSION_SECONDS;
    const leaseExpiry = Math.min(now + 75, hardExpiry);
    const result = await redis.eval<unknown[], string>(RESERVE_VOICE_SESSION, [
      ACTIVE_KEY,
      `portfolio:voice:ip-active:${ipHash}`,
      `portfolio:voice:session:${sessionId}`,
      `portfolio:voice:budget:${new Date(now * 1000).toISOString().slice(0, 10)}`,
    ], [now, leaseExpiry, hardExpiry, sessionId, roomName, identity, hashSecret(sessionKey), BUDGET_TTL_SECONDS,
      config.maxConcurrentSessions, SESSION_SECONDS, config.dailyBudgetSeconds]);

    if (result !== "OK") {
      const status = result === "ONE_ACTIVE" || result === "BUSY" ? 409 : 503;
      const messages: Record<string, string> = {
        BUDGET: "The voice demo is resting for now. Please explore my work and try again later.",
        ONE_ACTIVE: "A conversation is already open on this network. End it first, or give it a moment to finish.",
        BUSY: "A few conversations are happening right now. Please try again in a moment.",
      };
      return NextResponse.json({ error: messages[result] ?? "Voice sessions are unavailable.", code: result }, { status, headers: { "Cache-Control": "no-store" } });
    }

    let dispatchStarted = false;
    try {
      stage = "cleanup_schedule";
      await scheduleVoiceCleanup(sessionId, 75, "initial");
      stage = "token_issuance";
      const token = await issueLiveKitToken(roomName, identity);
      stage = "agent_dispatch";
      const livekit = createLiveKitApi();
      dispatchStarted = true;
      await livekit.agentDispatch.createDispatch(roomName, "voiceagent");
      stage = "budget_commit";
      const committed = await redis.eval<unknown[], number>(COMMIT_VOICE_BUDGET, [`portfolio:voice:session:${sessionId}`], []);
      if (committed !== 1) throw new Error("Voice allocation was not committed.");
      return NextResponse.json({
        serverUrl: config.url,
        participantToken: token,
        sessionId,
        sessionKey,
        expiresAt: hardExpiry,
      }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      console.error("[voice-session] provisioning failed", {
        stage,
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
      await redis.eval<unknown[], number>(dispatchStarted ? REFUND_FAILED_VOICE_BUDGET : RELEASE_VOICE_RESERVATION,
        [ACTIVE_KEY, `portfolio:voice:session:${sessionId}`], [sessionId, "failed"]);
      // Dispatch may have succeeded even if its request timed out. Keep the lease
      // so scheduled cleanup can inspect and delete any room that was created.
      return NextResponse.json({
        error: "The voice agent could not be reached. Please try again.",
        code: stage,
      }, { status: 503 });
    }
  } catch (error) {
    // Keep credentials and request data out of logs; the stage pinpoints which
    // Vercel setting or dependency to inspect when admission fails closed.
    const configError = error instanceof VoiceConfigError ? error : null;
    console.error("[voice-session] admission unavailable", {
      stage,
      errorType: error instanceof Error ? error.name : "UnknownError",
      configIssue: configError?.issue,
      variables: configError?.variables,
    });
    return NextResponse.json({
      error: "Voice sessions are temporarily unavailable.",
      code: configError?.issue ?? stage,
      ...(configError?.variables.length ? { variables: configError.variables } : {}),
    }, { status: 503 });
  }
}
