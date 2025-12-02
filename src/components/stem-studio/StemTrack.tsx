import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Music2, Mic, Volume2, Wind, Drum, VolumeX, type LucideIcon } from 'lucide-react';
import { TrackStem } from '@/hooks/useTrackStems';
import { cn } from '@/lib/utils';

interface StemTrackProps {
  stem: TrackStem;
  state: { muted: boolean; solo: boolean; volume: number };
  onToggle: (type: 'mute' | 'solo') => void;
  onVolumeChange: (volume: number) => void;
  isPlaying: boolean;
}

const stemIcons: Record<string, LucideIcon> = {
  vocal: Mic,
  instrumental: Music2,
  drums: Drum,
  bass: Music2,
  atmosphere: Wind,
};

const stemColors: Record<string, string> = {
  vocal: 'emerald',
  instrumental: 'blue',
  drums: 'orange',
  bass: 'violet',
  atmosphere: 'pink',
};

// Generate stable waveform heights based on stem type
const generateWaveformHeights = (stemType: string): number[] => {
  const seed = stemType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const heights: number[] = [];
  for (let i = 0; i < 60; i++) {
    // Use seed-based pseudo-random generation for consistent heights
    const pseudoRandom = ((seed + i) * 9301 + 49297) % 233280 / 233280;
    heights.push(pseudoRandom * 80 + 20);
  }
  return heights;
};

export function StemTrack({ stem, state, onToggle, onVolumeChange, isPlaying }: StemTrackProps) {
  const stemType = stem.stem_type.toLowerCase();
  const Icon = stemIcons[stemType] || Music2;
  const color = stemColors[stemType] || 'neutral';
  const waveformHeights = generateWaveformHeights(stemType);
  
  const isSoloActive = state.solo;
  const colorClass = `${color}-500`;

  return (
    <Card className={cn(
      "group relative p-4 transition-all duration-300",
      isSoloActive && `bg-${color}-950/10 border-${color}-500/20`,
      state.muted && "opacity-50"
    )}>
      {isSoloActive && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${color}-500 rounded-l-lg`} />
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
            `bg-${color}-500/10 text-${color}-500`,
            isSoloActive && `bg-${color}-500/20`
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold capitalize">{stem.stem_type}</h3>
            <p className="text-xs text-muted-foreground">
              {stem.separation_mode === 'simple' ? 'Простое' : 'Детальное'} разделение
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Solo/Mute Buttons */}
          <div className="flex gap-1.5 bg-background/40 p-1 rounded-lg border border-border/50">
            <Button
              variant={isSoloActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                "w-7 h-7 text-xs font-bold p-0",
                isSoloActive && "shadow-[0_0_12px_rgba(139,92,246,0.4)]"
              )}
              onClick={() => onToggle('solo')}
            >
              S
            </Button>
            <Button
              variant={state.muted ? "destructive" : "ghost"}
              size="sm"
              className={cn(
                "w-7 h-7 text-xs font-bold p-0",
                state.muted && "bg-red-500/10 text-red-500 border-red-500/50"
              )}
              onClick={() => onToggle('mute')}
            >
              M
            </Button>
          </div>
          
          {/* Volume Control */}
          <div className="flex items-center gap-3 min-w-[140px]">
            {state.muted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            )}
            <Slider
              value={[state.volume * 100]}
              onValueChange={([val]) => onVolumeChange(val / 100)}
              max={100}
              step={1}
              className="w-24"
              disabled={state.muted}
            />
            <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
              {Math.round(state.volume * 100)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Waveform Visualization */}
      <div className="h-12 w-full flex items-center gap-[2px] opacity-60 group-hover:opacity-100 transition-opacity">
        {waveformHeights.map((height, i) => {
          const isAccent = i % 8 === 0;
          
          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-sm transition-all min-w-[2px]",
                isAccent ? "bg-foreground/30" : "bg-foreground/10",
                isPlaying && !state.muted && "animate-pulse"
              )}
              style={{ 
                height: `${height}%`,
                animationDelay: `${i * 0.05}s`,
                animationDuration: '0.6s'
              }}
            />
          );
        })}
      </div>
    </Card>
  );
}
