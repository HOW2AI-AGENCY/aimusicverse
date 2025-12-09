/**
 * MobileStemCard - Compact horizontal stem card for mobile
 * 
 * Displays stem info, volume slider, and M/S buttons in a horizontal layout
 */

import { Volume2, VolumeX, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface MobileStemCardProps {
  stem: Tables<'track_stems'>;
  volume: number;
  muted: boolean;
  solo: boolean;
  anySoloActive: boolean;
  onVolumeChange: (value: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
}

const stemLabels: Record<string, { label: string; color: string }> = {
  vocals: { label: 'Вокал', color: 'bg-pink-500/20 text-pink-400' },
  drums: { label: 'Барабаны', color: 'bg-orange-500/20 text-orange-400' },
  bass: { label: 'Бас', color: 'bg-purple-500/20 text-purple-400' },
  other: { label: 'Другое', color: 'bg-blue-500/20 text-blue-400' },
  piano: { label: 'Пиано', color: 'bg-emerald-500/20 text-emerald-400' },
  guitar: { label: 'Гитара', color: 'bg-amber-500/20 text-amber-400' },
  melody: { label: 'Мелодия', color: 'bg-cyan-500/20 text-cyan-400' },
  instrumental: { label: 'Инструментал', color: 'bg-indigo-500/20 text-indigo-400' },
};

export function MobileStemCard({
  stem,
  volume,
  muted,
  solo,
  anySoloActive,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
}: MobileStemCardProps) {
  const stemInfo = stemLabels[stem.stem_type] || { 
    label: stem.stem_type, 
    color: 'bg-muted text-muted-foreground' 
  };
  
  const isEffectivelyMuted = muted || (anySoloActive && !solo);

  return (
    <div className={cn(
      "p-3 rounded-xl border border-border/50 bg-card/50",
      "transition-all duration-200",
      isEffectivelyMuted && "opacity-50"
    )}>
      <div className="flex items-center gap-3">
        {/* Stem Icon & Label */}
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
          stemInfo.color
        )}>
          <Music2 className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium truncate">{stemInfo.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {Math.round(volume * 100)}%
            </span>
          </div>
          
          {/* Volume Slider */}
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([v]) => onVolumeChange(v)}
            className="w-full"
          />
        </div>
        
        {/* M/S Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant={muted ? "default" : "ghost"}
            size="icon"
            onClick={onMuteToggle}
            className={cn(
              "h-8 w-8 rounded-lg text-xs font-bold",
              muted && "bg-destructive hover:bg-destructive/90"
            )}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : 'M'}
          </Button>
          <Button
            variant={solo ? "default" : "ghost"}
            size="icon"
            onClick={onSoloToggle}
            className={cn(
              "h-8 w-8 rounded-lg text-xs font-bold",
              solo && "bg-primary hover:bg-primary/90"
            )}
          >
            S
          </Button>
        </div>
      </div>
    </div>
  );
}
