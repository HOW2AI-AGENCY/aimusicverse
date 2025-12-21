/**
 * SectionNotesPanel - Edit notes, tags, and references for a lyrics section
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  X, 
  Tag, 
  StickyNote, 
  Mic, 
  Upload, 
  Music2, 
  Sparkles,
  Play,
  Pause,
  Trash2,
  Check,
  Loader2,
  Wand2
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SectionNote, ReferenceAnalysis, SaveSectionNoteData } from '@/hooks/useSectionNotes';
import { AudioReferenceRecorder } from './AudioReferenceRecorder';
import { ReferenceAnalysisDisplay } from './ReferenceAnalysisDisplay';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SectionNotesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  sectionType: string;
  sectionContent: string;
  position: number;
  existingNote?: SectionNote;
  lyricsTemplateId?: string;
  onSave: (data: SaveSectionNoteData) => Promise<void>;
  onEnrichWithTags?: (tags: string[]) => void;
}

const sectionTypeLabels: Record<string, string> = {
  verse: 'Куплет',
  chorus: 'Припев',
  bridge: 'Бридж',
  intro: 'Интро',
  outro: 'Аутро',
  prechorus: 'Предприпев',
  hook: 'Хук',
  unknown: 'Секция'
};

export function SectionNotesPanel({
  open,
  onOpenChange,
  sectionId,
  sectionType,
  sectionContent,
  position,
  existingNote,
  lyricsTemplateId,
  onSave,
  onEnrichWithTags
}: SectionNotesPanelProps) {
  const [notes, setNotes] = useState(existingNote?.notes || '');
  const [tags, setTags] = useState<string[]>(existingNote?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [audioNoteUrl, setAudioNoteUrl] = useState(existingNote?.audio_note_url || '');
  const [referenceAudioUrl, setReferenceAudioUrl] = useState(existingNote?.reference_audio_url || '');
  const [referenceAnalysis, setReferenceAnalysis] = useState<ReferenceAnalysis | null>(
    existingNote?.reference_analysis || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recorderMode, setRecorderMode] = useState<'note' | 'reference'>('note');

  // Reset state when section changes
  useEffect(() => {
    setNotes(existingNote?.notes || '');
    setTags(existingNote?.tags || []);
    setAudioNoteUrl(existingNote?.audio_note_url || '');
    setReferenceAudioUrl(existingNote?.reference_audio_url || '');
    setReferenceAnalysis(existingNote?.reference_analysis || null);
  }, [existingNote, sectionId]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        section_id: sectionId,
        lyrics_template_id: lyricsTemplateId,
        section_type: sectionType,
        position,
        notes: notes || undefined,
        tags: tags.length > 0 ? tags : undefined,
        audio_note_url: audioNoteUrl || undefined,
        reference_audio_url: referenceAudioUrl || undefined,
        reference_analysis: referenceAnalysis || undefined,
      });
      toast.success('Заметка сохранена');
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordingComplete = (url: string, analysis?: ReferenceAnalysis) => {
    if (recorderMode === 'note') {
      setAudioNoteUrl(url);
    } else {
      setReferenceAudioUrl(url);
      if (analysis) {
        setReferenceAnalysis(analysis);
        // Auto-add suggested tags
        if (analysis.suggested_tags) {
          const newTags = [...new Set([...tags, ...analysis.suggested_tags])];
          setTags(newTags);
        }
      }
    }
    setShowRecorder(false);
  };

  const handleApplyTagsToLyrics = () => {
    const allTags = [
      ...tags,
      ...(referenceAnalysis?.suggested_tags || []),
      referenceAnalysis?.genre,
      referenceAnalysis?.mood,
      ...(referenceAnalysis?.instruments || [])
    ].filter(Boolean) as string[];
    
    if (allTags.length > 0) {
      onEnrichWithTags?.(allTags);
      toast.success(`Добавлено ${allTags.length} тегов`);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-primary" />
              {sectionTypeLabels[sectionType] || 'Секция'} #{position + 1}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-6 pb-4">
              {/* Section Preview */}
              <div className="p-3 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Текст секции:</p>
                <p className="text-sm whitespace-pre-wrap line-clamp-4">
                  {sectionContent || 'Пустая секция'}
                </p>
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  Заметки
                </Label>
                <Textarea
                  placeholder="Идеи, настроение, референсы..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Теги секции
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Добавить тег..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddTag} disabled={!tagInput.trim()}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="gap-1 pr-1"
                      >
                        {tag}
                        <button 
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Audio Note */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Голосовая заметка
                </Label>
                {audioNoteUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                    <audio src={audioNoteUrl} controls className="flex-1 h-8" />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setAudioNoteUrl('')}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setRecorderMode('note');
                      setShowRecorder(true);
                    }}
                  >
                    <Mic className="w-4 h-4" />
                    Записать заметку
                  </Button>
                )}
              </div>

              <Separator />

              {/* Reference Audio */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Music2 className="w-4 h-4" />
                  Референс (мелодия/вокал)
                </Label>
                
                {referenceAudioUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                      <audio src={referenceAudioUrl} controls className="flex-1 h-8" />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setReferenceAudioUrl('');
                          setReferenceAnalysis(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    
                    {referenceAnalysis && (
                      <ReferenceAnalysisDisplay analysis={referenceAnalysis} />
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        setRecorderMode('reference');
                        setShowRecorder(true);
                      }}
                    >
                      <Mic className="w-4 h-4" />
                      Записать
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        setRecorderMode('reference');
                        setShowRecorder(true);
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      Загрузить
                    </Button>
                  </div>
                )}
              </div>

              {/* Enrich with Tags button */}
              {(tags.length > 0 || referenceAnalysis) && onEnrichWithTags && (
                <>
                  <Separator />
                  <Button
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={handleApplyTagsToLyrics}
                  >
                    <Wand2 className="w-4 h-4" />
                    Применить теги к генерации
                  </Button>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Сохранить заметку
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Audio Recorder Sheet */}
      <AudioReferenceRecorder
        open={showRecorder}
        onOpenChange={setShowRecorder}
        mode={recorderMode}
        onComplete={handleRecordingComplete}
      />
    </>
  );
}
