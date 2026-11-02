import { NextResponse } from "next/server";
import { scheduleVoiceCleanup } from "../../../../lib/voice-cleanup";
import { qstashErrorDiagnostics } from "../../../../lib/qstash-diagnostics";
import { authorizeOwnerDiagnostic, QSTASH_DIAGNOSTIC_SESSION_ID } from "../../../../lib/qstash-owner-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

// Temporary terminal-only diagnostic. No public admission, quotas, or sessions.
export async function POST(request: Request) {
  const tag = authorizeOwnerDiagnostic(request);
  if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  try {
    const result = await scheduleVoiceCleanup(QSTASH_DIAGNOSTIC_SESSION_ID, 75, tag);
    return NextResponse.json({
      ok: true,
      published: true,
      deduplicated: "deduplicated" in result && result.deduplicated === true,
      // The SDK exposes the exact HTTP status on rejection, but discards it on
      // success. Do not invent a status from the parsed success response.
      httpStatus: null,
      serviceCode: null,
      serviceReason: null,
    }, { headers });
  } catch (error) {
    const details = qstashErrorDiagnostics(error, [QSTASH_DIAGNOSTIC_SESSION_ID, `${QSTASH_DIAGNOSTIC_SESSION_ID}:${tag}`]);
    return NextResponse.json({
      ok: false,
      published: false,
      httpStatus: details.httpStatus,
      serviceCode: details.serviceCode ?? null,
      serviceReason: details.serviceReason ?? null,
    }, { status: 502, headers });
  }
}
