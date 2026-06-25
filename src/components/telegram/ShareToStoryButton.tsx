/**
 * ShareToStoryButton - Telegram Stories sharing component
 * Allows users to share tracks to their Telegram Stories
 *
 * @example
 * ```tsx
 * <ShareToStoryButton
 *   mediaUrl={track.audio_url}
 *   text="Слушай этот крутой трек!" />
 * ```
 */

import { useState } from "react";
import { Share2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTelegram } from "@/contexts/telegram";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface ShareToStoryButtonProps {
  /** URL of the media to share (audio, video, or image) */
  mediaUrl: string;
  /** Optional text to accompany the media */
  text?: string;
  /** Alternative to mediaUrl - link to share */
  link?: string;
  /** Button variant */
  variant?: "default" | "ghost" | "outline";
  /** Button size */
  size?: "default" | "sm" | "icon" | "lg";
  /** Additional className */
  className?: string;
  /** Icon position (only for non-icon sizes) */
  iconPosition?: "left" | "right";
}

export function ShareToStoryButton({
  mediaUrl,
  text = "Создано в MusicVerse AI 🎵",
  link,
  variant = "ghost",
  size = "icon",
  className,
  iconPosition = "left",
}: ShareToStoryButtonProps) {
  const { shareToStory } = useTelegram();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!shareToStory) {
      toast.error("Функция доступна только в Telegram");
      return;
    }

    setIsSharing(true);
    try {
      shareToStory(mediaUrl, {
        media_url: mediaUrl,
        text,
        link,
      });
      toast.success("Открыт редактор Telegram Stories");
    } catch (error: unknown) {
      logger.error("Share to story failed", error instanceof Error ? error : new Error(String(error)));
      toast.error("Не удалось поделиться. Попробуйте позже.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      toast.success("Ссылка скопирована");
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  const hasMultipleOptions = link && size !== "icon";

  // Single button mode
  if (!hasMultipleOptions) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleShare}
        disabled={isSharing || !mediaUrl}
        className={cn("min-h-touch min-w-touch", className)}
        aria-label="Поделиться в Telegram Stories"
      >
        {isSharing ? (
          <span className="animate-pulse">...</span>
        ) : (
          <>
            {iconPosition === "left" && <Share2 className="w-4 h-4" aria-hidden="true" />}
            {size !== "icon" && <span className="ml-2">В Stories</span>}
            {iconPosition === "right" && <Share2 className="w-4 h-4" aria-hidden="true" />}
          </>
        )}
      </Button>
    );
  }

  // Dropdown mode for multiple options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isSharing}
          className={cn("min-h-touch min-w-touch", className)}
          aria-label="Поделиться в Telegram Stories"
        >
          <Share2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleShare} disabled={isSharing}>
          <Share2 className="w-4 h-4 mr-2" />
          <span>В Telegram Stories</span>
        </DropdownMenuItem>
        {link && (
          <DropdownMenuItem onClick={handleCopyLink}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>Скопировать ссылку</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * ShareTrackToStory - Pre-configured component for sharing tracks
 */
interface ShareTrackToStoryProps {
  trackId: string;
  trackTitle: string;
  audioUrl: string;
  coverUrl?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function ShareTrackToStory({
  trackId,
  trackTitle,
  audioUrl,
  coverUrl,
  variant = "ghost",
  size = "icon",
  className,
}: ShareTrackToStoryProps) {
  const trackLink = `${window.location.origin}/track/${trackId}`;

  return (
    <ShareToStoryButton
      mediaUrl={coverUrl || audioUrl}
      text={`🎵 ${trackTitle}\n\nСоздано в MusicVerse AI`}
      link={trackLink}
      variant={variant}
      size={size}
      className={className}
    />
  );
}

export default ShareToStoryButton;
