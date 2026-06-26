/**
 * LyricsVisualEditorCompact - Simplified visual lyrics editor for generate form
 * No drag-drop, no stats panel - just sections as cards with timeline
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles, ChevronDown, Eraser, CornerDownLeft } from "@/lib/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LyricSection {
  id: string;
  type: "intro" | "verse" | "chorus" | "bridge" | "outro" | "hook" | "pre" | "drop" | "breakdown";
  content: string;
  tags?: string[];
}

interface LyricsVisualEditorCompactProps {
  value: string;
  onChange: (value: string) => void;
  onAIGenerate?: () => void;
}

const SECTION_TYPES = [
  { value: "intro", label: "Intro", icon: "🎬", color: "bg-emerald-500/20 text-emerald-400" },
  { value: "verse", label: "Verse", icon: "📝", color: "bg-sky-500/20 text-sky-400" },
  { value: "pre", label: "Pre", icon: "⬆️", color: "bg-amber-500/20 text-amber-400" },
  { value: "chorus", label: "Chorus", icon: "🎵", color: "bg-violet-500/20 text-violet-400" },
  { value: "hook", label: "Hook", icon: "🎤", color: "bg-pink-500/20 text-pink-400" },
  { value: "bridge", label: "Bridge", icon: "🌉", color: "bg-orange-500/20 text-orange-400" },
  { value: "drop", label: "Drop", icon: "💥", color: "bg-red-500/20 text-red-400" },
  { value: "breakdown", label: "Break", icon: "🔊", color: "bg-cyan-500/20 text-cyan-400" },
  { value: "outro", label: "Outro", icon: "🔚", color: "bg-slate-500/20 text-slate-400" },
] as const;

const QUICK_TEMPLATES = [
  { name: "Pop", icon: "🎤", sections: ["verse", "chorus", "verse", "chorus", "bridge", "chorus"] },
  { name: "Рэп", icon: "🎙️", sections: ["verse", "hook", "verse", "hook"] },
  { name: "EDM", icon: "🎧", sections: ["intro", "verse", "drop", "verse", "drop", "outro"] },
];

function parseLyrics(text: string): LyricSection[] {
  if (!text.trim()) return [];

  const parsed: LyricSection[] = [];
  const lines = text.split("\n");
  let currentSection: LyricSection | null = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^\[(\w+)(?:\s+\d+)?(?:,\s*[^\]]+)?\]/i);

    if (sectionMatch) {
      if (currentSection) {
        parsed.push(currentSection);
      }

      const type = sectionMatch[1].toLowerCase() as LyricSection["type"];
      const validType = SECTION_TYPES.find((t) => t.value === type) ? type : "verse";
      const afterTag = line.slice(sectionMatch[0].length).trim();

      currentSection = {
        id: `${validType}-${Date.now()}-${Math.random()}`,
        type: validType,
        content: afterTag,
        tags: [],
      };
    } else if (line.trim()) {
      if (!currentSection) {
        currentSection = {
          id: `verse-${Date.now()}-${Math.random()}`,
          type: "verse",
          content: "",
          tags: [],
        };
      }
      currentSection.content += (currentSection.content ? "\n" : "") + line;
    }
  }

  if (currentSection) {
    parsed.push(currentSection);
  }

  return parsed;
}

function sectionsToLyrics(sections: LyricSection[]): string {
  return sections
    .map((section) => {
      const tagName = section.type.charAt(0).toUpperCase() + section.type.slice(1);
      return `[${tagName}]\n${section.content}`;
    })
    .join("\n\n");
}

// Structural equality ignoring volatile IDs — avoids JSON.stringify allocations on every keystroke.
export function sectionsEqual(a: LyricSection[], b: LyricSection[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].type !== b[i].type || a[i].content !== b[i].content) return false;
  }
  return true;
}

/**
 * Build a new section list from a template, carrying over user content for
 * matching section types in document order.  Pure & exported for tests.
 */
export function applyTemplateToSections(
  prev: LyricSection[],
  sectionTypes: readonly string[],
  now: number = Date.now(),
): LyricSection[] {
  const pools = new Map<string, string[]>();
  for (const s of prev) {
    if (!s.content) continue;
    const list = pools.get(s.type) ?? [];
    list.push(s.content);
    pools.set(s.type, list);
  }
  return sectionTypes.map((type, i) => {
    const pool = pools.get(type);
    const content = pool && pool.length ? pool.shift()! : "";
    return {
      id: `${type}-${now}-${i}`,
      type: type as LyricSection["type"],
      content,
      tags: [],
    };
  });
}

export { parseLyrics, sectionsToLyrics };

