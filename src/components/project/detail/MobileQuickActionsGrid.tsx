/**
 * MobileQuickActionsGrid - 2x2 icon grid for mobile project actions
 * Uses IconGridButton pattern with Telegram haptic feedback
 */

import { memo } from 'react';
import { Plus, Sparkles, Share2, Wand2 } from 'lucide-react';
import { IconGridButton } from '@/components/track-actions/IconGridButton';
import { cn } from '@/lib/utils';

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
    <div className={cn(
      "grid grid-cols-4 gap-1 px-3 py-2",
      "bg-background/95 backdrop-blur-md border-b border-border/50",
      className
    )}>
      <IconGridButton
        icon={Plus}
        label="Трек"
        color="green"
        onClick={onAddTrack}
        haptic
      />
      <IconGridButton
        icon={Sparkles}
        label="AI Треклист"
        color="purple"
        onClick={onGenerateTracklist}
        loading={isGenerating}
        disabled={isGenerating}
        haptic
      />
      <IconGridButton
        icon={Wand2}
        label="AI Действия"
        color="pink"
        onClick={onOpenAI}
        haptic
      />
      <IconGridButton
        icon={Share2}
        label="Поделиться"
        color="blue"
        onClick={onShare}
        haptic
      />
    </div>
  );
});

export default MobileQuickActionsGrid;
