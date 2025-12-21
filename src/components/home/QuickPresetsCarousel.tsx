/**
 * QuickPresetsCarousel - Horizontal scrollable presets for quick generation
 * One-tap generation with pre-filled parameters
 */

import { motion } from '@/lib/motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QUICK_CREATE_PRESETS, QuickCreatePreset } from '@/constants/quickCreatePresets';
import { useTelegram } from '@/contexts/TelegramContext';

interface QuickPresetsCarouselProps {
  onSelectPreset: (preset: QuickCreatePreset) => void;
  className?: string;
}

export function QuickPresetsCarousel({ onSelectPreset, className }: QuickPresetsCarouselProps) {
  const { hapticFeedback } = useTelegram();
  
  // Take first 6 presets for carousel
  const presets = QUICK_CREATE_PRESETS.slice(0, 6);

  const handlePresetClick = (preset: QuickCreatePreset) => {
    hapticFeedback('medium');
    // Store preset in sessionStorage for GenerateSheet to pick up
    sessionStorage.setItem('quickPreset', JSON.stringify(preset));
    onSelectPreset(preset);
  };

  return (
    <section className={cn("mb-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Быстрый старт</h2>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
          Свайпай <ChevronRight className="w-3 h-3" />
        </span>
      </div>

      {/* Scrollable Presets */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2.5 pb-2">
          {presets.map((preset, index) => (
            <motion.button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                "flex-shrink-0 w-[130px] p-3 rounded-xl",
                "bg-card border border-border/60 hover:border-primary/40",
                "transition-all duration-200 touch-manipulation",
                "text-left group"
              )}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Icon */}
              <div className="text-2xl mb-2">{preset.icon}</div>
              
              {/* Name */}
              <h3 className="text-xs font-semibold truncate mb-0.5 group-hover:text-primary transition-colors">
                {preset.name.replace(/^[^\s]+\s/, '')} {/* Remove emoji from name */}
              </h3>
              
              {/* Category tag */}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                {preset.category}
              </span>
            </motion.button>
          ))}
          
          {/* "More" card */}
          <motion.div
            className={cn(
              "flex-shrink-0 w-[80px] p-3 rounded-xl",
              "bg-muted/50 border border-dashed border-border",
              "flex flex-col items-center justify-center text-muted-foreground"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-lg mb-1">+{QUICK_CREATE_PRESETS.length - 6}</span>
            <span className="text-[10px]">ещё</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
