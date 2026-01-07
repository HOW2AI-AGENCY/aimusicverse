/**
 * OptimizedStemTrack - High-performance stem track display
 * Uses canvas for waveform and minimal re-renders
 */

import React, { memo, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TrackStem } from '@/hooks/useTrackStems';
import { OptimizedWaveform } from './OptimizedWaveform';
import { OptimizedVolumeSlider } from './OptimizedVolumeSlider';
import { Button } from '@/components/ui/button';
import { 
  Volume2, 
  VolumeX, 
  Headphones,
  MoreVertical,
} from 'lucide-react';

interface OptimizedStemTrackProps {
  stem: TrackStem;
  volume: number;
  muted: boolean;
  solo: boolean;
  isEffectivelyMuted: boolean;
  progress: number;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onSeek?: (progress: number) => void;
  onMoreClick?: () => void;
  className?: string;
}

// Stem type icons
const STEM_ICONS: Record<string, string> = {
  vocals: '🎤',
  drums: '🥁',
  bass: '🎸',
  other: '🎹',
  instrumental: '🎼',
  melody: '🎵',
  harmony: '🎶',
};

// Stem colors
const STEM_COLORS: Record<string, string> = {
  vocals: 'hsl(340, 82%, 52%)',
  drums: 'hsl(45, 93%, 47%)',
  bass: 'hsl(262, 83%, 58%)',
  other: 'hsl(173, 80%, 40%)',
  instrumental: 'hsl(210, 79%, 46%)',
  melody: 'hsl(280, 87%, 65%)',
  harmony: 'hsl(150, 60%, 45%)',
};

const StemLabel = memo(function StemLabel({ 
  type, 
  className 
}: { 
  type: string;
  className?: string;
}) {
  const icon = STEM_ICONS[type] || '🎵';
  const displayName = type.charAt(0).toUpperCase() + type.slice(1);
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium truncate">{displayName}</span>
    </div>
  );
});

const StemControls = memo(function StemControls({
  muted,
  solo,
  onMuteToggle,
  onSoloToggle,
}: {
  muted: boolean;
  solo: boolean;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant={muted ? 'destructive' : 'ghost'}
        size="icon"
        className="h-7 w-7"
        onClick={onMuteToggle}
      >
        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </Button>
      <Button
        variant={solo ? 'default' : 'ghost'}
        size="icon"
        className="h-7 w-7"
        onClick={onSoloToggle}
      >
        <Headphones className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
});

export const OptimizedStemTrack = memo(function OptimizedStemTrack({
  stem,
  volume,
  muted,
  solo,
  isEffectivelyMuted,
  progress,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onSeek,
  onMoreClick,
  className,
}: OptimizedStemTrackProps) {
  const color = STEM_COLORS[stem.stem_type] || STEM_COLORS.other;
  
  const waveformColors = useMemo(() => ({
    primary: isEffectivelyMuted ? 'hsl(var(--muted))' : 'hsl(var(--muted-foreground))',
    progress: isEffectivelyMuted ? 'hsl(var(--muted))' : color,
  }), [isEffectivelyMuted, color]);

  const handleSeek = useCallback((newProgress: number) => {
    onSeek?.(newProgress);
  }, [onSeek]);

  if (!stem.audio_url) {
    return (
      <div className={cn(
        'flex items-center justify-center h-16 rounded-lg border border-dashed',
        'text-sm text-muted-foreground',
        className
      )}>
        No audio available
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-3 rounded-lg border',
        'bg-card/50 backdrop-blur-sm',
        isEffectivelyMuted && 'opacity-60',
        className
      )}
      style={{ borderColor: `${color}30` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <StemLabel type={stem.stem_type} />
        
        <div className="flex items-center gap-2">
          <StemControls
            muted={muted}
            solo={solo}
            onMuteToggle={onMuteToggle}
            onSoloToggle={onSoloToggle}
          />
          
          {onMoreClick && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onMoreClick}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Waveform */}
      <OptimizedWaveform
        audioUrl={stem.audio_url}
        audioId={stem.id}
        progress={progress}
        height={48}
        primaryColor={waveformColors.primary}
        progressColor={waveformColors.progress}
        onClick={handleSeek}
        className="rounded-md overflow-hidden"
      />
      
      {/* Volume slider */}
      <OptimizedVolumeSlider
        value={volume}
        onChange={onVolumeChange}
        muted={muted}
        onMuteToggle={onMuteToggle}
        size="sm"
        showIcon={false}
      />
    </div>
  );
});
