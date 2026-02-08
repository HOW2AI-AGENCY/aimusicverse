/**
 * Payment Success Page
 * Enhanced with glassmorphism, premium animations and celebratory effects
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Music, ExternalLink, Sparkles, Star, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from '@/lib/motion';
import confetti from 'canvas-confetti';
import { useTelegram } from '@/contexts/TelegramContext';
import { SubscriptionSuccessPopup } from '@/components/popups/SubscriptionSuccessPopup';
import { cn } from '@/lib/utils';
import { glass, gradientGlass } from '@/lib/glass';
import { getGenerateDeepLink } from '@/lib/telegram';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [showContent, setShowContent] = useState(false);
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const { webApp, isInitialized } = useTelegram();
  const isTelegram = isInitialized && !!webApp;

  // Get order info from URL params (Tinkoff adds these)
  const orderId = searchParams.get('OrderId');
  const amount = searchParams.get('Amount');
  const productCode = searchParams.get('product') || searchParams.get('ProductCode');
  
  // Determine if this was a subscription purchase
  const isSubscriptionPurchase = productCode?.includes('pro') || productCode?.includes('premium');
  const purchasedTier = productCode?.includes('premium') ? 'premium' : 
                         productCode?.includes('pro') ? 'pro' : null;

  useEffect(() => {
    logger.info('Payment success page loaded', { orderId, amount, productCode, isSubscriptionPurchase });

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['tinkoff-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['credits-limits'] });

    // Show subscription popup for subscription purchases
    if (isSubscriptionPurchase && purchasedTier) {
      const timer = setTimeout(() => {
        setShowSubscriptionPopup(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Enhanced celebration confetti burst
    const launchConfetti = () => {
      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b', '#8b5cf6'],
      });

      // Side bursts
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#10b981', '#34d399', '#fbbf24'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#10b981', '#34d399', '#fbbf24'],
        });
      }, 150);

      // Top burst
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 100,
          origin: { y: 0.3 },
          colors: ['#fbbf24', '#f59e0b', '#8b5cf6'],
        });
      }, 300);
    };

    launchConfetti();

    // Continuous subtle confetti
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#34d399', '#6ee7b7'],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#34d399', '#6ee7b7'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    setTimeout(frame, 500);

    // Delay content for smooth animation
    const timer = setTimeout(() => setShowContent(true), 100);

    // Telegram haptic feedback
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.notificationOccurred('success');
    }

    return () => clearTimeout(timer);
  }, [orderId, amount, productCode, isSubscriptionPurchase, purchasedTier, queryClient, webApp]);

  const handleGoToLibrary = () => {
    navigate('/library');
  };

  const handleGoToGenerate = () => {
    navigate('/generate');
  };

  const handleOpenInTelegram = () => {
    const telegramUrl = getGenerateDeepLink();
    window.open(telegramUrl, '_blank');
  };

  // Format amount if present (Tinkoff sends in kopecks)
  const formattedAmount = amount 
    ? new Intl.NumberFormat('ru-RU', { 
        style: 'currency', 
        currency: 'RUB',
        minimumFractionDigits: 0,
      }).format(parseInt(amount, 10) / 100)
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-background to-success/10 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-success/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/3 right-1/4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 25,
              delay: 0.1,
            }}
            className="w-full max-w-md relative z-10"
          >
            <div className={cn(
              "overflow-hidden rounded-3xl border",
              glass.card,
              "shadow-2xl shadow-success/20"
            )}>
              <div className="pt-10 pb-8 px-6 text-center space-y-6">
                {/* Floating Stars */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: `${10 + i * 5}%`,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.3 + 0.5,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    >
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </motion.div>
                  ))}
                </div>

                {/* Success Icon with Enhanced Pulse */}
                <motion.div 
                  className="relative mx-auto w-28 h-28"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 200, 
                    damping: 15,
                    delay: 0.2,
                  }}
                >
                  {/* Outer pulse rings */}
                  <motion.div 
                    className="absolute inset-0 bg-success/20 rounded-full"
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div 
                    className="absolute inset-2 bg-success/30 rounded-full"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.8, 0.2, 0.8],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div 
                    className="absolute inset-4 bg-success/20 rounded-full"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.4, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                  />
                  
                  {/* Main icon container */}
                  <motion.div 
                    className="relative flex items-center justify-center w-28 h-28 bg-gradient-to-br from-success to-emerald-600 rounded-full shadow-xl shadow-success/40"
                    whileHover={{ scale: 1.05 }}
                  >
                    <CheckCircle className="w-14 h-14 text-white" />
                  </motion.div>
                  
                  {/* Sparkle decorations */}
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </motion.div>
                </motion.div>

                {/* Title & Description */}
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                >
                  <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      🎉
                    </motion.span>
                    Оплата успешна!
                    <motion.span
                      animate={{ rotate: [0, -15, 15, 0] }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                    >
                      🎉
                    </motion.span>
                  </h1>
                  <p className="text-muted-foreground">
                    Кредиты уже зачислены на ваш счёт
                  </p>
                </motion.div>

                {/* Payment Details */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="space-y-3"
                >
                  {formattedAmount && (
                    <motion.div 
                      className={cn(
                        "text-xl font-bold text-success rounded-xl py-3 px-6 inline-flex items-center gap-2",
                        gradientGlass.success
                      )}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Zap className="w-5 h-5" />
                      {formattedAmount}
                    </motion.div>
                  )}
                  {orderId && (
                    <div className={cn(
                      "text-sm rounded-xl p-3",
                      glass.card
                    )}>
                      <span className="text-muted-foreground">Заказ:</span>{' '}
                      <span className="font-mono text-foreground">{orderId}</span>
                    </div>
                  )}
                </motion.div>

                {/* Actions */}
                <motion.div 
                  className="space-y-3 pt-4"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                >
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={handleGoToGenerate}
                      className={cn(
                        "w-full gap-2 h-12 text-base font-semibold",
                        "bg-gradient-to-r from-primary via-primary to-primary/90",
                        "hover:shadow-xl hover:shadow-primary/30",
                        "transition-all duration-300"
                      )}
                      size="lg"
                    >
                      <Music className="w-5 h-5" />
                      Создать музыку
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                  
                  <Button 
                    onClick={handleGoToLibrary}
                    variant="outline"
                    className="w-full gap-2 h-11"
                  >
                    <Crown className="w-4 h-4" />
                    Перейти в библиотеку
                  </Button>

                  {/* Show Telegram link only outside Mini App */}
                  {!isTelegram && (
                    <Button 
                      onClick={handleOpenInTelegram}
                      variant="ghost"
                      className="w-full gap-2 text-muted-foreground"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Открыть в Telegram
                    </Button>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subscription Success Popup */}
      {purchasedTier && (
        <SubscriptionSuccessPopup
          open={showSubscriptionPopup}
          onClose={() => setShowSubscriptionPopup(false)}
          tier={purchasedTier}
          credits={purchasedTier === 'premium' ? 1200 : 500}
        />
      )}
    </div>
  );
}
