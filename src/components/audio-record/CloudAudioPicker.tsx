import { useState } from "react";
import { useReferenceAudio, ReferenceAudio } from "@/hooks/useReferenceAudio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Play, Pause, Music, Mic, Cloud, Check } from "@/lib/icons";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { pauseAllStudioAudio } from "@/hooks/studio/useStudioAudio";
import { usePreviewAudio } from "@/hooks/audio/usePreviewAudio";
import { AudioPriority } from "@/lib/audioElementPool";

interface CloudAudioPickerProps {
  onSelect: (audio: ReferenceAudio) => void;
  selectedId?: string;
}

export function CloudAudioPicker({ onSelect, selectedId }: CloudAudioPickerProps) {
  const { audioList, isLoading } = useReferenceAudio();
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const { pauseTrack } = usePlayerStore();

  // Пул-аудио с динамическим src через usePreviewAudio.
  // Регистрация в useStudioAudio координаторе уже встроена в хук.
  const { playUrl, pause } = usePreviewAudio({
    id: "cloud-picker",
    src: previewUrl,
    priority: AudioPriority.LOW,
    onEnded: () => setPlayingId(null),
    onError: () => setPlayingId(null),
  });

  const filteredAudio =
    audioList?.filter(
      (a) =>
        a.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.mood?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlay = async (audio: ReferenceAudio, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingId === audio.id) {
      // Toggle off
      pause();
      setPlayingId(null);
      return;
    }

    // Pause global player and other studio audio
    pauseTrack();
    pauseAllStudioAudio("cloud-picker");

    // Меняем src на pool-элементе и запускаем.
    setPlayingId(audio.id);
    setPreviewUrl(audio.file_url);
    await playUrl(audio.file_url);
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
                  isSelected ? "bg-primary/10 border-primary" : "bg-card/50 border-border/50",
                )}
              >
                {/* Play Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full shrink-0",
                    isPlaying ? "bg-primary text-primary-foreground" : "bg-primary/10",
                  )}
                  onClick={(e) => handlePlay(audio, e)}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </Button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {audio.source === "recording" ? (
                      <Mic className="w-3 h-3 text-primary shrink-0" />
                    ) : (
                      <Music className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                    <h3 className="font-medium text-sm truncate">{audio.file_name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[0.625rem] text-muted-foreground">{formatDuration(audio.duration_seconds)}</span>
                    {audio.has_vocals === true && audio.has_instrumentals !== false && (
                      <Badge variant="outline" className="text-[0.5625rem] h-4 px-1.5">
                        🎤+🎸
                      </Badge>
                    )}
                    {audio.has_vocals === true && audio.has_instrumentals === false && (
                      <Badge variant="outline" className="text-[0.5625rem] h-4 px-1.5">
                        🎤 Вокал
                      </Badge>
                    )}
                    {audio.has_vocals === false && (
                      <Badge variant="outline" className="text-[0.5625rem] h-4 px-1.5">
                        🎸 Инструментал
                      </Badge>
                    )}
                    {audio.genre && (
                      <Badge variant="secondary" className="text-[0.5625rem] h-4 px-1.5">
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
            <EmptyState icon={Search} title="Ничего не найдено" variant="compact" animated={false} className="py-6" />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
