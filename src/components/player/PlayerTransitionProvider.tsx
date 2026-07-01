import { createContext, useContext, useId, useMemo, type ReactNode } from "react";
import { logger } from "@/lib/logger";

interface PlayerTransitionContextValue {
  artworkLayoutId: string;
  playerLayoutId: string;
}

const PlayerTransitionContext = createContext<PlayerTransitionContextValue | null>(null);

// Stable fallback ids — used only if a consumer renders outside a Provider.
// Framer Motion tolerates duplicate layoutIds; the animation just won't cross-fade
// between two players simultaneously, which is acceptable degradation.
const FALLBACK_VALUE: PlayerTransitionContextValue = {
  artworkLayoutId: "player-artwork-fallback",
  playerLayoutId: "player-shell-fallback",
};

let hasWarnedMissingProvider = false;

/**
 * Read the player transition ids. If no `PlayerTransitionProvider` is mounted
 * above the caller, this returns stable fallback ids instead of throwing —
 * preventing the whole player subtree (e.g. `CoverPage`) from crashing the app
 * when it's rendered on standalone routes like `/track/:trackId`.
 */
export function usePlayerTransition(): PlayerTransitionContextValue {
  const ctx = useContext(PlayerTransitionContext);
  if (!ctx) {
    if (!hasWarnedMissingProvider) {
      hasWarnedMissingProvider = true;
      logger.warn(
        "usePlayerTransition: no PlayerTransitionProvider in tree, using fallback ids. " +
          "Wrap the player subtree in <PlayerTransitionProvider> for shared-layout animations.",
      );
    }
    return FALLBACK_VALUE;
  }
  return ctx;
}

export function PlayerTransitionProvider({ children }: { children: ReactNode }) {
  const id = useId();
  const value = useMemo(
    () => ({
      artworkLayoutId: `player-artwork-${id}`,
      playerLayoutId: `player-shell-${id}`,
    }),
    [id],
  );
  return <PlayerTransitionContext.Provider value={value}>{children}</PlayerTransitionContext.Provider>;
}
