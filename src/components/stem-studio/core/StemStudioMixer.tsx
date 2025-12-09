/**
 * Stem Studio Mixer Component
 * 
 * Master volume control panel
 * Extracted from StemStudioContent for better organization
 */

import { memo } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface StemStudioMixerProps {
  masterVolume: number;
  masterMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

export const StemStudioMixer = memo(({
  masterVolume,
  masterMuted,
  onVolumeChange,
  onMuteToggle,
}: StemStudioMixerProps) => {
  return (
    <div className="px-4 sm:px-6 py-3 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMuteToggle}
          className={cn(
            "h-9 w-9 rounded-full flex-shrink-0",
            masterMuted && "text-destructive"
          )}
        >
          {masterMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide">Master</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
          <Slider
            value={[masterVolume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => onVolumeChange(v[0])}
            className="w-full"
            disabled={masterMuted}
          />
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.masterVolume === nextProps.masterVolume &&
    prevProps.masterMuted === nextProps.masterMuted
  );
});

StemStudioMixer.displayName = 'StemStudioMixer';
