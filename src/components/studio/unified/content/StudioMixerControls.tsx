/**
 * StudioMixerControls Component
 *
 * Mixer controls for stem tracks (volume, mute, solo).
 * Extracted from UnifiedStudioContent for better maintainability.
 *
 * @feature Spec 001 - Phase 3: Component Maintainability
 * @priority P1 - Split UnifiedStudioContent (1477 lines → 5 components)
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrackStem } from '@/hooks/useStudioData';
import type { StemState } from './StudioAudioManager';

export interface StudioMixerControlsProps {
  stems: TrackStem[];
  stemStates: Record<string, StemState>;
  masterVolume: number;
  masterMuted: boolean;
  onStemStateChange: (stemId: string, state: Partial<StemState>) => void;
  onMasterVolumeChange: (volume: number) => void;
  onMasterMutedChange: (muted: boolean) => void;
  isMobile?: boolean;
  className?: string;
}

export const StudioMixerControls = React.forwardRef<
  HTMLDivElement,
  StudioMixerControlsProps
>(({
  stems,
  stemStates,
  masterVolume,
  masterMuted,
  onStemStateChange,
  onMasterVolumeChange,
  onMasterMutedChange,
  isMobile = false,
  className,
}, ref) => {
  return (
    <div ref={ref} className={cn("space-y-4", className)}>
      {/* Master Volume */}
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onMasterMutedChange(!masterMuted)}
        >
          {masterMuted || masterVolume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <div className="flex-1">
          <Slider
            value={[masterMuted ? 0 : masterVolume]}
            max={1}
            step={0.01}
            onValueChange={(v) => onMasterVolumeChange(v[0])}
            className="w-full"
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">
          {Math.round((masterMuted ? 0 : masterVolume) * 100)}
        </span>
      </div>

      {/* Stem Mixers */}
      <div className="space-y-2">
        {stems.map((stem) => {
          const state = stemStates[stem.id];
          if (!state) return null;

          const stemName = stem.stem_type.replace('_', ' ');
          const stemIcon = getStemIcon(stem.stem_type);

          return (
            <div
              key={stem.id}
              className="flex items-center gap-3 px-4 py-2 bg-card/50 rounded-lg hover:bg-card/80 transition-colors"
            >
              {/* Stem Icon */}
              <div className="h-8 w-8 shrink-0 flex items-center justify-center bg-primary/10 rounded">
                {stemIcon}
              </div>

              {/* Stem Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize truncate">
                    {stemName}
                  </span>
                  {state.solo && (
                    <Badge variant="secondary" className="text-[10px]">
                      SOLO
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mute Button */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 shrink-0",
                  state.muted && "bg-destructive/10 text-destructive"
                )}
                onClick={() =>
                  onStemStateChange(stem.id, { muted: !state.muted, solo: false })
                }
              >
                {state.muted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              {/* Volume Slider */}
              <div className="flex-1 max-w-[120px] sm:max-w-[160px]">
                <Slider
                  value={[state.muted ? 0 : state.volume]}
                  max={1}
                  step={0.01}
                  onValueChange={(v) =>
                    onStemStateChange(stem.id, { volume: v[0], muted: false })
                  }
                  className="w-full"
                />
              </div>

              {/* Volume Value */}
              <span className="text-xs font-mono text-muted-foreground w-10 shrink-0 hidden sm:block">
                {Math.round((state.muted ? 0 : state.volume) * 100)}
              </span>

              {/* Solo Button */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 shrink-0 text-xs",
                  state.solo && "bg-primary text-primary-foreground"
                )}
                onClick={() =>
                  onStemStateChange(stem.id, { solo: !state.solo, muted: false })
                }
              >
                S
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

StudioMixerControls.displayName = 'StudioMixerControls';

// Helper function to get stem icon
function getStemIcon(stemType: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    vocal: '🎤',
    instrumental: '🎸',
    drums: '🥁',
    bass: '🎸',
    other: '🎵',
  };

  return icons[stemType] || '🎵';
}
