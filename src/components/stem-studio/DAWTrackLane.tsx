import { memo } from 'react';
import {
  Mic2, Guitar, Drum, Music, Piano, Radio, Waves,
  Volume2, VolumeX, FileMusic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { TrackStem } from '@/hooks/useTrackStems';
import { OptimizedStemWaveform } from './OptimizedStemWaveform';

interface DAWTrackLaneProps {
  stem: TrackStem;
  index: number;
  state: {
    muted: boolean;
    solo: boolean;
    volume: number;
  };
  onToggle: (type: 'mute' | 'solo') => void;
  onVolumeChange: (volume: number) => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
}

const stemConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string; waveColor: string; bgColor: string }> = {
  vocals: { icon: Mic2, label: 'VOX', color: 'text-blue-400', waveColor: 'blue', bgColor: 'bg-blue-500/20' },
  vocal: { icon: Mic2, label: 'VOX', color: 'text-blue-400', waveColor: 'blue', bgColor: 'bg-blue-500/20' },
  backing_vocals: { icon: Mic2, label: 'BVX', color: 'text-cyan-400', waveColor: 'cyan', bgColor: 'bg-cyan-500/20' },
  drums: { icon: Drum, label: 'DRM', color: 'text-orange-400', waveColor: 'orange', bgColor: 'bg-orange-500/20' },
  bass: { icon: Waves, label: 'BAS', color: 'text-purple-400', waveColor: 'purple', bgColor: 'bg-purple-500/20' },
  guitar: { icon: Guitar, label: 'GTR', color: 'text-amber-400', waveColor: 'amber', bgColor: 'bg-amber-500/20' },
  keyboard: { icon: Piano, label: 'KEY', color: 'text-pink-400', waveColor: 'pink', bgColor: 'bg-pink-500/20' },
  piano: { icon: Piano, label: 'PNO', color: 'text-pink-400', waveColor: 'pink', bgColor: 'bg-pink-500/20' },
  strings: { icon: Music, label: 'STR', color: 'text-emerald-400', waveColor: 'emerald', bgColor: 'bg-emerald-500/20' },
  brass: { icon: Radio, label: 'BRS', color: 'text-yellow-400', waveColor: 'yellow', bgColor: 'bg-yellow-500/20' },
  woodwinds: { icon: Radio, label: 'WND', color: 'text-lime-400', waveColor: 'lime', bgColor: 'bg-lime-500/20' },
  percussion: { icon: Drum, label: 'PRC', color: 'text-red-400', waveColor: 'red', bgColor: 'bg-red-500/20' },
  synth: { icon: Piano, label: 'SYN', color: 'text-violet-400', waveColor: 'violet', bgColor: 'bg-violet-500/20' },
  fx: { icon: Waves, label: 'FX', color: 'text-teal-400', waveColor: 'teal', bgColor: 'bg-teal-500/20' },
  atmosphere: { icon: Waves, label: 'ATM', color: 'text-sky-400', waveColor: 'sky', bgColor: 'bg-sky-500/20' },
  instrumental: { icon: Guitar, label: 'INS', color: 'text-green-400', waveColor: 'green', bgColor: 'bg-green-500/20' },
  other: { icon: Music, label: 'OTH', color: 'text-gray-400', waveColor: 'gray', bgColor: 'bg-gray-500/20' },
};

export const DAWTrackLane = memo(({ 
  stem, 
  index,
  state, 
  onToggle, 
  onVolumeChange,
  isPlaying,
  currentTime,
  duration,
  onSeek,
}: DAWTrackLaneProps) => {
  const config = stemConfig[stem.stem_type.toLowerCase()] || stemConfig.other;
  const Icon = config.icon;
  
  const hasSolo = state.solo;
  const isMuted = state.muted || (!state.solo && hasSolo);

  return (
    <div className={cn(
      "flex h-[72px] border-b border-border/30 transition-all group",
      state.muted 
        ? "opacity-40" 
        : state.solo 
          ? "bg-primary/5" 
          : "hover:bg-accent/5"
    )}>
      {/* Track Header - Fixed width */}
      <div className={cn(
        "w-[180px] flex-shrink-0 flex items-center gap-2 px-2 border-r border-border/30",
        config.bgColor
      )}>
        {/* Track Number & Icon */}
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded text-xs font-mono font-bold",
          config.color,
          "bg-background/50"
        )}>
          {index + 1}
        </div>
        
        {/* Track Name & Volume */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon className={cn("w-3.5 h-3.5", config.color)} />
            <span className="text-xs font-semibold uppercase tracking-wide truncate">
              {config.label}
            </span>
          </div>
          <Slider
            value={[state.volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => onVolumeChange(v[0])}
            disabled={state.muted}
            className="w-full h-1"
          />
        </div>
        
        {/* Controls */}
        <div className="flex flex-col gap-0.5">
          <Button
            variant={state.muted ? "destructive" : "ghost"}
            size="sm"
            onClick={() => onToggle('mute')}
            className={cn(
              "h-6 w-6 p-0 text-[10px] font-bold",
              !state.muted && "hover:bg-destructive/20 hover:text-destructive"
            )}
          >
            M
          </Button>
          <Button
            variant={state.solo ? "default" : "ghost"}
            size="sm"
            onClick={() => onToggle('solo')}
            className={cn(
              "h-6 w-6 p-0 text-[10px] font-bold",
              state.solo && "bg-yellow-500 text-yellow-950 hover:bg-yellow-400",
              !state.solo && "hover:bg-yellow-500/20 hover:text-yellow-500"
            )}
          >
            S
          </Button>
        </div>
      </div>

      {/* Waveform Area - Optimized canvas-based renderer */}
      <div className="flex-1 relative overflow-hidden bg-background/30">
        <OptimizedStemWaveform
          audioUrl={stem.audio_url}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          isMuted={isMuted}
          color={config.waveColor}
          height={70}
          onSeek={onSeek}
        />
        
        {/* Volume indicator overlay */}
        <div 
          className="absolute top-1 right-2 text-[10px] font-mono text-muted-foreground/60"
        >
          {Math.round(state.volume * 100)}%
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.stem.id === nextProps.stem.id &&
    prevProps.index === nextProps.index &&
    prevProps.state.muted === nextProps.state.muted &&
    prevProps.state.solo === nextProps.state.solo &&
    prevProps.state.volume === nextProps.state.volume &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.currentTime === nextProps.currentTime &&
    prevProps.duration === nextProps.duration
  );
});

DAWTrackLane.displayName = 'DAWTrackLane';
