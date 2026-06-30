/**
 * SubscriptionUpgradePopup - Popup when user hits free tier limits
 * Shows PRO and PREMIUM options with benefits
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Check, Star, Loader2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";

interface SubscriptionUpgradePopupProps {
  open: boolean;
  onClose: () => void;
  reason?: "balance_limit" | "daily_limit" | "feature_locked" | "general";
}

interface TierInfo {
  id: "pro" | "premium";
  name: string;
  price: number;
  credits: number;
  bonus: string;
  features: string[];
  icon: typeof Crown;
  gradient: string;
  productCode: string;
}

const TIERS: TierInfo[] = [
  {
    id: "pro",
    name: "PRO",
    price: 350,
    credits: 500,
    bonus: "+50% при докупке",
    features: ["HD качество аудио", "5 треков одновременно", "Stem-сепарация", "MIDI экспорт", "Нет лимита баланса"],
    icon: Zap,
    gradient: "from-blue-500 to-cyan-500",
    productCode: "pro_monthly",
  },
  {
    id: "premium",
    name: "PREMIUM",
    price: 750,
    credits: 1200,
    bonus: "+100% при докупке",
    features: [
      "Ultra HD качество",
      "10 треков одновременно",
      "AI Мастеринг",
      "Приоритетная генерация",
      "Все AI модели",
      "Персональная поддержка",
    ],
    icon: Crown,
    gradient: "from-amber-500 to-orange-500",
    productCode: "premium_monthly",
  },
];

const REASON_MESSAGES = {
  balance_limit: "Ты достиг лимита в 100 кредитов для бесплатных пользователей",
  daily_limit: "Ты заработал максимум 30 кредитов сегодня",
  feature_locked: "Эта функция доступна только с подпиской",
  general: "Открой все возможности MusicVerse AI",
};

export const SubscriptionUpgradePopup = memo(function SubscriptionUpgradePopup({
  open,
  onClose,
  reason = "general",
}: SubscriptionUpgradePopupProps) {
  const { user, session } = useAuth();
  const [selectedTier, setSelectedTier] = useState<"pro" | "premium">("pro");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Необходима авторизация");
      return;
    }

    const tier = TIERS.find((t) => t.id === selectedTier);
    if (!tier) return;

    setIsLoading(true);

    try {
      const token = session?.access_token;

      if (!token) {
        throw new Error("Не удалось получить токен авторизации");
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tinkoff-create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productCode: tier.productCode }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Не удалось создать платёж");
      }

      window.location.href = result.paymentUrl;
    } catch (error) {
      logger.error("Subscription error", error instanceof Error ? error : new Error(String(error)));
      toast.error("Ошибка при создании платежа", {
        description: error instanceof Error ? error.message : "Попробуйте позже",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Улучши свой опыт"
      size="xl"
    >
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {/* Reason message */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm">{REASON_MESSAGES[reason]}</p>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              const isSelected = selectedTier === tier.id;

              return (
                <motion.button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 text-left transition-all",
                    isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:border-border",
                  )}
                >
                  {tier.id === "premium" && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500">
                      Популярный
                    </Badge>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                        tier.gradient,
                      )}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold">{tier.name}</h3>
                      <p className="text-xs text-muted-foreground">{tier.bonus}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold">{tier.price} ₽</span>
                    <span className="text-muted-foreground text-sm">/мес</span>
                  </div>

                  {/* Credits */}
                  <div className="mb-4 p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="font-medium">{tier.credits} кредитов</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="tier-selection"
                      className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              size="lg"
              className={cn(
                "w-full bg-gradient-to-r",
                selectedTier === "premium"
                  ? "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  : "from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
              Подписаться на {selectedTier === "premium" ? "PREMIUM" : "PRO"}
            </Button>

            <Button variant="ghost" onClick={onClose}>
              Позже
            </Button>
          </div>

          {/* Info */}
          <p className="text-xs text-center text-muted-foreground">
            💳 Оплата картой через Tinkoff • Отмена в любой момент
          </p>
        </motion.div>
      </AnimatePresence>
    </UnifiedDialog>
  );
});
