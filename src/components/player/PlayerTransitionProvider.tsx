import { createContext, useContext, useId, useMemo, type ReactNode } from "react";

interface PlayerTransitionContextValue {
  artworkLayoutId: string;
  playerLayoutId: string;
}

const PlayerTransitionContext = createContext<PlayerTransitionContextValue | null>(null);

export function usePlayerTransition(): PlayerTransitionContextValue {
  const ctx = useContext(PlayerTransitionContext);
  if (!ctx) throw new Error("usePlayerTransition must be used within PlayerTransitionProvider");
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
