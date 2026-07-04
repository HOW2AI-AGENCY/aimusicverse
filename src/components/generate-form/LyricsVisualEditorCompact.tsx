/**
 * LyricsVisualEditorCompact Component
 *
 * Editorial-spread lyrics editor for the advanced generation form.
 * 9 structural sections (intro → outro), templates, and per-line metadata
 * rendered as a magazine spread rather than a form list.
 *
 * Public API (preserved):
 *   <LyricsVisualEditorCompact value={lyrics} onChange={setLyrics} onAIGenerate?={fn} />
 *
 * Exposed helpers (used by tests):
 *   parseLyrics, sectionsToLyrics, sectionsEqual, applyTemplateToSections
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowUp, ArrowDown, Plus, RotateCcw, Trash2 } from "@/lib/icons";
import { logger } from "@/lib/logger";
import { getSectionColor } from "@/lib/design-colors";

export type LyricSectionType =
  "intro" | "verse" | "pre" | "chorus" | "hook" | "bridge" | "drop" | "breakdown" | "outro";

export interface LyricSection {
  id: string;
  type: LyricSectionType;
  content: string;
  tags?: string[];
}

interface SECTION_TYPE_DEF {
  value: LyricSectionType;
  label: string;
  /** Single-letter glyph used as oversized marker in the editorial spread. */
  glyph: string;
}

/**
 * 9 structural sections, ordered from cold-open to fade-out.
 * Glyph follows the convention used in GenerationResultSheet (V / C / B / I / O / etc.).
 */
const SECTION_TYPES: SECTION_TYPE_DEF[] = [
  { value: "intro", label: "Интро", glyph: "I" },
  { value: "verse", label: "Куплет", glyph: "V" },
  { value: "pre", label: "Pre-Chorus", glyph: "P" },
  { value: "chorus", label: "Припев", glyph: "C" },
  { value: "hook", label: "Hook", glyph: "H" },
  { value: "bridge", label: "Бридж", glyph: "B" },
  { value: "drop", label: "Drop", glyph: "D" },
  { value: "breakdown", label: "Breakdown", glyph: "X" },
  { value: "outro", label: "Аутро", glyph: "O" },
];

/** Lookup the structural definition from a section type value. */
const SECTION_BY_VALUE: Record<LyricSectionType, SECTION_TYPE_DEF> = SECTION_TYPES.reduce(
  (acc, def) => {
    acc[def.value] = def;
    return acc;
  },
  {} as Record<LyricSectionType, SECTION_TYPE_DEF>,
);

interface QUICK_TEMPLATE_DEF {
  id: string;
  label: string;
  blurb: string;
  structure: LyricSectionType[];
}

const QUICK_TEMPLATES: QUICK_TEMPLATE_DEF[] = [
  {
    id: "pop",
    label: "Pop",
    blurb: "Verse → Chorus, 6 блоков",
    structure: ["verse", "chorus", "verse", "chorus", "bridge", "chorus"],
  },
  {
    id: "rap",
    label: "Рэп",
    blurb: "Verse → Hook, 4 блока",
    structure: ["verse", "hook", "verse", "hook"],
  },
  {
    id: "edm",
    label: "EDM",
    blurb: "Intro → Drop, 6 блоков",
    structure: ["intro", "verse", "drop", "verse", "drop", "outro"],
  },
];

const MAX_SNAPSHOTS = 200;

/**
 * Snapshot captured around an external sync, exposed on `window.__lyricsEditorMetrics.snapshots`
 * and consumed by `LyricsEditorMetricsOverlay` (dev-only). Field names must stay in sync with
 * the overlay's expectations (id, phase, ts, syncIndex, sections, focus).
 */
export interface SyncSnapshot {
  id: string;
  phase: "before" | "after";
  ts: number;
  syncIndex: number;
  sections: LyricSection[];
  focus: {
    sectionId: string | null;
    selectionStart: number | null;
    selectionEnd: number | null;
  };
  /** Serialized lyrics string for parity with the editor's emit pipeline. */
  source: string;
}

