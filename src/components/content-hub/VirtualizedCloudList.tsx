import { forwardRef, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Mic, Play, Pause, MoreVertical, Trash2, Upload, FileText, ArrowRight, Disc, Sparkles, Scissors, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ReferenceAudio } from '@/hooks/useReferenceAudio';

interface VirtualizedCloudListProps {
  audioFiles: ReferenceAudio[];
  playingId: string | null;
  onSelect: (audio: ReferenceAudio) => void;
  onPlay: (audio: ReferenceAudio) => void;
  onDelete: (id: string) => void;
  onUseForGeneration: (audio: ReferenceAudio, mode: 'cover' | 'extend') => void;
  onSeparateStems?: (audio: ReferenceAudio) => void;
}

// List container
const ListContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props} className="space-y-2" />
  )
);
ListContainer.displayName = "ListContainer";

export function VirtualizedCloudList({
  audioFiles,
  playingId,
  onSelect,
  onPlay,
  onDelete,
  onUseForGeneration,
  onSeparateStems,
}: VirtualizedCloudListProps) {
  const formatDuration = useCallback((seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const renderAudioItem = useCallback((index: number, audio: ReferenceAudio) => {
    const isPlaying = playingId === audio.id;

    return (
      <div
        onClick={() => onSelect(audio)}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50",
          "hover:bg-card hover:border-border cursor-pointer transition-all",
          "active:scale-[0.99] touch-manipulation"
        )}
      >
        {/* Play Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-primary/10 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onPlay(audio);
          }}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {audio.source === 'recording' ? (
                <Mic className="w-3 h-3 text-primary shrink-0" />
              ) : (
                <Upload className="w-3 h-3 text-muted-foreground shrink-0" />
              )}
              <h3 className="font-medium text-sm truncate">{audio.file_name}</h3>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] text-muted-foreground">
                {formatDuration(audio.duration_seconds)}
              </span>
              {audio.genre && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                  {audio.genre}
                </Badge>
              )}
              {audio.mood && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                  {audio.mood}
                </Badge>
              )}
              {audio.transcription && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-primary border-primary/30">
                  <FileText className="w-2.5 h-2.5 mr-0.5" />
                  Текст
                </Badge>
              )}
              {audio.style_description && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-green-600 border-green-600/30">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  Стиль
                </Badge>
              )}
              {audio.stems_status === 'completed' && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-purple-600 border-purple-600/30">
                  <Scissors className="w-2.5 h-2.5 mr-0.5" />
                  Стемы
                </Badge>
              )}
              {audio.stems_status === 'processing' && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-yellow-600 border-yellow-600/30 animate-pulse">
                  <Scissors className="w-2.5 h-2.5 mr-0.5" />
                  ...
                </Badge>
              )}
            </div>
          </div>

        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onUseForGeneration(audio, 'cover');
            }}>
              <Disc className="w-4 h-4 mr-2" />
              Создать кавер
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onUseForGeneration(audio, 'extend');
            }}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Расширить
            </DropdownMenuItem>
            {onSeparateStems && audio.stems_status !== 'completed' && audio.stems_status !== 'processing' && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onSeparateStems(audio);
              }}>
                <Scissors className="w-4 h-4 mr-2" />
                Разделить на стемы
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(audio.id);
              }}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }, [playingId, onSelect, onPlay, onDelete, onUseForGeneration, formatDuration]);

  // If few items, render directly without virtualization
  if (audioFiles.length <= 20) {
    return (
      <div className="space-y-2">
        {audioFiles.map((audio, index) => renderAudioItem(index, audio))}
      </div>
    );
  }

  return (
    <Virtuoso
      style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
      totalCount={audioFiles.length}
      overscan={200}
      components={{
        List: ListContainer,
      }}
      itemContent={(index) => renderAudioItem(index, audioFiles[index])}
    />
  );
}
