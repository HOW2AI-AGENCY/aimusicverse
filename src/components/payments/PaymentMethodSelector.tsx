/**
 * Payment Method Selector Component
 * Card payment via Tinkoff only
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CreditCard, Check } from 'lucide-react';
import { formatRubles } from '@/types/payment';

interface PaymentMethodSelectorProps {
  priceRubCents?: number;
  className?: string;
}

export function PaymentMethodSelector({
  priceRubCents,
  className,
}: PaymentMethodSelectorProps) {
  // Only Tinkoff card payment is available
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-primary/5 ring-1 ring-primary/20">
        {/* Icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Банковская карта</span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded">
              Tinkoff
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Visa, Mastercard, МИР
          </p>
        </div>

        {/* Price */}
        {priceRubCents && (
          <div className="text-right">
            <span className="font-semibold">{formatRubles(priceRubCents)}</span>
          </div>
        )}

        {/* Selected indicator */}
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground">
          <Check className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
