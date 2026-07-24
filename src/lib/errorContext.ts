/**
 * Error scope helpers — collect route + active track context for Sentry.
 *
 * Kept dependency-free (no React hooks). Reads Zustand store via `getState()`
 * so it can be called from error boundaries, window handlers, or async code.
 */

import { usePlayerStore } from "@/hooks/audio/usePlayerState";

export interface ErrorScope {
  route: string;
  search: string;
  activeTrackId?: string;
  activeTrackTitle?: string;
  activeVersionId?: string;
  isPlaying?: boolean;
  playerMode?: string;
  queueLength?: number;
}

/**
 * Snapshot the current UI state (route + player) for error reporting.
 * Safe to call in any environment — errors are swallowed.
 */
export function getErrorScope(): ErrorScope {
  const scope: ErrorScope = {
    route: "unknown",
    search: "",
  };

  try {
    if (typeof window !== "undefined") {
      scope.route = window.location?.pathname ?? "unknown";
      scope.search = window.location?.search ?? "";
    }
  } catch {
    /* ignore */
  }

  try {
    const state = usePlayerStore.getState();
    const t = state?.activeTrack;
    if (t) {
      scope.activeTrackId = t.id;
      scope.activeTrackTitle = t.title?.slice(0, 80);
      // active_version_id lives on Track in this codebase; guard for safety.
      const versionId = (t as unknown as { active_version_id?: string }).active_version_id;
      if (versionId) scope.activeVersionId = versionId;
    }
    scope.isPlaying = !!state?.isPlaying;
    scope.playerMode = state?.playerMode;
    scope.queueLength = state?.queue?.length ?? 0;
  } catch {
    /* ignore */
  }

  return scope;
}
