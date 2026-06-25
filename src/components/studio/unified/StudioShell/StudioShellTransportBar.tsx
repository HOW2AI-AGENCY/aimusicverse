/**
 * StudioShellTransportBar Component
 *
 * Transport controls bar for the studio (play, pause, seek, volume).
 * Desktop only - mobile uses MobileStudioPlayerBar.
 *
 * @feature Spec 001 - Phase 3: Component Maintainability
 * @priority P1 - Split StudioShell (1852 lines → 6 components)
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Volume2, VolumeX, Upload, Plus } from "lucide-react";
import { OptimizedTransport } from "../OptimizedTransport";

export interface StudioShellTransportBarProps {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // Audio controls
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;

  // Volume
  masterVolume: number;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;

  // Actions
  onImportAudio: () => void;
  onAddTrack: () => void;

  className?: string;
}

export const StudioShellTransportBar = React.forwardRef<HTMLDivElement, StudioShellTransportBarProps>(
  (
    {
      isPlaying,
      currentTime,
      duration,
      onPlayPause,
      onStop,
      onSeek,
      masterVolume,
      onVolumeChange,
      onMuteToggle,
      onImportAudio,
      onAddTrack,
      className,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-card/50 shrink-0 overflow-hidden",
          className,
        )}
      >
        {/* Play Controls - OptimizedTransport */}
        <OptimizedTransport
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlay={onPlayPause}
          onPause={onPlayPause}
          onStop={onStop}
          onSeek={onSeek}
          compact={true}
          className="shrink-0"
        />

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Master Volume */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMuteToggle}>
            {masterVolume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[masterVolume]}
            max={1}
            step={0.01}
            onValueChange={(v) => onVolumeChange(v[0])}
            className="w-20"
          />
          <span className="text-xs font-mono text-muted-foreground w-6">{Math.round(masterVolume * 100)}</span>
        </div>

        {/* Import Audio */}
        <Button variant="ghost" size="icon" onClick={onImportAudio} className="h-8 w-8 shrink-0" title="Импорт аудио">
          <Upload className="h-4 w-4" />
        </Button>

        {/* Add Track */}
        <Button variant="outline" size="sm" onClick={onAddTrack} className="h-8 px-3 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="ml-1">Дорожка</span>
        </Button>
      </div>
    );
  },
);

StudioShellTransportBar.displayName = "StudioShellTransportBar";
