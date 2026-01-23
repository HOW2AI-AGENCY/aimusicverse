/**
 * Lyrics Workspace
 * 
 * Visual section editor for lyrics with notes, tags, 
 * audio recordings, and reference audio per section.
 * Optimized for mobile with larger touch targets and swipe actions.
 * 
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Plus, 
  GripVertical, 
  Music2, 
  Mic, 
  FileAudio, 
  MessageSquare,
  ChevronRight,
  Trash2,
  Play,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EditableLyricsContent } from './EditableLyricsContent';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { useIsMobile } from '@/hooks/use-mobile';
import { TagBadge } from '@/components/lyrics/shared/TagBadge';
import { SectionTagSelector } from '@/components/lyrics/shared/SectionTagSelector';
import { sectionColors } from '@/lib/design-colors';

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
  { value: 'verse', label: 'Куплет', color: sectionColors.verse.dot },
  { value: 'chorus', label: 'Припев', color: sectionColors.chorus.dot },
  { value: 'bridge', label: 'Бридж', color: sectionColors.bridge.dot },
  { value: 'intro', label: 'Интро', color: sectionColors.intro.dot },
  { value: 'outro', label: 'Аутро', color: sectionColors.outro.dot },
  { value: 'hook', label: 'Хук', color: sectionColors.hook.dot },
  { value: 'prechorus', label: 'Пре-припев', color: sectionColors['pre-chorus'].dot },
  { value: 'breakdown', label: 'Брейкдаун', color: sectionColors.breakdown.dot },
] as const;

interface LyricsWorkspaceProps {
  sections: LyricsSection[];
  onChange: (sections: LyricsSection[]) => void;
  onSave?: () => void;
  isSaving?: boolean;
  hideSaveButton?: boolean;
  onSectionSelect?: (section: LyricsSection | null) => void;
}

export function LyricsWorkspace({ 
  sections, 
  onChange, 
  onSave, 
  isSaving, 
  hideSaveButton = false,
  onSectionSelect 
}: LyricsWorkspaceProps) {
  const isMobile = useIsMobile();
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
    onSectionSelect?.(section);
  }, [onSectionSelect]);

  const updateSectionTags = useCallback((id: string, tags: string[]) => {
    updateSection(id, { tags });
  }, [updateSection]);

  const getSectionTypeInfo = (type: string) => 
    SECTION_TYPES.find(t => t.value === type) || SECTION_TYPES[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header - Hidden when embedded in LyricsStudio */}
      {!hideSaveButton && (
        <div className={cn(
          "flex items-center justify-between border-b border-border/50",
          isMobile ? "p-3" : "p-4"
        )}>
          <h2 className={cn(
            "font-semibold flex items-center gap-2",
            isMobile ? "text-base" : "text-lg"
          )}>
            <Music2 className="w-5 h-5 text-primary" />
            Редактор лирики
          </h2>
          {onSave && (
            <Button onClick={onSave} disabled={isSaving} size="sm">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          )}
        </div>
      )}

      {/* Sections list */}
      <ScrollArea className={cn("flex-1", isMobile ? "p-3" : "p-4")}>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sections.map((section, index) => {
              const typeInfo = getSectionTypeInfo(section.type);
              const hasNotes = section.notes || section.audioNoteUrl || section.referenceAudioUrl;

              return (
                <motion.div
                  key={section.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group"
                >
                  <Card className="border-border/50 hover:border-primary/30 transition-colors overflow-hidden">
                    <div className="flex gap-3 p-3">
                      {/* Drag handle */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                        <span className="text-xs text-muted-foreground">{index + 1}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Section type badge + Add tag button */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", typeInfo.color, "text-white border-0")}
                          >
                            {typeInfo.label}
                          </Badge>
                          
                          {/* Add tag button */}
                          <SectionTagSelector
                            selectedTags={section.tags || []}
                            onTagsChange={(tags) => updateSectionTags(section.id, tags)}
                          />

                          {hasNotes && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Заметки
                            </Badge>
                          )}
                        </div>

                        {/* Lyrics content - inline editable */}
                        <EditableLyricsContent
                          value={section.content}
                          onChange={(content) => updateSection(section.id, { content })}
                          placeholder="Нажмите, чтобы ввести текст..."
                        />

                        {/* Tags display with icons */}
                        {section.tags && section.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {section.tags.map(tag => (
                              <TagBadge
                                key={tag}
                                tag={tag}
                                onRemove={() => {
                                  updateSectionTags(
                                    section.id, 
                                    section.tags?.filter(t => t !== tag) || []
                                  );
                                }}
                              />
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

              {/* Tags with selector */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  Теги стиля
                  <SectionTagSelector
                    selectedTags={selectedSection.tags || []}
                    onTagsChange={(tags) => updateSection(selectedSection.id, { tags })}
                    trigger={
                      <Button variant="outline" size="sm" className="h-6 text-xs gap-1">
                        <Plus className="w-3 h-3" />
                        Добавить
                      </Button>
                    }
                  />
                </label>
                
                {selectedSection.tags && selectedSection.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSection.tags.map(tag => (
                      <TagBadge
                        key={tag}
                        tag={tag}
                        size="md"
                        onRemove={() => {
                          updateSection(selectedSection.id, {
                            tags: selectedSection.tags?.filter(t => t !== tag) || []
                          });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Нажмите "Добавить" для выбора тегов
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  Теги применяются в формате [Tag] к секции
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
