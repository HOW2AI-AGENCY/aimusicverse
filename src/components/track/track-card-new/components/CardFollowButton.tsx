/**
 * CardFollowButton - Reusable "follow author" icon button for track cards
 *
 * Extracted from EnhancedVariant so Grid/Enhanced/Compact variants share
 * one follow-button implementation instead of duplicating useFollow wiring.
 */

import { memo, useCallback } from "react";
import { UserPlus } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/social/useFollow";
import { useTelegram } from "@/contexts/TelegramContext";
import { pill } from "@/lib/overlay-colors";

interface CardFollowButtonProps {
  userId: string;
  isOwnTrack: boolean;
  show?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const CardFollowButton = memo(function CardFollowButton({
  userId,
  isOwnTrack,
  show = true,
  size = "md",
  className,
}: CardFollowButtonProps) {
  const { user } = useAuth();
  const { hapticFeedback } = useTelegram();
  const { isFollowing, isLoading, toggleFollow } = useFollow(userId);

  const handleFollow = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      hapticFeedback("light");
      toggleFollow();
    },
    [hapticFeedback, toggleFollow],
  );

  if (!user || !show || isOwnTrack || isFollowing) return null;

  return (
    <Button
      size="icon"
      variant="secondary"
      className={cn(
        size === "md"
          ? "h-11 w-11 min-w-[44px] min-h-[44px] sm:h-7 sm:w-7 sm:min-w-0 sm:min-h-0"
          : "h-9 w-9 min-w-[44px] min-h-[44px]",
        "rounded-full border-0",
        pill.glassDark,
        className,
      )}
      onClick={handleFollow}
      disabled={isLoading}
      aria-label="Подписаться на автора"
    >
      <UserPlus className={size === "md" ? "w-5 h-5 sm:w-3.5 sm:h-3.5" : "w-4 h-4"} />
    </Button>
  );
});
