/**
 * LyricsVisualEditor constants and helper functions
 * Extracted from LyricsVisualEditor.tsx — Sprint 051 T056
 */

export type LyricSectionType =
  "intro" | "verse" | "chorus" | "bridge" | "outro" | "hook" | "pre" | "drop" | "breakdown";

export interface LyricSection {
  id: string;
  type: LyricSectionType;
  content: string;
  tags?: string[];
}

export const SECTION_TYPES = [
  {
    value: "intro",
    label: "Вступление",
    icon: "🎬",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    gradient: "from-emerald-500/10 to-emerald-500/5",
  },
  {
    value: "verse",
    label: "Куплет",
    icon: "📝",
    color: "bg-sky-500/20 text-sky-400 border-sky-500/40",
    gradient: "from-sky-500/10 to-sky-500/5",
  },
  {
    value: "pre",
    label: "Пре-припев",
    icon: "⬆️",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    gradient: "from-amber-500/10 to-amber-500/5",
  },
  {
    value: "chorus",
    label: "Припев",
    icon: "🎵",
    color: "bg-violet-500/20 text-violet-400 border-violet-500/40",
    gradient: "from-violet-500/10 to-violet-500/5",
  },
  {
    value: "hook",
    label: "Хук",
    icon: "🎤",
    color: "bg-pink-500/20 text-pink-400 border-pink-500/40",
    gradient: "from-pink-500/10 to-pink-500/5",
  },
  {
    value: "bridge",
    label: "Бридж",
    icon: "🌉",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    gradient: "from-orange-500/10 to-orange-500/5",
  },
  {
    value: "drop",
    label: "Дроп",
    icon: "💥",
    color: "bg-red-500/20 text-red-400 border-red-500/40",
    gradient: "from-red-500/10 to-red-500/5",
  },
  {
    value: "breakdown",
    label: "Брейкдаун",
    icon: "🔊",
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    gradient: "from-cyan-500/10 to-cyan-500/5",
  },
  {
    value: "outro",
    label: "Концовка",
    icon: "🔚",
    color: "bg-slate-500/20 text-slate-400 border-slate-500/40",
    gradient: "from-slate-500/10 to-slate-500/5",
  },
] as const;

export const STRUCTURE_TEMPLATES = [
  {
    name: "Классическая",
    icon: "🎼",
    sections: ["intro", "verse", "chorus", "verse", "chorus", "bridge", "chorus", "outro"],
  },
  {
    name: "Поп",
    icon: "🎤",
    sections: ["intro", "verse", "pre", "chorus", "verse", "pre", "chorus", "bridge", "chorus", "outro"],
  },
  {
    name: "EDM",
    icon: "🎧",
    sections: ["intro", "verse", "build", "drop", "verse", "build", "drop", "breakdown", "drop", "outro"],
  },
  {
    name: "Рэп",
    icon: "🎙️",
    sections: ["intro", "verse", "hook", "verse", "hook", "verse", "hook", "outro"],
  },
];

export function parseLyrics(text: string): LyricSection[] {
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

      const headerTags: string[] = [];
      const fullMatch = line.match(/^\[([^\]]+)\]/);
      if (fullMatch) {
        const parts = fullMatch[1].split(",").map((p) => p.trim());
        headerTags.push(...parts.slice(1));
      }

      currentSection = {
        id: `${validType}-${Date.now()}-${Math.random()}`,
        type: validType,
        content: afterTag,
        tags: headerTags,
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

      const inlineTagMatches = Array.from(line.matchAll(/\[([^\]]+)\]/g));
      const structureKeywords = ["verse", "chorus", "bridge", "intro", "outro", "hook", "pre", "drop", "breakdown"];

      for (const tagMatch of inlineTagMatches) {
        const tagContent = tagMatch[1];
        const isStructure = structureKeywords.some((k) => tagContent.toLowerCase().startsWith(k));
        if (!isStructure && currentSection.tags && !currentSection.tags.includes(tagContent)) {
          currentSection.tags.push(tagContent);
        }
      }

      const parenTagMatches = Array.from(line.matchAll(/\(([^)]+)\)/g));
      for (const tagMatch of parenTagMatches) {
        const tagContent = tagMatch[1];
        const looksLikeTag = /^[A-Za-z\s]+$/.test(tagContent) && tagContent.length < 30;
        if (looksLikeTag && currentSection.tags && !currentSection.tags.includes(tagContent)) {
          currentSection.tags.push(tagContent);
        }
      }

      currentSection.content += (currentSection.content ? "\n" : "") + line;
    }
  }

  if (currentSection) {
    parsed.push(currentSection);
  }

  return parsed.length > 0 ? parsed : [];
}

export function sectionsToLyrics(sections: LyricSection[]): string {
  return sections
    .map((section) => {
      const tagName = section.type.charAt(0).toUpperCase() + section.type.slice(1);
      let content = section.content;

      if (section.tags && section.tags.length > 0) {
        const existingTags: string[] = content.match(/\(([^)]+)\)/g) || [];
        const tagsToAdd = section.tags.filter((tag: string) => !existingTags.includes(`(${tag})`));
        if (tagsToAdd.length > 0) {
          content = tagsToAdd.map((t) => `(${t})`).join(" ") + "\n" + content;
        }
      }

      return `[${tagName}]\n${content}`;
    })
    .join("\n\n");
}

export function getCleanCharCount(text: string): number {
  return text
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "")
    .trim().length;
}
