import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Edit, Sparkles, Save, X, Music, StickyNote, CheckCircle } from 'lucide-react';
import { ProjectTrack } from '@/hooks/useProjectTracks';
import { LyricsChatAssistant } from '@/components/generate-form/LyricsChatAssistant';
import { cn } from '@/lib/utils';

interface LyricsPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: ProjectTrack | null;
  onSaveLyrics: (trackId: string, lyrics: string, lyricsStatus?: string) => void;
  onSaveNotes: (trackId: string, notes: string) => void;
  onOpenWizard: () => void;
  projectContext?: {
    projectId: string;
    projectTitle: string;
    genre?: string;
    mood?: string;
    language?: 'ru' | 'en';
    concept?: string;
  };
}

export function LyricsPreviewSheet({
  open,
  onOpenChange,
  track,
  onSaveLyrics,
  onSaveNotes,
  onOpenWizard,
  projectContext,
}: LyricsPreviewSheetProps) {
  const [activeTab, setActiveTab] = useState<'lyrics' | 'notes'>('lyrics');
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [showChatAssistant, setShowChatAssistant] = useState(false);

  // Reset state when track changes
  useEffect(() => {
    if (track) {
      setEditedLyrics(track.lyrics || '');
      setEditedNotes(track.notes || '');
      setIsEditingLyrics(false);
      setIsEditingNotes(false);
    }
  }, [track?.id]);

  if (!track) return null;

  const generatedLyrics = track.linked_track?.lyrics;
  const draftLyrics = track.lyrics || '';
  const notes = track.notes || '';
  const hasGeneratedLyrics = !!generatedLyrics;
  const hasDraftLyrics = !!draftLyrics;
  const lyricsStatus = track.lyrics_status || 'draft';

  const handleStartEditLyrics = () => {
    setEditedLyrics(draftLyrics);
    setIsEditingLyrics(true);
  };

  const handleSaveLyrics = () => {
    onSaveLyrics(track.id, editedLyrics, 'draft');
    setIsEditingLyrics(false);
  };

  const handleApproveLyrics = () => {
    onSaveLyrics(track.id, editedLyrics || draftLyrics, 'approved');
    setIsEditingLyrics(false);
  };

  const handleStartEditNotes = () => {
    setEditedNotes(notes);
    setIsEditingNotes(true);
  };

  const handleSaveNotes = () => {
    onSaveNotes(track.id, editedNotes);
    setIsEditingNotes(false);
  };

  const handleLyricsGenerated = (lyrics: string) => {
    onSaveLyrics(track.id, lyrics, 'generated');
    setShowChatAssistant(false);
  };

  // Clean lyrics from Suno structural tags for display
  const cleanLyrics = (text: string) => {
    return text.replace(/\[.*?\]/g, '').trim();
  };

  const getLyricsStatusBadge = () => {
    const config = {
      draft: { label: 'Черновик', variant: 'secondary' as const },
      prompt: { label: 'Промпт', variant: 'outline' as const },
      generated: { label: 'AI', variant: 'default' as const },
      approved: { label: 'Готово', variant: 'default' as const },
    };
    const c = config[lyricsStatus as keyof typeof config] || config.draft;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {track.title}
            </SheetTitle>
            <SheetDescription className="flex items-center gap-2">
              {track.style_prompt && (
                <span className="truncate">{track.style_prompt}</span>
              )}
              {getLyricsStatusBadge()}
            </SheetDescription>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col h-[calc(100%-80px)]">
            <TabsList className="w-full grid grid-cols-2 shrink-0">
              <TabsTrigger value="lyrics" className="gap-1.5">
                <FileText className="w-4 h-4" />
                Лирика
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5">
                <StickyNote className="w-4 h-4" />
                Заметки
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lyrics" className="flex-1 overflow-hidden mt-3">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {/* Generated Lyrics Section */}
                  {hasGeneratedLyrics && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="gap-1">
                          <Music className="w-3 h-3" />
                          Сгенерированная лирика
                        </Badge>
                      </div>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {cleanLyrics(generatedLyrics)}
                        </p>
                      </div>
                    </div>
                  )}

                  {hasGeneratedLyrics && hasDraftLyrics && <Separator />}

                  {/* Draft/Working Lyrics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="gap-1">
                        <Edit className="w-3 h-3" />
                        {hasGeneratedLyrics ? 'Исходный текст' : 'Текст песни'}
                      </Badge>
                      {!isEditingLyrics && hasDraftLyrics && lyricsStatus !== 'approved' && (
                        <Button size="sm" variant="ghost" onClick={handleApproveLyrics} className="gap-1 text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Одобрить
                        </Button>
                      )}
                    </div>

                    {!isEditingLyrics && (
                      <div className="flex gap-2 mb-2">
                        <Button size="sm" variant="outline" onClick={handleStartEditLyrics} className="gap-1">
                          <Edit className="w-3.5 h-3.5" />
                          {hasDraftLyrics ? 'Редактировать' : 'Написать'}
                        </Button>
                        <Button size="sm" onClick={() => setShowChatAssistant(true)} className="gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Помощник
                        </Button>
                      </div>
                    )}

                    {isEditingLyrics ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editedLyrics}
                          onChange={(e) => setEditedLyrics(e.target.value)}
                          placeholder="Введите полный текст песни с куплетами, припевами..."
                          className="min-h-[300px] text-sm"
                        />
                        <div className="flex gap-2 justify-between items-center">
                          <span className={cn(
                            "text-xs",
                            editedLyrics.length < 50 ? "text-muted-foreground" : "text-green-500"
                          )}>
                            {editedLyrics.length} символов
                          </span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setIsEditingLyrics(false)}>
                              <X className="w-3.5 h-3.5 mr-1" />
                              Отмена
                            </Button>
                            <Button size="sm" onClick={handleSaveLyrics}>
                              <Save className="w-3.5 h-3.5 mr-1" />
                              Сохранить
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : hasDraftLyrics ? (
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {draftLyrics}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-muted/20 rounded-lg p-8 text-center">
                        <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">
                          Текст песни ещё не написан
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-hidden mt-3">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="gap-1">
                      <StickyNote className="w-3 h-3" />
                      Заметки
                    </Badge>
                  </div>

                  {!isEditingNotes && (
                    <Button size="sm" variant="outline" onClick={handleStartEditNotes} className="gap-1 mb-2">
                      <Edit className="w-3.5 h-3.5" />
                      {notes ? 'Редактировать' : 'Добавить заметку'}
                    </Button>
                  )}

                  {isEditingNotes ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="Идеи, комментарии, референсы, пожелания к продакшену..."
                        className="min-h-[200px] text-sm"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(false)}>
                          <X className="w-3.5 h-3.5 mr-1" />
                          Отмена
                        </Button>
                        <Button size="sm" onClick={handleSaveNotes}>
                          <Save className="w-3.5 h-3.5 mr-1" />
                          Сохранить
                        </Button>
                      </div>
                    </div>
                  ) : notes ? (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {notes}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-muted/20 rounded-lg p-8 text-center">
                      <StickyNote className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        Нет заметок
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Chat-based AI Assistant with project context */}
      <LyricsChatAssistant
        open={showChatAssistant}
        onOpenChange={setShowChatAssistant}
        onLyricsGenerated={handleLyricsGenerated}
        initialGenre={projectContext?.genre}
        initialMood={projectContext?.mood ? [projectContext.mood] : undefined}
        initialLanguage={projectContext?.language}
        projectContext={projectContext ? {
          projectId: projectContext.projectId,
          projectTitle: projectContext.projectTitle,
          genre: projectContext.genre,
          mood: projectContext.mood,
          language: projectContext.language,
          concept: projectContext.concept,
        } : undefined}
        trackContext={{
          position: track.position,
          title: track.title,
          stylePrompt: track.style_prompt || undefined,
          draftLyrics: track.lyrics || undefined,
          generatedLyrics: track.linked_track?.lyrics || undefined,
          recommendedTags: track.recommended_tags || undefined,
          recommendedStructure: track.recommended_structure || undefined,
        }}
      />
    </>
  );
}
