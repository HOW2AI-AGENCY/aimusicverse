import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  GripVertical, Plus, Trash2, Edit2, Check,
  Sparkles, Music2, ChevronDown, Mic, Tag,
  Copy, BarChart3, Eye, EyeOff, Wand2, AlignLeft
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { SectionTagSelector } from './SectionTagSelector';
import { TagBadge, TagList } from '@/components/lyrics/shared/TagBadge';
import { cn } from '@/lib/utils';

interface LyricSection {
  id: string;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'hook' | 'pre' | 'drop' | 'breakdown';
  content: string;
  tags?: string[];
}

interface LyricsVisualEditorProps {
  value: string;
  onChange: (value: string) => void;
  onAIGenerate?: () => void;
}

const SECTION_TYPES = [
  { value: 'intro', label: 'Вступление', icon: '🎬', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', gradient: 'from-emerald-500/10 to-emerald-500/5' },
  { value: 'verse', label: 'Куплет', icon: '📝', color: 'bg-sky-500/20 text-sky-400 border-sky-500/40', gradient: 'from-sky-500/10 to-sky-500/5' },
  { value: 'pre', label: 'Пре-припев', icon: '⬆️', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', gradient: 'from-amber-500/10 to-amber-500/5' },
  { value: 'chorus', label: 'Припев', icon: '🎵', color: 'bg-violet-500/20 text-violet-400 border-violet-500/40', gradient: 'from-violet-500/10 to-violet-500/5' },
  { value: 'hook', label: 'Хук', icon: '🎤', color: 'bg-pink-500/20 text-pink-400 border-pink-500/40', gradient: 'from-pink-500/10 to-pink-500/5' },
  { value: 'bridge', label: 'Бридж', icon: '🌉', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40', gradient: 'from-orange-500/10 to-orange-500/5' },
  { value: 'drop', label: 'Дроп', icon: '💥', color: 'bg-red-500/20 text-red-400 border-red-500/40', gradient: 'from-red-500/10 to-red-500/5' },
  { value: 'breakdown', label: 'Брейкдаун', icon: '🔊', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40', gradient: 'from-cyan-500/10 to-cyan-500/5' },
  { value: 'outro', label: 'Концовка', icon: '🔚', color: 'bg-slate-500/20 text-slate-400 border-slate-500/40', gradient: 'from-slate-500/10 to-slate-500/5' },
] as const;

// Recommended structure templates
const STRUCTURE_TEMPLATES = [
  {
    name: 'Классическая',
    icon: '🎼',
    sections: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro']
  },
  {
    name: 'Поп',
    icon: '🎤',
    sections: ['intro', 'verse', 'pre', 'chorus', 'verse', 'pre', 'chorus', 'bridge', 'chorus', 'outro']
  },
  {
    name: 'EDM',
    icon: '🎧',
    sections: ['intro', 'verse', 'build', 'drop', 'verse', 'build', 'drop', 'breakdown', 'drop', 'outro']
  },
  {
    name: 'Рэп',
    icon: '🎙️',
    sections: ['intro', 'verse', 'hook', 'verse', 'hook', 'verse', 'hook', 'outro']
  },
];

// Helper function to parse lyrics text into sections
function parseLyrics(text: string): LyricSection[] {
  if (!text.trim()) return [];

  const parsed: LyricSection[] = [];
  const lines = text.split('\n');
  let currentSection: LyricSection | null = null;

  for (const line of lines) {
    // Improved regex: matches [TAG] at start of line, potentially followed by content
    // e.g., [Verse], [Verse 1], [Chorus, Powerful], or [Tag]Word
    const sectionMatch = line.match(/^\[(\w+)(?:\s+\d+)?(?:,\s*[^\]]+)?\]/i);
    
    if (sectionMatch) {
      if (currentSection) {
        parsed.push(currentSection);
      }

      const type = sectionMatch[1].toLowerCase() as LyricSection['type'];
      const validType = SECTION_TYPES.find(t => t.value === type) ? type : 'verse';
      
      // Get remaining content after the section tag (for cases like [Tag]Word)
      const afterTag = line.slice(sectionMatch[0].length).trim();
      
      // Extract any comma-separated tags from the section header like [Verse, Powerful]
      const headerTags: string[] = [];
      const fullMatch = line.match(/^\[([^\]]+)\]/);
      if (fullMatch) {
        const parts = fullMatch[1].split(',').map(p => p.trim());
        // First part is section type, rest are tags
        headerTags.push(...parts.slice(1));
      }

      currentSection = {
        id: `${validType}-${Date.now()}-${Math.random()}`,
        type: validType,
        content: afterTag, // Start with any content after the tag
        tags: headerTags,
      };
    } else if (line.trim()) {
      // Handle lines without section headers
      if (!currentSection) {
        // Create a default verse section if content appears before any section
        currentSection = {
          id: `verse-${Date.now()}-${Math.random()}`,
          type: 'verse',
          content: '',
          tags: [],
        };
      }
      
      // Extract inline tags in brackets like [Powerful] or [Male Vocal]
      const inlineTagMatches = Array.from(line.matchAll(/\[([^\]]+)\]/g));
      const structureKeywords = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'hook', 'pre', 'drop', 'breakdown'];
      
      for (const tagMatch of inlineTagMatches) {
        const tagContent = tagMatch[1];
        const isStructure = structureKeywords.some(k => tagContent.toLowerCase().startsWith(k));
        if (!isStructure && currentSection.tags && !currentSection.tags.includes(tagContent)) {
          currentSection.tags.push(tagContent);
        }
      }
      
      // Extract parentheses tags like (ooh, aah), (harmony)
      const parenTagMatches = Array.from(line.matchAll(/\(([^)]+)\)/g));
      for (const tagMatch of parenTagMatches) {
        const tagContent = tagMatch[1];
        // Only add as tag if it looks like a production tag, not sung content
        const looksLikeTag = /^[A-Za-z\s]+$/.test(tagContent) && tagContent.length < 30;
        if (looksLikeTag && currentSection.tags && !currentSection.tags.includes(tagContent)) {
          currentSection.tags.push(tagContent);
        }
      }
      
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  }

  if (currentSection) {
    parsed.push(currentSection);
  }

  return parsed.length > 0 ? parsed : [];
}

