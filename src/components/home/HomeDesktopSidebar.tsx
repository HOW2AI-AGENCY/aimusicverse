/**
 * HomeDesktopSidebar — persistent right rail for lg+ screens.
 *
 * Density 7 (dense, DAW-adjacent): stack useful widgets in a compact
 * column so the sidebar is never empty for anonymous users and gives
 * signed-in users at-a-glance status without stealing feed space.
 *
 * Order (top → bottom):
 *   1. YouStrip           — gamification (signed-in only)
 *   2. DailyTipCard       — rotating feature tip
 *   3. StatsHighlightBanner — live platform proof
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import { YouStrip } from "./YouStrip";
import { DailyTipCard } from "./DailyTipCard";
import { StatsHighlightBanner } from "./StatsHighlightBanner";

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
      {isAuthenticated && <YouStrip />}
      <DailyTipCard />
      <StatsHighlightBanner />
    </div>
  );
});
