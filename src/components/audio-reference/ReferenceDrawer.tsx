/**
 * Reference Drawer Component
 * Unified UI for browsing and selecting audio references with improved UX
 */

import { useState, useCallback, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Search,
  Sparkles,
  FileAudio,
  Trash2,
} from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { useAudioReference } from '@/hooks/useAudioReference';
import { useReferenceAudio, ReferenceAudio } from '@/hooks/useReferenceAudio';
import { useReferenceAudioPlayer } from '@/hooks/audio/useReferenceAudioPlayer';
import { ReferenceMode } from '@/services/audio-reference';
import { ReferenceAnalysisDisplay } from './ReferenceAnalysisDisplay';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, ru } from '@/lib/date-utils';
import { toast } from 'sonner';

interface ReferenceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (mode?: ReferenceMode) => void;
  defaultMode?: ReferenceMode;
}

function ReferenceItem({ 
  audio, 
  isPlaying, 
  onPlay, 
  onSelect, 
  onDelete 
}: { 
  audio: ReferenceAudio; 
  isPlaying: boolean;
  onPlay: () => void;
  onSelect: (mode: ReferenceMode) => void;
  onDelete: () => void;
}) {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'upload': return <Music className="h-4 w-4" />;
      case 'record': return <Mic className="h-4 w-4" />;
      case 'telegram': return <Cloud className="h-4 w-4" />;
      case 'drums': return <Drum className="h-4 w-4" />;
      case 'dj': return <Radio className="h-4 w-4" />;
      case 'guitar': return <Guitar className="h-4 w-4" />;
      case 'stem': return <Sparkles className="h-4 w-4" />;
      default: return <FileAudio className="h-4 w-4" />;
    }
  };

  const getAnalysisStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="text-xs gap-1 bg-green-500/20 text-green-700 dark:text-green-400"><Check className="h-3 w-3" />Анализ</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-xs gap-1"><Loader2 className="h-3 w-3 animate-spin" />Анализ...</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" />Ожидает</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "p-3 rounded-lg border bg-card transition-all",
      "hover:border-primary/50 hover:shadow-sm"
    )}>
      <div className="flex items-start gap-3">
        {/* Play button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full bg-primary/10 hover:bg-primary/20"
          onClick={onPlay}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {getSourceIcon(audio.source)}
            <span className="font-medium truncate">{audio.file_name}</span>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
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

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => onSelect('cover')}
        >
          Кавер
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => onSelect('extend')}
        >
          Расширить
        </Button>
      </div>
    </div>
  );
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
    analysisStatus,
  } = useAudioReference();

  const { deleteAudio } = useReferenceAudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  const { isPlaying, togglePlay, reset } = useReferenceAudioPlayer({
    audioUrl: playingUrl,
    onEnded: () => setPlayingId(null),
  });

  // Stop playback when drawer closes
  useEffect(() => {
    if (!open) {
      reset();
      setPlayingId(null);
      setPlayingUrl(null);
    }
  }, [open, reset]);

  const handlePlay = useCallback((url: string, id: string) => {
    if (playingId === id) {
      togglePlay();
    } else {
      setPlayingUrl(url);
      setPlayingId(id);
      // Let the effect handle playing the new audio
    }
  }, [playingId, togglePlay]);

  // Auto-play when URL changes
  useEffect(() => {
    if (playingUrl && playingId) {
      // Small delay to let the audio load
      const timer = setTimeout(() => {
        togglePlay();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [playingUrl]);

  const handleSelectCloud = useCallback((audio: ReferenceAudio, mode: ReferenceMode) => {
    setFromCloud(audio, mode);
    onSelect?.(mode);
    onOpenChange(false);
  }, [setFromCloud, onSelect, onOpenChange]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteAudio(id);
      toast.success('Референс удалён');
    } catch (error) {
      toast.error('Не удалось удалить');
    }
  }, [deleteAudio]);

  // Filter references by search
  const filteredReferences = searchQuery
    ? recentReferences.filter(audio => 
        audio.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audio.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audio.mood?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentReferences;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader className="pb-4 shrink-0">
          <SheetTitle>Аудио референсы</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue={activeReference ? "active" : "recent"} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="recent">
              Недавние
              {recentReferences.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{recentReferences.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" disabled={!activeReference}>
              Активный {activeReference && <Badge variant="default" className="ml-1 text-xs">1</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Recent references */}
          <TabsContent value="recent" className="flex-1 overflow-hidden mt-4">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию, жанру..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="flex-1 h-[calc(100%-60px)] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredReferences.length === 0 ? (
                <EmptyState
                  icon={Cloud}
                  title={searchQuery ? 'Ничего не найдено' : 'Нет сохранённых референсов'}
                  description={!searchQuery ? 'Загрузите или запишите аудио' : undefined}
                  variant="compact"
                />
              ) : (
                <div className="space-y-3 pb-4">
                  {filteredReferences.map((audio) => (
                    <ReferenceItem
                      key={audio.id}
                      audio={audio}
                      isPlaying={playingId === audio.id && isPlaying}
                      onPlay={() => handlePlay(audio.file_url, audio.id)}
                      onSelect={(mode) => handleSelectCloud(audio, mode)}
                      onDelete={() => handleDelete(audio.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Active reference */}
          <TabsContent value="active" className="flex-1 overflow-auto mt-4">
            {activeReference && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileAudio className="h-5 w-5 text-primary" />
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
                        <Badge variant={activeReference.intendedMode === 'cover' ? 'default' : 'secondary'}>
                          {activeReference.intendedMode === 'cover' ? 'Кавер' : 'Расширение'}
                        </Badge>
                      </div>
                    )}
                    {activeReference.source && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Источник</span>
                        <span className="capitalize">{activeReference.source}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Analysis display */}
                <ReferenceAnalysisDisplay
                  analysis={activeReference.analysis}
                  status={analysisStatus}
                />

                <div className="flex gap-2">
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
