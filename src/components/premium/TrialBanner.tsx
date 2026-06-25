/**
 * TrialBanner - Displays trial offer to eligible users
 */

import { memo, useState } from "react";
import { motion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, ArrowRight, Loader2, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useTrialEligibility, activateTrial } from "@/hooks/useTrialEligibility";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { navigateTo, getGlobalNavigate } from "@/hooks/useAppNavigate";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "@/services/analytics";
import { logger } from "@/lib/logger";

interface TrialBannerProps {
  className?: string;
  variant?: "compact" | "full";
  onClose?: () => void;
}

export const TrialBanner = memo(function TrialBanner({ className, variant = "full", onClose }: TrialBannerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isEligible, trialDays, isLoading } = useTrialEligibility();

  // Use global navigate since this may render outside Router context
  const navigate = (path: string) => {
    const globalNav = getGlobalNavigate();
    if (globalNav) {
      globalNav(path);
    } else {
      navigateTo(path);
    }
  };
  const [isActivating, setIsActivating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't render if not eligible or loading
  if (isLoading || !isEligible || isDismissed) {
    return null;
  }

  const handleActivateTrial = async () => {
    if (!user?.id) {
      toast.error("Необходима авторизация");
      return;
    }

    setIsActivating(true);
    trackEvent({ eventType: "button_clicked", eventName: "trial_activate_start" });

    try {
      const result = await activateTrial(user.id);

      if (result.success) {
        toast.success("🎉 Пробный период активирован!", {
          description: `${trialDays} дня PRO-доступа бесплатно`,
        });

        // Invalidate subscription queries
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        queryClient.invalidateQueries({ queryKey: ["trial-eligibility"] });

        trackEvent({ eventType: "button_clicked", eventName: "trial_activate_success" });

        // Redirect to home or close
        onClose?.();
        navigate("/");
      } else {
        toast.error("Не удалось активировать пробный период", {
          description: result.error,
        });
        trackEvent({
          eventType: "button_clicked",
          eventName: "trial_activate_error",
          metadata: { error: result.error },
        });
      }
    } catch (error: unknown) {
      toast.error("Произошла ошибка");
      logger.error("Trial activation error", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsActivating(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onClose?.();
  };

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg",
          "bg-gradient-to-r from-primary/10 to-primary/5",
          "border border-primary/20",
          className,
        )}
      >
        <Gift className="w-5 h-5 text-primary shrink-0" />
        <span className="text-sm flex-1">
          <strong>Попробуй PRO бесплатно</strong> — {trialDays} дня полного доступа
        </span>
        <Button size="sm" variant="default" onClick={handleActivateTrial} disabled={isActivating} className="shrink-0">
          {isActivating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Начать
              <ArrowRight className="w-3 h-3 ml-1" />
            </>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative p-5 rounded-xl",
        "bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5",
        "border border-primary/30",
        className,
      )}
    >
      {/* Close button */}
      {onClose && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-background/50 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
          <Gift className="w-6 h-6 text-primary-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Попробуй PRO бесплатно</h3>
            <Badge variant="secondary" className="text-xs">
              {trialDays} дня
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            HD качество, stem-сепарация, MIDI экспорт и другие PRO-функции. Без привязки карты.
          </p>
        </div>

        {/* CTA */}
        <Button
          onClick={handleActivateTrial}
          disabled={isActivating}
          className="bg-gradient-to-r from-primary to-primary/80 shrink-0"
        >
          {isActivating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Активировать
        </Button>
      </div>
    </motion.div>
  );
});
