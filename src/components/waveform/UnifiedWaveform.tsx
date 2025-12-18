/**
 * Unified Waveform Component
 * Single component for all waveform visualization needs
 */

import React, { memo, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useWaveformData } from '@/hooks/audio/useWaveformData';
import { useBeatGrid, generateSyntheticBeatGrid } from '@/hooks/audio/useBeatGrid';
import { WaveformCanvas } from './WaveformCanvas';
import { BeatGridOverlay } from './BeatGridOverlay';
import { Skeleton } from '@/components/ui/skeleton';

export type WaveformMode = 'compact' | 'standard' | 'detailed' | 'minimal';

interface UnifiedWaveformProps {
  audioUrl?: string | null;
  trackId?: string | null;
  waveformData?: number[] | null; // Pre-computed data (optional)
  
  // Playback state
  currentTime?: number;
  duration?: number;
  
  // Display options
  mode?: WaveformMode;
  height?: number;
  showBeatGrid?: boolean;
  showProgress?: boolean;
  interactive?: boolean;
  
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
};

export const UnifiedWaveform = memo(function UnifiedWaveform({
  audioUrl,
  trackId,
  waveformData: precomputedData,
  currentTime = 0,
  duration: providedDuration,
  mode = 'standard',
  height: customHeight,
  showBeatGrid = false,
  showProgress = true,
  interactive = true,
  waveColor,
  progressColor,
  className,
  onSeek,
}: UnifiedWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = MODE_CONFIGS[mode];
  const height = customHeight ?? config.height;

  // Load waveform data if not pre-computed
  const {
    waveformData: loadedData,
    duration: loadedDuration,
    isLoading,
  } = useWaveformData(precomputedData ? null : audioUrl, {
    samples: config.samples,
    autoLoad: !precomputedData && !!audioUrl,
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
      className={cn('relative', className)}
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
        waveColor={waveColor}
        progressColor={progressColor}
        onClick={interactive ? handleSeek : undefined}
        className="relative z-10"
      />
    </div>
  );
});

export default UnifiedWaveform;
