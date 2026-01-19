/**
 * StudioTransportBar - Transport controls for desktop StudioShell
 * Extracted from StudioShell for better maintainability
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { OptimizedTransport } from '../OptimizedTransport';
import {
  Volume2,
  VolumeX,
  Upload,
  Plus,
} from 'lucide-react';

interface StudioTransportBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onImport: () => void;
  onAddTrack: () => void;
}

export const StudioTransportBar = memo(function StudioTransportBar({
  isPlaying,
  currentTime,
  duration,
  masterVolume,
  onPlayPause,
  onSeek,
  onMasterVolumeChange,
  onImport,
  onAddTrack,
}: StudioTransportBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-card/50 shrink-0 overflow-hidden">
      {/* Play Controls - OptimizedTransport */}
      <OptimizedTransport
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onPlay={onPlayPause}
        onPause={onPlayPause}
        onStop={() => onSeek(0)}
        onSeek={onSeek}
        compact={true}
        className="shrink-0"
      />

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Master Volume */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onMasterVolumeChange(masterVolume === 0 ? 0.85 : 0)}
        >
          {masterVolume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[masterVolume]}
          max={1}
          step={0.01}
          onValueChange={(v) => onMasterVolumeChange(v[0])}
          className="w-20"
        />
        <span className="text-xs font-mono text-muted-foreground w-6">
          {Math.round(masterVolume * 100)}
        </span>
      </div>

      {/* Import Audio */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onImport}
        className="h-8 w-8 shrink-0"
        title="Импорт аудио"
      >
        <Upload className="h-4 w-4" />
      </Button>

      {/* Add Track */}
      <Button
        variant="outline"
        size="sm"
        onClick={onAddTrack}
        className="h-8 px-3 shrink-0"
      >
        <Plus className="h-4 w-4" />
        <span className="ml-1">Дорожка</span>
      </Button>
    </div>
  );
});
