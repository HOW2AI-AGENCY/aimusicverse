/**
 * useTipPosition — single source of truth for floating tip-card placement.
 *
 * Rules:
 *  - desktop (>=768px): pinned to bottom-right, fixed width, clear of edge.
 *  - mobile (<768px):
 *      - clears bottom-nav (~80px)
 *      - clears mini-player (~72px) when an active track is present
 *      - honors Telegram safe-area var AND iOS `env(safe-area-inset-bottom)`
 *      - always centered, full-width minus 12px gutters, capped to `max-w-md`
 *
 * z-index `95` keeps the card above the mini-player (z-60) and bottom-nav
 * but strictly below modal/sheet/drawer layers (z-150+).
 */
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";

const MOBILE_QUERY = "(max-width: 767px)";

/** Tailwind literals — listed in full so JIT picks them up at build time. */
const POS_DESKTOP = "fixed right-6 bottom-6 w-[360px] max-w-[calc(100vw-3rem)] z-[95]";
const POS_MOBILE_BASE = "fixed left-3 right-3 mx-auto max-w-md z-[95]";
const POS_MOBILE_NO_PLAYER =
  "bottom-[calc(5.5rem+max(var(--tg-safe-area-inset-bottom,0px),env(safe-area-inset-bottom,0px)))]";
const POS_MOBILE_WITH_PLAYER =
  "bottom-[calc(10rem+max(var(--tg-safe-area-inset-bottom,0px),env(safe-area-inset-bottom,0px)))]";

export interface TipPosition {
  isMobile: boolean;
  hasMiniPlayer: boolean;
  className: string;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export function useTipPosition(): TipPosition {
  const isMobile = useIsMobile();
  const hasMiniPlayer = usePlayerStore((s) => !!s.activeTrack);

  const className = useMemo(() => {
    if (!isMobile) return POS_DESKTOP;
    return cn(POS_MOBILE_BASE, hasMiniPlayer ? POS_MOBILE_WITH_PLAYER : POS_MOBILE_NO_PLAYER);
  }, [isMobile, hasMiniPlayer]);

  return { isMobile, hasMiniPlayer, className };
}
