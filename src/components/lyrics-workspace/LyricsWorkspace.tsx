/**
 * Lyrics Workspace
 * 
 * Visual section editor for lyrics with notes, tags, 
 * audio recordings, and reference audio per section.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Plus, 
  GripVertical, 
  Music2, 
  Mic, 
  FileAudio, 
  Tag, 
  MessageSquare,
  ChevronRight,
  Trash2,
  Play,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

export interface LyricsSection {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'hook' | 'prechorus' | 'breakdown';
  content: string;
  notes?: string;
  tags?: string[];
  audioNoteUrl?: string;
  referenceAudioUrl?: string;
  referenceAnalysis?: {
    bpm?: number;
    key?: string;
    mood?: string;
  };
}

const SECTION_TYPES = [
  { value: 'verse', label: 'Куплет', color: 'bg-blue-500' },
  { value: 'chorus', label: 'Припев', color: 'bg-purple-500' },
  { value: 'bridge', label: 'Бридж', color: 'bg-amber-500' },
  { value: 'intro', label: 'Интро', color: 'bg-green-500' },
  { value: 'outro', label: 'Аутро', color: 'bg-red-500' },
  { value: 'hook', label: 'Хук', color: 'bg-pink-500' },
  { value: 'prechorus', label: 'Пре-припев', color: 'bg-indigo-500' },
  { value: 'breakdown', label: 'Брейкдаун', color: 'bg-orange-500' },
] as const;

interface LyricsWorkspaceProps {
  sections: LyricsSection[];
  onChange: (sections: LyricsSection[]) => void;
  onSave?: () => void;
  isSaving?: boolean;
  hideSaveButton?: boolean;
}

export function LyricsWorkspace({ sections, onChange, onSave, isSaving, hideSaveButton = false }: LyricsWorkspaceProps) {
  const [selectedSection, setSelectedSection] = useState<LyricsSection | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const addSection = useCallback((type: LyricsSection['type'] = 'verse') => {
    hapticImpact('light');
    const newSection: LyricsSection = {
      id: `${type}-${Date.now()}`,
      type,
      content: '',
      tags: [],
    };
    onChange([...sections, newSection]);
  }, [sections, onChange]);

  const updateSection = useCallback((id: string, updates: Partial<LyricsSection>) => {
    onChange(sections.map(s => s.id === id ? { ...s, ...updates } : s));
    if (selectedSection?.id === id) {
      setSelectedSection(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [sections, onChange, selectedSection]);

  const deleteSection = useCallback((id: string) => {
    hapticImpact('medium');
    onChange(sections.filter(s => s.id !== id));
    if (selectedSection?.id === id) {
      setSelectedSection(null);
      setDetailsOpen(false);
    }
  }, [sections, onChange, selectedSection]);

  const openDetails = useCallback((section: LyricsSection) => {
    hapticImpact('light');
    setSelectedSection(section);
    setDetailsOpen(true);
  }, []);

  const getSectionTypeInfo = (type: string) => 
    SECTION_TYPES.find(t => t.value === type) || SECTION_TYPES[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Music2 className="w-5 h-5 text-primary" />
          Редактор лирики
        </h2>
        {onSave && !hideSaveButton && (
          <Button onClick={onSave} disabled={isSaving} size="sm">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        )}
      </div>

      {/* Sections list */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sections.map((section, index) => {
              const typeInfo = getSectionTypeInfo(section.type);
              const hasNotes = section.notes || section.tags?.length || section.audioNoteUrl || section.referenceAudioUrl;

              return (
                <motion.div
                  key={section.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group"
                >
                  <Card className="p-3 border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex gap-3">
                      {/* Drag handle */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                        <span className="text-xs text-muted-foreground">{index + 1}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Section type badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", typeInfo.color, "text-white border-0")}
                          >
                            {typeInfo.label}
                          </Badge>
                          {hasNotes && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Заметки
                            </Badge>
                          )}
                        </div>

                        {/* Lyrics textarea */}
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(section.id, { content: e.target.value })}
                          placeholder="Введите текст секции..."
                          className="min-h-[80px] resize-none text-sm"
                        />

                        {/* Tags preview */}
                        {section.tags && section.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {section.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDetails(section)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive/70 hover:text-destructive"
                          onClick={() => deleteSection(section.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Add section buttons */}
          <div className="pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-2">Добавить секцию:</p>
            <div className="flex flex-wrap gap-2">
              {SECTION_TYPES.slice(0, 4).map(type => (
                <Button
                  key={type.value}
                  variant="outline"
                  size="sm"
                  onClick={() => addSection(type.value as LyricsSection['type'])}
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Section details sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedSection && (
                <Badge className={cn(getSectionTypeInfo(selectedSection.type).color, "text-white border-0")}>
                  {getSectionTypeInfo(selectedSection.type).label}
                </Badge>
              )}
              Детали секции
            </SheetTitle>
          </SheetHeader>

          {selectedSection && (
            <div className="mt-6 space-y-6">
              {/* Notes */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Заметки
                </label>
                <Textarea
                  value={selectedSection.notes || ''}
                  onChange={(e) => updateSection(selectedSection.id, { notes: e.target.value })}
                  placeholder="Заметки о секции, идеи, настроение..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4" />
                  Теги стиля
                </label>
                <Input
                  value={selectedSection.tags?.join(', ') || ''}
                  onChange={(e) => updateSection(selectedSection.id, { 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="energetic, female vocal, piano..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Теги через запятую для точной генерации
                </p>
              </div>

              {/* Audio note */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Mic className="w-4 h-4" />
                  Аудио-заметка
                </label>
                <Button variant="outline" className="w-full gap-2">
                  <Mic className="w-4 h-4" />
                  Записать заметку
                </Button>
                {selectedSection.audioNoteUrl && (
                  <div className="mt-2 p-2 bg-muted rounded-lg flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    <span className="text-sm">Аудио-заметка</span>
                  </div>
                )}
              </div>

              {/* Reference audio */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <FileAudio className="w-4 h-4" />
                  Референс мелодии
                </label>
                <Button variant="outline" className="w-full gap-2">
                  <FileAudio className="w-4 h-4" />
                  Загрузить референс
                </Button>
                {selectedSection.referenceAnalysis && (
                  <div className="mt-2 p-3 bg-muted rounded-lg space-y-1">
                    {selectedSection.referenceAnalysis.bpm && (
                      <div className="text-sm">BPM: {selectedSection.referenceAnalysis.bpm}</div>
                    )}
                    {selectedSection.referenceAnalysis.key && (
                      <div className="text-sm">Тональность: {selectedSection.referenceAnalysis.key}</div>
                    )}
                    {selectedSection.referenceAnalysis.mood && (
                      <div className="text-sm">Настроение: {selectedSection.referenceAnalysis.mood}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