/** Live counters exposed on `window.__lyricsEditorMetrics` for the dev overlay. */
export interface LyricsEditorMetrics {
  renders: number;
  externalSyncs: number;
  snapshots: SyncSnapshot[];
  reset?: () => void;
}

declare global {
  interface Window {
    __lyricsEditorMetrics?: LyricsEditorMetrics;
  }
}

const TRACK_METRICS = import.meta.env.DEV;

function getMetrics(): LyricsEditorMetrics | undefined {
  if (typeof window === "undefined") return undefined;
  return window.__lyricsEditorMetrics;
}

function trackRender(): void {
  if (!TRACK_METRICS) return;
  const m = getMetrics() ?? { renders: 0, externalSyncs: 0, snapshots: [] };
  m.renders += 1;
  if (typeof window !== "undefined") window.__lyricsEditorMetrics = m;
}

function trackExternalSync(): void {
  if (!TRACK_METRICS) return;
  const m = getMetrics() ?? { renders: 0, externalSyncs: 0, snapshots: [] };
  m.externalSyncs += 1;
  if (typeof window !== "undefined") window.__lyricsEditorMetrics = m;
}

// ============================================================================
// LYRICS PARSE / EMIT HELPERS (exposed for tests)
// ============================================================================

const SECTION_HEADER_RE = /^\[(intro|verse|pre|chorus|hook|bridge|drop|breakdown|outro)\]\s*$/i;

export function parseLyrics(input: string): LyricSection[] {
  if (!input.trim()) return [];
  const lines = input.split(/\r?\n/);
  const sections: LyricSection[] = [];
  let current: LyricSection | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    const match = line.match(SECTION_HEADER_RE);
    if (match) {
      if (current) sections.push(current);
      current = {
        id: `sec-${sections.length}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: match[1].toLowerCase() as LyricSectionType,
        content: "",
      };
      continue;
    }
    // Skip blank separator lines — they must not contribute trailing whitespace
    // to the previous section's content (preserves round-trip stability).
    if (!line) continue;
    if (current) {
      current.content = current.content ? `${current.content}\n${line}` : line;
    } else {
      // Orphan text without a header — wrap it in a default verse.
      current = {
        id: `sec-${sections.length}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "verse",
        content: line,
      };
    }
  }
  if (current) sections.push(current);
  return sections;
}

export function sectionsToLyrics(sections: LyricSection[]): string {
  return sections
    .map((s) => `[${s.type}]\n${s.content}`.trim())
    .filter((block) => block.length > "[x]".length)
    .join("\n\n");
}

export function sectionsEqual(a: LyricSection[], b: LyricSection[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].type !== b[i].type) return false;
    if (a[i].content !== b[i].content) return false;
  }
  return true;
}

/**
 * Replace (or seed) section structure from a template definition.
 * Carries verse-like content from the previous document in order, **per type**:
 * a verse slot only consumes prior verse content, never prior chorus content.
 * Non-matching slots stay empty so the user can decide what to write.
 */
