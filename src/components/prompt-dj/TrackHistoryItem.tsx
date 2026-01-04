/**
 * TrackHistoryItem - Track item with mini waveform visualization
 */

import { memo, useState, useEffect, useRef } from 'react';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Play, Square, MoreVertical, Save, Music, Download, Trash2, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { GeneratedTrack } from '@/hooks/usePromptDJEnhanced';

interface TrackHistoryItemProps {
  track: GeneratedTrack;
  isPlaying: boolean;
  isCurrent: boolean;
  isSaving: boolean;
  onPlay: () => void;
  onStop: () => void;
  onSave: () => void;
  onUseAsReference: () => void;
  onDownload: () => void;
  onRemove: () => void;
}

// Generate fake waveform data for visualization
const generateWaveformData = (length: number = 40): number[] => {
  const data: number[] = [];
  for (let i = 0; i < length; i++) {
    // Create a somewhat realistic waveform pattern
    const base = 0.3 + Math.random() * 0.4;
    const variation = Math.sin(i * 0.3) * 0.2;
    data.push(Math.max(0.1, Math.min(1, base + variation)));
  }
  return data;
};

export const TrackHistoryItem = memo(function TrackHistoryItem({
  track,
  isPlaying,
  isCurrent,
  isSaving,
  onPlay,
  onStop,
  onSave,
  onUseAsReference,
  onDownload,
  onRemove,
}: TrackHistoryItemProps) {
  const [waveform] = useState(() => generateWaveformData());
  const [playProgress, setPlayProgress] = useState(0);
  const progressRef = useRef<number | null>(null);

  // Simulate play progress
  useEffect(() => {
    if (isPlaying && isCurrent) {
      const start = Date.now();
      const duration = 20000; // Assume 20s tracks
      
      const update = (): void => {
        const elapsed = Date.now() - start;
        setPlayProgress(Math.min(100, (elapsed / duration) * 100));
        
        if (elapsed < duration) {
          progressRef.current = requestAnimationFrame(update);
        }
      };
      update();
      
      return () => {
        if (progressRef.current) {
          cancelAnimationFrame(progressRef.current);
        }
      };
    } else {
      setPlayProgress(0);
    }
  }, [isPlaying, isCurrent]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg',
        'bg-card/40 border border-border/30',
        isCurrent && 'border-primary/50 bg-primary/5'
      )}
    >
      {/* Play button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={isCurrent && isPlaying ? onStop : onPlay}
      >
        {isCurrent && isPlaying ? (
          <Square className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3" />
        )}
      </Button>

      {/* Waveform visualization */}
      <div className="flex-1 flex items-center gap-px h-6 overflow-hidden">
        {waveform.map((level, i) => {
          const isPlayed = (i / waveform.length) * 100 < playProgress;
          return (
            <div
              key={i}
              className={cn(
                'w-0.5 rounded-full transition-colors duration-100',
                isPlayed ? 'bg-primary' : 'bg-muted/40'
              )}
              style={{ height: `${level * 100}%` }}
            />
          );
        })}
      </div>

      {/* Prompt preview */}
      <p className="hidden sm:block flex-1 text-[10px] text-muted-foreground truncate max-w-[100px]">
        {track.prompt.slice(0, 30)}...
      </p>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            <MoreVertical className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-[10px]">Действия</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={onSave} disabled={isSaving} className="text-xs">
            {isSaving ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <Save className="w-3 h-3 mr-2" />
            )}
            Сохранить в облако
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={onUseAsReference} className="text-xs">
            <Music className="w-3 h-3 mr-2" />
            Как референс
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={onDownload} className="text-xs">
            <Download className="w-3 h-3 mr-2" />
            Скачать
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={onRemove} className="text-xs text-destructive">
            <Trash2 className="w-3 h-3 mr-2" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
});