// ---- Dev metrics types & helpers ----
export interface SyncFocusSnapshot {
  sectionId: string | null;
  tagName: string | null;
  selectionStart: number | null;
  selectionEnd: number | null;
  valueLength: number | null;
}
export interface SyncSnapshot {
  id: string;
  ts: number;
  phase: "before" | "after";
  syncIndex: number;
  sections: Array<{ id: string; type: string; content: string }>;
  focus: SyncFocusSnapshot;
}
export interface LyricsEditorMetrics {
  renders: number;
  externalSyncs: number;
  lastRenderAt: number;
  snapshots: SyncSnapshot[];
  reset?: () => void;
}

const MAX_SNAPSHOTS = 200;

function captureFocusSnapshot(): SyncFocusSnapshot {
  if (typeof document === "undefined") {
    return { sectionId: null, tagName: null, selectionStart: null, selectionEnd: null, valueLength: null };
  }
  const el = document.activeElement as HTMLElement | null;
  if (!el) return { sectionId: null, tagName: null, selectionStart: null, selectionEnd: null, valueLength: null };
  const sectionId = el.getAttribute?.("data-section-id") ?? null;
  const ta = el as HTMLTextAreaElement;
  const isField = typeof ta.selectionStart === "number";
  return {
    sectionId,
    tagName: el.tagName?.toLowerCase() ?? null,
    selectionStart: isField ? ta.selectionStart : null,
    selectionEnd: isField ? ta.selectionEnd : null,
    valueLength: isField && typeof ta.value === "string" ? ta.value.length : null,
  };
}

function pushSnapshot(snap: SyncSnapshot) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __lyricsEditorMetrics?: LyricsEditorMetrics };
  const m = w.__lyricsEditorMetrics;
  if (!m) return;
  const arr = m.snapshots ?? (m.snapshots = []);
  arr.push(snap);
  if (arr.length > MAX_SNAPSHOTS) arr.splice(0, arr.length - MAX_SNAPSHOTS);
}


