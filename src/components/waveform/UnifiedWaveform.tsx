/**
 * Unified Waveform Component
 * Single component for all waveform visualization needs
 * 
 * Replaces: StemWaveform, OptimizedStemWaveform
 * Supports: standard playback, stem visualization, beat grid
 */

import React, { memo, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useWaveformData } from '@/hooks/audio/useWaveformData';
import { useBeatGrid, generateSyntheticBeatGrid } from '@/hooks/audio/useBeatGrid';
import { WaveformCanvas } from './WaveformCanvas';
import { BeatGridOverlay } from './BeatGridOverlay';
import { Skeleton } from '@/components/ui/skeleton';

export type WaveformMode = 'compact' | 'standard' | 'detailed' | 'minimal' | 'stem';
export type StemType = 'vocals' | 'vocal' | 'drums' | 'bass' | 'guitar' | 'piano' | 'keyboard' | 
  'instrumental' | 'other' | 'backing_vocals' | 'strings' | 'brass' | 'woodwinds' | 
  'percussion' | 'synth' | 'fx' | 'atmosphere';

interface UnifiedWaveformProps {
  audioUrl?: string | null;
  trackId?: string | null;
  waveformData?: number[] | null;
  
  // Playback state
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  
  // Display options
  mode?: WaveformMode;
  height?: number;
  showBeatGrid?: boolean;
  showProgress?: boolean;
  interactive?: boolean;
  
  // Stem-specific options
  stemType?: StemType;
  isMuted?: boolean;
  
  // Styling
  waveColor?: string;
  progressColor?: string;
  className?: string;
  
  // Callbacks
  onSeek?: (time: number) => void;
}

const MODE_CONFIGS: Record<WaveformMode, { height: number; barWidth: number; barGap: number; samples: number }> = {
  minimal: { height: 20, barWidth: 2, barGap: 1, samples: 50 },
  compact: { height: 32, barWidth: 2, barGap: 1, samples: 80 },
  standard: { height: 48, barWidth: 3, barGap: 1, samples: 100 },
  detailed: { height: 80, barWidth: 4, barGap: 2, samples: 150 },
  stem: { height: 40, barWidth: 2, barGap: 1, samples: 120 },
};

// HSL-based color map for stem types (design system consistency)
const STEM_COLORS: Record<string, { wave: string; progress: string }> = {
  vocals: { wave: 'hsl(207 90% 54% / 0.4)', progress: 'hsl(207 90% 54% / 0.8)' },
  vocal: { wave: 'hsl(207 90% 54% / 0.4)', progress: 'hsl(207 90% 54% / 0.8)' },
  backing_vocals: { wave: 'hsl(188 80% 43% / 0.4)', progress: 'hsl(188 80% 43% / 0.8)' },
  drums: { wave: 'hsl(25 95% 53% / 0.4)', progress: 'hsl(25 95% 53% / 0.8)' },
  bass: { wave: 'hsl(270 70% 65% / 0.4)', progress: 'hsl(270 70% 65% / 0.8)' },
  guitar: { wave: 'hsl(38 95% 50% / 0.4)', progress: 'hsl(38 95% 50% / 0.8)' },
  piano: { wave: 'hsl(330 75% 60% / 0.4)', progress: 'hsl(330 75% 60% / 0.8)' },
  keyboard: { wave: 'hsl(330 75% 60% / 0.4)', progress: 'hsl(330 75% 60% / 0.8)' },
  strings: { wave: 'hsl(160 70% 40% / 0.4)', progress: 'hsl(160 70% 40% / 0.8)' },
  brass: { wave: 'hsl(48 95% 48% / 0.4)', progress: 'hsl(48 95% 48% / 0.8)' },
  woodwinds: { wave: 'hsl(84 80% 44% / 0.4)', progress: 'hsl(84 80% 44% / 0.8)' },
  percussion: { wave: 'hsl(0 72% 51% / 0.4)', progress: 'hsl(0 72% 51% / 0.8)' },
  synth: { wave: 'hsl(250 80% 60% / 0.4)', progress: 'hsl(250 80% 60% / 0.8)' },
  fx: { wave: 'hsl(175 70% 40% / 0.4)', progress: 'hsl(175 70% 40% / 0.8)' },
  atmosphere: { wave: 'hsl(200 90% 48% / 0.4)', progress: 'hsl(200 90% 48% / 0.8)' },
  instrumental: { wave: 'hsl(145 65% 45% / 0.4)', progress: 'hsl(145 65% 45% / 0.8)' },
  other: { wave: 'hsl(220 10% 55% / 0.4)', progress: 'hsl(220 10% 55% / 0.8)' },
  muted: { wave: 'hsl(220 10% 40% / 0.2)', progress: 'hsl(220 10% 40% / 0.4)' },
};

