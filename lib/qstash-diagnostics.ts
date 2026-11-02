import { QstashError } from "@upstash/qstash";

// Temporary publish-failure diagnostics. Only service error fields are read;
// never serialize the error, request, headers, or the complete response body.
const serviceWords = new Set(`redacted a an the of for to from in on is are be was with and or not
  must should can cannot only provided supported allowed available requested current
  invalid valid malformed missing empty unknown unsupported unauthorized forbidden
  error err code reason status bad request failed failure publish publishing message
  destination url uri endpoint host hostname domain address public private local ip
  resolve resolves resolved resolution dns protocol scheme port https http localhost
  delay duration second seconds minute minutes hour hours day days timeout
  retry retries count max maximum min minimum limit limits exceeded exceeds exceed
  deduplication deduplicationid deduplication-id id length character characters header
  upstash upstash-delay upstash-retries upstash-deduplication-id qstash
  free plan tier quota daily burst rate ratelimit too many large size payload body
  token authentication authorization signature signing key credentials expired
  account disabled blocked suspended region mismatch permission access denied
  number less greater than at most least between value integer positive negative
  allowed_retries max_retries invalid_request bad_request`.split(/\s+/));

function safeServiceText(value: unknown, sensitiveValues: string[]) {
  if (typeof value !== "string" || !value) return undefined;
  let text = value;
  // Redact known credentials/identifiers even if they happen to be ordinary words.
  for (const secret of sensitiveValues.filter(Boolean).sort((a, b) => b.length - a.length)) {
    text = text.split(secret).join("[redacted]");
  }
  return text.slice(0, 2048)
    .replace(/https?:\/\/[^\s<>"']+/gi, "[redacted]")
    .replace(/[A-Za-z0-9_./@+=-]+/g, (word) => {
      // A vocabulary allowlist also removes unknown payloads, JWTs and keys that
      // weren't in the environment. Keep small numeric limits and duration units.
      const allowed = serviceWords.has(word.toLowerCase()) ||
        /^\d{1,6}(?:ms|s|m|h|d)?$/.test(word) ||
        word.split(/[_-]/).every((part) => serviceWords.has(part.toLowerCase()));
      return allowed ? word : "[redacted]";
    })
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 300);
}

export function qstashErrorDiagnostics(error: unknown, identifiers: string[] = []) {
  if (!(error instanceof QstashError)) return { httpStatus: null };
  const sensitiveValues = [
    ...identifiers,
    ...Object.entries(process.env)
      .filter(([name]) => /TOKEN|SECRET|SIGNING_KEY|API_KEY|PASSWORD/i.test(name))
      .map(([, value]) => value?.trim() ?? ""),
  ];
  let serviceCode: unknown;
  let serviceReason: unknown = error.message;
  try {
    const body: unknown = JSON.parse(error.message);
    if (body && typeof body === "object") {
      const fields = body as Record<string, unknown>;
      const nested = fields.error && typeof fields.error === "object"
        ? fields.error as Record<string, unknown> : undefined;
      serviceCode = fields.code ?? nested?.code;
      serviceReason = nested?.message ?? nested?.reason ?? fields.error ?? fields.message ?? fields.reason;
    } else {
      serviceReason = typeof body === "string" ? body : undefined;
    }
  } catch {
    // QStash/proxies can return plain text instead of the documented JSON error.
  }
  return {
    httpStatus: error.status ?? null,
    serviceCode: safeServiceText(serviceCode, sensitiveValues),
    serviceReason: safeServiceText(serviceReason, sensitiveValues),
  };
}
