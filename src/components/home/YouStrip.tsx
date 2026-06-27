/**
 * YouStrip — single personal status row for the home page.
 *
 * Replaces the previous duplication of GamificationBar + StatsHighlightBanner +
 * DailyTipCard stacked one after another. Renders the gamification bar (credits,
 * streak, level) as the only personal-status surface. Stats / DailyTip are now
 * surfaced elsewhere on demand to cut visual noise.
 */

import { Suspense, lazy } from "react";

const GamificationBar = lazy(() =>
  import("@/components/gamification/GamificationBar").then((m) => ({ default: m.GamificationBar })),
);

export const YouStrip = () => (
  <section aria-label="Ваш прогресс">
    <Suspense fallback={<div className="h-16 rounded-xl bg-muted/20 animate-pulse" />}>
      <GamificationBar />
    </Suspense>
  </section>
);
