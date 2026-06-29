import { LogIn, X } from "@/lib/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useGuestMode } from "@/contexts/GuestModeContext";
import { useTelegram } from "@/contexts/TelegramContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { motion, AnimatePresence } from "@/lib/motion";

/**
 * Guest mode banner.
 * Visibility rules (see UI audit Stage 1, fix C3):
 * - Hidden on desktop ≥1024px when NOT inside Telegram (the Sidebar already
 *   carries an explicit "Войти" CTA and the banner used to overlap the logo).
 * - On mobile / inside Telegram: rendered as a compact inline strip above the
 *   main content, not as a full-width fixed overlay across the Sidebar.
 */
export const GuestModeBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const { disableGuestMode } = useGuestMode();
  const { platform } = useTelegram();
  const isTelegram = Boolean(platform) && platform !== "unknown";

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (!isVisible) return null;
  // On desktop outside Telegram, the Sidebar already shows the auth CTA.
  if (isDesktop && !isTelegram) return null;

  const handleSignIn = () => {
    disableGuestMode();
    navigate("/auth");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        role="region"
        aria-label="Гостевой режим"
        className="fixed top-0 left-0 right-0 z-navigation bg-muted/95 backdrop-blur-md border-b border-border/50"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px))",
        }}
      >
        <div className="mx-auto px-3 py-0.5 flex items-center justify-between gap-2 max-w-screen-md">
          <p className="text-[11px] text-muted-foreground flex-1 truncate">Гостевой режим</p>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignIn}
              className="h-6 min-h-0 text-[11px] gap-1 px-2"
              aria-label="Войти в аккаунт"
            >
              <LogIn className="w-3 h-3" />
              Войти
            </Button>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="p-1 -mr-1 hover:bg-muted rounded touch-manipulation"
              aria-label="Скрыть баннер гостевого режима"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
