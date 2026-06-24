/**
 * ContextualTipOverlay - thin adapter on top of the unified hints system.
 *
 * Kept for back-compat with existing call sites in pages. Internally
 * delegates to UnifiedTipCard + HintRegistry, so:
 *  - only ONE tip is visible at a time globally (no stacking on mobile);
 *  - tips don't show while a modal/sheet/drawer is open;
 *  - position respects safe-area and the mini-player on mobile, and
 *    pins to the bottom-right on desktop.
 */

import { memo } from 'react';
import { UnifiedTipCard } from '@/components/hints';
import { useAutoShowTip } from '@/hooks/useFeatureTips';

type TipContext = 'library' | 'player' | 'studio' | 'generation' | 'social';

interface ContextualTipOverlayProps {
  context: TipContext;
  /** Delay before showing first tip (ms) */
  delay?: number;
  /** Reserved for back-compat; the unified card decides its own position. */
  position?: 'top' | 'bottom';
  className?: string;
}

export const ContextualTipOverlay = memo(function ContextualTipOverlay({
  context,
  delay = 2000,
}: ContextualTipOverlayProps) {
  const { currentTip, dismissCurrentTip, hasUnseen } = useAutoShowTip(context, delay);

  if (!currentTip) return null;

  return (
    <UnifiedTipCard
      id={currentTip.id}
      title={currentTip.title}
      message={currentTip.message}
      emoji={currentTip.emoji}
      hasNext={hasUnseen}
      onDismiss={() => dismissCurrentTip(false)}
      onNext={() => dismissCurrentTip(true)}
      delay={0}
    />
  );
});

/**
 * Simple hook wrapper for pages that just need the overlay
 */
export function useContextualTips(context: TipContext) {
  return useAutoShowTip(context, 2500);
}

export default ContextualTipOverlay;
