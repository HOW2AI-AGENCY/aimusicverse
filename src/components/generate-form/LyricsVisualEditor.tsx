import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GripVertical, Plus, Trash2, Edit2, Check, 
  Sparkles, Music2, ChevronDown, Mic, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { SectionTagSelector } from './SectionTagSelector';
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
  { value: 'intro', label: 'Вступление', icon: '🎬', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { value: 'verse', label: 'Куплет', icon: '📝', color: 'bg-sky-500/20 text-sky-400 border-sky-500/40' },
  { value: 'pre', label: 'Пре-припев', icon: '⬆️', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { value: 'chorus', label: 'Припев', icon: '🎵', color: 'bg-violet-500/20 text-violet-400 border-violet-500/40' },
  { value: 'hook', label: 'Хук', icon: '🎤', color: 'bg-pink-500/20 text-pink-400 border-pink-500/40' },
  { value: 'bridge', label: 'Бридж', icon: '🌉', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  { value: 'drop', label: 'Дроп', icon: '💥', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
  { value: 'breakdown', label: 'Брейкдаун', icon: '🔊', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  { value: 'outro', label: 'Концовка', icon: '🔚', color: 'bg-slate-500/20 text-slate-400 border-slate-500/40' },
] as const;

// Helper function to parse lyrics text into sections
function parseLyrics(text: string): LyricSection[] {
  if (!text.trim()) return [];

  const parsed: LyricSection[] = [];
  const lines = text.split('\n');
  let currentSection: LyricSection | null = null;

  for (const line of lines) {
    const match = line.match(/\[(\w+)(?:\s+\d+)?\]/i);
    
    if (match) {
      if (currentSection) {
        parsed.push(currentSection);
      }
      
      const type = match[1].toLowerCase() as LyricSection['type'];
      const validType = SECTION_TYPES.find(t => t.value === type) ? type : 'verse';
      
      currentSection = {
        id: `${validType}-${Date.now()}-${Math.random()}`,
        type: validType,
        content: '',
        tags: [],
      };
    } else if (currentSection && line.trim()) {
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
    const label = SECTION_TYPES.find(t => t.value === section.type)?.label || section.type;
    return `[${label}]\n${section.content}`;
  }).join('\n\n');
}

export function LyricsVisualEditor({ value, onChange, onAIGenerate }: LyricsVisualEditorProps) {
  const [sections, setSections] = useState<LyricSection[]>(() => parseLyrics(value));
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sync sections when value changes externally
  useEffect(() => {
    const parsed = parseLyrics(value);
    if (JSON.stringify(parsed) !== JSON.stringify(sections)) {
      setSections(parsed);
    }
  }, [value]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setSections(items);
    onChange(sectionsToLyrics(items));
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
  };

  const handleDeleteSection = (id: string) => {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    onChange(sectionsToLyrics(updated));
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

  const getSectionConfig = (type: string) => {
    return SECTION_TYPES.find(t => t.value === type) || SECTION_TYPES[1];
  };

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 h-9"
            >
              <Plus className="w-4 h-4" />
              Добавить
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {SECTION_TYPES.map((type) => (
              <DropdownMenuItem
                key={type.value}
                onClick={() => handleAddSection(type.value as LyricSection['type'])}
                className="gap-2"
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
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

      {/* Sections List */}
      <ScrollArea className="max-h-[400px]">
        {sections.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="lyrics-sections">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2 pr-2"
                >
                  {sections.map((section, index) => {
                    const config = getSectionConfig(section.type);
                    const isEditing = editingId === section.id;
                    
                    return (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "rounded-lg border-2 bg-card/50 backdrop-blur-sm transition-all",
                              snapshot.isDragging 
                                ? 'shadow-lg scale-[1.02] border-primary' 
                                : 'border-border/30 hover:border-border/50',
                              config.color.split(' ')[0] // Use the bg color
                            )}
                          >
                            {/* Section Header */}
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing touch-none"
                              >
                                <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                              </div>

                              <Badge 
                                variant="outline"
                                className={cn("border-2 text-xs font-medium", config.color)}
                              >
                                <span className="mr-1">{config.icon}</span>
                                {config.label}
                              </Badge>
                              
                              <div className="flex-1" />

                              <div className="flex items-center gap-1">
                                {isEditing ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-primary"
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
                                      className="h-7 w-7"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => setEditingId(section.id)}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteSection(section.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-3 space-y-2">
                              {isEditing ? (
                                <Textarea
                                  value={section.content}
                                  onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                                  placeholder="Введите текст секции..."
                                  rows={4}
                                  className="resize-none text-sm bg-background/50 border-border/30"
                                  autoFocus
                                  onBlur={() => handleSaveEdit(section.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      handleSaveEdit(section.id);
                                    }
                                  }}
                                />
                              ) : (
                                <div 
                                  className={cn(
                                    "text-sm whitespace-pre-wrap cursor-pointer rounded-md p-2 transition-colors min-h-[60px]",
                                    section.content 
                                      ? "hover:bg-background/30" 
                                      : "bg-background/20"
                                  )}
                                  onClick={() => setEditingId(section.id)}
                                >
                                  {section.content || (
                                    <span className="text-muted-foreground/60 italic flex items-center gap-2">
                                      <Edit2 className="w-3 h-3" />
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
          <div className="rounded-xl border-2 border-dashed border-border/30 bg-muted/20 p-8 text-center">
            <Music2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Начните создавать текст песни
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SECTION_TYPES.slice(0, 4).map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSection(type.value as LyricSection['type'])}
                  className={cn("gap-1 text-xs", type.color)}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Section count indicator */}
      {sections.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>{sections.length} {sections.length === 1 ? 'секция' : 'секций'}</span>
          <span className="text-muted-foreground/60">
            Перетащите для изменения порядка
          </span>
        </div>
      )}
    </div>
  );
}