// Helper function to convert sections back to lyrics text
function sectionsToLyrics(sections: LyricSection[]): string {
  return sections.map(section => {
    // Use English tag names for Suno compatibility
    const tagName = section.type.charAt(0).toUpperCase() + section.type.slice(1);
    let content = section.content;

    // Add tags inline if they exist and aren't already in content
    if (section.tags && section.tags.length > 0) {
      const existingTags: string[] = content.match(/\(([^)]+)\)/g) || [];
      const tagsToAdd = section.tags.filter((tag: string) => !existingTags.includes(`(${tag})`));
      if (tagsToAdd.length > 0) {
        content = tagsToAdd.map(t => `(${t})`).join(' ') + '\n' + content;
      }
    }

    return `[${tagName}]\n${content}`;
  }).join('\n\n');
}

// Calculate character count excluding tags
function getCleanCharCount(text: string): number {
  return text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim().length;
}

export function LyricsVisualEditor({ value, onChange, onAIGenerate }: LyricsVisualEditorProps) {
  const [sections, setSections] = useState<LyricSection[]>(() => parseLyrics(value));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showStats, setShowStats] = useState(true);

  // Sync sections when value changes externally
  useEffect(() => {
    const parsed = parseLyrics(value);
    if (JSON.stringify(parsed) !== JSON.stringify(sections)) {
      setSections(parsed);
    }
  }, [value]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalChars = sections.reduce((sum, s) => sum + getCleanCharCount(s.content), 0);
    const totalLines = sections.reduce((sum, s) => sum + s.content.split('\n').filter(l => l.trim()).length, 0);
    const sectionCounts: Record<string, number> = {};
    sections.forEach(s => {
      sectionCounts[s.type] = (sectionCounts[s.type] || 0) + 1;
    });

    return {
      totalChars,
      totalLines,
      sectionCounts,
      avgCharsPerSection: sections.length > 0 ? Math.round(totalChars / sections.length) : 0,
    };
  }, [sections]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setSections(items);
    onChange(sectionsToLyrics(items));
    toast.success('Секция перемещена');
  };

  const handleAddSection = (type: LyricSection['type']) => {
    const timestamp = Date.now();
    const newSectionId = `${type}-${timestamp}`;
    const newSection: LyricSection = {
      id: newSectionId,
      type,
      content: '',
      tags: [],
    };
    const updated = [...sections, newSection];
    setSections(updated);
    setEditingId(newSection.id);
    toast.success(`${SECTION_TYPES.find(t => t.value === type)?.label} добавлен${type === 'intro' || type === 'outro' ? 'а' : ''}`);
  };

  const handleDuplicateSection = (id: string) => {
    const section = sections.find(s => s.id === id);
    if (!section) return;

    const newSection: LyricSection = {
      ...section,
      id: `${section.type}-${Date.now()}`,
    };

    const index = sections.findIndex(s => s.id === id);
    const updated = [...sections];
    updated.splice(index + 1, 0, newSection);

    setSections(updated);
    onChange(sectionsToLyrics(updated));
    toast.success('Секция дублирована');
  };

  const handleDeleteSection = (id: string) => {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    onChange(sectionsToLyrics(updated));
    toast.success('Секция удалена');
  };

  const handleUpdateSection = (id: string, content: string) => {
    const updated = sections.map(s =>
      s.id === id ? { ...s, content } : s
    );
    setSections(updated);
  };

  const handleUpdateSectionTags = (id: string, tags: string[]) => {
    const updated = sections.map(s =>
      s.id === id ? { ...s, tags } : s
    );
    setSections(updated);
    onChange(sectionsToLyrics(updated));
  };

  const handleSaveEdit = (id: string) => {
    setEditingId(null);
    onChange(sectionsToLyrics(sections));
  };

  const handleVoiceInput = (id: string, text: string) => {
    const section = sections.find(s => s.id === id);
    if (section) {
      const newContent = section.content ? `${section.content}\n${text}` : text;
      handleUpdateSection(id, newContent);
      onChange(sectionsToLyrics(sections.map(s => s.id === id ? { ...s, content: newContent } : s)));
    }
  };

  const handleApplyTemplate = (template: typeof STRUCTURE_TEMPLATES[0]) => {
    const newSections = template.sections.map((type, index) => ({
      id: `${type}-${Date.now()}-${index}`,
      type: type as LyricSection['type'],
      content: '',
      tags: [],
    }));

    setSections(newSections);
    onChange(sectionsToLyrics(newSections));
    toast.success(`Шаблон "${template.name}" применён`);
  };

  const getSectionConfig = (type: string) => {
    return SECTION_TYPES.find(t => t.value === type) || SECTION_TYPES[1];
  };

  return (
    <div className="space-y-3">
      {/* Enhanced Header with Stats */}
      <div className="flex items-start justify-between gap-2 p-3 rounded-lg border bg-gradient-to-br from-background/50 to-muted/30 backdrop-blur-sm">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="gap-2 h-9 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Добавить
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Тип секции
                </DropdownMenuLabel>
                {SECTION_TYPES.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => handleAddSection(type.value as LyricSection['type'])}
                    className="gap-2"
                  >
                    <span className="text-base">{type.icon}</span>
                    <span>{type.label}</span>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Шаблоны структуры
                </DropdownMenuLabel>
                {STRUCTURE_TEMPLATES.map((template) => (
                  <DropdownMenuItem
                    key={template.name}
                    onClick={() => handleApplyTemplate(template)}
                    className="gap-2"
                  >
                    <span className="text-base">{template.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {template.sections.length} секций
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {onAIGenerate && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onAIGenerate}
                className="gap-2 h-9"
              >
                <Sparkles className="w-4 h-4" />
                AI Лирика
              </Button>
            )}
          </div>

          {/* Quick Stats */}
          {showStats && sections.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Music2 className="w-3 h-3" />
                {sections.length} {sections.length === 1 ? 'секция' : 'секций'}
              </span>
              <span className="flex items-center gap-1">
                <AlignLeft className="w-3 h-3" />
                {stats.totalLines} {stats.totalLines === 1 ? 'строка' : 'строк'}
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                {stats.totalChars} символов
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="h-7 w-7 p-0"
            title={showStats ? 'Скрыть статистику' : 'Показать статистику'}
          >
            {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Timeline View */}
      {showTimeline && sections.length > 0 && (
        <div className="p-3 rounded-lg border bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Структура трека</span>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {sections.map((section, index) => {
              const config = getSectionConfig(section.type);
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setEditingId(section.id);
                    const element = document.getElementById(`section-${section.id}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={cn(
                    "flex-shrink-0 h-8 px-2 rounded text-xs font-medium transition-all border-2",
                    config.color,
                    editingId === section.id && "ring-2 ring-primary ring-offset-2"
                  )}
                  title={`${config.label} (${getCleanCharCount(section.content)} символов)`}
                >
                  <span className="mr-1">{config.icon}</span>
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sections List */}
      <ScrollArea className="max-h-[500px]">
        {sections.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="lyrics-sections">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3 pr-2"
                >
                  {sections.map((section, index) => {
                    const config = getSectionConfig(section.type);
                    const isEditing = editingId === section.id;
                    const charCount = getCleanCharCount(section.content);
                    const lineCount = section.content.split('\n').filter(l => l.trim()).length;
                    const isOptimalLength = charCount >= 50 && charCount <= 200;

                    return (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            id={`section-${section.id}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "rounded-xl border-2 overflow-hidden transition-all",
                              snapshot.isDragging
                                ? 'shadow-2xl scale-[1.02] border-primary rotate-1'
                                : 'border-border/30 hover:border-border/50 shadow-sm',
                              `bg-gradient-to-br ${config.gradient} backdrop-blur-sm`
                            )}
                          >
                            {/* Section Header */}
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-background/40 backdrop-blur-sm border-b border-border/30">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing touch-none"
                              >
                                <GripVertical className="w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                              </div>

                              <Badge
                                variant="outline"
                                className={cn(
                                  "border-2 text-xs font-semibold shadow-sm",
                                  config.color
                                )}
                              >
                                <span className="mr-1.5">{config.icon}</span>
                                {config.label} {index + 1}
                              </Badge>

                              {/* Character count indicator */}
                              <div className="flex items-center gap-1.5 ml-2">
                                <span className={cn(
                                  "text-xs font-medium tabular-nums",
                                  isOptimalLength ? "text-emerald-500" : "text-muted-foreground"
                                )}>
                                  {charCount}
                                </span>
                                {charCount > 0 && (
                                  <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full transition-all rounded-full",
                                        isOptimalLength ? "bg-emerald-500" : "bg-primary"
                                      )}
                                      style={{ width: `${Math.min((charCount / 200) * 100, 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1" />

                              <div className="flex items-center gap-1">
                                {isEditing ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                    onClick={() => handleSaveEdit(section.id)}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <>
                                    <VoiceInputButton
                                      onResult={(text) => handleVoiceInput(section.id, text)}
                                      context="lyrics"
                                      size="icon"
                                      className="h-8 w-8"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-primary/10"
                                      onClick={() => setEditingId(section.id)}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-primary/10"
                                      onClick={() => handleDuplicateSection(section.id)}
                                      title="Дублировать секцию"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteSection(section.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={section.content}
                                    onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                                    placeholder="Введите текст секции..."
                                    rows={6}
                                    className="resize-none text-sm bg-background/50 border-border/40 focus:border-primary/50 font-mono leading-relaxed"
                                    autoFocus
                                    onBlur={() => handleSaveEdit(section.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') {
                                        handleSaveEdit(section.id);
                                      }
                                    }}
                                  />
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      {lineCount} {lineCount === 1 ? 'строка' : lineCount < 5 ? 'строки' : 'строк'}
                                    </span>
                                    <span className={cn(
                                      "font-medium",
                                      isOptimalLength ? "text-emerald-500" : "text-muted-foreground"
                                    )}>
                                      {isOptimalLength && "✓ "}
                                      {charCount} / 200 символов
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={cn(
                                    "text-sm whitespace-pre-wrap cursor-pointer rounded-lg p-3 transition-all min-h-[80px] font-mono leading-relaxed",
                                    section.content
                                      ? "hover:bg-background/40 bg-background/20 border border-border/20"
                                      : "bg-background/10 border-2 border-dashed border-border/30"
                                  )}
                                  onClick={() => setEditingId(section.id)}
                                >
                                  {section.content || (
                                    <span className="text-muted-foreground/60 italic flex items-center gap-2 justify-center h-full">
                                      <Edit2 className="w-4 h-4" />
                                      Нажмите для ввода текста...
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Tags Section */}
                              <div className="pt-2 border-t border-border/20">
                                <SectionTagSelector
                                  selectedTags={section.tags || []}
                                  onChange={(tags) => handleUpdateSectionTags(section.id, tags)}
                                  sectionName={config.label}
                                  compact={true}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border/40 bg-gradient-to-br from-muted/30 to-muted/10 p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Music2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Начните создавать текст песни</h3>
                <p className="text-sm text-muted-foreground">
                  Выберите шаблон структуры или добавьте секции вручную
                </p>
              </div>

              {/* Quick Start Templates */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Быстрый старт:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {STRUCTURE_TEMPLATES.slice(0, 4).map((template) => (
                    <Button
                      key={template.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyTemplate(template)}
                      className="gap-2 hover:border-primary/50"
                    >
                      <span className="text-base">{template.icon}</span>
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Or add manually */}
              <div className="pt-4 border-t border-border/20">
                <p className="text-xs font-medium text-muted-foreground mb-2">Или добавьте секции:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SECTION_TYPES.slice(0, 4).map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddSection(type.value as LyricSection['type'])}
                      className={cn("gap-1.5", type.color.split(' ')[0])}
                    >
                      <span>{type.icon}</span>
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Footer Info */}
      {sections.length > 0 && (
        <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-muted/20 border">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Music2 className="w-3 h-3" />
              {sections.length} {sections.length === 1 ? 'секция' : 'секций'}
            </span>
            {stats.totalChars > 0 && (
              <span className={cn(
                "font-medium",
                stats.totalChars >= 300 && stats.totalChars <= 3000
                  ? "text-emerald-500"
                  : "text-amber-500"
              )}>
                {stats.totalChars >= 300 && stats.totalChars <= 3000 && "✓ "}
                {stats.totalChars} символов
              </span>
            )}
          </div>
          <span className="text-muted-foreground/60">
            Перетащите для изменения порядка
          </span>
        </div>
      )}
    </div>
  );
}
