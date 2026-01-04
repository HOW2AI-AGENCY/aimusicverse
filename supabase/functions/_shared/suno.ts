/**
 * Checks whether a Suno API `code` value represents success.
 * Suno returns 2xx codes (e.g., 200/201) for accepted or completed tasks.
 */
export function isSunoSuccessCode(code: unknown): boolean {
  const numericCode = Number(code);
  return Number.isFinite(numericCode) && numericCode >= 200 && numericCode < 300;
}
