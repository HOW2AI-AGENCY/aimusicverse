/**
 * Payment Method Selector Component
 * Allows users to choose between Telegram Stars and Card payment
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Star, CreditCard, Check } from 'lucide-react';
import type { PaymentGateway } from '@/types/payment';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentGateway;
  onSelect: (method: PaymentGateway) => void;
  isTelegram?: boolean;
  priceStars?: number;
  priceRubCents?: number;
  className?: string;
}

export function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  isTelegram = false,
  priceStars,
  priceRubCents,
  className,
}: PaymentMethodSelectorProps) {
  const methods = [
    {
      gateway: 'telegram_stars' as PaymentGateway,
      name: 'Telegram Stars',
      description: 'Быстрая оплата в Telegram',
      icon: Star,
      price: priceStars ? `⭐ ${priceStars}` : undefined,
      available: isTelegram,
      recommended: isTelegram,
    },
    {
      gateway: 'tinkoff' as PaymentGateway,
      name: 'Банковская карта',
      description: 'Visa, Mastercard, МИР',
      icon: CreditCard,
      price: priceRubCents ? `${Math.round(priceRubCents / 100)} ₽` : undefined,
      available: true,
      recommended: !isTelegram,
    },
  ];

  const availableMethods = methods.filter(m => m.available);

  if (availableMethods.length === 1) {
    // Auto-select the only available method
    if (selectedMethod !== availableMethods[0].gateway) {
      onSelect(availableMethods[0].gateway);
    }
    return null; // Don't show selector if only one option
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm text-muted-foreground">Способ оплаты</p>
      <div className="grid gap-2">
        {availableMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.gateway;
          
          return (
            <button
              key={method.gateway}
              onClick={() => onSelect(method.gateway)}
              className={cn(
                'relative flex items-center gap-3 p-3 rounded-lg border transition-all',
                'hover:bg-accent/50',
                isSelected 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                  : 'border-border bg-background'
              )}
            >
              {/* Icon */}
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              
              {/* Text */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-medium',
                    isSelected ? 'text-foreground' : 'text-foreground/80'
                  )}>
                    {method.name}
                  </span>
                  {method.recommended && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      Рекомендуем
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </div>

              {/* Price */}
              {method.price && (
                <div className={cn(
                  'font-semibold',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {method.price}
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
