/**
 * StemTrackRow
 * 
 * Individual stem track for the unified timeline.
 * Shows waveform, mute/solo controls, and clickable for stem focus.
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Mic2, Guitar, Drum, Music, Piano, Waves, Volume2, VolumeX, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrackStem } from '@/hooks/useTrackStems';
import { StemWaveform } from '../StemWaveform';

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface StemTrackRowProps {
  stem: TrackStem;
  state: StemState;
  hasSolo: boolean;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isFocused: boolean;
  onToggle: (type: 'mute' | 'solo') => void;
  onSeek?: (time: number) => void;
  onClick: () => void;
}

const stemConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string; waveColor: string }> = {
  vocals: { icon: Mic2, label: 'Вокал', color: 'text-blue-500 bg-blue-500/10', waveColor: '#3b82f6' },
  vocal: { icon: Mic2, label: 'Вокал', color: 'text-blue-500 bg-blue-500/10', waveColor: '#3b82f6' },
  backing_vocals: { icon: Mic2, label: 'Бэк', color: 'text-cyan-500 bg-cyan-500/10', waveColor: '#06b6d4' },
  drums: { icon: Drum, label: 'Ударные', color: 'text-orange-500 bg-orange-500/10', waveColor: '#f97316' },
  bass: { icon: Waves, label: 'Бас', color: 'text-purple-500 bg-purple-500/10', waveColor: '#a855f7' },
  guitar: { icon: Guitar, label: 'Гитара', color: 'text-amber-500 bg-amber-500/10', waveColor: '#f59e0b' },
  keyboard: { icon: Piano, label: 'Клавишные', color: 'text-pink-500 bg-pink-500/10', waveColor: '#ec4899' },
  piano: { icon: Piano, label: 'Пианино', color: 'text-pink-500 bg-pink-500/10', waveColor: '#ec4899' },
  strings: { icon: Music, label: 'Струнные', color: 'text-emerald-500 bg-emerald-500/10', waveColor: '#10b981' },
  instrumental: { icon: Guitar, label: 'Инструментал', color: 'text-green-500 bg-green-500/10', waveColor: '#22c55e' },
  other: { icon: Music2, label: 'Другое', color: 'text-gray-500 bg-gray-500/10', waveColor: '#6b7280' },
};

export const StemTrackRow = memo(({
  stem,
  state,
  hasSolo,
  duration,
  currentTime,
  isPlaying,
  isFocused,
  onToggle,
  onSeek,
  onClick,
}: StemTrackRowProps) => {
  const config = stemConfig[stem.stem_type.toLowerCase()] || stemConfig.other;
  const Icon = config.icon;
  const isMuted = state.muted || (hasSolo && !state.solo);

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-lg transition-all cursor-pointer group",
        isMuted ? "opacity-40" : "opacity-100",
        isFocused 
          ? "bg-primary/10 ring-1 ring-primary/30" 
          : "hover:bg-muted/30",
        state.solo && !isFocused && "bg-primary/5 ring-1 ring-primary/20"
      )}
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Stem Label + Controls */}
      <div className="flex items-center gap-1.5 min-w-[100px] flex-shrink-0">
        <div className={cn(
          "flex items-center justify-center w-5 h-5 rounded flex-shrink-0",
          config.color,
          isFocused && "ring-1 ring-primary"
        )}>
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-[10px] font-medium truncate w-12">{config.label}</span>
        
        {/* Solo/Mute controls - stop propagation to not trigger row click */}
        <div className="flex items-center gap-0.5">
          <Button
            variant={state.solo ? "default" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggle('solo');
            }}
            className={cn(
              "h-4 w-4 p-0 text-[8px] font-bold",
              state.solo && "bg-primary text-primary-foreground"
            )}
          >
            S
          </Button>
          <Button
            variant={state.muted ? "destructive" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggle('mute');
            }}
            className="h-4 w-4 p-0"
          >
            {state.muted ? (
              <VolumeX className="w-2.5 h-2.5" />
            ) : (
              <Volume2 className="w-2.5 h-2.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Compact Waveform */}
      <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        <StemWaveform
          audioUrl={stem.audio_url}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          isMuted={isMuted}
          color={isFocused ? 'hsl(var(--primary))' : config.waveColor}
          height={24}
          onSeek={onSeek}
        />
      </div>

      {/* Focus indicator */}
      {isFocused && (
        <motion.div
          className="w-1 h-4 bg-primary rounded-full"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
        />
      )}
    </motion.div>
  );
});

StemTrackRow.displayName = 'StemTrackRow';