export function applyTemplateToSections(
  prev: LyricSection[],
  template: LyricSectionType[],
  seedVerse = 1,
): LyricSection[] {
  // Per-type pools — preserve the original semantic where each template slot
  // only ever sees content from a matching source type, left → right.
  const pools = new Map<LyricSectionType, string[]>();
  for (const s of prev) {
    if (!s.content) continue;
    const list = pools.get(s.type) ?? [];
    list.push(s.content);
    pools.set(s.type, list);
  }
  return template.map((type, i) => {
    const pool = pools.get(type);
    const content = pool && pool.length ? pool.shift()! : "";
    return {
      id: `sec-${seedVerse}-${i}-${Math.random().toString(36).slice(2, 10)}`,
      type,
      content,
      tags: [],
    };
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export interface LyricsVisualEditorCompactProps {
  value: string;
  onChange: (value: string) => void;
  onAIGenerate?: () => void;
  disabled?: boolean;
}

export const LyricsVisualEditorCompact = memo(function LyricsVisualEditorCompact({
  value,
  onChange,
  onAIGenerate,
  disabled,
}: LyricsVisualEditorCompactProps) {
  // The current sections representation, synced from `value`.
  const [currentSections, setCurrentSections] = useState<LyricSection[]>(() => parseLyrics(value));
  const [snapshots, setSnapshots] = useState<SyncSnapshot[]>([]);
  const lastEmittedRef = useRef<string>(value);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  trackRender();

  // -------------------------------------------------------------------------
  // Sync `value` (prop) → sections (state), without clobbering local edits.
  // We compare the incoming string to the last one we emitted; if identical
  // (round-trip of our own onChange), this is a no-op. Otherwise we re-parse.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    const parsed = parseLyrics(value);
    trackExternalSync();
    setCurrentSections((prev) => (sectionsEqual(prev, parsed) ? prev : parsed));
    lastEmittedRef.current = value;
  }, [value]);

  // -------------------------------------------------------------------------
  // Publish `snapshots` to `window.__lyricsEditorMetrics` so the dev overlay
  // can read a structured history. Only active in DEV.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!TRACK_METRICS || typeof window === "undefined") return;
    const m = window.__lyricsEditorMetrics ?? {
      renders: 0,
      externalSyncs: 0,
      snapshots: [],
      reset: () => {
        if (typeof window === "undefined") return;
        window.__lyricsEditorMetrics = { renders: 0, externalSyncs: 0, snapshots: [] };
      },
    };
    m.snapshots = snapshots;
    window.__lyricsEditorMetrics = m;
  }, [snapshots]);

  // -------------------------------------------------------------------------
  // Emit sections → `value` (prop), with structural-equality short-circuit
  // to keep the editor focused while the user is typing.
  // -------------------------------------------------------------------------
  const emit = useCallback(
    (next: LyricSection[]) => {
      const serialized = sectionsToLyrics(next);
      if (serialized === lastEmittedRef.current) {
        setCurrentSections((prev) => (sectionsEqual(prev, next) ? prev : next));
        return;
      }
      lastEmittedRef.current = serialized;
      setCurrentSections(next);
      onChange(serialized);
    },
    [onChange],
  );

  // Snapshot stack — preserved for future undo/redo wiring AND consumed by the
  // dev-only `LyricsEditorMetricsOverlay`. Each entry keeps the serialized source
  // for short-circuit dedup, plus the structured fields the overlay expects.
  const pushSnapshot = useCallback((next: LyricSection[]) => {
    setSnapshots((prev) => {
      const source = sectionsToLyrics(next);
      if (prev.length > 0 && prev[prev.length - 1].source === source) return prev;
      const syncIndex = (prev[prev.length - 1]?.syncIndex ?? 0) + 1;
      const ts = Date.now();
      const updated: SyncSnapshot[] = [
        ...prev,
        {
          id: `snap-${ts}-${Math.random().toString(36).slice(2, 8)}`,
          phase: "after",
          ts,
          syncIndex,
          sections: next,
          focus: { sectionId: null, selectionStart: null, selectionEnd: null },
          source,
        },
      ];
      if (updated.length > MAX_SNAPSHOTS) updated.splice(0, updated.length - MAX_SNAPSHOTS);
      return updated;
    });
  }, []);

  const updateSectionContent = useCallback(
    (id: string, content: string) => {
      const next = currentSections.map((s) => (s.id === id ? { ...s, content } : s));
      pushSnapshot(next);
      emit(next);
    },
    [currentSections, emit, pushSnapshot],
  );

  const changeSectionType = useCallback(
    (id: string, type: LyricSectionType) => {
      const next = currentSections.map((s) => (s.id === id ? { ...s, type } : s));
      pushSnapshot(next);
      emit(next);
    },
    [currentSections, emit, pushSnapshot],
  );

  const moveSection = useCallback(
    (id: string, direction: -1 | 1) => {
      const idx = currentSections.findIndex((s) => s.id === id);
      if (idx < 0) return;
      const target = idx + direction;
      if (target < 0 || target >= currentSections.length) return;
      const next = [...currentSections];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      pushSnapshot(next);
      emit(next);
    },
    [currentSections, emit, pushSnapshot],
  );

  const clearSection = useCallback(
    (id: string) => {
      const next = currentSections.map((s) => (s.id === id ? { ...s, content: "" } : s));
      pushSnapshot(next);
      emit(next);
    },
    [currentSections, emit, pushSnapshot],
  );

  const deleteSection = useCallback(
    (id: string) => {
      const next = currentSections.filter((s) => s.id !== id);
      if (next.length === currentSections.length) return;
      pushSnapshot(next);
      emit(next);
    },
    [currentSections, emit, pushSnapshot],
  );

  const addLineBreak = useCallback(
    (id: string) => {
      const target = currentSections.find((s) => s.id === id);
      if (!target) return;
      const next = currentSections.map((s) => (s.id === id ? { ...s, content: `${s.content}\n` } : s));
      pushSnapshot(next);
      emit(next);
      // Restore focus after React re-renders the textarea.
      requestAnimationFrame(() => textareaRefs.current[id]?.focus());
    },
    [currentSections, emit, pushSnapshot],
  );

  const addSection = useCallback(
    (type: LyricSectionType = "verse") => {
      const next: LyricSection[] = [
        ...currentSections,
        {
          id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type,
          content: "",
        },
      ];
      pushSnapshot(next);
      emit(next);
    },
    [currentSections, emit, pushSnapshot],
  );

  const applyTemplate = useCallback(
    (template: QUICK_TEMPLATE_DEF) => {
      const next = applyTemplateToSections(currentSections, template.structure, 1);
      pushSnapshot(next);
      emit(next);
    },
    [currentSections, emit, pushSnapshot],
  );

  // -------------------------------------------------------------------------
  // Derived metrics for the masthead/footer.
  // -------------------------------------------------------------------------
  const totals = useMemo(() => {
    const text = currentSections.map((s) => s.content).join("\n");
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.trim() ? text.split(/\r?\n/).length : 0;
    return { chars, words, lines };
  }, [currentSections]);

  const isOverBudget = totals.chars > 2800;
  const isNearBudget = totals.chars > 2400;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const hasContent = currentSections.length > 0;

  return (
    <div
      className={cn(
        "w-full max-w-3xl mx-auto",
        "border border-foreground/15 rounded-none bg-background text-foreground",
        "shadow-[0_1px_0_0_hsl(var(--foreground)/0.05)]",
      )}
      data-testid="lyrics-editor"
    >
      {/* Masthead */}
      <header className="px-5 sm:px-6 pt-6 pb-4 border-b border-foreground/15">
        <div className="flex items-baseline justify-between gap-3 font-mono">
          <p className="text-overline uppercase tracking-[0.18em] text-muted-foreground">№ 001 · LYRICS</p>
          <p className="text-overline uppercase tracking-[0.18em] text-muted-foreground">
            {currentSections.length.toString().padStart(2, "0")} /{" "}
            {String(Math.max(currentSections.length, 9)).padStart(2, "0")} sections
          </p>
        </div>
        <h2 className="mt-2 font-display text-heading-1 tracking-tight">Текст песни</h2>
        <p className="mt-1.5 font-mono text-caption uppercase tracking-[0.18em] text-muted-foreground">
          {hasContent ? "structure · type · write" : "пусто · выбери шаблон или пиши"}
        </p>
      </header>

      {/* Timeline — section jump-nav */}
      {hasContent && (
        <nav aria-label="Перейти к секции" className="px-5 sm:px-6 py-3 border-b border-foreground/10 overflow-x-auto">
          <ol className="flex items-stretch gap-[2px] font-mono text-overline uppercase tracking-[0.16em]">
            {currentSections.map((section, idx) => {
              const def = SECTION_BY_VALUE[section.type];
              const color = getSectionColor(section.type).text;
              const isActive = idx === 0;
              return (
                <li key={`tl-${section.id}`} className="shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      textareaRefs.current[section.id]?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      })
                    }
                    className={cn(
                      "h-9 px-2.5 flex items-center gap-1.5 border border-foreground/15 transition-colors",
                      "hover:border-primary hover:text-primary",
                      isActive &&
                        "bg-foreground text-background border-foreground hover:text-background hover:border-foreground",
                    )}
                    aria-label={`Перейти к секции ${idx + 1} — ${def.label}`}
                  >
                    <span className={cn(!isActive && color)}>{def.glyph}</span>
                    <span aria-hidden>·</span>
                    <span>{String(idx + 1).padStart(2, "0")}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Sections list */}
      <div className={cn("px-5 sm:px-6", hasContent ? "py-5" : "py-6", "max-h-[420px] overflow-y-auto")}>
        {hasContent ? (
          <ol className="divide-y divide-foreground/10">
            {currentSections.map((section, idx) => (
              <SectionCard
                key={section.id}
                index={idx}
                total={currentSections.length}
                section={section}
                disabled={disabled}
                registerRef={(el) => {
                  textareaRefs.current[section.id] = el;
                }}
                onTypeChange={(t) => changeSectionType(section.id, t)}
                onContentChange={(c) => updateSectionContent(section.id, c)}
                onMoveUp={() => moveSection(section.id, -1)}
                onMoveDown={() => moveSection(section.id, 1)}
                onAddLine={() => addLineBreak(section.id)}
                onClear={() => clearSection(section.id)}
                onDelete={() => deleteSection(section.id)}
              />
            ))}
          </ol>
        ) : (
          <EmptyState
            onPickTemplate={applyTemplate}
            onPickType={(t) => addSection(t)}
            onAIGenerate={onAIGenerate}
            disabled={disabled}
          />
        )}
      </div>

      {/* Colophon — footer */}
      <footer
        className={cn(
          "border-t border-foreground/15 px-5 sm:px-6 py-4",
          "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        )}
      >
        <div className="flex items-center gap-3 font-mono text-caption uppercase tracking-[0.18em]">
          <button
            type="button"
            onClick={() => addSection("verse")}
            disabled={disabled}
            className={cn(
              "group inline-flex items-center gap-1.5 px-3 h-9 border border-foreground/30",
              "hover:bg-foreground hover:text-background transition-colors",
              "disabled:opacity-40 disabled:pointer-events-none",
            )}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            <span>секция</span>
          </button>
          {onAIGenerate && (
            <button
              type="button"
              onClick={onAIGenerate}
              disabled={disabled}
              className={cn(
                "group inline-flex items-center gap-1.5 px-3 h-9 border border-primary/40",
                "text-primary hover:bg-primary hover:text-primary-foreground transition-colors",
                "disabled:opacity-40 disabled:pointer-events-none",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <span>AI · написать</span>
            </button>
          )}
        </div>

        <div
          className={cn(
            "font-mono text-overline uppercase tracking-[0.18em]",
            isOverBudget
              ? "text-destructive"
              : isNearBudget
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground",
          )}
          aria-live="polite"
        >
          <span className="tabular-nums">{totals.chars}</span>
          <span aria-hidden> · </span>
          <span>chars</span>
          <span aria-hidden> · </span>
          <span className="tabular-nums">{totals.words}</span>
          <span> words</span>
          <span aria-hidden> · </span>
          <span className="tabular-nums">{totals.lines}</span>
          <span> lines</span>
        </div>
      </footer>
    </div>
  );
});

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SectionCardProps {
  index: number;
  total: number;
  section: LyricSection;
  disabled?: boolean;
  registerRef: (el: HTMLTextAreaElement | null) => void;
  onTypeChange: (type: LyricSectionType) => void;
  onContentChange: (content: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddLine: () => void;
  onClear: () => void;
  onDelete: () => void;
}

function SectionCard({
  index,
  total,
  section,
  disabled,
  registerRef,
  onTypeChange,
  onContentChange,
  onMoveUp,
  onMoveDown,
  onAddLine,
  onClear,
  onDelete,
}: SectionCardProps) {
  const def = SECTION_BY_VALUE[section.type];
  const color = getSectionColor(section.type);
  const lineCount = section.content.trim() ? section.content.split(/\r?\n/).length : 0;
  const charCount = section.content.length;

  return (
    <li
      className={cn("relative grid grid-cols-[auto_1fr] gap-x-4 gap-y-3", "py-5 first:pt-2 last:pb-2")}
      data-section-id={section.id}
    >
      {/* Glyph marker */}
      <div className="row-span-2 flex flex-col items-center pt-1">
        <span
          className={cn("font-display leading-[0.85] tabular-nums", "text-[40px] sm:text-[48px]", color.text)}
          aria-hidden
        >
          {def.glyph}
        </span>
        <span aria-hidden className="mt-1 h-[2px] w-6 bg-foreground/20" />
      </div>

      {/* Header row */}
      <header className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">
          <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
          <span aria-hidden> · </span>
          <span>{def.label}</span>
          <span aria-hidden> · </span>
          <span className="text-foreground/70">type</span>
        </p>
        <p className="font-mono text-caption uppercase tracking-[0.18em] text-muted-foreground">
          <span className="tabular-nums">{lineCount}</span>
          <span> lines</span>
          <span aria-hidden> · </span>
          <span className="tabular-nums">{charCount}</span>
          <span> chars</span>
          <span aria-hidden> · </span>
          <span className="tabular-nums">
            {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
        </p>
      </header>

      {/* Type strip */}
      <div className="flex flex-wrap gap-[2px]" role="radiogroup" aria-label={`Тип секции ${index + 1}`}>
        {SECTION_TYPES.map((t) => {
          const isActive = t.value === section.type;
          const tColor = getSectionColor(t.value);
          return (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={disabled}
              onClick={() => onTypeChange(t.value)}
              className={cn(
                "h-7 px-2 font-mono text-overline uppercase tracking-[0.16em]",
                "border border-foreground/15 transition-colors",
                "hover:border-foreground disabled:opacity-40 disabled:pointer-events-none",
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title={t.label}
            >
              <span className={cn(isActive ? "" : tColor.text)}>{t.glyph}</span>
            </button>
          );
        })}
      </div>

      {/* Textarea + actions row */}
      <div className="row-span-1 col-start-2 flex items-stretch border border-foreground/15 focus-within:border-primary transition-colors">
        <Textarea
          ref={(el) => registerRef(el)}
          value={section.content}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={disabled}
          placeholder={`${def.label} — пиши здесь…`}
          rows={Math.max(3, Math.min(lineCount + 1, 8))}
          className={cn(
            "flex-1 resize-none border-0 rounded-none shadow-none",
            "bg-transparent font-mono text-body-sm leading-[1.7]",
            "px-4 py-3 placeholder:text-muted-foreground/40",
            "focus-visible:ring-0 focus-visible:outline-none",
            "min-h-[88px]",
          )}
          data-section-id={section.id}
        />
      </div>

      {/* Action tray */}
      <div className="col-start-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-[2px] font-mono text-overline uppercase tracking-[0.16em]">
          <ActionButton
            label="вверх"
            onClick={onMoveUp}
            disabled={disabled || index === 0}
            icon={<ArrowUp className="h-3 w-3" />}
          />
          <ActionButton
            label="вниз"
            onClick={onMoveDown}
            disabled={disabled || index === total - 1}
            icon={<ArrowDown className="h-3 w-3" />}
          />
          <ActionButton label="строка" onClick={onAddLine} disabled={disabled} icon={<Plus className="h-3 w-3" />} />
          <ActionButton
            label="очистить"
            onClick={onClear}
            disabled={disabled || !section.content}
            icon={<RotateCcw className="h-3 w-3" />}
          />
          <ActionButton
            label="удалить"
            onClick={onDelete}
            disabled={disabled || total <= 1}
            icon={<Trash2 className="h-3 w-3" />}
            destructive
          />
        </div>

        <span aria-hidden className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground/50">
          ⏎ enter · ⇧+enter for stanza
        </span>
      </div>
    </li>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  destructive?: boolean;
}

function ActionButton({ label, onClick, disabled, icon, destructive }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "h-7 w-7 inline-flex items-center justify-center border border-transparent",
        "hover:border-foreground/30 hover:text-foreground transition-colors",
        "disabled:opacity-30 disabled:pointer-events-none",
        destructive
          ? "text-destructive/70 hover:text-destructive hover:border-destructive/40"
          : "text-muted-foreground",
      )}
    >
      {icon}
    </button>
  );
}

interface EmptyStateProps {
  onPickTemplate: (template: QUICK_TEMPLATE_DEF) => void;
  onPickType: (type: LyricSectionType) => void;
  onAIGenerate?: () => void;
  disabled?: boolean;
}

function EmptyState({ onPickTemplate, onPickType, onAIGenerate, disabled }: EmptyStateProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Coverlines — template tiles */}
      <div>
        <p className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">шаблоны · structure</p>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-[2px]">
          {QUICK_TEMPLATES.map((tpl, idx) => (
            <li key={tpl.id}>
              <button
                type="button"
                onClick={() => onPickTemplate(tpl)}
                disabled={disabled}
                className={cn(
                  "w-full text-left p-4 border border-foreground/15 bg-background",
                  "hover:bg-foreground hover:text-background transition-colors",
                  "group disabled:opacity-40 disabled:pointer-events-none",
                )}
              >
                <p className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground group-hover:text-background/70">
                  {String(idx + 1).padStart(2, "0")} · {tpl.structure.length} sections
                </p>
                <p className="mt-1 font-display text-heading-2 tracking-tight">{tpl.label}</p>
                <p className="mt-1.5 font-mono text-caption uppercase tracking-[0.16em] text-muted-foreground group-hover:text-background/70">
                  {tpl.blurb}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Hairline divider with center chip */}
      <div className="relative h-[1px] bg-foreground/15" aria-hidden>
        <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-2 bg-background font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">
          or
        </span>
      </div>

      {/* Single section shortcut */}
      <div>
        <p className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">
          одна секция · single take
        </p>
        <ul className="mt-3 grid grid-cols-3 sm:grid-cols-9 gap-[2px]">
          {SECTION_TYPES.map((t) => {
            const tColor = getSectionColor(t.value);
            return (
              <li key={t.value}>
                <button
                  type="button"
                  onClick={() => onPickType(t.value)}
                  disabled={disabled}
                  className={cn(
                    "w-full h-16 flex flex-col items-center justify-center gap-1",
                    "border border-foreground/15 bg-background",
                    "hover:border-foreground transition-colors",
                    "disabled:opacity-40 disabled:pointer-events-none",
                  )}
                  title={t.label}
                >
                  <span className={cn("font-display text-heading-2 leading-none tabular-nums", tColor.text)}>
                    {t.glyph}
                  </span>
                  <span className="font-mono text-overline uppercase tracking-[0.14em] text-muted-foreground">
                    {t.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* AI pull-quote */}
      {onAIGenerate && (
        <button
          type="button"
          onClick={onAIGenerate}
          disabled={disabled}
          className={cn(
            "mt-2 text-left px-5 py-4 border-l-2 border-primary",
            "hover:bg-foreground/[0.02] transition-colors",
            "disabled:opacity-40 disabled:pointer-events-none",
          )}
        >
          <p className="font-display text-heading-3 leading-snug">
            <Sparkles className="inline h-4 w-4 mr-2 align-baseline text-primary" aria-hidden />
            AI — пусть напишет первый драфт.
          </p>
          <p className="mt-1 font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">
            одна кнопка → стартовый текст по идее
          </p>
        </button>
      )}
    </div>
  );
}

// Logger used in error-path callbacks (kept for parity with sibling editors).
export const __lyricsEditorDebugLog = (err: unknown) => logger.error("lyrics editor failed", err);
