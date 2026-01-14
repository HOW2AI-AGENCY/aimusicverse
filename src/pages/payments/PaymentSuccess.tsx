/**
 * Payment Success Page
 * Shown after successful payment via Tinkoff
 * Includes Telegram deep links and enhanced animations
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Music, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from '@/lib/motion';
import confetti from 'canvas-confetti';
import { useTelegram } from '@/contexts/TelegramContext';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [showContent, setShowContent] = useState(false);
  const { webApp, isInitialized } = useTelegram();
  const isTelegram = isInitialized && !!webApp;

  // Get order info from URL params (Tinkoff adds these)
  const orderId = searchParams.get('OrderId');
  const amount = searchParams.get('Amount');

  useEffect(() => {
    logger.info('Payment success page loaded', { orderId, amount });

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['tinkoff-subscriptions'] });

    // Celebration confetti burst
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Delay content for smooth animation
    const timer = setTimeout(() => setShowContent(true), 100);

    // Telegram haptic feedback
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.notificationOccurred('success');
    }

    return () => clearTimeout(timer);
  }, [orderId, amount, queryClient, webApp]);

  const handleGoToLibrary = () => {
    navigate('/library');
  };

  const handleGoToGenerate = () => {
    navigate('/generate');
  };

  const handleOpenInTelegram = () => {
    // Deep link to Telegram Mini App
    const botUsername = 'aimusicversebot'; // Replace with actual bot username
    const telegramUrl = `https://t.me/${botUsername}?startapp=generate`;
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-background to-success/5">
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              delay: 0.1,
            }}
            className="w-full max-w-md"
          >
            <Card className="overflow-hidden border-success/20 shadow-xl shadow-success/10">
              <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
                {/* Success Icon with Pulse */}
                <motion.div 
                  className="relative mx-auto w-24 h-24"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 15,
                    delay: 0.2,
                  }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-success/20 rounded-full"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <motion.div 
                    className="absolute inset-2 bg-success/10 rounded-full"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.8, 0.4, 0.8],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.3,
                    }}
                  />
                  <div className="relative flex items-center justify-center w-24 h-24 bg-success/10 rounded-full">
                    <CheckCircle className="w-12 h-12 text-success" />
                  </div>
                </motion.div>

                {/* Title & Description */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Оплата прошла успешно!
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </h1>
                  <p className="text-muted-foreground">
                    Кредиты уже зачислены на ваш счёт
                  </p>
                </motion.div>

                {/* Payment Details */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  {formattedAmount && (
                    <div className="text-lg font-semibold text-success bg-success/10 rounded-lg py-2 px-4 inline-block">
                      {formattedAmount}
                    </div>
                  )}
                  {orderId && (
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      Номер заказа: <span className="font-mono text-foreground">{orderId}</span>
                    </div>
                  )}
                </motion.div>

                {/* Actions */}
                <motion.div 
                  className="space-y-3 pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    onClick={handleGoToGenerate}
                    className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    size="lg"
                  >
                    <Music className="w-4 h-4" />
                    Создать музыку
                  </Button>
                  
                  <Button 
                    onClick={handleGoToLibrary}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    Перейти в библиотеку
                    <ArrowRight className="w-4 h-4" />
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
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
