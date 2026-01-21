/**
 * QuickGenrePresets - One-tap genre presets for instant generation
 * Phase 7.3: Simplify first generation path (2 clicks)
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

interface QuickGenrePresetsProps {
  onSelectPreset: (preset: QuickPreset) => void;
  className?: string;
}

export interface QuickPreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  hasVocals: boolean;
}

const QUICK_PRESETS: QuickPreset[] = [
  { id: 'pop', label: 'Поп', emoji: '🎤', description: 'upbeat pop, catchy melody, modern production', hasVocals: true },
  { id: 'lofi', label: 'Лофи', emoji: '🎧', description: 'lofi hip hop, chill beats, relaxing, study music', hasVocals: false },
  { id: 'rock', label: 'Рок', emoji: '🎸', description: 'rock, electric guitar, drums, energetic', hasVocals: true },
  { id: 'electro', label: 'Электро', emoji: '🎹', description: 'electronic, synth, bass drop, EDM', hasVocals: false },
  { id: 'rnb', label: 'R&B', emoji: '🎷', description: 'R&B, smooth, soulful, groove', hasVocals: true },
  { id: 'hiphop', label: 'Хип-хоп', emoji: '🔥', description: 'hip hop, trap beats, 808 bass, modern rap', hasVocals: true },
];

export const QuickGenrePresets = memo(function QuickGenrePresets({
  onSelectPreset,
  className,
}: QuickGenrePresetsProps) {
  const { hapticFeedback } = useTelegram();

  const handleSelect = useCallback((preset: QuickPreset) => {
    hapticFeedback('medium');
    onSelectPreset(preset);
  }, [hapticFeedback, onSelectPreset]);

  return (
    <section className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Быстрый старт</span>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {QUICK_PRESETS.map((preset, index) => (
          <motion.button
            key={preset.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleSelect(preset)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5",
              "px-3 py-2 rounded-full",
              "bg-card/80 border border-border/50",
              "hover:bg-primary/10 hover:border-primary/30",
              "active:scale-95",
              "transition-all duration-150"
            )}
          >
            <span className="text-base">{preset.emoji}</span>
            <span className="text-xs font-medium whitespace-nowrap">{preset.label}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
});
