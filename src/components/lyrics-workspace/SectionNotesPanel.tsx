/**
 * SectionNotesPanel - Edit notes, tags, and references for a lyrics section
 * Professional mobile-first design with refined UI/UX
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
  Wand2,
  Cloud,
  Guitar,
  ChevronRight,
  FileText,
  Volume2,
  Headphones
} from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SectionNote, ReferenceAnalysis, SaveSectionNoteData } from '@/hooks/useSectionNotes';
import { AudioReferenceRecorder, RecordingType } from './AudioReferenceRecorder';
import { CloudAudioPicker } from './CloudAudioPicker';
import { ReferenceAnalysisDisplay } from './ReferenceAnalysisDisplay';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';

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
  breakdown: 'Брейкдаун',
  unknown: 'Секция'
};

const sectionTypeColors: Record<string, string> = {
  verse: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  chorus: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  bridge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  intro: 'bg-green-500/20 text-green-400 border-green-500/30',
  outro: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  prechorus: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  hook: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  breakdown: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  unknown: 'bg-muted text-muted-foreground'
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
  const [recordingType, setRecordingType] = useState<RecordingType>('vocal');
  const [showCloudPicker, setShowCloudPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'audio' | 'tags'>('notes');

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
      hapticImpact('light');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
    hapticImpact('light');
  };

  const handleSave = async () => {
    setIsSaving(true);
    hapticImpact('medium');
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
        if (analysis.suggested_tags) {
          const newTags = [...new Set([...tags, ...analysis.suggested_tags])];
          setTags(newTags);
        }
      }
    }
    setShowRecorder(false);
  };

  const handleCloudSelect = (audio: { file_url: string; genre?: string | null; mood?: string | null; bpm?: number | null; instruments?: string[] | null }) => {
    setReferenceAudioUrl(audio.file_url);
    if (audio.genre || audio.mood || audio.bpm || audio.instruments) {
      setReferenceAnalysis({
        genre: audio.genre || undefined,
        mood: audio.mood || undefined,
        bpm: audio.bpm || undefined,
        instruments: audio.instruments || undefined,
      });
    }
    setShowCloudPicker(false);
    toast.success('Референс выбран из облака');
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
      hapticImpact('medium');
    }
  };

  const openRecorder = (mode: 'note' | 'reference', type: RecordingType) => {
    setRecorderMode(mode);
    setRecordingType(type);
    setShowRecorder(true);
    hapticImpact('light');
  };

  const hasContent = notes || tags.length > 0 || audioNoteUrl || referenceAudioUrl;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          {/* Header */}
          <DrawerHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className={cn(
                  "p-2.5 rounded-xl border",
                  sectionTypeColors[sectionType] || sectionTypeColors.unknown
                )}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <FileText className="w-5 h-5" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <DrawerTitle className="text-lg font-semibold">
                  {sectionTypeLabels[sectionType] || 'Секция'} #{position + 1}
                </DrawerTitle>
                <DrawerDescription className="text-xs line-clamp-1 mt-0.5">
                  {sectionContent ? sectionContent.substring(0, 60) + '...' : 'Пустая секция'}
                </DrawerDescription>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-4">
              {[
                { id: 'notes' as const, icon: StickyNote, label: 'Заметки' },
                { id: 'audio' as const, icon: Headphones, label: 'Аудио' },
                { id: 'tags' as const, icon: Tag, label: 'Теги', count: tags.length },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    hapticImpact('light');
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                  whileTap={{ scale: 0.97 }}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      activeTab === tab.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/20 text-primary"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </DrawerHeader>

          {/* Content */}
          <ScrollArea className="flex-1 px-4 py-4" style={{ maxHeight: 'calc(92vh - 220px)' }}>
            <AnimatePresence mode="wait">
              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {/* Section Preview Card */}
                  <div className="p-4 bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          sectionTypeColors[sectionType] || sectionTypeColors.unknown
                        )}
                      >
                        {sectionTypeLabels[sectionType]}
                      </Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap line-clamp-4 text-foreground/80">
                      {sectionContent || 'Добавьте текст в секцию...'}
                    </p>
                  </div>

                  {/* Notes Input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <StickyNote className="w-4 h-4 text-primary" />
                      Заметки и идеи
                    </Label>
                    <Textarea
                      placeholder="Настроение, отсылки, идеи для исполнения..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[120px] resize-none rounded-xl bg-muted/30 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </motion.div>
              )}

              {/* Audio Tab */}
              {activeTab === 'audio' && (
                <motion.div
                  key="audio"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-5"
                >
                  {/* Voice Note Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Mic className="w-4 h-4 text-primary" />
                      Голосовая заметка
                    </Label>
                    
                    {audioNoteUrl ? (
                      <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-xl bg-primary/20">
                            <Volume2 className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium flex-1">Голосовая заметка</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setAudioNoteUrl('');
                              hapticImpact('light');
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <audio src={audioNoteUrl} controls className="w-full h-10 rounded-lg" />
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-14 gap-3 rounded-xl border-dashed border-2 hover:border-primary/50 hover:bg-primary/5"
                        onClick={() => openRecorder('note', 'vocal')}
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Mic className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">Записать заметку</span>
                      </Button>
                    )}
                  </div>

                  {/* Reference Audio Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Music2 className="w-4 h-4 text-primary" />
                      Референс-аудио
                    </Label>
                    
                    {referenceAudioUrl ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-2xl border border-amber-500/20">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-xl bg-amber-500/20">
                              <Headphones className="w-4 h-4 text-amber-500" />
                            </div>
                            <span className="text-sm font-medium flex-1">Референс</span>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setReferenceAudioUrl('');
                                setReferenceAnalysis(null);
                                hapticImpact('light');
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <audio src={referenceAudioUrl} controls className="w-full h-10 rounded-lg" />
                        </div>
                        
                        {referenceAnalysis && (
                          <ReferenceAnalysisDisplay analysis={referenceAnalysis} />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Recording Options */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="h-16 flex-col gap-1.5 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5"
                            onClick={() => openRecorder('reference', 'vocal')}
                          >
                            <div className="p-1.5 rounded-lg bg-primary/10">
                              <Mic className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-xs font-medium">Вокал</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-16 flex-col gap-1.5 rounded-xl border-2 hover:border-amber-500/50 hover:bg-amber-500/5"
                            onClick={() => openRecorder('reference', 'guitar')}
                          >
                            <div className="p-1.5 rounded-lg bg-amber-500/10">
                              <Guitar className="w-4 h-4 text-amber-500" />
                            </div>
                            <span className="text-xs font-medium">Гитара</span>
                          </Button>
                        </div>
                        
                        {/* Additional Options */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="secondary"
                            className="h-12 gap-2 rounded-xl"
                            onClick={() => openRecorder('reference', 'vocal')}
                          >
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">Файл</span>
                          </Button>
                          <Button
                            variant="secondary"
                            className="h-12 gap-2 rounded-xl"
                            onClick={() => {
                              setShowCloudPicker(true);
                              hapticImpact('light');
                            }}
                          >
                            <Cloud className="w-4 h-4" />
                            <span className="text-sm">Облако</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Tags Tab */}
              {activeTab === 'tags' && (
                <motion.div
                  key="tags"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {/* Tag Input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                      Теги секции
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Добавить тег..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 rounded-xl bg-muted/30 border-border/50"
                      />
                      <Button 
                        size="icon" 
                        onClick={handleAddTag} 
                        disabled={!tagInput.trim()}
                        className="rounded-xl h-10 w-10"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tags Display */}
                  {tags.length > 0 ? (
                    <div className="p-4 bg-muted/30 rounded-2xl">
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <motion.div
                            key={tag}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                          >
                            <Badge 
                              variant="secondary" 
                              className="gap-1.5 pr-1.5 py-1.5 text-sm rounded-lg"
                            >
                              {tag}
                              <button 
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="inline-flex p-4 rounded-2xl bg-muted/30 mb-3">
                        <Tag className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Добавьте теги для секции
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Теги помогут AI при генерации музыки
                      </p>
                    </div>
                  )}

                  {/* Analysis Tags */}
                  {referenceAnalysis?.suggested_tags && referenceAnalysis.suggested_tags.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Теги из анализа</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {referenceAnalysis.suggested_tags.map(tag => (
                          <Badge key={tag} className="text-xs rounded-lg">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Apply Tags Button */}
                  {(tags.length > 0 || referenceAnalysis) && onEnrichWithTags && (
                    <Button
                      variant="secondary"
                      className="w-full h-12 gap-2 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20"
                      onClick={handleApplyTagsToLyrics}
                    >
                      <Wand2 className="w-4 h-4 text-primary" />
                      <span className="font-medium">Применить к генерации</span>
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 gap-2 rounded-xl text-base font-semibold"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Audio Recorder Sheet */}
      <AudioReferenceRecorder
        open={showRecorder}
        onOpenChange={setShowRecorder}
        mode={recorderMode}
        onComplete={handleRecordingComplete}
        defaultRecordingType={recordingType}
      />

      {/* Cloud Audio Picker */}
      <CloudAudioPicker
        open={showCloudPicker}
        onOpenChange={setShowCloudPicker}
        onSelect={handleCloudSelect}
      />
    </>
  );
}
