/**
 * Payment Fail Page
 * Shown after failed payment via Tinkoff/Robokassa
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function PaymentFail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showContent, setShowContent] = useState(false);

  // Get error info from URL params
  const orderId = searchParams.get('OrderId');
  const errorCode = searchParams.get('ErrorCode');

  useEffect(() => {
    logger.warn('Payment fail page loaded', { orderId, errorCode });

    // Delay content for smooth animation
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, [orderId, errorCode]);

  const handleRetry = () => {
    navigate('/buy-credits');
  };

  const handleGoBack = () => {
    // Try to get saved return URL
    const returnUrl = sessionStorage.getItem('payment_return_url');
    if (returnUrl) {
      sessionStorage.removeItem('payment_return_url');
      navigate(new URL(returnUrl).pathname);
    } else {
      navigate('/');
    }
  };

  const getErrorMessage = (code?: string | null): string => {
    if (!code) return 'Платёж не был завершён';
    
    // Common Tinkoff error codes
    const errorMessages: Record<string, string> = {
      '0': 'Операция отменена пользователем',
      '99': 'Платёж отклонён банком',
      '100': 'Недостаточно средств на карте',
      '101': 'Карта заблокирована',
      '102': 'Превышен лимит',
      '103': 'Срок действия карты истёк',
      '119': 'Превышено количество попыток ввода PIN',
      '191': 'Некорректная сумма',
      '1006': 'Проблема с 3D-Secure авторизацией',
    };
    
    return errorMessages[code] || `Ошибка платежа (код: ${code})`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <Card className={`
        max-w-md w-full transform transition-all duration-500
        ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
          {/* Error Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-destructive/20 rounded-full animate-pulse" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-destructive/10 rounded-full">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Оплата не удалась
            </h1>
            <p className="text-muted-foreground">
              {getErrorMessage(errorCode)}
            </p>
          </div>

          {/* Order ID */}
          {orderId && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              Номер заказа: <span className="font-mono">{orderId}</span>
            </div>
          )}

          {/* Help text */}
          <div className="flex items-start gap-2 text-left text-sm text-muted-foreground bg-amber-500/10 rounded-lg p-3">
            <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
            <p>
              Деньги не были списаны с вашей карты. 
              Попробуйте ещё раз или используйте другой способ оплаты.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
