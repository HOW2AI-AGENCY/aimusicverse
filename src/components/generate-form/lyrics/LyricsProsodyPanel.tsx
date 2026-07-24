/**
 * LyricsProsodyPanel — inline diagnostics panel for the lyrics editor.
 *
 * Shows per-line syllable counts, rhyme groups and issues. Clicking a row jumps
 * the caret to that line in the provided textarea ref.
 */

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { analyzeProsody, type LineIssueLevel } from "@/lib/lyrics/prosody";
import { AlertTriangle, AlertCircle, Info, Music2 } from "@/lib/icons";

interface LyricsProsodyPanelProps {
  lyrics: string;
  onJumpToLine?: (lineIndex: number) => void;
  className?: string;
}

const LEVEL_STYLES: Record<LineIssueLevel, string> = {
  info: "text-muted-foreground bg-muted/40 border-border/40",
  warn: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
  error: "text-destructive bg-destructive/10 border-destructive/40",
};

const LEVEL_ICON: Record<LineIssueLevel, typeof Info> = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
};

export const LyricsProsodyPanel = memo(function LyricsProsodyPanel({
  lyrics,
  onJumpToLine,
  className,
}: LyricsProsodyPanelProps) {
  const report = useMemo(() => analyzeProsody(lyrics), [lyrics]);

  const problemLines = useMemo(
    () => report.lines.filter((l) => l.issues.length > 0 && !l.isTag && !l.isEmpty),
    [report.lines],
  );

  if (!lyrics.trim()) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border/40 bg-muted/20 p-3 text-xs text-muted-foreground",
          className,
        )}
      >
        Начните писать текст — здесь появится анализ слогов и рифм.
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3", className)}>
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded border font-medium",
            report.totalIssues === 0
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
          )}
        >
          <Music2 className="h-3 w-3" aria-hidden />
          {report.totalIssues === 0
            ? "Ритм и рифма в норме"
            : `Найдено проблем: ${report.totalIssues}`}
        </span>
        {report.sections.map((s, i) => (
          <span
            key={`${s.startLine}-${i}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border/50 bg-background/50 font-mono"
            title={`${s.label} · схема ${s.scheme || "—"}`}
          >
            <span className="text-muted-foreground">{s.label}</span>
            <span className="text-foreground">{s.scheme || "—"}</span>
          </span>
        ))}
      </div>

      {/* Problems list */}
      {problemLines.length > 0 ? (
        <ul className="space-y-1 max-h-48 overflow-y-auto pr-1" role="list">
          {problemLines.map((line) => {
            const topIssue = line.issues.reduce((worst, cur) => {
              const rank = { info: 0, warn: 1, error: 2 } as const;
              return rank[cur.level] > rank[worst.level] ? cur : worst;
            }, line.issues[0]);
            const Icon = LEVEL_ICON[topIssue.level];
            return (
              <li key={line.index}>
                <button
                  type="button"
                  onClick={() => onJumpToLine?.(line.index)}
                  className={cn(
                    "w-full flex items-start gap-2 rounded-md border px-2 py-1.5 text-left text-[11px]",
                    "hover:bg-background/60 transition-colors",
                    LEVEL_STYLES[topIssue.level],
                  )}
                >
                  <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
                  <span className="font-mono tabular-nums text-muted-foreground mr-1">
                    {String(line.index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-mono text-foreground/80">
                      {line.raw.trim() || "(пустая строка)"}
                    </span>
                    <span className="block text-[10px] opacity-80">
                      {line.syllables > 0 && `${line.syllables} сл. · `}
                      {line.rhymeGroup && `рифма ${line.rhymeGroup} · `}
                      {topIssue.message}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-[11px] text-muted-foreground">
          Все строки в пределах 6–12 слогов, рифмы распределены корректно.
        </div>
      )}
    </div>
  );
});
