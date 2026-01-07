/**
 * OptimizedMixerChannel - Highly optimized mixer channel with minimal re-renders
 * Uses memo and callbacks for maximum performance
 */

import { memo, useCallback } from 'react';
import { Volume2, VolumeX, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SimpleMeter } from './AudioMeter';

export interface OptimizedMixerChannelProps {
  id: string;
  name: string;
  shortName?: string;
  icon?: string;
  color?: string;
  volume: number;
  pan?: number;
  muted: boolean;
  solo: boolean;
  isPlaying?: boolean;
  hasEffects?: boolean;
  compact?: boolean;
  delay?: number;
  // Support both APIs - legacy (without id) and new (with id)
  onVolumeChange: ((id: string, volume: number) => void) | ((volume: number) => void);
  onPanChange?: ((id: string, pan: number) => void) | ((pan: number) => void);
  onToggleMute: ((id: string) => void) | (() => void);
  onToggleSolo: ((id: string) => void) | (() => void);
  onOpenEffects?: ((id: string) => void) | (() => void);
}

// Memoized fader component
const VolumeFader = memo(function VolumeFader({
  volume,
  onChange,
  disabled,
}: {
  volume: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="h-24 w-8 relative">
      <div className="absolute inset-0 bg-muted rounded-lg overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-primary/50 transition-all duration-75"
          style={{ height: `${volume * 100}%` }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
        disabled={disabled}
      />
    </div>
  );
});

// Memoized control buttons
const ChannelControls = memo(function ChannelControls({
  muted,
  solo,
  onToggleMute,
  onToggleSolo,
}: {
  muted: boolean;
  solo: boolean;
  onToggleMute: () => void;
  onToggleSolo: () => void;
}) {
  return (
    <div className="flex gap-1">
      <Button
        variant={muted ? "destructive" : "outline"}
        size="icon"
        className="h-10 w-10"
        onClick={onToggleMute}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </Button>
      <Button
        variant={solo ? "default" : "outline"}
        size="icon"
        className="h-10 w-10"
        onClick={onToggleSolo}
      >
        <Headphones className="w-4 h-4" />
      </Button>
    </div>
  );
});

export const OptimizedMixerChannel = memo(function OptimizedMixerChannel({
  id,
  name,
  shortName,
  icon = '🎵',
  color = 'hsl(var(--primary))',
  volume,
  pan = 0,
  muted,
  solo,
  isPlaying = false,
  hasEffects = false,
  compact = false,
  delay = 0,
  onVolumeChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
  onOpenEffects,
}: OptimizedMixerChannelProps) {
  // Detect if callback expects id parameter (new API) or not (legacy API)
  // by checking function length - functions with id expect 2 args for volume, 1 for toggles
  const handleVolumeChange = useCallback(
    (v: number) => {
      if (onVolumeChange.length === 2) {
        (onVolumeChange as (id: string, volume: number) => void)(id, v);
      } else {
        (onVolumeChange as (volume: number) => void)(v);
      }
    },
    [id, onVolumeChange]
  );

  const handleToggleMute = useCallback(() => {
    if (onToggleMute.length === 1) {
      (onToggleMute as (id: string) => void)(id);
    } else {
      (onToggleMute as () => void)();
    }
  }, [id, onToggleMute]);

  const handleToggleSolo = useCallback(() => {
    if (onToggleSolo.length === 1) {
      (onToggleSolo as (id: string) => void)(id);
    } else {
      (onToggleSolo as () => void)();
    }
  }, [id, onToggleSolo]);

  return (
    <div
      className={cn(
        "flex flex-col items-center p-3 rounded-xl border min-w-[80px]",
        "bg-card/50",
        muted ? "opacity-60 border-border/30" : "border-border/50"
      )}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-2"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>

      {/* Name */}
      <p className="text-xs font-medium text-center truncate w-full mb-2">
        {shortName || name}
      </p>

      {/* Level Meter + Fader */}
      <div className="flex items-end gap-1 mb-2">
        <SimpleMeter
          volume={volume}
          isMuted={muted}
          isPlaying={isPlaying}
          height={96}
          width={6}
        />
        <VolumeFader
          volume={volume}
          onChange={handleVolumeChange}
          disabled={muted}
        />
      </div>

      {/* Volume Value */}
      <span className="text-[10px] font-mono text-muted-foreground mb-2">
        {muted ? 'M' : `${Math.round(volume * 100)}`}
      </span>

      {/* Mute/Solo Buttons */}
      <ChannelControls
        muted={muted}
        solo={solo}
        onToggleMute={handleToggleMute}
        onToggleSolo={handleToggleSolo}
      />
    </div>
  );
});
