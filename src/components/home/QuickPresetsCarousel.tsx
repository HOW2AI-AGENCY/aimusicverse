/**
 * QuickPresetsCarousel - Horizontal scrollable presets for quick generation
 * One-tap generation with pre-filled parameters
 */

import { motion } from '@/lib/motion';
import { Sparkles, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QUICK_CREATE_PRESETS, QuickCreatePreset } from '@/constants/quickCreatePresets';
import { useTelegram } from '@/contexts/TelegramContext';
import { useNavigate } from 'react-router-dom';

interface QuickPresetsCarouselProps {
  onSelectPreset: (preset: QuickCreatePreset) => void;
  className?: string;
}

// Category colors
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  rock: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  pop: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  electronic: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  jazz: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  classical: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'hip-hop': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
};

export function QuickPresetsCarousel({ onSelectPreset, className }: QuickPresetsCarouselProps) {
  const { hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  
  // Take first 6 presets for carousel
  const presets = QUICK_CREATE_PRESETS.slice(0, 6);

  const handlePresetClick = (preset: QuickCreatePreset) => {
    hapticFeedback('medium');
    // Store preset params in sessionStorage for GenerateSheet to pick up
    const presetParams = {
      presetId: preset.id,
      style: preset.defaultParams.style,
      mood: preset.defaultParams.mood,
      tempo: preset.defaultParams.tempo,
      instruments: preset.defaultParams.instruments,
      duration: preset.defaultParams.duration,
    };
    sessionStorage.setItem('presetParams', JSON.stringify(presetParams));
    onSelectPreset(preset);
  };

  const handleMoreClick = () => {
    hapticFeedback('light');
    navigate('/music-lab');
  };

  const getCategoryStyle = (category: string) => {
    return categoryColors[category] || { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' };
  };

  return (
    <section className={cn("mb-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold">Быстрый старт</h2>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>

      {/* Scrollable Presets */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 pb-2">
          {presets.map((preset, index) => {
            const colors = getCategoryStyle(preset.category);
            return (
              <motion.button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "flex-shrink-0 w-[120px] p-2.5 rounded-xl",
                  "bg-card/80 backdrop-blur-sm border hover:border-primary/50",
                  colors.border,
                  "transition-all duration-200 touch-manipulation",
                  "text-left group active:scale-95"
                )}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
              >
                {/* Icon with colored background */}
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center mb-2",
                  colors.bg
                )}>
                  <span className="text-xl">{preset.icon}</span>
                </div>
                
                {/* Name - extract just the text without emoji */}
                <h3 className="text-[11px] font-semibold truncate mb-1 group-hover:text-primary transition-colors leading-tight">
                  {preset.name.replace(/^[^\s]+\s/, '')}
                </h3>
                
                {/* Short description */}
                <p className="text-[9px] text-muted-foreground line-clamp-2 leading-tight">
                  {preset.description.slice(0, 40)}...
                </p>
              </motion.button>
            );
          })}
          
          {/* "More" card - clickable */}
          <motion.button
            onClick={handleMoreClick}
            className={cn(
              "flex-shrink-0 w-[70px] p-2.5 rounded-xl",
              "bg-muted/30 border border-dashed border-border hover:border-primary/40",
              "flex flex-col items-center justify-center text-muted-foreground",
              "transition-all duration-200 touch-manipulation hover:text-primary"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
          >
            <Sparkles className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Ещё</span>
            <span className="text-[9px]">+{QUICK_CREATE_PRESETS.length - 6}</span>
          </motion.button>
        </div>
      </div>
    </section>
  );
}
