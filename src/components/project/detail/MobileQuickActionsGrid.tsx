/**
 * MobileQuickActionsGrid - 2x2 icon grid for mobile project actions
 * Uses IconGridButton pattern with Telegram haptic feedback
 */

import { memo } from "react";
import { Plus, Sparkles, Share2, Wand2 } from "@/lib/icons";
import { IconGridButton } from "@/components/track-actions/IconGridButton";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";
import { EASE_OUT } from "@/lib/motion-presets";

const gridContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};

const gridItem = {
  hidden: { opacity: 0, y: 8, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: EASE_OUT },
};

interface MobileQuickActionsGridProps {
  isGenerating?: boolean;
  onAddTrack: () => void;
  onGenerateTracklist: () => void;
  onOpenAI: () => void;
  onShare: () => void;
  className?: string;
}

export const MobileQuickActionsGrid = memo(function MobileQuickActionsGrid({
  isGenerating = false,
  onAddTrack,
  onGenerateTracklist,
  onOpenAI,
  onShare,
  className,
}: MobileQuickActionsGridProps) {
  return (
    <motion.div
      variants={gridContainer}
      initial="hidden"
      animate="show"
      className={cn(
        "grid grid-cols-4 gap-1 px-3 py-2",
        "bg-background/95 backdrop-blur-md border-b border-border/50",
        className,
      )}
    >
      <motion.div variants={gridItem}>
        <IconGridButton icon={Plus} label="Трек" color="green" onClick={onAddTrack} haptic />
      </motion.div>
      <motion.div variants={gridItem}>
        <IconGridButton
          icon={Sparkles}
          label="AI Треклист"
          color="purple"
          onClick={onGenerateTracklist}
          loading={isGenerating}
          disabled={isGenerating}
          haptic
        />
      </motion.div>
      <motion.div variants={gridItem}>
        <IconGridButton icon={Wand2} label="AI Действия" color="pink" onClick={onOpenAI} haptic />
      </motion.div>
      <motion.div variants={gridItem}>
        <IconGridButton icon={Share2} label="Поделиться" color="blue" onClick={onShare} haptic />
      </motion.div>
    </motion.div>
  );
});

export default MobileQuickActionsGrid;
