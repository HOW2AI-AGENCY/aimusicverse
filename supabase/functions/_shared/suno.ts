/**
 * Checks whether a Suno API `code` value represents success.
 * Suno returns 2xx codes (e.g., 200/201) for accepted or completed tasks.
 */
export function isSunoSuccessCode(code: unknown): boolean {
  const numericCode = Number(code);
  return Number.isFinite(numericCode) && numericCode >= 200 && numericCode < 300;
}

// ---------------------------------------------------------------------------
// Webhook signature verification — unified for all Suno callbacks (HIGH-2)
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = Deno.env.get("SUNO_WEBHOOK_SECRET");

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify Suno webhook HMAC-SHA256 signature.
 *
 * Headers expected:
 *   - X-Suno-Signature (or x-suno-signature)
 *   - X-Suno-Timestamp (or x-suno-timestamp)
 *
 * Signature format: HMAC-SHA256(`${payload}${timestamp}`) as hex.
 *
 * FAIL-CLOSED: returns FALSE if SUNO_WEBHOOK_SECRET is not configured.
 */
export async function verifySunoSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null,
): Promise<boolean> {
  if (!WEBHOOK_SECRET) {
    console.error("[suno] SUNO_WEBHOOK_SECRET not set — rejecting callback");
    return false;
  }
  if (!signature || !timestamp) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${payload}${timestamp}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(hex, signature);
}

/**
 * Extract Suno signature headers from a Request.
 */
export function getSunoSignatureHeaders(req: Request): {
  signature: string | null;
  timestamp: string | null;
} {
  return {
    signature: req.headers.get("X-Suno-Signature") || req.headers.get("x-suno-signature"),
    timestamp: req.headers.get("X-Suno-Timestamp") || req.headers.get("x-suno-timestamp"),
  };
}
