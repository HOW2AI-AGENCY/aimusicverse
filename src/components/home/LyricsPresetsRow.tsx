/**
 * LyricsPresetsRow - Horizontal row of lyrics AI presets
 * 
 * Quick one-tap lyrics creation with AI templates
 * Mobile-optimized with compact chip design
 */

import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Sparkles, PenTool, ArrowRight } from 'lucide-react';
import { LYRICS_PRESETS, type LyricsPreset, getQuickLyricsPresets } from '@/constants/lyricsPresets';
import { useTelegram } from '@/contexts/TelegramContext';

interface LyricsPresetsRowProps {
  className?: string;
  variant?: 'chips' | 'cards';
  maxPresets?: number;
}

const LyricsChip = memo(function LyricsChip({
  preset,
  index,
  onClick,
}: {
  preset: LyricsPreset;
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
        "bg-card hover:bg-accent/50",
        "transition-all duration-200 touch-manipulation",
        "flex items-center gap-1.5",
        "snap-start"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-base">{preset.emoji}</span>
      <span className="text-xs font-medium whitespace-nowrap">{preset.name}</span>
    </motion.button>
  );
});

const LyricsCard = memo(function LyricsCard({
  preset,
  index,
  onClick,
}: {
  preset: LyricsPreset;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-[130px] p-2.5 rounded-xl text-left",
        "border border-border/50 hover:border-primary/40",
        "bg-card hover:bg-accent/50",
        "transition-all duration-200 touch-manipulation",
        "snap-start"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Emoji */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xl">{preset.emoji}</span>
        <span className={cn(
          "text-[8px] px-1 py-0.5 rounded",
          preset.bgClass,
          preset.colorClass
        )}>
          {preset.genre.split(',')[0]}
        </span>
      </div>
      
      {/* Name */}
      <h4 className="text-xs font-medium truncate mb-0.5">
        {preset.name}
      </h4>
      
      {/* Structure */}
      <p className="text-[9px] text-muted-foreground truncate">
        {preset.structureDescription}
      </p>
    </motion.button>
  );
});

export const LyricsPresetsRow = memo(function LyricsPresetsRow({
  className,
  variant = 'chips',
  maxPresets = 8,
}: LyricsPresetsRowProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const handlePresetClick = useCallback((preset: LyricsPreset) => {
    hapticFeedback('medium');
    // Store preset in sessionStorage for LyricsStudio
    sessionStorage.setItem('lyricsPreset', JSON.stringify(preset));
    navigate('/lyrics-studio');
  }, [hapticFeedback, navigate]);

  const visiblePresets = variant === 'chips' 
    ? getQuickLyricsPresets() 
    : LYRICS_PRESETS.slice(0, maxPresets);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Presets row */}
      <div className="relative -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
          {visiblePresets.map((preset, index) => (
            variant === 'chips' ? (
              <LyricsChip
                key={preset.id}
                preset={preset}
                index={index}
                onClick={() => handlePresetClick(preset)}
              />
            ) : (
              <LyricsCard
                key={preset.id}
                preset={preset}
                index={index}
                onClick={() => handlePresetClick(preset)}
              />
            )
          ))}
          
          {/* "More" button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: visiblePresets.length * 0.03, duration: 0.15 }}
            onClick={() => {
              hapticFeedback('light');
              navigate('/lyrics-studio');
            }}
            className={cn(
              variant === 'chips'
                ? "flex-shrink-0 px-3 py-2 rounded-full"
                : "flex-shrink-0 w-[80px] p-2.5 rounded-xl",
              "border border-dashed border-border/50 hover:border-primary/40",
              "bg-muted/30 hover:bg-muted/50",
              "flex items-center justify-center gap-1.5",
              "transition-all duration-200 touch-manipulation",
              "snap-start"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xs text-muted-foreground">Ещё</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </motion.button>
        </div>
      </div>
    </div>
  );
});
