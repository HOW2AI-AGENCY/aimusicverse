import { useState, useRef, useEffect, useId } from 'react';
import { useReferenceAudio, ReferenceAudio } from '@/hooks/useReferenceAudio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Play, Pause, Music, Mic, Cloud, Check } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { 
  registerStudioAudio, 
  unregisterStudioAudio, 
  pauseAllStudioAudio 
} from '@/hooks/studio/useStudioAudio';

interface CloudAudioPickerProps {
  onSelect: (audio: ReferenceAudio) => void;
  selectedId?: string;
}

export function CloudAudioPicker({ onSelect, selectedId }: CloudAudioPickerProps) {
  const { audioList, isLoading } = useReferenceAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceId = useId();
  
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();

  // Register with studio audio coordinator
  useEffect(() => {
    const fullSourceId = `cloud-picker-${sourceId}`;
    registerStudioAudio(fullSourceId, () => {
      audioRef.current?.pause();
      setPlayingId(null);
    });

    return () => {
      unregisterStudioAudio(fullSourceId);
      audioRef.current?.pause();
    };
  }, [sourceId]);

  // Pause when global player starts
  useEffect(() => {
    if (globalIsPlaying && playingId) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
  }, [globalIsPlaying, playingId]);

  const filteredAudio = audioList?.filter((a) =>
    a.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.genre?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.mood?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = (audio: ReferenceAudio, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (playingId === audio.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      // Stop current playback
      audioRef.current?.pause();

      // Pause global player and other studio audio
      pauseTrack();
      pauseAllStudioAudio(`cloud-picker-${sourceId}`);

      const newAudio = new Audio(audio.file_url);
      newAudio.onended = () => setPlayingId(null);
      newAudio.onerror = () => {
        toast.error('Ошибка воспроизведения');
        setPlayingId(null);
      };
      newAudio.play();
      audioRef.current = newAudio;
      setPlayingId(audio.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!audioList || audioList.length === 0) {
    return (
      <EmptyState
        icon={Cloud}
        title="Нет загруженных файлов"
        description="Загрузите аудио через Telegram бот или сделайте запись. Если вы записывали аудио, но оно не появилось — проверьте подключение к интернету и повторите запись"
        variant="compact"
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск в облаке..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Audio List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-3">
          {filteredAudio.map((audio) => {
            const isSelected = selectedId === audio.id;
            const isPlaying = playingId === audio.id;

            return (
              <div
                key={audio.id}
                onClick={() => onSelect(audio)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                  "hover:bg-accent/50",
                  isSelected 
                    ? "bg-primary/10 border-primary" 
                    : "bg-card/50 border-border/50"
                )}
              >
                {/* Play Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full shrink-0",
                    isPlaying ? "bg-primary text-primary-foreground" : "bg-primary/10"
                  )}
                  onClick={(e) => handlePlay(audio, e)}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </Button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {audio.source === 'recording' ? (
                      <Mic className="w-3 h-3 text-primary shrink-0" />
                    ) : (
                      <Music className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                    <h3 className="font-medium text-sm truncate">{audio.file_name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDuration(audio.duration_seconds)}
                    </span>
                    {audio.has_vocals === true && audio.has_instrumentals !== false && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                        🎤+🎸
                      </Badge>
                    )}
                    {audio.has_vocals === true && audio.has_instrumentals === false && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                        🎤 Вокал
                      </Badge>
                    )}
                    {audio.has_vocals === false && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                        🎸 Инструментал
                      </Badge>
                    )}
                    {audio.genre && (
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                        {audio.genre}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            );
          })}

          {filteredAudio.length === 0 && (
            <EmptyState
              icon={Search}
              title="Ничего не найдено"
              variant="compact"
              animated={false}
              className="py-6"
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
