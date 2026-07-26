/**
 * LyricsStudioBanner — home entry point into the Lyrics Studio.
 *
 * Gives users a visible, single-tap path to the lyrics editor from the main
 * screen. Uses design-system glass tokens; no hardcoded colors.
 */

import { memo, useCallback } from "react";
import { useNavigate } from "react-router";
import { PenTool, Sparkles, ChevronRight } from "@/lib/icons";
import { glass } from "@/lib/glass";
import { cn } from "@/lib/utils";
import { hapticImpact } from "@/lib/haptic";

interface LyricsStudioBannerProps {
  className?: string;
}

export const LyricsStudioBanner = memo(function LyricsStudioBanner({ className }: LyricsStudioBannerProps) {
  const navigate = useNavigate();

  const handleOpen = useCallback(() => {
    hapticImpact("light");
    navigate("/lyrics-studio");
  }, [navigate]);

  return (
    <button
      type="button"
      onClick={handleOpen}
      aria-label="Открыть студию лирики"
      className={cn(
        glass.card,
        "group w-full min-h-[56px] rounded-2xl px-3 py-3 text-left",
        "flex items-center gap-3 transition-colors hover:bg-muted/40 active:scale-[0.99]",
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <PenTool className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          Студия лирики
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          Пишите текст с секциями и AI-подсказками
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
});
