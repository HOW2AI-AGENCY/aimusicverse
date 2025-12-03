import { 
  Mic2, Guitar, Drum, Music, Piano, Radio, Waves,
  Volume2, VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { TrackStem } from '@/hooks/useTrackStems';

interface StemChannelProps {
  stem: TrackStem;
  state: {
    muted: boolean;
    solo: boolean;
    volume: number;
  };
  onToggle: (type: 'mute' | 'solo') => void;
  onVolumeChange: (volume: number) => void;
  isPlaying: boolean;
}

const stemConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
  vocals: { icon: Mic2, label: 'Вокал', color: 'text-blue-500 bg-blue-500/10' },
  vocal: { icon: Mic2, label: 'Вокал', color: 'text-blue-500 bg-blue-500/10' },
  backing_vocals: { icon: Mic2, label: 'Бэк-вокал', color: 'text-cyan-500 bg-cyan-500/10' },
  drums: { icon: Drum, label: 'Ударные', color: 'text-orange-500 bg-orange-500/10' },
  bass: { icon: Waves, label: 'Бас', color: 'text-purple-500 bg-purple-500/10' },
  guitar: { icon: Guitar, label: 'Гитара', color: 'text-amber-500 bg-amber-500/10' },
  keyboard: { icon: Piano, label: 'Клавишные', color: 'text-pink-500 bg-pink-500/10' },
  piano: { icon: Piano, label: 'Пианино', color: 'text-pink-500 bg-pink-500/10' },
  strings: { icon: Music, label: 'Струнные', color: 'text-emerald-500 bg-emerald-500/10' },
  brass: { icon: Radio, label: 'Духовые', color: 'text-yellow-500 bg-yellow-500/10' },
  woodwinds: { icon: Radio, label: 'Дер. духовые', color: 'text-lime-500 bg-lime-500/10' },
  percussion: { icon: Drum, label: 'Перкуссия', color: 'text-red-500 bg-red-500/10' },
  synth: { icon: Piano, label: 'Синтезатор', color: 'text-violet-500 bg-violet-500/10' },
  fx: { icon: Waves, label: 'Эффекты', color: 'text-teal-500 bg-teal-500/10' },
  atmosphere: { icon: Waves, label: 'Атмосфера', color: 'text-sky-500 bg-sky-500/10' },
  instrumental: { icon: Guitar, label: 'Инструментал', color: 'text-green-500 bg-green-500/10' },
  other: { icon: Music, label: 'Другое', color: 'text-gray-500 bg-gray-500/10' },
};

export const StemChannel = ({ 
  stem, 
  state, 
  onToggle, 
  onVolumeChange,
  isPlaying 
}: StemChannelProps) => {
  const config = stemConfig[stem.stem_type.toLowerCase()] || stemConfig.other;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-all",
      state.muted 
        ? "bg-muted/30 border-border/30 opacity-60" 
        : state.solo 
          ? "bg-primary/5 border-primary/30 shadow-sm" 
          : "bg-card border-border/50 hover:border-border"
    )}>
      {/* Icon */}
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
        config.color
      )}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Label & Volume */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium truncate">{config.label}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {Math.round(state.volume * 100)}%
          </span>
        </div>
        <Slider
          value={[state.volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => onVolumeChange(v[0])}
          disabled={state.muted}
          className="w-full"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant={state.solo ? "default" : "outline"}
          size="sm"
          onClick={() => onToggle('solo')}
          className={cn(
            "h-8 w-8 p-0 text-xs font-bold",
            state.solo && "bg-primary text-primary-foreground"
          )}
        >
          S
        </Button>
        <Button
          variant={state.muted ? "destructive" : "outline"}
          size="sm"
          onClick={() => onToggle('mute')}
          className="h-8 w-8 p-0"
        >
          {state.muted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
