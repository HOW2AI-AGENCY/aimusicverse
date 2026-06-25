/**
 * SmartPaywallDialog - Context-aware paywall with A/B testing
 * Shows different messaging based on trigger reason
 */

import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Check, Sparkles, Music, TrendingUp, Gift, Star, Loader2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { navigateTo, getGlobalNavigate } from "@/hooks/useAppNavigate";
import type { PaywallTriggerReason } from "@/hooks/usePaywallTrigger";
import { trackEvent } from "@/services/analytics";

interface SmartPaywallDialogProps {
  open: boolean;
  onClose: () => void;
  reason: PaywallTriggerReason;
  generationCount?: number;
  onPaywallShown?: () => void;
}

// Messaging variants per reason
const MESSAGING: Record<
  PaywallTriggerReason,
  {
    title: string;
    subtitle: string;
    icon: typeof Sparkles;
    variant: "soft" | "hard";
  }
> = {
  soft_upsell: {
    title: "Тебе нравится создавать музыку! 🎵",
    subtitle: "Открой PRO-функции для ещё лучших треков",
    icon: Music,
    variant: "soft",
  },
  hard_upsell: {
    title: "Ты настоящий музыкант! 🌟",
    subtitle: "Перейди на PRO и получи безлимитные возможности",
    icon: Crown,
    variant: "hard",
  },
  feature_locked: {
    title: "PRO-функция",
    subtitle: "Эта функция доступна для подписчиков",
    icon: Zap,
    variant: "hard",
  },
  balance_limit: {
    title: "Достигнут лимит баланса",
    subtitle: "PRO-пользователи не имеют лимитов",
    icon: TrendingUp,
    variant: "hard",
  },
  daily_limit: {
    title: "Дневной лимит исчерпан",
    subtitle: "PRO снимает все ограничения",
    icon: TrendingUp,
    variant: "hard",
  },
  credits_low: {
    title: "Кредиты заканчиваются",
    subtitle: "Пополни баланс или подключи PRO",
    icon: Gift,
    variant: "soft",
  },
};

const PRO_BENEFITS = [
  { icon: "🎵", text: "HD качество аудио" },
  { icon: "🎛️", text: "Stem-сепарация (вокал + инструменты)" },
  { icon: "🎹", text: "MIDI экспорт" },
  { icon: "⚡", text: "Приоритетная генерация" },
  { icon: "♾️", text: "Без лимита баланса" },
];

const TRIAL_FEATURES = ["3 дня бесплатно", "Отмена в любой момент", "Все PRO-функции"];

export const SmartPaywallDialog = memo(function SmartPaywallDialog({
  open,
  onClose,
  reason,
  generationCount = 0,
  onPaywallShown,
}: SmartPaywallDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showTrial, setShowTrial] = useState(true);

  // Use global navigate since this component renders outside Router context
  const navigate = (path: string) => {
    const globalNav = getGlobalNavigate();
    if (globalNav) {
      globalNav(path);
    } else {
      navigateTo(path);
    }
  };

  const messaging = MESSAGING[reason] || MESSAGING.soft_upsell;
  const Icon = messaging.icon;

  // Track paywall view
  useEffect(() => {
    if (open) {
      trackEvent({
        eventType: "paywall_view",
        metadata: {
          reason,
          generation_count: generationCount,
          variant: messaging.variant,
        },
      });
      onPaywallShown?.();
    }
  }, [open, reason, generationCount, messaging.variant, onPaywallShown]);

  const handleStartTrial = async () => {
    if (!user) {
      toast.error("Необходима авторизация");
      return;
    }

    setIsLoading(true);
    trackEvent({ eventType: "paywall_trial_click", metadata: { reason, generation_count: generationCount } });

    try {
      // Navigate to subscription page with trial param
      navigate("/subscription?trial=true");
      onClose();
    } catch (error) {
      logger.error("Trial navigation error", error as Error);
      toast.error("Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Необходима авторизация");
      return;
    }

    trackEvent({ eventType: "paywall_subscribe_click", metadata: { reason, generation_count: generationCount } });
    navigate("/subscription");
    onClose();
  };

  const handleDismiss = () => {
    trackEvent({ eventType: "paywall_dismiss", metadata: { reason, generation_count: generationCount } });
    onClose();
  };

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleDismiss()}
      title={messaging.title}
      description={messaging.subtitle}
      size="md"
    >
      <div className="text-center mb-4">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-5 py-4"
        >
          {/* Generation count badge for soft upsell */}
          {reason === "soft_upsell" && generationCount > 0 && (
            <div className="text-center">
              <Badge variant="secondary" className="px-3 py-1">
                <Music className="w-3 h-3 mr-1" />
                {generationCount} {generationCount === 1 ? "трек" : "треков"} создано
              </Badge>
            </div>
          )}

          {/* Trial offer */}
          {showTrial && messaging.variant === "soft" && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold">Попробуй PRO бесплатно</h4>
                  <p className="text-xs text-muted-foreground">3 дня полного доступа</p>
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                {TRIAL_FEATURES.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleStartTrial}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-primary/80"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Начать бесплатно
              </Button>
            </motion.div>
          )}

          {/* PRO benefits */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Что входит в PRO:</h4>
            <ul className="space-y-2">
              {PRO_BENEFITS.map((benefit, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <span className="text-base">{benefit.icon}</span>
                  <span>{benefit.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-2 pt-2">
            {messaging.variant === "hard" && (
              <Button
                onClick={handleSubscribe}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Crown className="w-4 h-4 mr-2" />
                Подключить PRO
              </Button>
            )}

            <Button variant="ghost" onClick={handleDismiss} className="text-muted-foreground">
              Позже
            </Button>
          </div>

          {/* Price info */}
          <p className="text-xs text-center text-muted-foreground">от 350 ₽/мес • Отмена в любой момент</p>
        </motion.div>
      </AnimatePresence>
    </UnifiedDialog>
  );
});
