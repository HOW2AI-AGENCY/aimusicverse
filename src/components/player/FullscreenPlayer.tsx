/**
 * FullscreenPlayer — unified entry point for the full-screen player surface.
 *
 * Replaces direct usage of `MobileFullscreenPlayer`, `DesktopFullscreenPlayer`,
 * and `ExpandedPlayer`. Dispatches to the correct viewport-specific
 * implementation and ensures lyrics are sourced from the **active/master**
 * track version so karaoke highlighting stays in sync after A/B switches.
 *
 * Internal layout subcomponents (`FullscreenMobile`, `FullscreenDesktop`)
 * are lazy-loaded to keep the initial bundle small.
 */

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMasterVersion } from "@/hooks/useTrackVersions";
import type { Track } from "@/types/track";

const FullscreenMobile = React.lazy(() =>
  import("./MobileFullscreenPlayer").then((m) => ({ default: m.MobileFullscreenPlayer })),
);

const FullscreenDesktop = React.lazy(() =>
  import("./DesktopFullscreenPlayer").then((m) => ({ default: m.DesktopFullscreenPlayer })),
);

export interface FullscreenPlayerProps {
  track: Track;
  onClose: () => void;
  /** Force a layout variant; otherwise determined by viewport. */
  variant?: "auto" | "mobile" | "desktop";
}

export function FullscreenPlayer({ track, onClose, variant = "auto" }: FullscreenPlayerProps) {
  const isMobileViewport = useIsMobile();
  const { data: masterVersion } = useMasterVersion(track?.id);

  const resolved = variant === "auto" ? (isMobileViewport ? "mobile" : "desktop") : variant;

  return (
    <React.Suspense fallback={null}>
      {resolved === "mobile" ? (
        <FullscreenMobile track={track} onClose={onClose} currentVersion={masterVersion ?? undefined} />
      ) : (
        <FullscreenDesktop track={track} currentVersion={masterVersion ?? undefined} onClose={onClose} />
      )}
    </React.Suspense>
  );
}

export default FullscreenPlayer;
