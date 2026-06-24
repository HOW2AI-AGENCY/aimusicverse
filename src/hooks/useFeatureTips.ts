/**
 * useFeatureTips - Unified hook for managing feature discovery tips.
 *
 * Texts now live in the canonical registry at
 * `src/components/hints/registry.ts` — this module only re-exports them
 * under the legacy FEATURE_TIPS shape for back-compat and provides the
 * page-level orchestration hooks.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useHintTracking } from '@/hooks/useHintTracking';
import { HINT_REGISTRY, type HintId, type HintEntry } from '@/components/hints/registry';

export type FeatureTipId = HintId;

type FeatureTip = HintEntry;

/**
 * Feature tips configuration (canonical registry, re-exported).
 */
export const FEATURE_TIPS: Record<FeatureTipId, FeatureTip> = HINT_REGISTRY;


/**
 * Hook for managing a single feature tip
 */
export function useFeatureTip(tipId: FeatureTipId) {
  const { hasSeenHint, markAsSeen, resetHint } = useHintTracking(tipId);
  const tip = FEATURE_TIPS[tipId];

  return {
    tip,
    hasSeen: hasSeenHint,
    markAsSeen,
    resetHint,
    shouldShow: !hasSeenHint,
  };
}

/**
 * Hook for managing tips by context
 */
export function useContextTips(context: FeatureTip['context']) {
  const contextTips = useMemo(() => 
    Object.values(FEATURE_TIPS)
      .filter(tip => tip.context === context)
      .sort((a, b) => a.priority - b.priority),
    [context]
  );

  const [shownTipId, setShownTipId] = useState<FeatureTipId | null>(null);

  // Check which tips haven't been seen
  const getUnseenTips = useCallback(() => {
    return contextTips.filter(tip => {
      try {
        return localStorage.getItem(`hint_seen_${tip.id}`) !== 'true';
      } catch {
        return true;
      }
    });
  }, [contextTips]);

  // Show the highest priority unseen tip
  const showNextTip = useCallback(() => {
    const unseen = getUnseenTips();
    if (unseen.length > 0) {
      setShownTipId(unseen[0].id as FeatureTipId);
      return unseen[0];
    }
    return null;
  }, [getUnseenTips]);

  // Mark current tip as seen and optionally show next
  const dismissCurrentTip = useCallback((showNext = false) => {
    if (shownTipId) {
      try {
        localStorage.setItem(`hint_seen_${shownTipId}`, 'true');
      } catch {
        // Ignore storage errors
      }
    }
    
    if (showNext) {
      const unseen = getUnseenTips().filter(t => t.id !== shownTipId);
      setShownTipId(unseen.length > 0 ? (unseen[0].id as FeatureTipId) : null);
    } else {
      setShownTipId(null);
    }
  }, [shownTipId, getUnseenTips]);

  const currentTip = shownTipId ? FEATURE_TIPS[shownTipId] : null;

  return {
    contextTips,
    currentTip,
    shownTipId,
    showNextTip,
    dismissCurrentTip,
    unseenCount: getUnseenTips().length,
  };
}

/**
 * Hook for managing tutorial dialog state
 */
export function useTutorialDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [tutorialType, setTutorialType] = useState<string | null>(null);

  const openTutorial = useCallback((type: string) => {
    setTutorialType(type);
    setIsOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
    setTutorialType(null);
  }, []);

  return {
    isOpen,
    tutorialType,
    openTutorial,
    closeTutorial,
  };
}

/**
 * Hook for auto-showing tips on first page visit
 * Use this in pages to trigger onboarding automatically
 */
export function useAutoShowTip(context: FeatureTip['context'], delayMs: number = 2000) {
  const { currentTip, showNextTip, dismissCurrentTip, unseenCount } = useContextTips(context);
  const [hasTriggered, setHasTriggered] = useState(false);
  
  // Auto-show tip after delay on first visit
  useEffect(() => {
    if (hasTriggered || unseenCount === 0) return;
    
    const timer = setTimeout(() => {
      showNextTip();
      setHasTriggered(true);
    }, delayMs);
    
    return () => clearTimeout(timer);
  }, [hasTriggered, unseenCount, showNextTip, delayMs]);
  
  return {
    currentTip,
    dismissCurrentTip,
    hasUnseen: unseenCount > 0,
  };
}

export default useFeatureTip;
