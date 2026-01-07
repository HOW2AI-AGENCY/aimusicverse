/**
 * OptimizedTrackRow - Lightweight version of StudioTrackRow
 * Optimized for virtualized lists with minimal re-renders
 */

import { memo, useCallback, useState } from 'react';
import { Volume2, VolumeX, MoreHorizontal, Music, Mic2, Guitar, Drum, Waves, Sliders, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { UnifiedWaveform, type StemType } from '@/components/waveform/UnifiedWaveform';

// Track type configuration - static, not recreated
const TRACK_CONFIG = {
  main: { 
    icon: Music, 
    shortLabel: 'MAIN',
    gradient: 'from-primary/20 to-primary/5',
    accent: 'text-primary bg-primary/20 border-primary/30'
  },
  vocal: { 
    icon: Mic2, 
    shortLabel: 'VOX',
    gradient: 'from-blue-500/20 to-blue-600/5',
    accent: 'text-blue-400 bg-blue-500/20 border-blue-500/30'
  },
  instrumental: { 
    icon: Guitar, 
    shortLabel: 'INS',
    gradient: 'from-green-500/20 to-green-600/5',
    accent: 'text-green-400 bg-green-500/20 border-green-500/30'
  },
  drums: { 
    icon: Drum, 
    shortLabel: 'DRM',
    gradient: 'from-orange-500/20 to-orange-600/5',
    accent: 'text-orange-400 bg-orange-500/20 border-orange-500/30'
  },
  bass: { 
    icon: Waves, 
    shortLabel: 'BAS',
    gradient: 'from-purple-500/20 to-purple-600/5',
    accent: 'text-purple-400 bg-purple-500/20 border-purple-500/30'
  },
  stem: { 
    icon: Sliders, 
    shortLabel: 'STM',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    accent: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
  },
  other: { 
    icon: Music, 
    shortLabel: 'OTH',
    gradient: 'from-gray-500/20 to-gray-600/5',
    accent: 'text-gray-400 bg-gray-500/20 border-gray-500/30'
  },
} as const;

type TrackType = keyof typeof TRACK_CONFIG;

export interface OptimizedTrackRowProps {
  id: string;
  name: string;
  type: TrackType;
  audioUrl?: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasSoloTracks?: boolean;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onSeek: (time: number) => void;
  onOpenMenu?: (id: string) => void;
}

// Memoized header controls
const TrackControls = memo(function TrackControls({
  id,
  volume,
  muted,
  solo,
  showVolume,
  onToggleVolume,
  onToggleMute,
  onToggleSolo,
  onOpenMenu,
}: {
  id: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  showVolume: boolean;
  onToggleVolume: () => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onOpenMenu?: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleMute}
        className={cn(
          "h-8 w-8 p-0 rounded-lg font-mono text-[10px] font-bold touch-manipulation",
          muted 
            ? "bg-destructive text-destructive-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        M
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleSolo}
        className={cn(
          "h-8 w-8 p-0 rounded-lg font-mono text-[10px] font-bold touch-manipulation",
          solo 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        S
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleVolume}
        className={cn(
          "h-8 px-2 rounded-lg text-[10px] font-mono touch-manipulation",
          showVolume && "bg-muted"
        )}
      >
        {Math.round(volume * 100)}
      </Button>

      {onOpenMenu && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-lg touch-manipulation"
          onClick={onOpenMenu}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
});

// Memoized volume slider
const VolumeSlider = memo(function VolumeSlider({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
}: {
  volume: number;
  muted: boolean;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
}) {
  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggleMute}
        >
          {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </Button>
        <Slider
          value={[volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => onVolumeChange(v[0])}
          className="flex-1"
          disabled={muted}
        />
      </div>
    </div>
  );
});

export const OptimizedTrackRow = memo(function OptimizedTrackRow({
  id,
  name,
  type,
  audioUrl,
  volume,
  muted,
  solo,
  isPlaying,
  currentTime,
  duration,
  hasSoloTracks = false,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
  onSeek,
  onOpenMenu,
}: OptimizedTrackRowProps) {
  const [showVolume, setShowVolume] = useState(false);
  
  const config = TRACK_CONFIG[type] || TRACK_CONFIG.other;
  const Icon = config.icon;
  
  // Effective muted state
  const effectiveMuted = muted || (hasSoloTracks && !solo);

  // Stable callbacks with id bound
  const handleToggleMute = useCallback(() => onToggleMute(id), [id, onToggleMute]);
  const handleToggleSolo = useCallback(() => onToggleSolo(id), [id, onToggleSolo]);
  const handleVolumeChange = useCallback((v: number) => onVolumeChange(id, v), [id, onVolumeChange]);
  const handleOpenMenu = useCallback(() => onOpenMenu?.(id), [id, onOpenMenu]);
  const handleToggleVolume = useCallback(() => setShowVolume(v => !v), []);

  return (
    <div className={cn("relative", effectiveMuted && "opacity-50")}>
      <div className={cn(
        "flex flex-col rounded-xl overflow-hidden",
        "bg-gradient-to-r",
        config.gradient,
        "border border-border/30"
      )}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
          
          {/* Track icon + label */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
              config.accent
            )}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-mono font-semibold truncate block">
                {name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {config.shortLabel}
              </span>
            </div>
          </div>

          <TrackControls
            id={id}
            volume={volume}
            muted={muted}
            solo={solo}
            showVolume={showVolume}
            onToggleVolume={handleToggleVolume}
            onToggleMute={handleToggleMute}
            onToggleSolo={handleToggleSolo}
            onOpenMenu={onOpenMenu ? handleOpenMenu : undefined}
          />
        </div>

        {/* Volume slider */}
        {showVolume && (
          <VolumeSlider
            volume={volume}
            muted={muted}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
          />
        )}

        {/* Waveform */}
        <div className="h-14 relative">
          {audioUrl ? (
            <>
              <UnifiedWaveform
                audioUrl={audioUrl}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                isMuted={muted}
                stemType={type as StemType}
                mode="stem"
                height={56}
                onSeek={onSeek}
              />
              {duration > 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-10"
                  style={{ 
                    left: `${(currentTime / duration) * 100}%`,
                    boxShadow: '0 0 6px var(--primary)',
                  }}
                />
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/20">
              <span className="text-xs text-muted-foreground">Нет аудио</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
