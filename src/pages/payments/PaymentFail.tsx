/**
 * Payment Fail Page
 * Enhanced with glassmorphism and empathetic UX
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  XCircle,
  RefreshCw,
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  ExternalLink,
  CreditCard,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { motion, AnimatePresence } from "@/lib/motion";
import { useTelegram } from "@/contexts/TelegramContext";
import { cn } from "@/lib/utils";
import { glass, gradientGlass } from "@/lib/glass";

// Common Tinkoff error codes with user-friendly messages
const ERROR_MESSAGES: Record<string, { title: string; description: string; icon?: string }> = {
  "0": {
    title: "Операция отменена",
    description: "Вы отменили платёж. Деньги не были списаны.",
    icon: "🚫",
  },
  "99": {
    title: "Платёж отклонён банком",
    description: "Попробуйте использовать другую карту или обратитесь в банк.",
    icon: "🏦",
  },
  "100": {
    title: "Недостаточно средств",
    description: "На карте недостаточно средств для оплаты.",
    icon: "💳",
  },
  "101": {
    title: "Карта заблокирована",
    description: "Карта заблокирована. Обратитесь в банк.",
    icon: "🔒",
  },
  "102": {
    title: "Превышен лимит",
    description: "Превышен лимит на операции по карте.",
    icon: "📊",
  },
  "103": {
    title: "Срок действия карты истёк",
    description: "Используйте другую карту с действующим сроком.",
    icon: "📅",
  },
  "119": {
    title: "Превышены попытки ввода PIN",
    description: "Попробуйте позже или обратитесь в банк.",
    icon: "🔢",
  },
  "191": {
    title: "Некорректная сумма",
    description: "Произошла техническая ошибка. Попробуйте снова.",
    icon: "⚠️",
  },
  "1006": {
    title: "Ошибка 3D-Secure",
    description: "Проблема с подтверждением платежа. Попробуйте снова.",
    icon: "🔐",
  },
  "1051": {
    title: "Недостаточно средств",
    description: "На карте недостаточно средств для оплаты.",
    icon: "💸",
  },
};

export default function PaymentFail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showContent, setShowContent] = useState(false);
  const { webApp, isInitialized } = useTelegram();
  const isTelegram = isInitialized && !!webApp;

  // Get error info from URL params
  const orderId = searchParams.get("OrderId");
  const errorCode = searchParams.get("ErrorCode");
  const message = searchParams.get("Message");

  useEffect(() => {
    logger.warn("Payment fail page loaded", { orderId, errorCode, message });

    // Delay content for smooth animation
    const timer = setTimeout(() => setShowContent(true), 100);

    // Telegram haptic feedback
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.notificationOccurred("error");
    }

    return () => clearTimeout(timer);
  }, [orderId, errorCode, message, webApp]);

  const handleRetry = () => {
    navigate("/buy-credits");
  };

  const handleGoBack = () => {
    const returnUrl = sessionStorage.getItem("payment_return_url");
    if (returnUrl) {
      sessionStorage.removeItem("payment_return_url");
      try {
        navigate(new URL(returnUrl).pathname);
      } catch {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  };

  const handleContactSupport = () => {
    const supportUrl = "https://t.me/aimusicverse_support";
    window.open(supportUrl, "_blank");
  };

  const getErrorInfo = () => {
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return ERROR_MESSAGES[errorCode];
    }

    return {
      title: "Платёж не был завершён",
      description: message || "Произошла ошибка при обработке платежа. Попробуйте ещё раз.",
      icon: "😔",
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-background to-destructive/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-destructive/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.1,
            }}
            className="w-full max-w-md relative z-10"
          >
            <div
              className={cn(
                "overflow-hidden rounded-3xl border border-destructive/20",
                glass.card,
                "shadow-2xl shadow-destructive/10",
              )}
            >
              <div className="pt-10 pb-8 px-6 text-center space-y-6">
                {/* Error Icon with Shake */}
                <motion.div
                  className="relative mx-auto w-28 h-28"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.2,
                  }}
                >
                  {/* Pulse rings */}
                  <motion.div
                    className="absolute inset-0 bg-destructive/20 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.1, 0.4],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-3 bg-destructive/15 rounded-full"
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.6, 0.2, 0.6],
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.3 }}
                  />

                  {/* Main icon */}
                  <motion.div
                    className="relative flex items-center justify-center w-28 h-28 bg-gradient-to-br from-destructive/80 to-destructive rounded-full shadow-xl shadow-destructive/30"
                    animate={{
                      rotate: [0, -3, 3, 0],
                    }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <XCircle className="w-14 h-14 text-white" />
                  </motion.div>

                  {/* Error emoji */}
                  <motion.div
                    className="absolute -top-2 -right-2 text-2xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                  >
                    {errorInfo.icon}
                  </motion.div>
                </motion.div>

                {/* Title & Description */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h1 className="text-2xl font-bold text-foreground">{errorInfo.title}</h1>
                  <p className="text-muted-foreground">{errorInfo.description}</p>
                </motion.div>

                {/* Order ID */}
                {orderId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className={cn("text-sm rounded-xl p-3", glass.card)}
                  >
                    <div className="text-muted-foreground">
                      Заказ: <span className="font-mono text-foreground">{orderId}</span>
                    </div>
                    {errorCode && <div className="text-xs opacity-70 mt-1">Код ошибки: {errorCode}</div>}
                  </motion.div>
                )}

                {/* Reassurance message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className={cn("flex items-start gap-3 text-left text-sm rounded-xl p-4", gradientGlass.warning)}
                >
                  <Shield className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Не волнуйтесь!</p>
                    <p className="text-muted-foreground">
                      Деньги не были списаны с вашей карты. Попробуйте ещё раз или используйте другую карту.
                    </p>
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                  className="space-y-3 pt-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleRetry}
                      className={cn(
                        "w-full gap-2 h-12 text-base font-semibold",
                        "bg-gradient-to-r from-primary via-primary to-primary/90",
                        "hover:shadow-xl hover:shadow-primary/30",
                        "transition-all duration-300",
                      )}
                      size="lg"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Попробовать снова
                    </Button>
                  </motion.div>

                  <Button onClick={handleGoBack} variant="outline" className="w-full gap-2 h-11">
                    <ArrowLeft className="w-4 h-4" />
                    Вернуться назад
                  </Button>

                  <Button
                    onClick={handleContactSupport}
                    variant="ghost"
                    className="w-full gap-2 text-muted-foreground"
                    size="sm"
                  >
                    {isTelegram ? <MessageCircle className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    Связаться с поддержкой
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
