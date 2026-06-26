/**
 * LyricsPreview - Read-only formatted preview of lyrics
 * Renders sections as styled blocks matching the visual editor color palette.
 */

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ParsedSection {
  id: string;
  type: string;
  label: string;
  color: string;
  icon: string;
  lines: string[];
}

const SECTION_META: Record<string, { label: string; color: string; icon: string }> = {
  intro: { label: "Intro", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: "🎬" },
  verse: { label: "Verse", color: "bg-sky-500/15 text-sky-300 border-sky-500/30", icon: "📝" },
  pre: { label: "Pre", color: "bg-amber-500/15 text-amber-300 border-amber-500/30", icon: "⬆️" },
  chorus: { label: "Chorus", color: "bg-violet-500/15 text-violet-300 border-violet-500/30", icon: "🎵" },
  hook: { label: "Hook", color: "bg-pink-500/15 text-pink-300 border-pink-500/30", icon: "🎤" },
  bridge: { label: "Bridge", color: "bg-orange-500/15 text-orange-300 border-orange-500/30", icon: "🌉" },
  drop: { label: "Drop", color: "bg-red-500/15 text-red-300 border-red-500/30", icon: "💥" },
  breakdown: { label: "Break", color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30", icon: "🔊" },
  outro: { label: "Outro", color: "bg-slate-500/15 text-slate-300 border-slate-500/30", icon: "🔚" },
};

function parse(text: string): ParsedSection[] {
  if (!text.trim()) return [];
  const out: ParsedSection[] = [];
  let current: ParsedSection | null = null;
  let idx = 0;
  for (const raw of text.split("\n")) {
    const m = raw.match(/^\s*\[(\w+)(?:\s+\d+)?(?:,\s*[^\]]+)?\]\s*(.*)$/i);
    if (m) {
      if (current) out.push(current);
      const key = m[1].toLowerCase();
      const meta = SECTION_META[key] ?? {
        label: m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase(),
        color: "bg-muted/40 text-foreground border-border/60",
        icon: "🎶",
      };
      current = { id: `${key}-${idx++}`, type: key, label: meta.label, color: meta.color, icon: meta.icon, lines: [] };
      if (m[2].trim()) current.lines.push(m[2]);
    } else if (raw.trim()) {
      if (!current) {
        const meta = SECTION_META.verse;
        current = { id: `verse-${idx++}`, type: "verse", label: meta.label, color: meta.color, icon: meta.icon, lines: [] };
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
  const totalLines = useMemo(() => sections.reduce((n, s) => n + s.lines.filter((l) => l.trim()).length, 0), [sections]);

  if (sections.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center",
          "text-xs text-muted-foreground",
          className,
        )}
      >
        Пока пусто. Добавь секции и текст — здесь появится финальный вид песни.
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
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground/70">
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
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-semibold uppercase tracking-wider",
              s.color,
            )}
          >
            <span aria-hidden>{s.icon}</span>
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