export function LyricsVisualEditorCompact({ value, onChange, onAIGenerate }: LyricsVisualEditorCompactProps) {
  const [sections, setSections] = useState<LyricSection[]>(() => parseLyrics(value));
  // Track the last lyrics string we emitted, so external changes (mode switch, AI, templates)
  // re-sync the editor without clobbering in-progress edits on every keystroke.
  const lastEmittedRef = useRef<string>(sectionsToLyrics(parseLyrics(value)));

  // Dev-only render metrics — warn if external syncs happen suspiciously often,
  // which would indicate we're clobbering local state on each keystroke again.
  const renderCountRef = useRef(0);
  const syncCountRef = useRef(0);
  renderCountRef.current += 1;
  if (import.meta.env?.DEV) {
    const w = window as unknown as { __lyricsEditorMetrics?: LyricsEditorMetrics };
    const existing = w.__lyricsEditorMetrics;
    w.__lyricsEditorMetrics = {
      renders: renderCountRef.current,
      externalSyncs: syncCountRef.current,
      lastRenderAt: performance.now(),
      snapshots: existing?.snapshots ?? [],
      reset: () => {
        renderCountRef.current = 0;
        syncCountRef.current = 0;
        if (w.__lyricsEditorMetrics) {
          w.__lyricsEditorMetrics.renders = 0;
          w.__lyricsEditorMetrics.externalSyncs = 0;
          w.__lyricsEditorMetrics.snapshots = [];
        }
      },
    };
  }

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    const parsed = parseLyrics(value);
    if (!sectionsEqual(parsed, sections)) {
      syncCountRef.current += 1;
      // Preserve existing IDs where possible to keep React keys + focus stable.
      const merged = parsed.map((p, i) => {
        const prev = sections[i];
        if (prev && prev.type === p.type) return { ...p, id: prev.id };
        return p;
      });
      if (import.meta.env?.DEV) {
        const focus = captureFocusSnapshot();
        const ts = Date.now();
        const syncId = `sync-${ts}-${syncCountRef.current}`;
        pushSnapshot({
          id: syncId,
          ts,
          phase: "before",
          syncIndex: syncCountRef.current,
          sections: sections.map((s) => ({ id: s.id, type: s.type, content: s.content })),
          focus,
        });
        pushSnapshot({
          id: syncId,
          ts,
          phase: "after",
          syncIndex: syncCountRef.current,
          sections: merged.map((s) => ({ id: s.id, type: s.type, content: s.content })),
          focus,
        });
      }
      setSections(merged);
    }
    lastEmittedRef.current = value;
  }, [value, sections]);

  const updateSections = (newSections: LyricSection[]) => {
    setSections(newSections);
    const next = sectionsToLyrics(newSections);
    lastEmittedRef.current = next;
    onChange(next);
  };

  const addSection = (type: LyricSection["type"]) => {
    const newSection: LyricSection = {
      id: `${type}-${Date.now()}`,
      type,
      content: "",
      tags: [],
    };
    updateSections([...sections, newSection]);
  };

  const updateSectionContent = (id: string, content: string) => {
    updateSections(sections.map((s) => (s.id === id ? { ...s, content } : s)));
  };

  const changeSectionType = (id: string, newType: LyricSection["type"]) => {
    updateSections(sections.map((s) => (s.id === id ? { ...s, type: newType } : s)));
  };

  const deleteSection = (id: string) => {
    updateSections(sections.filter((s) => s.id !== id));
  };

  const applyTemplate = (sectionTypes: string[]) => {
    updateSections(applyTemplateToSections(sections, sectionTypes));
  };

  const charCount = useMemo(() => value.replace(/\[.*?\]/g, "").trim().length, [value]);

  return (
    <div className="space-y-2">
      {/* Timeline - compact badges */}
      {sections.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sections.map((section) => {
            const typeInfo = SECTION_TYPES.find((t) => t.value === section.type);
            return (
              <Badge
                key={section.id}
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0 h-5 cursor-default", typeInfo?.color)}
              >
                {typeInfo?.icon} {typeInfo?.label}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto">
        {sections.map((section) => {
          const typeInfo = SECTION_TYPES.find((t) => t.value === section.type);
          return (
            <div
              key={section.id}
              className={cn(
                "rounded-lg border border-border/40 overflow-hidden",
                "bg-gradient-to-br from-muted/30 to-transparent",
              )}
            >
              {/* Section header */}
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-muted/30">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Тип секции: ${typeInfo?.label}`}
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium rounded-md px-2 py-1 min-h-[32px]",
                        typeInfo?.color,
                      )}
                    >
                      <span aria-hidden>{typeInfo?.icon}</span>
                      <span>{typeInfo?.label}</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[140px]">
                    {SECTION_TYPES.map((t) => (
                      <DropdownMenuItem
                        key={t.value}
                        onClick={() => changeSectionType(section.id, t.value)}
                        className={cn("text-xs", section.type === t.value && "bg-primary/10")}
                      >
                        <span className="mr-2">{t.icon}</span>
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Добавить строку"
                    className="h-9 w-9 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-primary"
                    onClick={() =>
                      updateSectionContent(
                        section.id,
                        section.content ? section.content + "\n" : "",
                      )
                    }
                  >
                    <CornerDownLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Очистить секцию"
                    disabled={!section.content}
                    className="h-9 w-9 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground disabled:opacity-40"
                    onClick={() => updateSectionContent(section.id, "")}
                  >
                    <Eraser className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Удалить секцию"
                    className="h-9 w-9 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive"
                    onClick={() => deleteSection(section.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <Textarea
                value={section.content}
                onChange={(e) => updateSectionContent(section.id, e.target.value)}
                placeholder="Текст секции — каждая строка с новой строки..."
                rows={3}
                className="border-0 rounded-none bg-transparent text-sm leading-relaxed resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
              />
              <div className="flex items-center justify-between px-2 py-1 text-[10px] text-muted-foreground/70 bg-muted/10 border-t border-border/30">
                <span>
                  {section.content.split("\n").filter((l) => l.trim()).length} стр · {section.content.length} симв
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1">
          {/* Add section */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                <Plus className="w-3 h-3" />
                Секция
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px]">
              <DropdownMenuLabel className="text-[10px]">Добавить секцию</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SECTION_TYPES.map((t) => (
                <DropdownMenuItem key={t.value} onClick={() => addSection(t.value)} className="text-xs">
                  <span className="mr-2">{t.icon}</span>
                  {t.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px]">Шаблоны</DropdownMenuLabel>
              {QUICK_TEMPLATES.map((t) => (
                <DropdownMenuItem key={t.name} onClick={() => applyTemplate(t.sections)} className="text-xs">
                  <span className="mr-2">{t.icon}</span>
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI Generate */}
          {onAIGenerate && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
              onClick={onAIGenerate}
            >
              <Sparkles className="w-3 h-3" />
              AI
            </Button>
          )}
        </div>

        {/* Char count */}
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded bg-muted",
            charCount > 2800 ? "text-destructive" : charCount > 2500 ? "text-yellow-500" : "text-muted-foreground",
          )}
        >
          {charCount}/3000
        </span>
      </div>
    </div>
  );
}
