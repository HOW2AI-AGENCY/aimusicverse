/**
 * PaymentSuccessModal Component
 * Enhanced with glassmorphism, premium animations and celebration effects
 */

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { CheckCircle2, Sparkles, Star, Zap, Music, Crown } from "@/lib/icons";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { gradientGlass } from "@/lib/glass";
import type { StarsProduct } from "@/services/starsPaymentService";
import { confetti } from "@/lib/confetti";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: StarsProduct;
  language?: "en" | "ru";
}

// Enhanced confetti particle. Random visuals are generated ONCE by the parent
// (in an effect) and passed in as props, so no Math.random() runs during this
// component's render (purity rule).
interface ConfettiParticleProps {
  delay: number;
  color: string;
  x: number;
  rotate: number;
  size: number;
}

function ConfettiParticle({ delay, color, x, rotate, size }: ConfettiParticleProps) {
  return (
    <motion.div
      className="absolute top-1/4 left-1/2"
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: 0,
        x,
        y: 300,
        rotate,
        scale: 0.5,
      }}
      transition={{
        duration: 2.5,
        delay,
        ease: "easeOut",
      }}
    >
      <div
        className="rounded-sm"
        style={{
          backgroundColor: color,
          width: size,
          height: size,
        }}
      />
    </motion.div>
  );
}

// Floating star animation
function FloatingStar({ delay, x, y }: { delay: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0.5, 1.2, 0.5],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 3,
      }}
    >
      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
    </motion.div>
  );
}

const CONFETTI_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#fbbf24", "#f59e0b", "#8b5cf6", "#ec4899"];

interface ConfettiParticleData {
  delay: number;
  color: string;
  x: number;
  rotate: number;
  size: number;
}

function generateConfettiParticles(count: number): ConfettiParticleData[] {
  return Array.from({ length: count }, (_, i) => ({
    delay: i * 0.03,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: Math.random() * 300 - 150,
    rotate: Math.random() * 720 - 360,
    size: Math.random() * 6 + 4,
  }));
}

