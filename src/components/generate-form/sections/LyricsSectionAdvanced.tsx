/**
 * LyricsSectionAdvanced - Premium lyrics editor for generation form
 *
 * Features:
 * - Collapsible sections (Verse, Chorus, Bridge, etc.)
 * - AI-powered suggestions
 * - Character count with limits
 * - Visual structure editor toggle
 * - Template quick-actions
 */

import { memo, useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormFieldActions } from "@/components/ui/FormFieldActions";
import { LyricsVisualEditorCompact } from "../LyricsVisualEditorCompact";
import { SaveTemplateDialog } from "../SaveTemplateDialog";
import { SavedLyricsSelector } from "../SavedLyricsSelector";
import { SectionLabel, SECTION_HINTS } from "../SectionLabel";
import { ValidationMessage, checkArtistValidation } from "../ValidationMessage";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "@/contexts/TelegramContext";
import { LyricsPreview } from "../LyricsPreview";
import {
  LYRIC_SECTION_TYPES,
  LYRIC_SECTION_BY_VALUE,
  getLyricSectionColor,
  normalizeSectionType,
  type LyricSectionType,
} from "../lyricsSectionMeta";
import { LayoutGrid, AlignLeft, Eye, Plus, Music2 } from "@/lib/icons";
import { LyricsProsodyPanel } from "../lyrics/LyricsProsodyPanel";
import { useProsodyReport } from "@/hooks/lyrics/useProsodyReport";

interface LyricsSectionAdvancedProps {
  lyrics: string;
  onLyricsChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onOpenLyricsAssistant: () => void;
  style?: string;
  genre?: string;
  mood?: string;
}

// Section tag types shown as quick-insert chips above the textarea (in text mode).
const QUICK_SECTION_TYPES: LyricSectionType[] = [
  "intro",
  "verse",
  "pre",
  "chorus",
  "hook",
  "bridge",
  "drop",
  "outro",
];

interface ParsedTag {
  id: string;
  type: LyricSectionType | null;
  label: string;
  glyph: string;
  colorClass: string;
  raw: string;
}

function parseSectionTags(text: string): ParsedTag[] {
  if (!text.trim()) return [];
  const tags: ParsedTag[] = [];
  const lines = text.split("\n");
  const counters: Partial<Record<LyricSectionType, number>> = {};
  let idx = 0;
  for (const line of lines) {
    const m = line.match(/^\s*\[([\wа-яё\s-]+?)(?:\s+(\d+))?(?:,\s*[^\]]+)?\]\s*$/i);
    if (!m) continue;
    const raw = m[1].trim();
    const explicitOrd = m[2];
    const type = normalizeSectionType(raw);
    if (type) {
      const def = LYRIC_SECTION_BY_VALUE[type];
      counters[type] = (counters[type] ?? 0) + 1;
      const ord = explicitOrd ?? String(counters[type]);
      const color = getLyricSectionColor(type);
      tags.push({
        id: `tag-${idx++}`,
        type,
        label: `${def.label}${counters[type]! > 1 || explicitOrd ? ` ${ord}` : ""}`,
        glyph: def.glyph,
        colorClass: cn(color.bg, color.border, color.text),
        raw,
      });
    } else {
      tags.push({
        id: `tag-${idx++}`,
        type: null,
        label: raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase(),
        glyph: "♪",
        colorClass: "bg-muted/40 text-muted-foreground border-border/60",
        raw,
      });
    }
  }
  return tags;
}