export const UnifiedWaveform = memo(function UnifiedWaveform({
  audioUrl,
  trackId,
  waveformData: precomputedData,
  currentTime = 0,
  duration: providedDuration,
  isPlaying = false,
  mode = 'standard',
  height: customHeight,
  showBeatGrid = false,
  showProgress = true,
  interactive = true,
  stemType,
  isMuted = false,
  waveColor: customWaveColor,
  progressColor: customProgressColor,
  className,
  onSeek,
}: UnifiedWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = MODE_CONFIGS[mode];
  const height = customHeight ?? config.height;

  // Determine colors based on stem type or custom colors
  const colors = useMemo(() => {
    if (isMuted) return STEM_COLORS.muted;
    if (customWaveColor && customProgressColor) {
      return { wave: customWaveColor, progress: customProgressColor };
    }
    if (stemType) {
      return STEM_COLORS[stemType.toLowerCase()] || STEM_COLORS.other;
    }
    return { wave: undefined, progress: undefined };
  }, [isMuted, customWaveColor, customProgressColor, stemType]);

  // Load waveform data if not pre-computed
  const {
    waveformData: loadedData,
    duration: loadedDuration,
    isLoading,
  } = useWaveformData(precomputedData ? null : audioUrl, {
    samples: config.samples,
    autoLoad: !precomputedData && !!audioUrl,
    trackId: trackId || undefined,
  });

  // Load beat grid if enabled
  const { beatGrid } = useBeatGrid(showBeatGrid ? trackId : null);

  // Use pre-computed data or loaded data
  const waveformData = precomputedData ?? loadedData;
  const duration = providedDuration ?? loadedDuration ?? 0;

  // Calculate progress
  const progress = useMemo(() => {
    if (!showProgress || duration <= 0) return 0;
    return Math.min(currentTime / duration, 1);
  }, [currentTime, duration, showProgress]);

  // Get beats for overlay
  const beats = useMemo(() => {
    if (!showBeatGrid) return [];
    if (beatGrid?.beats?.length) return beatGrid.beats;
    if (beatGrid?.bpm && duration > 0) {
      return generateSyntheticBeatGrid(beatGrid.bpm, duration);
    }
    return [];
  }, [showBeatGrid, beatGrid, duration]);

  // Handle seek
  const handleSeek = (clickProgress: number) => {
    if (!interactive || !onSeek || duration <= 0) return;
    const seekTime = clickProgress * duration;
    onSeek(seekTime);
  };

  // Loading state
  if (isLoading && !waveformData) {
    return (
      <div className={cn('relative', className)} style={{ height }}>
        <Skeleton className="w-full h-full rounded-sm" />
      </div>
    );
  }

  // Empty state
  if (!waveformData || waveformData.length === 0) {
    return (
      <div 
        className={cn('relative bg-muted/20 rounded-sm', className)} 
        style={{ height }}
      />
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative transition-opacity',
        isMuted && 'opacity-50',
        className
      )}
      style={{ height }}
    >
      {/* Beat grid overlay (behind waveform) */}
      {showBeatGrid && beats.length > 0 && (
        <BeatGridOverlay
          beats={beats}
          duration={duration}
          currentTime={currentTime}
          height={height}
          showDownbeatsOnly={mode === 'compact' || mode === 'minimal'}
        />
      )}
      
      {/* Waveform canvas */}
      <WaveformCanvas
        waveformData={waveformData}
        progress={progress}
        height={height}
        barWidth={config.barWidth}
        barGap={config.barGap}
        barRadius={1}
        waveColor={colors.wave}
        progressColor={colors.progress}
        onClick={interactive ? handleSeek : undefined}
        className="relative z-10"
      />
    </div>
  );
});

export default UnifiedWaveform;
