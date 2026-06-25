/**
 * Share Project Card - generates shareable card for Telegram Stories
 */
import { useState } from "react";
import { Share2, Loader2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { useTelegram } from "@/contexts/TelegramContext";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface ShareProjectCardProps {
  project: {
    id: string;
    title: string;
    cover_url: string | null;
    genre: string | null;
    total_tracks_count: number | null;
    approved_tracks_count: number | null;
  };
  variant?: "button" | "icon";
  className?: string;
}

export function ShareProjectCard({ project, variant = "button", className }: ShareProjectCardProps) {
  const { shareToStory, shareURL, platform, isDevelopmentMode, hapticFeedback } = useTelegram();
  const [isSharing, setIsSharing] = useState(false);

  const isRealMiniApp = platform && platform !== "web" && platform !== "" && !isDevelopmentMode;

  const handleShare = async () => {
    setIsSharing(true);
    hapticFeedback("medium");

    try {
      const appUrl = `https://t.me/musicverse_ai_bot/app?startapp=project_${project.id}`;

      if (isRealMiniApp && project.cover_url) {
        // Share to Telegram Story with cover image
        shareToStory(project.cover_url, {
          media_url: project.cover_url,
          text: `🎵 ${project.title}${project.genre ? ` • ${project.genre}` : ""}\n\nСлушай в MusicVerse!`,
          widget_link: {
            url: appUrl,
            name: "Открыть проект",
          },
        });
        toast.success("Открыта публикация в Stories");
      } else if (isRealMiniApp) {
        // Share URL if no cover
        shareURL(appUrl, `🎵 ${project.title} - послушай мой проект в MusicVerse!`);
        toast.success("Ссылка скопирована");
      } else {
        // Fallback for web - copy link
        await navigator.clipboard.writeText(appUrl);
        toast.success("Ссылка скопирована в буфер обмена");
      }
    } catch (error: unknown) {
      logger.error("Share error", error instanceof Error ? error : new Error(String(error)));
      toast.error("Не удалось поделиться");
    } finally {
      setIsSharing(false);
    }
  };

  if (variant === "icon") {
    return (
      <Button variant="ghost" size="icon" onClick={handleShare} disabled={isSharing} className={className}>
        {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} disabled={isSharing} className={className}>
      {isSharing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
      {isRealMiniApp ? "В Stories" : "Поделиться"}
    </Button>
  );
}
