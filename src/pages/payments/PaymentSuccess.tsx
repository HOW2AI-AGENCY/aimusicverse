/**
 * Payment Success Page
 * Shown after successful payment via Tinkoff/Robokassa
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, ArrowRight, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import confetti from 'canvas-confetti';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [showContent, setShowContent] = useState(false);

  // Get order info from URL params (Tinkoff adds these)
  const orderId = searchParams.get('OrderId');

  useEffect(() => {
    logger.info('Payment success page loaded', { orderId });

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });

    // Show confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    });

    // Delay content for smooth animation
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, [orderId, queryClient]);

  const handleGoToLibrary = () => {
    navigate('/library');
  };

  const handleGoToGenerate = () => {
    navigate('/generate');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <Card className={`
        max-w-md w-full transform transition-all duration-500
        ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
          {/* Success Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Оплата прошла успешно!
            </h1>
            <p className="text-muted-foreground">
              Кредиты уже зачислены на ваш счёт
            </p>
          </div>

          {/* Order ID */}
          {orderId && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              Номер заказа: <span className="font-mono">{orderId}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button 
              onClick={handleGoToGenerate}
              className="w-full gap-2"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
