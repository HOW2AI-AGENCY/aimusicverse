/**
 * LyricsVisualEditorCompact - Simplified visual lyrics editor for generate form
 * No drag-drop, no stats panel - just sections as cards with timeline
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sparkles, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface LyricSection {
  id: string;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'hook' | 'pre' | 'drop' | 'breakdown';
  content: string;
  tags?: string[];
}

interface LyricsVisualEditorCompactProps {
  value: string;
  onChange: (value: string) => void;
  onAIGenerate?: () => void;
}

const SECTION_TYPES = [
  { value: 'intro', label: 'Intro', icon: '🎬', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'verse', label: 'Verse', icon: '📝', color: 'bg-sky-500/20 text-sky-400' },
  { value: 'pre', label: 'Pre', icon: '⬆️', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'chorus', label: 'Chorus', icon: '🎵', color: 'bg-violet-500/20 text-violet-400' },
  { value: 'hook', label: 'Hook', icon: '🎤', color: 'bg-pink-500/20 text-pink-400' },
  { value: 'bridge', label: 'Bridge', icon: '🌉', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'drop', label: 'Drop', icon: '💥', color: 'bg-red-500/20 text-red-400' },
  { value: 'breakdown', label: 'Break', icon: '🔊', color: 'bg-cyan-500/20 text-cyan-400' },
  { value: 'outro', label: 'Outro', icon: '🔚', color: 'bg-slate-500/20 text-slate-400' },
] as const;

const QUICK_TEMPLATES = [
  { name: 'Pop', icon: '🎤', sections: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'] },
  { name: 'Рэп', icon: '🎙️', sections: ['verse', 'hook', 'verse', 'hook'] },
  { name: 'EDM', icon: '🎧', sections: ['intro', 'verse', 'drop', 'verse', 'drop', 'outro'] },
];

function parseLyrics(text: string): LyricSection[] {
  if (!text.trim()) return [];

  const parsed: LyricSection[] = [];
  const lines = text.split('\n');
  let currentSection: LyricSection | null = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^\[(\w+)(?:\s+\d+)?(?:,\s*[^\]]+)?\]/i);
    
    if (sectionMatch) {
      if (currentSection) {
        parsed.push(currentSection);
      }

      const type = sectionMatch[1].toLowerCase() as LyricSection['type'];
      const validType = SECTION_TYPES.find(t => t.value === type) ? type : 'verse';
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
          type: 'verse',
          content: '',
          tags: [],
        };
      }
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  }

  if (currentSection) {
    parsed.push(currentSection);
  }

  return parsed;
}

function sectionsToLyrics(sections: LyricSection[]): string {
  return sections.map(section => {
    const tagName = section.type.charAt(0).toUpperCase() + section.type.slice(1);
    return `[${tagName}]\n${section.content}`;
  }).join('\n\n');
}

export function LyricsVisualEditorCompact({ value, onChange, onAIGenerate }: LyricsVisualEditorCompactProps) {
  const [sections, setSections] = useState<LyricSection[]>(() => parseLyrics(value));

  useEffect(() => {
    const parsed = parseLyrics(value);
    if (JSON.stringify(parsed) !== JSON.stringify(sections)) {
      setSections(parsed);
    }
  }, [value]);

  const updateSections = (newSections: LyricSection[]) => {
    setSections(newSections);
    onChange(sectionsToLyrics(newSections));
  };

  const addSection = (type: LyricSection['type']) => {
    const newSection: LyricSection = {
      id: `${type}-${Date.now()}`,
      type,
      content: '',
      tags: [],
    };
    updateSections([...sections, newSection]);
  };

  const updateSectionContent = (id: string, content: string) => {
    updateSections(sections.map(s => s.id === id ? { ...s, content } : s));
  };

  const changeSectionType = (id: string, newType: LyricSection['type']) => {
    updateSections(sections.map(s => s.id === id ? { ...s, type: newType } : s));
  };

  const deleteSection = (id: string) => {
    updateSections(sections.filter(s => s.id !== id));
  };

  const applyTemplate = (sectionTypes: string[]) => {
    const newSections = sectionTypes.map((type, i) => ({
      id: `${type}-${Date.now()}-${i}`,
      type: type as LyricSection['type'],
      content: '',
      tags: [],
    }));
    updateSections(newSections);
  };

  const charCount = useMemo(() => value.replace(/\[.*?\]/g, '').trim().length, [value]);

  return (
    <div className="space-y-2">
      {/* Timeline - compact badges */}
      {sections.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sections.map((section) => {
            const typeInfo = SECTION_TYPES.find(t => t.value === section.type);
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
          const typeInfo = SECTION_TYPES.find(t => t.value === section.type);
          return (
            <div
              key={section.id}
              className={cn(
                "rounded-lg border border-border/40 overflow-hidden",
                "bg-gradient-to-br from-muted/30 to-transparent"
              )}
            >
              {/* Section header */}
              <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "flex items-center gap-1 text-xs font-medium rounded px-1.5 py-0.5",
                      typeInfo?.color
                    )}>
                      <span>{typeInfo?.icon}</span>
                      <span>{typeInfo?.label}</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[120px]">
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

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteSection(section.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* Content */}
              <Textarea
                value={section.content}
                onChange={(e) => updateSectionContent(section.id, e.target.value)}
                placeholder="Текст секции..."
                rows={3}
                className="border-0 rounded-none bg-transparent text-xs resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
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
                <DropdownMenuItem
                  key={t.value}
                  onClick={() => addSection(t.value)}
                  className="text-xs"
                >
                  <span className="mr-2">{t.icon}</span>
                  {t.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px]">Шаблоны</DropdownMenuLabel>
              {QUICK_TEMPLATES.map((t) => (
                <DropdownMenuItem
                  key={t.name}
                  onClick={() => applyTemplate(t.sections)}
                  className="text-xs"
                >
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
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded bg-muted",
          charCount > 2800 ? "text-destructive" : 
          charCount > 2500 ? "text-yellow-500" : "text-muted-foreground"
        )}>
          {charCount}/3000
        </span>
      </div>
    </div>
  );
}