/**
 * Mobile Master Volume
 * 
 * Compact single-line master volume control
 */

import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface MobileMasterVolumeProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

export function MobileMasterVolume({
  volume,
  muted,
  onVolumeChange,
  onMuteToggle,
}: MobileMasterVolumeProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-card/50">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMuteToggle}
        className={cn(
          "h-8 w-8 rounded-full flex-shrink-0",
          muted && "text-destructive"
        )}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </Button>
      
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-12">
          Master
        </span>
        <Slider
          value={[volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => onVolumeChange(v[0])}
          className="flex-1"
          disabled={muted}
        />
        <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}
