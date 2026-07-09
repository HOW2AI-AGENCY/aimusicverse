/**
 * HomeDesktopSidebar — persistent right rail for lg+ screens.
 *
 * Adaptive stack for the desktop shell. Top slot is contextual:
 *   - if a track is playing → NowPlayingRail (cover + meta + play toggle)
 *   - else                  → nothing (widgets below fill the space)
 *
 * Below, the widgets are ordered by usefulness:
 *   1. YouStrip           — gamification (signed-in only)
 *   2. DailyTipCard       — rotating feature tip
 *   3. StatsHighlightBanner — live platform proof
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import { YouStrip } from "./YouStrip";
import { DailyTipCard } from "./DailyTipCard";
import { StatsHighlightBanner } from "./StatsHighlightBanner";
import { NowPlayingRail } from "./NowPlayingRail";

interface HomeDesktopSidebarProps {
  isAuthenticated: boolean;
  className?: string;
}

export const HomeDesktopSidebar = memo(function HomeDesktopSidebar({
  isAuthenticated,
  className,
}: HomeDesktopSidebarProps) {
  return (
    <div className={cn("flex flex-col gap-6 xl:gap-8", className)}>
      <NowPlayingRail />
      {isAuthenticated && <YouStrip />}
      <DailyTipCard />
      <StatsHighlightBanner />
    </div>
  );
});
