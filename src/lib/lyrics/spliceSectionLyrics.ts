/**
 * Splice edited section lyrics back into the full lyrics document.
 *
 * Suno's replace-section API regenerates the [infillStartS, infillEndS] window
 * using `fullLyrics` — the document must already contain the MODIFIED text for
 * that section. Sending the untouched original lyrics makes Suno re-sing the
 * same words, which looks like "replacement does nothing".
 */

const normalize = (value: string) => value.replace(/\r\n/g, "\n").trim();

/**
 * Returns fullLyrics with `originalSection` replaced by `editedSection`.
 * Falls back to the original document when the section text can't be located.
 */
export function spliceSectionLyrics(
  fullLyrics: string | null | undefined,
  originalSection: string | null | undefined,
  editedSection: string | null | undefined,
): { lyrics: string; spliced: boolean } {
  const full = normalize(fullLyrics ?? "");
  const original = normalize(originalSection ?? "");
  const edited = normalize(editedSection ?? "");

  if (!edited || edited === original) return { lyrics: full, spliced: false };
  if (!full) return { lyrics: edited, spliced: true };
  if (!original) return { lyrics: full, spliced: false };

  // 1. Exact match
  const exactIndex = full.indexOf(original);
  if (exactIndex !== -1) {
    return {
      lyrics: full.slice(0, exactIndex) + edited + full.slice(exactIndex + original.length),
      spliced: true,
    };
  }

  // 2. Whitespace-tolerant match (line-by-line join with flexible spacing)
  const pattern = original
    .split(/\s+/)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  if (pattern) {
    const regex = new RegExp(pattern);
    if (regex.test(full)) {
      return { lyrics: full.replace(regex, () => edited), spliced: true };
    }
  }

  return { lyrics: full, spliced: false };
}
