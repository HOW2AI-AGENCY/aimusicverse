/**
 * TrackPresetsRow - One-tap genre presets for instant track generation
 * Integrated into unified CreativePresetsSection with tabs
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Music, ArrowRight } from 'lucide-react';
import { useTelegram } from '@/contexts/TelegramContext';

export interface TrackPreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  hasVocals: boolean;
}

const TRACK_PRESETS: TrackPreset[] = [
  { id: 'pop', label: 'Поп', emoji: '🎤', description: 'upbeat pop, catchy melody, modern production', hasVocals: true },
  { id: 'lofi', label: 'Лофи', emoji: '🎧', description: 'lofi hip hop, chill beats, relaxing, study music', hasVocals: false },
  { id: 'rock', label: 'Рок', emoji: '🎸', description: 'rock, electric guitar, drums, energetic', hasVocals: true },
  { id: 'electro', label: 'Электро', emoji: '🎹', description: 'electronic, synth, bass drop, EDM', hasVocals: false },
  { id: 'rnb', label: 'R&B', emoji: '🎷', description: 'R&B, smooth, soulful, groove', hasVocals: true },
  { id: 'hiphop', label: 'Хип-хоп', emoji: '🔥', description: 'hip hop, trap beats, 808 bass, modern rap', hasVocals: true },
  { id: 'jazz', label: 'Джаз', emoji: '🎺', description: 'jazz, smooth, saxophone, piano, swing', hasVocals: false },
  { id: 'ambient', label: 'Эмбиент', emoji: '🌙', description: 'ambient, atmospheric, dreamy, ethereal', hasVocals: false },
];

interface TrackPresetsRowProps {
  onSelectPreset: (preset: TrackPreset) => void;
  className?: string;
  variant?: 'chips' | 'cards';
}

const TrackChip = memo(function TrackChip({
  preset,
  index,
  onClick,
}: {
  preset: TrackPreset;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.15 }}
      onClick={onClick}
      className={cn(
        "flex-shrink-0 px-3 py-2 rounded-full",
        "border border-border/50 hover:border-primary/40",
        "bg-card hover:bg-primary/10",
        "transition-all duration-200 touch-manipulation",
        "flex items-center gap-1.5",
        "snap-start min-h-[40px]"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-base">{preset.emoji}</span>
      <span className="text-xs font-medium whitespace-nowrap">{preset.label}</span>
      {preset.hasVocals && (
        <span className="text-[8px] px-1 py-0.5 rounded bg-primary/20 text-primary">🎤</span>
      )}
    </motion.button>
  );
});

const TrackCard = memo(function TrackCard({
  preset,
  index,
  onClick,
}: {
  preset: TrackPreset;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-[115px] p-3 rounded-xl text-left relative overflow-hidden",
        "border border-border/50 hover:border-primary/50",
        "bg-gradient-to-br from-card to-card/50 hover:from-primary/5 hover:to-card/80",
        "transition-all duration-200 touch-manipulation",
        "snap-start group"
      )}
      whileTap={{ scale: 0.97 }}
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-300 rounded-xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl drop-shadow-sm">{preset.emoji}</span>
          {preset.hasVocals ? (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium border border-primary/30">
              🎤
            </span>
          ) : (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-medium">
              🎵
            </span>
          )}
        </div>
        <h4 className="text-sm font-semibold truncate mb-0.5">{preset.label}</h4>
        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
          {preset.description.split(',').slice(0, 2).join(', ')}
        </p>
      </div>
    </motion.button>
  );
});

export const TrackPresetsRow = memo(function TrackPresetsRow({
  onSelectPreset,
  className,
  variant = 'cards',
}: TrackPresetsRowProps) {
  const { hapticFeedback } = useTelegram();

  const handlePresetClick = useCallback((preset: TrackPreset) => {
    hapticFeedback('medium');
    onSelectPreset(preset);
  }, [hapticFeedback, onSelectPreset]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Presets row */}
      <div className="relative -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
          {TRACK_PRESETS.map((preset, index) => (
            variant === 'chips' ? (
              <TrackChip
                key={preset.id}
                preset={preset}
                index={index}
                onClick={() => handlePresetClick(preset)}
              />
            ) : (
              <TrackCard
                key={preset.id}
                preset={preset}
                index={index}
                onClick={() => handlePresetClick(preset)}
              />
            )
          ))}
        </div>
      </div>
    </div>
  );
});

export { TRACK_PRESETS };
