/**
 * LyricsPreview - Read-only formatted preview of lyrics
 * Renders sections as styled blocks using the shared section meta
 * (lyricsSectionMeta) and design-system colors, so preview, visual
 * editor and text mode speak the same visual language.
 */

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { LYRIC_SECTION_BY_VALUE, getLyricSectionColor, normalizeSectionType } from "./lyricsSectionMeta";

interface ParsedSection {
  id: string;
  label: string;
  glyph: string;
  colorClass: string;
  dotClass: string;
  lines: string[];
}

function metaFor(rawToken: string, ordinal: string | undefined) {
  const type = normalizeSectionType(rawToken);
  if (type) {
    const def = LYRIC_SECTION_BY_VALUE[type];
    const color = getLyricSectionColor(type);
    return {
      label: ordinal ? `${def.label} ${ordinal}` : def.label,
      glyph: def.glyph,
      colorClass: cn(color.bg, color.border, color.text),
      dotClass: color.dot,
    };
  }
  // Unknown tag ([Guitar Solo], [Instrumental Break]…) — keep it visible, muted.
  const label = rawToken.charAt(0).toUpperCase() + rawToken.slice(1).toLowerCase();
  return {
    label: ordinal ? `${label} ${ordinal}` : label,
    glyph: "♪",
    colorClass: "bg-muted/40 text-muted-foreground border-border/60",
    dotClass: "bg-muted-foreground",
  };
}

function parse(text: string): ParsedSection[] {
  if (!text.trim()) return [];
  const out: ParsedSection[] = [];
  let current: ParsedSection | null = null;
  let idx = 0;
  for (const raw of text.split("\n")) {
    const m = raw.match(/^\s*\[([\w\sа-яё-]+?)(?:\s+(\d+))?(?:,\s*[^\]]+)?\]\s*(.*)$/i);
    if (m) {
      if (current) out.push(current);
      const meta = metaFor(m[1].trim(), m[2]);
      current = { id: `sec-${idx++}`, ...meta, lines: [] };
      if (m[3].trim()) current.lines.push(m[3]);
    } else if (raw.trim()) {
      if (!current) {
        const meta = metaFor("verse", undefined);
        current = { id: `sec-${idx++}`, ...meta, lines: [] };
      }
      current.lines.push(raw);
    } else if (current) {
      current.lines.push("");
    }
  }
  if (current) out.push(current);
  return out;
}

interface LyricsPreviewProps {
  value: string;
  className?: string;
}

export const LyricsPreview = memo(function LyricsPreview({ value, className }: LyricsPreviewProps) {
  const sections = useMemo(() => parse(value), [value]);
  const totalLines = useMemo(
    () => sections.reduce((n, s) => n + s.lines.filter((l) => l.trim()).length, 0),
    [sections],
  );

  if (sections.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center",
          "text-xs text-muted-foreground",
          className,
        )}
      >
        Пока пусто. Добавьте секции и текст — здесь появится финальный вид песни.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-muted/20 p-3 space-y-3 max-h-[400px] overflow-y-auto",
        className,
      )}
      role="region"
      aria-label="Предпросмотр текста песни"
    >
      <div className="flex items-center justify-between text-overline uppercase text-muted-foreground/70">
        <span>Предпросмотр</span>
        <span className="tabular-nums">
          {sections.length} {sections.length === 1 ? "секция" : "секций"} · {totalLines}{" "}
          {totalLines === 1 ? "строка" : "строк"}
        </span>
      </div>

      {sections.map((s) => (
        <div key={s.id} className="space-y-1.5">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-overline uppercase",
              s.colorClass,
            )}
          >
            <span aria-hidden>{s.glyph}</span>
            <span>{s.label}</span>
          </div>
          {s.lines.some((l) => l.trim()) ? (
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap pl-1">
              {s.lines.join("\n").replace(/\n{3,}/g, "\n\n")}
            </p>
          ) : (
            <p className="text-xs italic text-muted-foreground/60 pl-1">— пустая секция —</p>
          )}
        </div>
      ))}
    </div>
  );
});
