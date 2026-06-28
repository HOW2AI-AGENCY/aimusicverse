/**
 * Animated Payment Button
 * Premium button with loading states, haptic feedback and animations
 */

import { motion, AnimatePresence } from "@/lib/motion";
import { CreditCard, Loader2, Lock, Check, ArrowRight, Sparkles, ShieldCheck } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { glass } from "@/lib/glass";
import { surface } from "@/lib/overlay-colors";

interface PaymentButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  price: string;
  className?: string;
}

export function PaymentButton({
  onClick,
  disabled = false,
  isLoading = false,
  isSuccess = false,
  price,
  className,
}: PaymentButtonProps) {
  const handleClick = () => {
    // Haptic feedback on click
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    }
    onClick();
  };

  const buttonContent = () => {
    if (isSuccess) {
      return (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-3">
          <motion.div
            className={cn("w-8 h-8 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center", surface.medium)}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 0.5 }}
          >
            <Check className="w-5 h-5" />
          </motion.div>
          <span className="font-bold">Успешно!</span>
          <Sparkles className="w-5 h-5" />
        </motion.div>
      );
    }

    if (isLoading) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Переход к оплате...</span>
          <motion.div
            className="flex gap-1"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span>•</span>
            <span>•</span>
            <span>•</span>
          </motion.div>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
        <motion.div
          className={cn("w-8 h-8 rounded-full flex items-center justify-center", surface.light)}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <CreditCard className="w-4 h-4" />
        </motion.div>
        <span className="font-bold">Оплатить</span>
        <span className={cn("px-2 py-0.5 rounded-full text-sm font-semibold", surface.medium)}>{price}</span>
        <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1, repeat: Infinity }}>
          <ArrowRight className="w-5 h-5" />
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-2">
      <motion.button
        onClick={handleClick}
        disabled={disabled || isLoading || isSuccess}
        className={cn(
          "relative w-full py-5 px-8 rounded-2xl font-semibold text-lg",
          "transition-all duration-300 overflow-hidden",
          "touch-manipulation select-none",
          isSuccess
            ? "bg-gradient-to-r from-success to-success/90 text-success-foreground"
            : "bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground",
          disabled && !isLoading && !isSuccess && "opacity-50 cursor-not-allowed",
          "shadow-xl",
          isSuccess ? "shadow-success/40" : "shadow-primary/40",
          className,
        )}
        whileHover={
          !disabled
            ? {
                scale: 1.02,
                boxShadow: isSuccess
                  ? "0 15px 50px -10px hsl(var(--success) / 0.6)"
                  : "0 15px 50px -10px hsl(var(--primary) / 0.6)",
              }
            : {}
        }
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        {/* Animated gradient overlay */}
        {!isSuccess && !isLoading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Shimmer effect on loading */}
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Success sparkle effect */}
        {isSuccess && (
          <>
            <motion.div
              className="absolute top-2 left-4 w-2 h-2 bg-white rounded-full"
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="absolute top-4 right-8 w-1.5 h-1.5 bg-white rounded-full"
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div
              className="absolute bottom-3 left-12 w-1 h-1 bg-white rounded-full"
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
            />
          </>
        )}

        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/10 opacity-0"
          whileHover={{ opacity: 1 }}
        />

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isSuccess ? "success" : isLoading ? "loading" : "default"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 flex items-center justify-center"
          >
            {buttonContent()}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Security badge below button */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-success" />
        <span>Защищённый платёж через Tinkoff</span>
        <Lock className="w-3 h-3" />
      </motion.div>
    </div>
  );
}
