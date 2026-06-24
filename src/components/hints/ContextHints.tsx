/**
 * ContextHints — canonical overlay that auto-shows the next unseen hint
 * for a given context (library, player, studio, generation, social).
 *
 * Drop-in replacement for the legacy `<ContextualTipOverlay context="..." />`.
 * Renders nothing if every hint for the context is already seen.
 *
 * Visual presentation, exclusivity, modal suppression and "seen" storage
 * are all handled by `UnifiedTipCard` + `HintRegistry`.
 */

import { memo, useMemo } from 'react';
import { getHintsByContext, type HintContext } from './registry';
import { useHintRegistry } from './HintRegistry';
import { UnifiedTipCard } from './UnifiedTipCard';

interface ContextHintsProps {
  context: HintContext;
  /** Delay before showing the first tip (ms). */
  delay?: number;
}

export const ContextHints = memo(function ContextHints({
  context,
  delay = 2500,
}: ContextHintsProps) {
  const reg = useHintRegistry();

  // Re-evaluate on every render — the registry triggers a re-render
  // when a hint is marked seen, so this naturally advances to the next.
  const next = useMemo(() => {
    const tips = getHintsByContext(context);
    return tips.find((t) => !reg.hasSeen(t.id));
    // hasSeen reads from the same ref that force-renders on mutation,
    // so depending on `reg.activeId` keeps us in sync without leaking.
  }, [context, reg, reg.activeId]);

  if (!next) return null;

  return (
    <UnifiedTipCard
      id={next.id}
      title={next.title}
      message={next.message}
      emoji={next.emoji}
      delay={delay}
      onDismiss={() => {
        /* registry handles seen + release */
      }}
    />
  );
});

export default ContextHints;
