/**
 * PaymentSuccessModal Component
 * Success modal with celebration animation using Framer Motion
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { StarsProduct } from '@/types/starsPayment';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: StarsProduct;
  language?: 'en' | 'ru';
}

// Confetti particle component
function ConfettiParticle({ delay }: { delay: number }) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomX = Math.random() * 400 - 200; // -200 to 200
  const randomRotate = Math.random() * 720 - 360; // -360 to 360

  return (
    <motion.div
      className="absolute top-0 left-1/2"
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
      animate={{
        opacity: 0,
        x: randomX,
        y: 400,
        rotate: randomRotate,
      }}
      transition={{
        duration: 2,
        delay,
        ease: 'easeOut',
      }}
    >
      <div
        className="w-2 h-2 rounded-sm"
        style={{ backgroundColor: randomColor }}
      />
    </motion.div>
  );
}

export function PaymentSuccessModal({
  isOpen,
  onClose,
  product,
  language = 'en',
}: PaymentSuccessModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const getText = () => {
    if (language === 'ru') {
      return {
        title: 'Оплата успешна! 🎉',
        creditsAdded: 'Кредиты добавлены',
        subscriptionActivated: 'Подписка активирована',
        description: product?.product_type === 'credits'
          ? `${product.credits_amount} кредитов добавлено на ваш счет`
          : `Подписка ${product?.subscription_tier} активирована`,
        close: 'Закрыть',
      };
    }
    return {
      title: 'Payment Successful! 🎉',
      creditsAdded: 'Credits Added',
      subscriptionActivated: 'Subscription Activated',
      description: product?.product_type === 'credits'
        ? `${product.credits_amount} credits added to your account`
        : `${product?.subscription_tier} subscription activated`,
      close: 'Close',
    };
  };

  const text = getText();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md relative overflow-hidden">
        {/* Confetti Animation */}
        <AnimatePresence>
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <ConfettiParticle key={i} delay={i * 0.05} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label={text.close}
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader className="text-center space-y-4">
          {/* Success Icon with Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
            className="mx-auto"
          >
            <div className="relative inline-block">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.3,
                  repeat: 2,
                }}
              >
                <CheckCircle2 className="h-20 w-20 text-success" aria-hidden="true" />
              </motion.div>

              {/* Sparkles */}
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
              </motion.div>
            </div>
          </motion.div>

          <DialogTitle className="text-2xl font-bold">
            {text.title}
          </DialogTitle>

          <DialogDescription className="text-base">
            {product && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <p className="font-semibold text-foreground">
                  {product.product_type === 'credits'
                    ? text.creditsAdded
                    : text.subscriptionActivated}
                </p>
                <p>{text.description}</p>
              </motion.div>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Button
            onClick={onClose}
            variant="default"
            size="lg"
            className="w-full"
          >
            {text.close}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
