import { useState, useCallback, useMemo } from "react";
import { LYRICS_TEMPLATES, type Template } from "./LyricsSectionTemplates";

export type SectionType =
  | "verse" | "chorus" | "bridge" | "pre-chorus"
  | "intro" | "outro" | "hook" | "custom";

export interface LyricsSection {
  id: string;
  type: SectionType;
  label?: string;
  content: string;
}

export interface LyricsStats {
  totalChars: number;
  totalLines: number;
  estimatedDurationSeconds: number;
}

const SECTION_HEADER_RE = /^\[(.+?)\]$/;

function parseSections(text: string): LyricsSection[] {
  const lines = text.split("\n");
  const sections: LyricsSection[] = [];
  let current: LyricsSection | null = null;
  for (const line of lines) {
    const m = line.match(SECTION_HEADER_RE);
    if (m) {
      if (current) sections.push(current);
      current = { id: crypto.randomUUID(), type: inferSectionType(m[1]), content: "" };
    } else if (current) {
      current.content += (current.content ? "\n" : "") + line;
    } else if (line.length > 0) {
      current = { id: crypto.randomUUID(), type: "verse", content: line };
    }
  }
  if (current) sections.push(current);
  return sections;
}

function inferSectionType(label: string): SectionType {
  const lower = label.toLowerCase().trim();
  if (lower.startsWith("verse") || lower.includes("куплет")) return "verse";
  if (lower.startsWith("chorus") || lower.includes("припев")) return "chorus";
  if (lower.startsWith("bridge") || lower.includes("бридж")) return "bridge";
  if (lower.includes("pre") && lower.includes("chorus")) return "pre-chorus";
  if (lower.startsWith("intro") || lower.includes("интро")) return "intro";
  if (lower.startsWith("outro") || lower.includes("аутро")) return "outro";
  if (lower.startsWith("hook") || lower.includes("хук")) return "hook";
  return "custom";
}

function serialize(sections: LyricsSection[]): string {
  return sections
    .map(s => `[${capitalize(s.type)}]\n${s.content}`)
    .join("\n");
}

function capitalize(t: SectionType): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function useLyricsSections(initialText: string, onChange: (text: string) => void) {
  const [sections, setSections] = useState<LyricsSection[]>(() => parseSections(initialText));

  const persist = useCallback((next: LyricsSection[]) => {
    setSections(next);
    onChange(serialize(next));
  }, [onChange]);

  const addSection = useCallback((type: SectionType, afterId?: string) => {
    setSections(prev => {
      const newSection: LyricsSection = { id: crypto.randomUUID(), type, content: "" };
      if (!afterId) {
        const next = [...prev, newSection];
        onChange(serialize(next));
        return next;
      }
      const idx = prev.findIndex(s => s.id === afterId);
      const next = [...prev.slice(0, idx + 1), newSection, ...prev.slice(idx + 1)];
      onChange(serialize(next));
      return next;
    });
  }, [onChange]);

  const removeSection = useCallback((id: string) => {
    setSections(prev => {
      const next = prev.filter(s => s.id !== id);
      onChange(serialize(next));
      return next.length > 0 ? next : [{ id: crypto.randomUUID(), type: "verse" as SectionType, content: "" }];
    });
  }, [onChange]);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setSections(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      onChange(serialize(next));
      return next;
    });
  }, [onChange]);

  const updateSection = useCallback((id: string, patch: Partial<LyricsSection>) => {
    setSections(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...patch } : s);
      onChange(serialize(next));
      return next;
    });
  }, [onChange]);

  const applyTemplate = useCallback((templateId: string) => {
    const tmpl: Template | undefined = LYRICS_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;
    const next = tmpl.sections.map(s => ({ id: crypto.randomUUID(), type: s.type, content: "" }));
    setSections(next);
    onChange(serialize(next));
  }, [onChange]);

  const toPlainText = useCallback(() => serialize(sections), [sections]);

  const fromPlainText = useCallback((text: string) => {
    const next = parseSections(text);
    setSections(next);
    onChange(serialize(next));
  }, [onChange]);

  const stats = useMemo<LyricsStats>(() => {
    const totalChars = sections.reduce((sum, s) => sum + s.content.length, 0);
    const totalLines = sections.reduce((sum, s) => sum + (s.content ? s.content.split("\n").length : 0), 0);
    const estimatedDurationSeconds = Math.round((totalChars / 12));
    return { totalChars, totalLines, estimatedDurationSeconds };
  }, [sections]);

  return {
    sections,
    addSection,
    removeSection,
    reorderSections,
    updateSection,
    applyTemplate,
    toPlainText,
    fromPlainText,
    stats,
  };
}