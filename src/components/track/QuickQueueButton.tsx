/**
 * QuickQueueButton - One-tap "add to queue" button for track cards
 * Mirrors QuickLikeButton's sizing/variant contract so both can share
 * the same cover-overlay action bar.
 */

import { memo, useCallback } from "react";
import { ListEnd } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/contexts/TelegramContext";
import { usePlaybackQueue } from "@/hooks/audio/usePlaybackQueue";
import { toast } from "sonner";
import { pill } from "@/lib/overlay-colors";
import type { Track } from "@/types/track";

interface QuickQueueButtonProps {
  track: Track;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "overlay" | "minimal";
  className?: string;
}

export const QuickQueueButton = memo(function QuickQueueButton({
  track,
  size = "md",
  variant = "default",
  className,
}: QuickQueueButtonProps) {
  const { hapticFeedback } = useTelegram();
  const { addTrack } = usePlaybackQueue();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      hapticFeedback("light");
      addTrack(track, false);
      toast.success("Добавлено в очередь", { description: track.title });
    },
    [hapticFeedback, addTrack, track],
  );

  const sizeClasses = {
    sm: "w-7 h-7 min-w-[44px] min-h-[44px]",
    md: "w-9 h-9 min-w-[44px] min-h-[44px]",
    lg: "w-11 h-11",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const variantClasses = {
    default: "rounded-lg transition-all active:scale-90 bg-muted/60 text-muted-foreground hover:bg-muted",
    overlay: cn("rounded-full transition-all active:scale-90", pill.glassDark, "text-white/90 hover:text-white"),
    minimal: "rounded-full transition-all active:scale-90 text-muted-foreground hover:text-foreground",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("flex items-center justify-center", sizeClasses[size], variantClasses[variant], className)}
      aria-label="Добавить в очередь"
    >
      <ListEnd className={iconSizes[size]} />
    </button>
  );
});
