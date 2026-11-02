import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { ownerDiagnosticSignature, QSTASH_DIAGNOSTIC_PATH } from "../lib/qstash-owner-auth.ts";

export async function diagnoseQstash(origin, { env = process.env, fetchImpl = fetch, now = Date.now() } = {}) {
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.username || url.password || url.search || url.hash) {
    throw new Error("Provide only the canonical HTTPS portfolio origin.");
  }
  const secret = env.VOICE_SESSION_HMAC_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("The existing server-side owner secret is required.");
  const timestamp = String(Math.floor(now / 1000));
  const nonce = randomBytes(16).toString("hex");
  const signature = ownerDiagnosticSignature(url.origin, timestamp, nonce, secret);
  // Only a scoped, short-lived signature leaves this terminal. Never send the
  // server secret or QStash credentials; never follow redirects with auth headers.
  const response = await fetchImpl(`${url.origin}${QSTASH_DIAGNOSTIC_PATH}`, {
    method: "POST",
    redirect: "error",
    headers: {
      Authorization: `Bearer ${signature}`,
      "X-Owner-Timestamp": timestamp,
      "X-Owner-Nonce": nonce,
    },
  });
  // Print only the authenticated endpoint's diagnostic fields, never HTML,
  // response headers, request details, or arbitrary error objects.
  const body = await response.json();
  return {
    endpointHttpStatus: response.status,
    ok: body.ok === true,
    published: body.published === true,
    deduplicated: body.deduplicated === true,
    httpStatus: typeof body.httpStatus === "number" ? body.httpStatus : null,
    serviceCode: typeof body.serviceCode === "string" ? body.serviceCode.slice(0, 300) : null,
    serviceReason: typeof body.serviceReason === "string" ? body.serviceReason.slice(0, 300) : null,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 4 || process.argv[2] !== "--publish") {
    console.log("Usage (Node 22.18+): npm run diagnose:qstash -- --publish https://your-portfolio.example");
    console.log("Requires explicit deployment enablement and the existing VOICE_SESSION_HMAC_SECRET in this terminal's environment.");
    process.exitCode = process.argv.includes("--help") ? 0 : 1;
  } else {
    try {
      const result = await diagnoseQstash(process.argv[3]);
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exitCode = 1;
    } catch {
      console.error("Diagnostic unavailable. Check the HTTPS origin, owner environment, deployment enablement, and connectivity. No raw error was logged.");
      process.exitCode = 1;
    }
  }
}
