/**
 * ProjectPresetsCarousel - Horizontal carousel of project presets
 * 
 * Quick one-tap project creation from templates
 * Mobile-optimized with snap scrolling
 */

import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Folder, ArrowRight, Sparkles } from 'lucide-react';
import { PROJECT_PRESETS, type ProjectPreset, getProjectTypeLabel } from '@/constants/projectPresets';
import { useTelegram } from '@/contexts/TelegramContext';

interface ProjectPresetsCarouselProps {
  className?: string;
  maxPresets?: number;
}

const ProjectPresetCard = memo(function ProjectPresetCard({
  preset,
  index,
  onClick,
}: {
  preset: ProjectPreset;
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
        "flex-shrink-0 w-[140px] p-3 rounded-xl text-left",
        "border border-border/50 hover:border-primary/40",
        "bg-card hover:bg-accent/50",
        "transition-all duration-200 touch-manipulation",
        "snap-start"
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Emoji & Type */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{preset.emoji}</span>
        <span className={cn(
          "text-[9px] px-1.5 py-0.5 rounded-full",
          preset.bgClass,
          preset.colorClass
        )}>
          {getProjectTypeLabel(preset.type)}
        </span>
      </div>
      
      {/* Name */}
      <h4 className="text-sm font-medium truncate mb-0.5">
        {preset.name}
      </h4>
      
      {/* Short description */}
      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
        {preset.shortDescription}
      </p>
      
      {/* CTA */}
      <div className="flex items-center gap-1 text-primary">
        <span className="text-[10px] font-medium">Создать</span>
        <ArrowRight className="w-3 h-3" />
      </div>
    </motion.button>
  );
});

export const ProjectPresetsCarousel = memo(function ProjectPresetsCarousel({
  className,
  maxPresets = 6,
}: ProjectPresetsCarouselProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const handlePresetClick = useCallback((preset: ProjectPreset) => {
    hapticFeedback('medium');
    // Store preset in sessionStorage for ProjectCreationWizard
    sessionStorage.setItem('projectPreset', JSON.stringify(preset));
    navigate('/projects?action=create');
  }, [hapticFeedback, navigate]);

  const visiblePresets = PROJECT_PRESETS.slice(0, maxPresets);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Folder className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">Проекты</span>
        </div>
        <motion.button
          onClick={() => {
            hapticFeedback('light');
            navigate('/projects');
          }}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          whileTap={{ scale: 0.95 }}
        >
          Все проекты
          <ArrowRight className="w-3 h-3" />
        </motion.button>
      </div>

      {/* Carousel */}
      <div className="relative -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
          {visiblePresets.map((preset, index) => (
            <ProjectPresetCard
              key={preset.id}
              preset={preset}
              index={index}
              onClick={() => handlePresetClick(preset)}
            />
          ))}
          
          {/* "Create custom" card */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: visiblePresets.length * 0.05, duration: 0.2 }}
            onClick={() => {
              hapticFeedback('light');
              navigate('/projects?action=create');
            }}
            className={cn(
              "flex-shrink-0 w-[100px] p-3 rounded-xl",
              "border border-dashed border-border/50 hover:border-primary/40",
              "bg-muted/30 hover:bg-muted/50",
              "flex flex-col items-center justify-center gap-2",
              "transition-all duration-200 touch-manipulation",
              "snap-start"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-5 h-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground text-center">
              Свой проект
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
});
