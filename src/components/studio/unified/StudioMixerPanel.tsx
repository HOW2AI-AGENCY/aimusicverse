/**
 * Studio Mixer Panel
 * Vertical fader-style mixer for multi-track control
 */

import { memo, useCallback } from 'react';
import { useUnifiedStudioStore, StudioTrack, TRACK_COLORS } from '@/stores/useUnifiedStudioStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { 
  Volume2, 
  VolumeX, 
  Headphones,
  Plus,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StudioMixerPanelProps {
  className?: string;
  onAddTrack?: () => void;
  compact?: boolean;
}

export const StudioMixerPanel = memo(function StudioMixerPanel({
  className,
  onAddTrack,
  compact = false,
}: StudioMixerPanelProps) {
  const {
    project,
    selectedTrackId,
    selectTrack,
    setMasterVolume,
  } = useUnifiedStudioStore();

  if (!project) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        Нет открытого проекта
      </div>
    );
  }

  const masterVolume = project.masterVolume;

  return (
    <div className={cn(
      'flex gap-2 p-3 bg-card/30 overflow-x-auto',
      compact ? 'flex-row items-end' : 'flex-row items-stretch',
      className
    )}>
      {/* Track Channels */}
      {project.tracks.map((track) => (
        <MixerChannel
          key={track.id}
          track={track}
          isSelected={selectedTrackId === track.id}
          onSelect={() => selectTrack(track.id)}
          compact={compact}
        />
      ))}

      {/* Add Track Button */}
      <div className={cn(
        'flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg',
        compact ? 'w-12 h-32' : 'w-16 min-h-[200px]',
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onAddTrack}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Master Channel */}
      <div className="w-px bg-border mx-2" />
      <MasterChannel
        volume={masterVolume}
        onVolumeChange={setMasterVolume}
        compact={compact}
      />
    </div>
  );
});

// ============ Mixer Channel ============

interface MixerChannelProps {
  track: StudioTrack;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
}

const MixerChannel = memo(function MixerChannel({
  track,
  isSelected,
  onSelect,
  compact,
}: MixerChannelProps) {
  const {
    setTrackVolume,
    setTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    removeTrack,
  } = useUnifiedStudioStore();

  const handleVolumeChange = useCallback((value: number[]) => {
    setTrackVolume(track.id, value[0]);
  }, [track.id, setTrackVolume]);

  const handlePanChange = useCallback((value: number[]) => {
    setTrackPan(track.id, value[0]);
  }, [track.id, setTrackPan]);

  if (compact) {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
          isSelected && 'bg-accent/20 ring-1 ring-primary',
        )}
        onClick={onSelect}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: track.color }}
        />
        <Slider
          value={[track.volume]}
          max={1}
          step={0.01}
          orientation="vertical"
          className="h-24"
          onValueChange={handleVolumeChange}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex gap-0.5">
          <Button
            variant={track.muted ? 'destructive' : 'ghost'}
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              toggleTrackMute(track.id);
            }}
          >
            {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </Button>
          <Button
            variant={track.solo ? 'secondary' : 'ghost'}
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              toggleTrackSolo(track.id);
            }}
          >
            <Headphones className="h-3 w-3" />
          </Button>
        </div>
        <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">
          {track.name}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-lg border border-border/50 cursor-pointer transition-colors min-w-[80px]',
        isSelected && 'bg-accent/20 ring-1 ring-primary',
        track.muted && 'opacity-60',
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center gap-1 w-full">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: track.color }}
        />
        <span className="text-xs font-medium truncate flex-1">{track.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => removeTrack(track.id)}>
              Удалить дорожку
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Pan Knob (simplified as slider) */}
      <div className="w-full">
        <div className="text-[10px] text-muted-foreground text-center mb-1">PAN</div>
        <Slider
          value={[track.pan]}
          min={-1}
          max={1}
          step={0.01}
          onValueChange={handlePanChange}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span>L</span>
          <span>R</span>
        </div>
      </div>

      {/* Volume Fader */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <Slider
          value={[track.volume]}
          max={1}
          step={0.01}
          orientation="vertical"
          className="h-32"
          onValueChange={handleVolumeChange}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-[10px] font-mono text-muted-foreground">
          {Math.round(track.volume * 100)}%
        </span>
      </div>

      {/* Mute/Solo */}
      <div className="flex gap-1">
        <Button
          variant={track.muted ? 'destructive' : 'outline'}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            toggleTrackMute(track.id);
          }}
        >
          M
        </Button>
        <Button
          variant={track.solo ? 'secondary' : 'outline'}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            toggleTrackSolo(track.id);
          }}
        >
          S
        </Button>
      </div>
    </div>
  );
});

// ============ Master Channel ============

interface MasterChannelProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  compact?: boolean;
}

const MasterChannel = memo(function MasterChannel({
  volume,
  onVolumeChange,
  compact,
}: MasterChannelProps) {
  const handleChange = useCallback((value: number[]) => {
    onVolumeChange(value[0]);
  }, [onVolumeChange]);

  return (
    <div className={cn(
      'flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-primary/30 bg-primary/5',
      compact ? 'min-w-[60px]' : 'min-w-[80px]',
    )}>
      <span className="text-xs font-semibold text-primary">MASTER</span>

      {!compact && (
        <div className="w-full">
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            disabled
            className="opacity-50"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center gap-1">
        <Slider
          value={[volume]}
          max={1}
          step={0.01}
          orientation="vertical"
          className={compact ? 'h-24' : 'h-32'}
          onValueChange={handleChange}
        />
        <span className="text-[10px] font-mono text-muted-foreground">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* VU Meter placeholder */}
      <div className="flex gap-0.5 h-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1.5 rounded-full transition-all',
              i < Math.floor(volume * 8)
                ? i > 5 ? 'bg-destructive' : 'bg-primary'
                : 'bg-muted',
            )}
            style={{ height: `${12 + i * 2}px` }}
          />
        ))}
      </div>
    </div>
  );
});
