import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Edit, Sparkles, Save, X, Music } from 'lucide-react';
import { ProjectTrack } from '@/hooks/useProjectTracks';
import { LyricsChatAssistant, type ProjectContext } from '@/components/generate-form/LyricsChatAssistant';

interface LyricsPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: ProjectTrack | null;
  projectName?: string;
  projectGenre?: string | null;
  projectMood?: string | null;
  projectLanguage?: string | null;
  onSave: (trackId: string, lyrics: string) => void;
  onOpenWizard: () => void;
}

export function LyricsPreviewSheet({
  open,
  onOpenChange,
  track,
  projectName,
  projectGenre,
  projectMood,
  projectLanguage,
  onSave,
  onOpenWizard,
}: LyricsPreviewSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState('');
  const [showChatAssistant, setShowChatAssistant] = useState(false);

  if (!track) return null;

  const generatedLyrics = track.linked_track?.lyrics;
  const draftLyrics = track.notes;
  const hasGeneratedLyrics = !!generatedLyrics;

  const handleStartEdit = () => {
    setEditedLyrics(draftLyrics || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(track.id, editedLyrics);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedLyrics('');
  };

  const handleLyricsGenerated = (lyrics: string) => {
    onSave(track.id, lyrics);
    setShowChatAssistant(false);
  };

  // Build project context for AI assistant
  const projectContext: ProjectContext | undefined = track.project_id ? {
    projectId: track.project_id,
    projectName,
    projectGenre,
    projectMood,
    projectLanguage,
    trackId: track.id,
    trackTitle: track.title,
    trackNotes: track.notes,
    stylePrompt: track.style_prompt,
  } : undefined;

  // Clean lyrics from Suno structural tags for display
  const cleanLyrics = (text: string) => {
    return text.replace(/\[.*?\]/g, '').trim();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {track.title}
            </SheetTitle>
            <SheetDescription>
              Просмотр и редактирование лирики трека
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100%-120px)]">
            <div className="space-y-6 pr-4">
              {/* Generated Lyrics Section */}
              {hasGeneratedLyrics && (
                <div className="space-y-3">
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

              {hasGeneratedLyrics && draftLyrics && <Separator />}

              {/* Draft Lyrics Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Edit className="w-3 h-3" />
                      {hasGeneratedLyrics ? 'Черновик / Заметки' : 'Лирика / Заметки'}
                    </Badge>
                  </div>
                  {!isEditing && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStartEdit}
                        className="gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setShowChatAssistant(true)}
                        className="gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Помощник
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editedLyrics}
                      onChange={(e) => setEditedLyrics(e.target.value)}
                      placeholder="Введите лирику или заметки для трека..."
                      className="min-h-[300px] text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="w-3.5 h-3.5 mr-1" />
                        Отмена
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Сохранить
                      </Button>
                    </div>
                  </div>
                ) : draftLyrics ? (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {draftLyrics}
                    </p>
                  </div>
                ) : (
                  <div className="bg-muted/20 rounded-lg p-8 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-4">
                      Лирика пока не написана
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStartEdit}
                        className="gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Написать вручную
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setShowChatAssistant(true)}
                        className="gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Создать с AI
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Chat-based AI Assistant */}
      <LyricsChatAssistant
        open={showChatAssistant}
        onOpenChange={setShowChatAssistant}
        onLyricsGenerated={handleLyricsGenerated}
        projectContext={projectContext}
        initialGenre={projectGenre || undefined}
        initialMood={projectMood ? [projectMood] : undefined}
        initialLanguage={(projectLanguage as 'ru' | 'en') || 'ru'}
      />
    </>
  );
}