export function PaymentSuccessModal({ isOpen, onClose, product, language = "ru" }: PaymentSuccessModalProps) {
  // Confetti visibility is derived from isOpen plus a hide flag that the
  // timeout effect toggles. Deriving from isOpen avoids a setState-in-effect
  // for the "show" transition.
  const [confettiHidden, setConfettiHidden] = useState(false);
  // Particle visuals are generated in the effect (Math.random is impure during
  // render) and stored here so ConfettiParticle receives them as pure props.
  const [particles, setParticles] = useState<ConfettiParticleData[]>([]);
  const showConfetti = isOpen && !confettiHidden;

  // Reset hide flag via render-time pattern when modal closes, so the next
  // open plays confetti again.
  const prevIsOpenRef = useRef(isOpen);
  if (!isOpen && prevIsOpenRef.current) {
    prevIsOpenRef.current = false;
    if (confettiHidden) setConfettiHidden(false);
  } else if (isOpen) {
    prevIsOpenRef.current = true;
  }

  useEffect(() => {
    if (!isOpen) return;

    // Generate fresh particle visuals for this open cycle. Done inside the
    // setTimeout callback (not synchronously in the effect body) to avoid a
    // cascading render (set-state-in-effect rule).
    const burstTimer = setTimeout(() => {
      setParticles(generateConfettiParticles(40));
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6, x: 0.5 },
        colors: ["#10b981", "#34d399", "#fbbf24", "#8b5cf6"],
      });
    }, 200);

    const hideTimer = setTimeout(() => setConfettiHidden(true), 3000);
    return () => {
      clearTimeout(burstTimer);
      clearTimeout(hideTimer);
    };
  }, [isOpen]);

  const getText = () => {
    if (language === "ru") {
      return {
        title: "Оплата успешна!",
        creditsAdded: "Кредиты добавлены",
        subscriptionActivated: "Подписка активирована",
        description:
          product?.product_type === "credits"
            ? `${product.credits_amount} кредитов добавлено на ваш счет`
            : `Подписка ${product?.subscription_tier} активирована`,
        close: "Отлично!",
        tracksInfo:
          product?.product_type === "credits" && product?.credits_amount
            ? `≈ ${Math.floor(product.credits_amount / 12)} AI-треков`
            : null,
      };
    }
    return {
      title: "Payment Successful!",
      creditsAdded: "Credits Added",
      subscriptionActivated: "Subscription Activated",
      description:
        product?.product_type === "credits"
          ? `${product.credits_amount} credits added to your account`
          : `${product?.subscription_tier} subscription activated`,
      close: "Awesome!",
      tracksInfo:
        product?.product_type === "credits" && product?.credits_amount
          ? `≈ ${Math.floor(product.credits_amount / 12)} AI tracks`
          : null,
    };
  };

  const text = getText();

  return (
    <UnifiedDialog
      variant="modal"
      open={isOpen}
      onOpenChange={onClose}
      title={text.title}
      description={text.description}
      size="md"
      className={cn(
        "relative overflow-hidden border-0",
        "bg-background/95 backdrop-blur-2xl",
        "shadow-2xl shadow-success/20",
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-success/10 via-transparent to-transparent pointer-events-none" />

      {/* Floating stars */}
      <FloatingStar delay={0.5} x="15%" y="10%" />
      <FloatingStar delay={0.8} x="80%" y="15%" />
      <FloatingStar delay={1.1} x="25%" y="60%" />
      <FloatingStar delay={1.4} x="75%" y="55%" />

      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p, i) => (
              <ConfettiParticle key={i} delay={p.delay} color={p.color} x={p.x} rotate={p.rotate} size={p.size} />
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-4 relative z-10">
        {/* Success Icon with Enhanced Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
          className="mx-auto"
        >
          <div className="relative inline-block">
            {/* Pulse rings */}
            <motion.div
              className="absolute inset-0 bg-success/30 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-2 bg-success/20 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 0.2, 0.8],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />

            {/* Main icon */}
            <motion.div
              className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-br from-success to-emerald-600 rounded-full shadow-xl shadow-success/40"
              whileHover={{ scale: 1.05 }}
              animate={{
                boxShadow: [
                  "0 10px 40px -10px rgba(16, 185, 129, 0.4)",
                  "0 10px 60px -10px rgba(16, 185, 129, 0.6)",
                  "0 10px 40px -10px rgba(16, 185, 129, 0.4)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCircle2 className="h-12 w-12 text-white" aria-hidden="true" />
            </motion.div>

            {/* Sparkles decoration */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Sparkles className="h-6 w-6 text-amber-400" aria-hidden="true" />
            </motion.div>

            <motion.div
              className="absolute -bottom-1 -left-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Crown className="h-5 w-5 text-amber-500" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold relative">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2"
          >
            <span>🎉</span>
            {text.title}
            <span>🎉</span>
          </motion.span>
        </h2>

        <div className="text-base relative">
          {product && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              {/* Credits/Subscription badge */}
              <motion.div
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold",
                  gradientGlass.success,
                )}
                whileHover={{ scale: 1.02 }}
              >
                {product.product_type === "credits" ? (
                  <>
                    <Zap className="w-5 h-5 text-success" />
                    <span className="text-lg text-foreground">+{product.credits_amount}</span>
                    <span className="text-muted-foreground">кредитов</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 text-amber-500" />
                    <span className="text-lg text-foreground">{product.subscription_tier}</span>
                  </>
                )}
              </motion.div>

              {/* Additional info */}
              {text.tracksInfo && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  <Music className="w-4 h-4" />
                  <span>{text.tracksInfo}</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 relative z-10"
      >
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onClose}
            variant="default"
            size="lg"
            className={cn(
              "w-full h-12 text-base font-semibold gap-2",
              "bg-gradient-to-r from-success to-emerald-600",
              "hover:from-success/90 hover:to-emerald-600/90",
              "shadow-lg shadow-success/30",
              "transition-all duration-300",
            )}
          >
            <Sparkles className="w-4 h-4" />
            {text.close}
          </Button>
        </motion.div>
      </motion.div>
    </UnifiedDialog>
  );
}
