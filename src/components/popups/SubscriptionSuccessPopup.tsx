/**
 * SubscriptionSuccessPopup - Celebration popup after successful subscription
 */

import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Check, Sparkles, Star } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { confetti } from "@/lib/confetti";

interface SubscriptionSuccessPopupProps {
  open: boolean;
  onClose: () => void;
  tier: "pro" | "premium";
  credits: number;
}

const TIER_INFO = {
  pro: {
    name: "PRO",
    icon: Zap,
    gradient: "from-blue-500 to-cyan-500",
    features: ["HD качество аудио", "5 треков одновременно", "Stem-сепарация", "MIDI экспорт"],
  },
  premium: {
    name: "PREMIUM",
    icon: Crown,
    gradient: "from-amber-500 to-orange-500",
    features: [
      "Ultra HD качество",
      "10 треков одновременно",
      "AI Мастеринг",
      "Приоритетная генерация",
      "Все AI модели",
    ],
  },
};

export const SubscriptionSuccessPopup = memo(function SubscriptionSuccessPopup({
  open,
  onClose,
  tier,
  credits,
}: SubscriptionSuccessPopupProps) {
  const [showContent, setShowContent] = useState(false);
  const info = TIER_INFO[tier];
  const Icon = info.icon;

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setShowContent(true), 200);

      // Fire confetti burst
      const fireConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#8B5CF6", "#EC4899", "#F59E0B"],
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#8B5CF6", "#EC4899", "#F59E0B"],
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      };

      const confettiTimer = setTimeout(fireConfetti, 300);

      return () => {
        clearTimeout(timer);
        clearTimeout(confettiTimer);
      };
    } else {
      setShowContent(false);
    }
  }, [open]);

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Подписка активирована"
      size="md"
    >
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 15 }}
            className="flex flex-col items-center text-center py-6"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br mb-6",
                info.gradient,
              )}
            >
              <Icon className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold mb-2"
            >
              Добро пожаловать в {info.name}! 🎉
            </motion.h2>

            {/* Credits granted */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="mb-6 px-6 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20"
            >
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span className="text-xl font-bold">+{credits} кредитов</span>
              </div>
            </motion.div>

            {/* Features unlocked */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full mb-6"
            >
              <p className="text-sm text-muted-foreground mb-3">Теперь тебе доступно:</p>
              <ul className="space-y-2 text-left">
                {info.features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
              <Button onClick={onClose} className={cn("px-8 bg-gradient-to-r", info.gradient)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Начать творить!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </UnifiedDialog>
  );
});
