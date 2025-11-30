import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, Plus, Trash2, Edit2, Check, X, 
  Sparkles, Music2 
} from 'lucide-react';
import { toast } from 'sonner';

interface LyricSection {
  id: string;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'hook' | 'pre';
  content: string;
}

interface LyricsVisualEditorProps {
  value: string;
  onChange: (value: string) => void;
  onAIGenerate?: () => void;
}

const SECTION_TYPES = [
  { value: 'intro', label: 'Вступление', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'verse', label: 'Куплет', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'chorus', label: 'Припев', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'bridge', label: 'Бридж', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'hook', label: 'Хук', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { value: 'pre', label: 'Пре-припев', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'outro', label: 'Концовка', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
] as const;

export function LyricsVisualEditor({ value, onChange, onAIGenerate }: LyricsVisualEditorProps) {
  const [sections, setSections] = useState<LyricSection[]>(() => parseLyrics(value));
  const [editingId, setEditingId] = useState<string | null>(null);

  function parseLyrics(text: string): LyricSection[] {
    if (!text.trim()) return [];

    const parsed: LyricSection[] = [];
    const lines = text.split('\n');
    let currentSection: LyricSection | null = null;
    let sectionCounter = { verse: 0, chorus: 0 };

    for (const line of lines) {
      const match = line.match(/\[(\w+)(?:\s+\d+)?\]/i);
      
      if (match) {
        if (currentSection) {
          parsed.push(currentSection);
        }
        
        const type = match[1].toLowerCase() as LyricSection['type'];
        const validType = SECTION_TYPES.find(t => t.value === type) ? type : 'verse';
        
        if (validType === 'verse' || validType === 'chorus') {
          sectionCounter[validType]++;
        }
        
        currentSection = {
          id: `${validType}-${Date.now()}-${Math.random()}`,
          type: validType,
          content: '',
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

  function sectionsToLyrics(sections: LyricSection[]): string {
    return sections.map(section => {
      const label = SECTION_TYPES.find(t => t.value === section.type)?.label || section.type;
      return `[${label}]\n${section.content}`;
    }).join('\n\n');
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setSections(items);
    onChange(sectionsToLyrics(items));
  };

  const handleAddSection = (type: LyricSection['type']) => {
    const newSection: LyricSection = {
      id: `${type}-${Date.now()}`,
      type,
      content: '',
    };
    const updated = [...sections, newSection];
    setSections(updated);
    setEditingId(newSection.id);
    toast.success('Секция добавлена');
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
    onChange(sectionsToLyrics(updated));
  };

  const handleSaveEdit = (id: string) => {
    setEditingId(null);
    onChange(sectionsToLyrics(sections));
  };

  const getSectionColor = (type: string) => {
    return SECTION_TYPES.find(t => t.value === type)?.color || 'bg-gray-500/20 text-gray-400';
  };

  const getSectionLabel = (type: string) => {
    return SECTION_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-4">
      {/* Header with AI button */}
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">Визуальный редактор</Label>
        {onAIGenerate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAIGenerate}
            className="gap-2"
          >
            <Sparkles className="w-3 h-3" />
            AI Generate
          </Button>
        )}
      </div>

      {/* Add Section Buttons */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Добавить секцию
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SECTION_TYPES.map((type) => (
              <Button
                key={type.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddSection(type.value as LyricSection['type'])}
                className={`${getSectionColor(type.value)} border-2`}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sections List */}
      {sections.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="lyrics-sections">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {sections.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`glass-card border-2 transition-all ${
                          snapshot.isDragging 
                            ? 'shadow-lg scale-105 border-primary' 
                            : 'border-border/50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                            </div>

                            <div className="flex-1 space-y-2">
                              {/* Section Header */}
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant="outline"
                                  className={`${getSectionColor(section.type)} border-2`}
                                >
                                  {getSectionLabel(section.type)}
                                </Badge>
                                
                                <div className="flex gap-1">
                                  {editingId === section.id ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleSaveEdit(section.id)}
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => setEditingId(section.id)}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => handleDeleteSection(section.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Content */}
                              {editingId === section.id ? (
                                <Textarea
                                  value={section.content}
                                  onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                                  placeholder="Введите текст..."
                                  rows={4}
                                  className="resize-none text-sm"
                                  autoFocus
                                />
                              ) : (
                                <div 
                                  className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-secondary/50 p-2 rounded-md transition-colors"
                                  onClick={() => setEditingId(section.id)}
                                >
                                  {section.content || (
                                    <span className="text-muted-foreground italic">
                                      Нажмите для редактирования...
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <Card className="glass-card border-primary/20 border-dashed">
          <CardContent className="p-12 text-center">
            <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              Добавьте первую секцию лирики
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