export const LyricsSectionAdvanced = memo(function LyricsSectionAdvanced({
  lyrics,
  onLyricsChange,
  onStyleChange,
  onOpenLyricsAssistant,
  style,
  genre,
  mood,
}: LyricsSectionAdvancedProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const [viewMode, setViewMode] = useState<"text" | "visual" | "preview">("text");
  const showVisualEditor = viewMode === "visual";
  const showPreview = viewMode === "preview";
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [showProsody, setShowProsody] = useState(false);

  // Preserve cursor/selection in the text-mode textarea across mode switches.
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => {
    if (viewMode !== "text") return;
    const el = textareaRef.current;
    const sel = selectionRef.current;
    if (!el || !sel) return;
    const len = el.value.length;
    const start = Math.min(sel.start, len);
    const end = Math.min(sel.end, len);
    try {
      el.setSelectionRange(start, end);
    } catch {
      /* noop */
    }
  }, [viewMode]);

  // Validation
  const lyricsValidation = useMemo(() => checkArtistValidation(lyrics), [lyrics]);
  const hasError = lyricsValidation?.level === "error";

  // Character limit colors
  const charCountColor = useMemo(() => {
    if (lyrics.length > 2800) return "text-destructive";
    if (lyrics.length > 2500) return "text-amber-500";
    return "text-muted-foreground";
  }, [lyrics.length]);

  // Parsed section tags for the text-mode visualization chip strip.
  const parsedTags = useMemo(() => parseSectionTags(lyrics), [lyrics]);

  // Prosody analysis — debounced + incremental via `useProsodyReport`, so
  // unchanged rows keep identity and the textarea doesn't lose selection.
  const prosodyReport = useProsodyReport(lyrics);
  const prosodySummary = useMemo(() => {
    let errors = 0;
    let warns = 0;
    for (const line of prosodyReport.lines) {
      for (const issue of line.issues) {
        if (issue.level === "error") errors++;
        else if (issue.level === "warn") warns++;
      }
    }
    return { errors, warns };
  }, [prosodyReport]);

  const jumpToLine = useCallback(
    (lineIndex: number) => {
      const el = textareaRef.current;
      if (!el) return;
      const before = lyrics.split("\n").slice(0, lineIndex).join("\n");
      const offset = before.length + (lineIndex > 0 ? 1 : 0);
      const lineText = lyrics.split("\n")[lineIndex] ?? "";
      el.focus();
      try {
        el.setSelectionRange(offset, offset + lineText.length);
      } catch {
        /* noop */
      }
      selectionRef.current = { start: offset, end: offset + lineText.length };
    },
    [lyrics],
  );

  // Insert a `[Header]` at cursor position (or append) in text mode.
  const insertSectionTag = useCallback(
    (type: LyricSectionType) => {
      hapticFeedback("light");
      const def = LYRIC_SECTION_BY_VALUE[type];
      const el = textareaRef.current;
      const header = `[${def.header}]`;
      if (!el) {
        const sep = lyrics.length && !lyrics.endsWith("\n") ? "\n\n" : lyrics.endsWith("\n\n") ? "" : "\n";
        onLyricsChange(`${lyrics}${sep}${header}\n`);
        return;
      }
      const start = el.selectionStart ?? lyrics.length;
      const end = el.selectionEnd ?? lyrics.length;
      const before = lyrics.slice(0, start);
      const after = lyrics.slice(end);
      const needsLeading = before && !before.endsWith("\n") ? "\n" : "";
      const needsTrailing = after && !after.startsWith("\n") ? "\n" : "";
      const insert = `${needsLeading}${header}${needsTrailing}`;
      const next = `${before}${insert}${after}`;
      const caret = (before + insert).length;
      selectionRef.current = { start: caret, end: caret };
      onLyricsChange(next);
      requestAnimationFrame(() => {
        const t = textareaRef.current;
        if (t) {
          t.focus();
          try {
            t.setSelectionRange(caret, caret);
          } catch {
            /* noop */
          }
        }
      });
    },
    [hapticFeedback, lyrics, onLyricsChange],
  );

  const switchView = useCallback(
    (mode: "text" | "visual" | "preview") => {
      hapticFeedback("light");
      setViewMode(mode);
    },
    [hapticFeedback],
  );


  return (
    <>
      <div className="space-y-3">
        {/* Header with label and controls */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <SectionLabel label="Текст песни" hint={SECTION_HINTS.lyrics} />

          <div className="flex items-center gap-1">
            {/* View toggle: text / visual / preview — subtle pill */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/40">
              <Button
                variant={viewMode === "text" ? "secondary" : "ghost"}
                size="icon"
                aria-label="Текстовый редактор"
                aria-pressed={viewMode === "text"}
                className="h-8 w-8 min-h-[40px] min-w-[40px] rounded-md"
                onClick={() => switchView("text")}
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "visual" ? "secondary" : "ghost"}
                size="icon"
                aria-label="Визуальный редактор секций"
                aria-pressed={viewMode === "visual"}
                className="h-8 w-8 min-h-[40px] min-w-[40px] rounded-md"
                onClick={() => switchView("visual")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "preview" ? "secondary" : "ghost"}
                size="icon"
                aria-label="Предпросмотр текста"
                aria-pressed={viewMode === "preview"}
                className="h-8 w-8 min-h-[40px] min-w-[40px] rounded-md"
                onClick={() => switchView("preview")}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* Prosody check toggle — sits next to the mode-pill so users can turn on rhyme/meter diagnostics without switching modes. */}
            <Button
              variant={showProsody ? "secondary" : "ghost"}
              size="icon"
              aria-label="Проверка ритма и рифмы"
              aria-pressed={showProsody}
              className="relative h-8 w-8 min-h-[40px] min-w-[40px] rounded-md"
              onClick={() => {
                hapticFeedback("light");
                setShowProsody((v) => !v);
              }}
            >
              <Music2 className="h-3.5 w-3.5" />
              {(prosodySummary.errors > 0 || prosodySummary.warns > 0) && (
                <span
                  className={cn(
                    "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full",
                    prosodySummary.errors > 0 ? "bg-destructive" : "bg-amber-500",
                  )}
                  aria-hidden
                />
              )}
            </Button>
          </div>
        </div>

        {/* Editor area */}
        {showPreview ? (
          <LyricsPreview value={lyrics} onAIAssist={onOpenLyricsAssistant} />
        ) : showVisualEditor ? (
          <LyricsVisualEditorCompact value={lyrics} onChange={onLyricsChange} onAIGenerate={onOpenLyricsAssistant} />
        ) : (
          <div className="space-y-2">
            {/* Quick-insert section tag chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mr-0.5">
                <Plus className="inline h-3 w-3 -mt-0.5 mr-0.5" />
                Секция:
              </span>
              {QUICK_SECTION_TYPES.map((t) => {
                const def = LYRIC_SECTION_BY_VALUE[t];
                const color = getLyricSectionColor(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => insertSectionTag(t)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium",
                      "hover:opacity-100 opacity-80 transition-opacity",
                      color.bg,
                      color.border,
                      color.text,
                    )}
                    aria-label={`Вставить [${def.header}]`}
                  >
                    <span aria-hidden className="font-mono">
                      {def.glyph}
                    </span>
                    <span>{def.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative group">
              {/* Main textarea with premium styling */}
              <Textarea
                ref={textareaRef}
                placeholder="Пишите текст. Секции задавайте в квадратных скобках: [Verse], [Chorus]…"
                value={lyrics}
                onChange={(e) => {
                  const el = e.currentTarget;
                  selectionRef.current = { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
                  onLyricsChange(el.value);
                }}
                onSelect={(e) => {
                  const el = e.currentTarget;
                  selectionRef.current = { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
                }}
                rows={8}
                className={cn(
                  "text-sm min-h-[160px] sm:min-h-[220px] max-h-[420px] overflow-y-auto whitespace-pre-wrap font-mono",
                  "pb-12 pt-3 px-3 rounded-xl resize-none leading-relaxed",
                  "bg-muted/30 text-foreground placeholder:text-muted-foreground",
                  "border-border/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
                  "transition-all duration-200",
                  (lyrics.length > 2800 || hasError) &&
                    "border-destructive/50 focus:border-destructive focus:ring-destructive/20",
                )}
                aria-invalid={hasError || lyrics.length > 3000}
                aria-describedby={lyricsValidation ? "lyrics-error" : undefined}
              />

              {/* Floating toolbar at bottom */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 p-2",
                  "bg-gradient-to-t from-background/95 via-background/80 to-transparent",
                  "backdrop-blur-sm rounded-b-xl",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Character count with progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full transition-colors",
                          lyrics.length > 2800
                            ? "bg-destructive"
                            : lyrics.length > 2500
                              ? "bg-amber-500"
                              : "bg-primary",
                        )}
                        initial={false}
                        animate={{ width: `${Math.min((lyrics.length / 3000) * 100, 100)}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <span className={cn("text-[10px] font-mono", charCountColor)}>{lyrics.length}/3000</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <FormFieldActions
                      value={lyrics}
                      onClear={() => onLyricsChange("")}
                      onVoiceInput={onLyricsChange}
                      voiceContext="lyrics"
                      appendMode
                      onAIAssist={onOpenLyricsAssistant}
                      onOpenTemplates={() => setTemplateSelectorOpen(true)}
                      onOpenStudio={() => navigate("/lyrics-studio")}
                      onSave={async () => setSaveDialogOpen(true)}
                      showSave
                      size="lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Parsed section chips — live visualization of tags in the text */}
            {parsedTags.length > 0 && (
              <div
                className="flex flex-wrap items-center gap-1"
                role="list"
                aria-label="Обнаруженные секции"
              >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mr-1">
                  Структура · {parsedTags.length}
                </span>
                {parsedTags.map((t) => (
                  <span
                    key={t.id}
                    role="listitem"
                    className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium",
                      t.colorClass,
                    )}
                  >
                    <span aria-hidden className="font-mono">
                      {t.glyph}
                    </span>
                    <span>{t.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prosody / rhyme-meter diagnostics — visible in every editor mode when enabled. */}
        {showProsody && <LyricsProsodyPanel lyrics={lyrics} onJumpToLine={jumpToLine} />}




        {/* Validation message */}
        {lyricsValidation && (
          <ValidationMessage message={lyricsValidation.message} level={lyricsValidation.level} fieldId="lyrics" />
        )}
      </div>

      {/* Dialogs */}
      <SaveTemplateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        lyrics={lyrics}
        style={style || ""}
        genre={genre}
        mood={mood}
      />

      <SavedLyricsSelector
        open={templateSelectorOpen}
        onOpenChange={setTemplateSelectorOpen}
        onSelect={(template) => {
          onLyricsChange(template.lyrics);
          if (template.style) onStyleChange(template.style);
        }}
      />
    </>
  );
});
