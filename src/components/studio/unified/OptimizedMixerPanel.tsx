/**
 * OptimizedMixerPanel - High-performance mixer panel
 * Uses virtualization and optimized rendering
 */

import React, { memo, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TrackStem } from '@/hooks/useTrackStems';
import { OptimizedMixerChannel } from './OptimizedMixerChannel';
import { OptimizedVolumeSlider } from './OptimizedVolumeSlider';
import { useStudioState, StemStates } from '@/hooks/studio/useStudioState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw, Volume2 } from 'lucide-react';

interface OptimizedMixerPanelProps {
  stems: TrackStem[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  showMaster?: boolean;
  compact?: boolean;
  onStemAction?: (stemId: string, action: string) => void;
}

export const OptimizedMixerPanel = memo(function OptimizedMixerPanel({
  stems,
  className,
  orientation = 'horizontal',
  showMaster = true,
  compact = false,
  onStemAction,
}: OptimizedMixerPanelProps) {
  const {
    stemStates,
    masterVolume,
    masterMuted,
    setMasterVolume,
    setMasterMuted,
    setStemVolume,
    toggleMute,
    toggleSolo,
    hasSoloStems,
    resetToDefaults,
    getEffectiveVolume,
    isStemEffectivelyMuted,
  } = useStudioState({ stems });

  // Memoized stem data with effective values
  const enrichedStems = useMemo(() => 
    stems.map(stem => ({
      ...stem,
      state: stemStates[stem.id] || { volume: 1, muted: false, solo: false, pan: 0 },
      effectiveVolume: getEffectiveVolume(stem.id),
      isEffectivelyMuted: isStemEffectivelyMuted(stem.id),
    })),
    [stems, stemStates, getEffectiveVolume, isStemEffectivelyMuted]
  );

  // Handlers - pass id to match OptimizedMixerChannel signature
  const handleVolumeChange = useCallback((stemId: string, value: number) => {
    setStemVolume(stemId, value);
  }, [setStemVolume]);

  const handleMuteToggle = useCallback((stemId: string) => {
    toggleMute(stemId);
  }, [toggleMute]);

  const handleSoloToggle = useCallback((stemId: string) => {
    toggleSolo(stemId);
  }, [toggleSolo]);

  const handleMasterMuteToggle = useCallback(() => {
    setMasterMuted(!masterMuted);
  }, [masterMuted, setMasterMuted]);

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={cn(
        'flex bg-background/95 backdrop-blur-sm border rounded-lg',
        isVertical ? 'flex-col h-full' : 'flex-row w-full',
        className
      )}
    >
      {/* Channels */}
      <ScrollArea
        className={cn(
          'flex-1',
          isVertical ? 'h-full' : 'w-full'
        )}
      >
        <div
          className={cn(
            'flex gap-1 p-2',
            isVertical ? 'flex-row' : 'flex-col'
          )}
        >
          {enrichedStems.map(stem => (
            <OptimizedMixerChannel
              key={stem.id}
              id={stem.id}
              name={stem.stem_type}
              volume={stem.state.volume}
              muted={stem.state.muted}
              solo={stem.state.solo}
              isPlaying={!stem.isEffectivelyMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleMuteToggle}
              onToggleSolo={handleSoloToggle}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Master Channel */}
      {showMaster && (
        <div
          className={cn(
            'flex items-center gap-3 p-3 border-t',
            isVertical && 'border-t-0 border-l flex-col'
          )}
        >
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">Master</span>
          </div>
          
          <OptimizedVolumeSlider
            value={masterVolume}
            onChange={setMasterVolume}
            muted={masterMuted}
            onMuteToggle={handleMasterMuteToggle}
            orientation={isVertical ? 'vertical' : 'horizontal'}
            size={compact ? 'sm' : 'md'}
            showIcon={false}
          />
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={resetToDefaults}
            title="Reset mixer"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
});
