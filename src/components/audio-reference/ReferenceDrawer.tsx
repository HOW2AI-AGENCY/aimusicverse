/**
 * Reference Drawer Component
 * Unified UI for browsing and selecting audio references
 */

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  Music, 
  Mic, 
  Drum, 
  Radio, 
  Guitar, 
  Play, 
  Pause,
  X,
  Check,
  Clock,
  Loader2,
} from 'lucide-react';
import { useAudioReference } from '@/hooks/useAudioReference';
import { ReferenceAudio } from '@/hooks/useReferenceAudio';
import { ReferenceMode } from '@/services/audio-reference';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ReferenceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (mode?: ReferenceMode) => void;
  defaultMode?: ReferenceMode;
}

export function ReferenceDrawer({ 
  open, 
  onOpenChange, 
  onSelect,
  defaultMode,
}: ReferenceDrawerProps) {
  const { 
    activeReference, 
    recentReferences, 
    isLoading,
    setFromCloud,
    clearActive,
  } = useAudioReference();
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handlePlay = (url: string, id: string) => {
    if (playingId === id) {
      audioElement?.pause();
      setPlayingId(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(url);
    audio.play();
    audio.onended = () => setPlayingId(null);
    setAudioElement(audio);
    setPlayingId(id);
  };

  const handleSelectCloud = (audio: ReferenceAudio, mode: ReferenceMode) => {
    setFromCloud(audio, mode);
    onSelect?.(mode);
    onOpenChange(false);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'upload': return <Music className="h-4 w-4" />;
      case 'record': return <Mic className="h-4 w-4" />;
      case 'telegram': return <Cloud className="h-4 w-4" />;
      case 'drums': return <Drum className="h-4 w-4" />;
      case 'dj': return <Radio className="h-4 w-4" />;
      case 'guitar': return <Guitar className="h-4 w-4" />;
      default: return <Music className="h-4 w-4" />;
    }
  };

  const getAnalysisStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="text-xs"><Check className="h-3 w-3 mr-1" />Анализ</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-xs"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Анализ...</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />Ожидает</Badge>;
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader className="pb-4">
          <SheetTitle>Аудио референсы</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="recent" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent">Недавние</TabsTrigger>
            <TabsTrigger value="active" disabled={!activeReference}>
              Активный {activeReference && <Badge variant="secondary" className="ml-1 text-xs">1</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Recent references */}
          <TabsContent value="recent" className="h-[calc(100%-48px)]">
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentReferences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Cloud className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Нет сохранённых референсов</p>
                  <p className="text-sm">Загрузите или запишите аудио</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentReferences.map((audio) => (
                    <div
                      key={audio.id}
                      className={cn(
                        "p-3 rounded-lg border bg-card transition-colors",
                        "hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Play button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => handlePlay(audio.file_url, audio.id)}
                        >
                          {playingId === audio.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getSourceIcon(audio.source)}
                            <span className="font-medium truncate">{audio.file_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {audio.duration_seconds && (
                              <span>{Math.round(audio.duration_seconds)}с</span>
                            )}
                            {audio.bpm && <span>{audio.bpm} BPM</span>}
                            {audio.genre && <span>{audio.genre}</span>}
                            <span>
                              {formatDistanceToNow(new Date(audio.created_at), { 
                                addSuffix: true, 
                                locale: ru 
                              })}
                            </span>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {getAnalysisStatusBadge(audio.analysis_status)}
                            {audio.has_vocals && (
                              <Badge variant="outline" className="text-xs">Вокал</Badge>
                            )}
                            {audio.mood && (
                              <Badge variant="outline" className="text-xs">{audio.mood}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleSelectCloud(audio, 'cover')}
                        >
                          Кавер
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleSelectCloud(audio, 'extend')}
                        >
                          Расширить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Active reference */}
          <TabsContent value="active" className="h-[calc(100%-48px)]">
            {activeReference && (
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(activeReference.source)}
                    <span className="font-medium">{activeReference.fileName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={clearActive}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  {activeReference.durationSeconds && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Длительность</span>
                      <span>{Math.round(activeReference.durationSeconds)}с</span>
                    </div>
                  )}
                  {activeReference.intendedMode && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Режим</span>
                      <span>{activeReference.intendedMode === 'cover' ? 'Кавер' : 'Расширение'}</span>
                    </div>
                  )}
                  {activeReference.analysis?.genre && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Жанр</span>
                      <span>{activeReference.analysis.genre}</span>
                    </div>
                  )}
                  {activeReference.analysis?.bpm && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BPM</span>
                      <span>{activeReference.analysis.bpm}</span>
                    </div>
                  )}
                </div>

                {activeReference.analysis?.styleDescription && (
                  <div className="mt-3 p-2 rounded bg-muted/50 text-sm">
                    {activeReference.analysis.styleDescription}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      onSelect?.(activeReference.intendedMode);
                      onOpenChange(false);
                    }}
                  >
                    Использовать
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
