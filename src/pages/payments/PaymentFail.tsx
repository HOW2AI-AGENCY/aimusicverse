/**
 * Payment Fail Page
 * Shown after failed payment via Tinkoff
 * Includes error handling and retry options
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, ArrowLeft, HelpCircle, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from '@/lib/motion';
import { useTelegram } from '@/contexts/TelegramContext';

export default function PaymentFail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showContent, setShowContent] = useState(false);
  const { webApp, isInitialized } = useTelegram();
  const isTelegram = isInitialized && !!webApp;

  // Get error info from URL params
  const orderId = searchParams.get('OrderId');
  const errorCode = searchParams.get('ErrorCode');
  const message = searchParams.get('Message');

  useEffect(() => {
    logger.warn('Payment fail page loaded', { orderId, errorCode, message });

    // Delay content for smooth animation
    const timer = setTimeout(() => setShowContent(true), 100);

    // Telegram haptic feedback
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.notificationOccurred('error');
    }

    return () => clearTimeout(timer);
  }, [orderId, errorCode, message, webApp]);

  const handleRetry = () => {
    navigate('/buy-credits');
  };

  const handleGoBack = () => {
    // Try to get saved return URL
    const returnUrl = sessionStorage.getItem('payment_return_url');
    if (returnUrl) {
      sessionStorage.removeItem('payment_return_url');
      try {
        navigate(new URL(returnUrl).pathname);
      } catch {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleContactSupport = () => {
    // Open support chat in Telegram
    const supportUrl = 'https://t.me/aimusicverse_support';
    window.open(supportUrl, '_blank');
  };

  const getErrorInfo = () => {
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return ERROR_MESSAGES[errorCode];
    }
    
    return {
      title: 'Платёж не был завершён',
      description: message || 'Произошла ошибка при обработке платежа. Попробуйте ещё раз.',
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-background to-destructive/5">
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
            <Card className="overflow-hidden border-destructive/20 shadow-xl shadow-destructive/10">
              <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
                {/* Error Icon with Shake */}
                <motion.div 
                  className="relative mx-auto w-24 h-24"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 15,
                    delay: 0.2,
                  }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-destructive/20 rounded-full"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <div className="relative flex items-center justify-center w-24 h-24 bg-destructive/10 rounded-full">
                    <XCircle className="w-12 h-12 text-destructive" />
                  </div>
                </motion.div>

                {/* Title & Description */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h1 className="text-2xl font-bold text-foreground">
                    {errorInfo.title}
                  </h1>
                  <p className="text-muted-foreground">
                    {errorInfo.description}
                  </p>
                </motion.div>

                {/* Order ID */}
                {orderId && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3"
                  >
                    Номер заказа: <span className="font-mono text-foreground">{orderId}</span>
                    {errorCode && (
                      <span className="block mt-1 text-xs opacity-70">
                        Код ошибки: {errorCode}
                      </span>
                    )}
                  </motion.div>
                )}

                {/* Help text */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="flex items-start gap-2 text-left text-sm text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"
                >
                  <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  <p>
                    Деньги не были списаны с вашей карты. 
                    Попробуйте ещё раз или используйте другой способ оплаты.
                  </p>
                </motion.div>

                {/* Actions */}
                <motion.div 
                  className="space-y-3 pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    onClick={handleRetry}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Попробовать снова
                  </Button>
                  
                  <Button 
                    onClick={handleGoBack}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Вернуться назад
                  </Button>

                  <Button 
                    onClick={handleContactSupport}
                    variant="ghost"
                    className="w-full gap-2 text-muted-foreground"
                    size="sm"
                  >
                    {isTelegram ? (
                      <MessageCircle className="w-4 h-4" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Связаться с поддержкой
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
