/**
 * Lyrics export — .txt (with inline annotations) and .lrc (with timestamps).
 *
 * Both formats preserve the original lyrics verbatim and interleave the
 * prosody diagnostics (syllable counts, rhyme groups, warnings/errors) as
 * comments that don't break either format's convention:
 *   - .txt: annotations as `# …` lines under the annotated source line.
 *   - .lrc: annotations as bracket-less `# …` comment lines; timestamps
 *          on singable lines only, tag lines rendered as `[Verse]` etc.
 */

import type { ProsodyReport, LineIssueLevel } from "@/lib/lyrics/prosody";
import { analyzeProsody } from "@/lib/lyrics/prosody";

interface ExportOptions {
  /** Milliseconds per singable line for the .lrc timestamp generator. */
  lrcLineMs?: number;
  /** If false, drop `info`-level annotations from the export. */
  includeInfo?: boolean;
  /** Optional metadata for the .lrc header. */
  meta?: { title?: string; artist?: string; album?: string };
}

const LEVEL_MARK: Record<LineIssueLevel, string> = {
  info: "ℹ",
  warn: "⚠",
  error: "✖",
};

function ensureReport(lyrics: string, report: ProsodyReport | null): ProsodyReport {
  return report ?? analyzeProsody(lyrics);
}

/** Build a `# …` annotation for a single analyzed line, or null if none needed. */
function buildAnnotation(
  line: ProsodyReport["lines"][number],
  includeInfo: boolean,
): string | null {
  if (line.isTag || line.isEmpty || line.isBackVocal) return null;
  const parts: string[] = [];
  if (line.syllables > 0) parts.push(`${line.syllables} сл.`);
  if (line.rhymeGroup) parts.push(`рифма ${line.rhymeGroup}`);
  const issues = line.issues.filter((iss) => includeInfo || iss.level !== "info");
  for (const iss of issues) parts.push(`${LEVEL_MARK[iss.level]} ${iss.message}`);
  if (parts.length === 0) return null;
  // Only annotate if there's an actual issue OR the line has a rhyme partner.
  const hasSignal = issues.length > 0 || Boolean(line.rhymeGroup);
  if (!hasSignal) return null;
  return `# ${parts.join(" · ")}`;
}

/** Export lyrics to plain `.txt` with prosody annotations interleaved. */
export function exportLyricsToTxt(
  lyrics: string,
  report: ProsodyReport | null = null,
  opts: ExportOptions = {},
): string {
  const { includeInfo = true, meta } = opts;
  const r = ensureReport(lyrics, report);
  const out: string[] = [];

  const totalWarn = r.lines.reduce(
    (n, l) => n + l.issues.filter((i) => i.level === "warn").length,
    0,
  );
  const totalErr = r.lines.reduce(
    (n, l) => n + l.issues.filter((i) => i.level === "error").length,
    0,
  );
  out.push(`# MusicVerse AI — lyrics export`);
  if (meta?.title) out.push(`# title: ${meta.title}`);
  if (meta?.artist) out.push(`# artist: ${meta.artist}`);
  out.push(`# generated: ${new Date().toISOString()}`);
  out.push(`# prosody: warnings=${totalWarn} errors=${totalErr}`);
  out.push("");

  for (const line of r.lines) {
    out.push(line.raw);
    const annot = buildAnnotation(line, includeInfo);
    if (annot) out.push(annot);
  }
  return out.join("\n");
}

/** Format a millisecond value as `[mm:ss.xx]` for LRC. */
function formatLrcTimestamp(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `[${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}]`;
}

/** Export lyrics to `.lrc` with placeholder timestamps and comment annotations. */
export function exportLyricsToLrc(
  lyrics: string,
  report: ProsodyReport | null = null,
  opts: ExportOptions = {},
): string {
  const { lrcLineMs = 3200, includeInfo = false, meta } = opts;
  const r = ensureReport(lyrics, report);
  const out: string[] = [];

  if (meta?.title) out.push(`[ti:${meta.title}]`);
  if (meta?.artist) out.push(`[ar:${meta.artist}]`);
  if (meta?.album) out.push(`[al:${meta.album}]`);
  out.push(`[by:MusicVerse AI]`);
  out.push(`[re:MusicVerse]`);

  let cursor = 0;
  for (const line of r.lines) {
    if (line.isTag) {
      // Preserve the original section tag on its own line.
      out.push(line.raw.trim());
      continue;
    }
    if (line.isEmpty) {
      out.push("");
      continue;
    }
    const ts = formatLrcTimestamp(cursor);
    out.push(`${ts}${line.raw}`);
    const annot = buildAnnotation(line, includeInfo);
    if (annot) out.push(annot);
    cursor += lrcLineMs;
  }
  return out.join("\n");
}

/**
 * Trigger a client-side download of a text payload. No-op outside the browser
 * so imports remain safe for SSR/tests.
 */
export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Release the object URL on next tick so Safari finishes the download.
  setTimeout(() => URL.revokeObjectURL(url), 250);
}
