// PHI-aware logger. Strips sensitive fields before logging.
const SENSITIVE_KEYS = new Set([
  "ssn", "ssn_last4", "ssnLast4", "ssn_last_four",
  "member_id", "memberId", "group_number", "groupNumber",
  "dob", "date_of_birth",
  "access_token", "refresh_token", "accessToken", "refreshToken",
  "phi_key", "encryption_key", "password",
]);

function redact(input: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth-limit]";
  if (input == null) return input;
  if (Array.isArray(input)) return input.map((v) => redact(v, depth + 1));
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) out[k] = "[redacted]";
      else out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return input;
}

export const log = {
  info(message: string, meta: Record<string, unknown> = {}) {
    console.log(JSON.stringify({ level: "info", message, ...(redact(meta) as object) }));
  },
  warn(message: string, meta: Record<string, unknown> = {}) {
    console.warn(JSON.stringify({ level: "warn", message, ...(redact(meta) as object) }));
  },
  error(message: string, err?: unknown, meta: Record<string, unknown> = {}) {
    const errInfo =
      err instanceof Error
        ? { error: err.message, stack: err.stack?.split("\n").slice(0, 5).join("\n") }
        : { error: String(err) };
    console.error(JSON.stringify({ level: "error", message, ...errInfo, ...(redact(meta) as object) }));
  },
};
