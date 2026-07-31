/**
 * LyricsVisualEditorCompact Component
 *
 * Section-based lyrics editor for the advanced generation form.
 * 9 structural sections (intro → outro), templates, per-section type chips
 * and a jump-nav timeline — styled with the app design system (Spec 032):
 * rounded-xl surfaces, `sectionColors` accents, 44px touch targets.
 *
 * Public API (preserved):
 *   <LyricsVisualEditorCompact value={lyrics} onChange={setLyrics} onAIGenerate?={fn} />
 *
 * Exposed helpers (used by tests):
 *   parseLyrics, sectionsToLyrics, sectionsEqual, applyTemplateToSections
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Plus } from "@/lib/icons";
import { logger } from "@/lib/logger";
import {
  LYRIC_SECTION_TYPES,
  LYRIC_SECTION_BY_VALUE,
  getLyricSectionColor,
  normalizeSectionType,
  type LyricSectionType,
} from "./lyricsSectionMeta";
import {
  parseLyrics,
  sectionsToLyrics,
  sectionsEqual,
  applyTemplateToSections,
  CHAR_LIMIT,
  CHAR_DANGER,
  CHAR_WARNING,
  QUICK_TEMPLATES,
  type QUICK_TEMPLATE_DEF,
  type LyricSection,
} from "./lyricsEditorHelpers";
import { SectionCard, EmptyState } from "./lyrics-editor";

// Re-export for backward compatibility with tests
// eslint-disable-next-line react-refresh/only-export-components
export { parseLyrics, sectionsToLyrics, sectionsEqual, applyTemplateToSections };

export type { LyricSectionType, LyricSection };

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
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
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

  const changeSectionTags = useCallback(
    (id: string, tags: string[]) => {
      const next = currentSections.map((s) => (s.id === id ? { ...s, tags } : s));
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

  const jumpToSection = useCallback((id: string) => {
    const el = textareaRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }, []);

  // -------------------------------------------------------------------------
  // Derived metrics for the footer + per-type numbering for card labels.
  // -------------------------------------------------------------------------
  const totals = useMemo(() => {
    const text = currentSections.map((s) => s.content).join("\n");
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.trim() ? text.split(/\r?\n/).length : 0;
    return { chars, words, lines };
  }, [currentSections]);

  const ordinals = useMemo(() => {
    const typeTotals = new Map<LyricSectionType, number>();
    for (const s of currentSections) typeTotals.set(s.type, (typeTotals.get(s.type) ?? 0) + 1);
    const seen = new Map<LyricSectionType, number>();
    const map = new Map<string, number | null>();
    for (const s of currentSections) {
      const n = (seen.get(s.type) ?? 0) + 1;
      seen.set(s.type, n);
      map.set(s.id, (typeTotals.get(s.type) ?? 0) > 1 ? n : null);
    }
    return map;
  }, [currentSections]);

  const isOverBudget = totals.chars > CHAR_DANGER;
  const isNearBudget = totals.chars > CHAR_WARNING;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const hasContent = currentSections.length > 0;

  return (
    <div
      className={cn("w-full rounded-xl border border-border/60 bg-muted/20 overflow-hidden")}
      data-testid="lyrics-editor"
    >
      {/* Timeline — section jump-nav */}
      {hasContent && (
        <nav
          aria-label="Перейти к секции"
          className="px-3 py-2 border-b border-border/40 bg-background/40 overflow-x-auto scrollbar-none"
        >
          <ol className="flex items-center gap-1">
            {currentSections.map((section, idx) => {
              const def = LYRIC_SECTION_BY_VALUE[section.type];
              const color = getLyricSectionColor(section.type);
              const isActive = section.id === focusedSectionId;
              return (
                <li key={`tl-${section.id}`} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => jumpToSection(section.id)}
                    className={cn(
                      "h-9 px-2.5 flex items-center gap-1 rounded-lg border text-caption-sm font-semibold",
                      "transition-colors touch-manipulation",
                      isActive
                        ? cn(color.bg, color.border, color.text)
                        : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                    aria-label={`Перейти к секции ${idx + 1} — ${def.label}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className={cn(!isActive && color.text)}>{def.glyph}</span>
                    <span className="tabular-nums">{idx + 1}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Sections list */}
      <div className="px-3 py-3">
        {hasContent ? (
          <ol className="space-y-3">
            {currentSections.map((section, idx) => (
              <SectionCard
                key={section.id}
                index={idx}
                total={currentSections.length}
                ordinal={ordinals.get(section.id) ?? null}
                section={section}
                disabled={disabled}
                registerRef={(el) => {
                  textareaRefs.current[section.id] = el;
                }}
                onFocusSection={() => setFocusedSectionId(section.id)}
                onTypeChange={(t) => changeSectionType(section.id, t)}
                onTagsChange={(tags) => changeSectionTags(section.id, tags)}
                onContentChange={(c) => updateSectionContent(section.id, c)}
                onMoveUp={() => moveSection(section.id, -1)}
                onMoveDown={() => moveSection(section.id, 1)}
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

      {/* Footer — add section, AI, character budget */}
      <footer
        className={cn(
          "border-t border-border/40 bg-background/40 px-3 py-2.5",
          "flex items-center justify-between gap-3",
        )}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => addSection("verse")}
            disabled={disabled}
            className={cn(
              "h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-border/60",
              "text-xs font-medium text-foreground/90 bg-background/60",
              "hover:border-primary/50 hover:bg-primary/5 transition-colors touch-manipulation",
              "disabled:opacity-40 disabled:pointer-events-none",
            )}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            <span>Секция</span>
          </button>
          {onAIGenerate && (
            <button
              type="button"
              onClick={onAIGenerate}
              disabled={disabled}
              className={cn(
                "h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/40",
                "text-xs font-medium text-primary bg-primary/5",
                "hover:bg-primary/10 hover:border-primary/60 transition-colors touch-manipulation",
                "disabled:opacity-40 disabled:pointer-events-none",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <span>AI-текст</span>
            </button>
          )}
        </div>

        {/* Character budget — same scale and colors as the text-mode editor */}
        <div className="flex items-center gap-2" aria-live="polite">
          <div className="h-1 w-16 rounded-full bg-muted overflow-hidden" aria-hidden>
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isOverBudget ? "bg-destructive" : isNearBudget ? "bg-amber-500" : "bg-primary",
              )}
              style={{ width: `${Math.min((totals.chars / CHAR_LIMIT) * 100, 100)}%` }}
            />
          </div>
          <span
            className={cn(
              "text-caption-sm font-mono tabular-nums",
              isOverBudget ? "text-destructive" : isNearBudget ? "text-amber-500" : "text-muted-foreground",
            )}
          >
            {totals.chars}/{CHAR_LIMIT}
          </span>
          <span className="hidden sm:inline text-caption-sm text-muted-foreground/70 tabular-nums">
            {totals.words} слов · {totals.lines} строк
          </span>
        </div>
      </footer>
    </div>
  );
});

// Logger used in error-path callbacks (kept for parity with sibling editors).
export const __lyricsEditorDebugLog = (err: unknown) => logger.error("lyrics editor failed", err);
