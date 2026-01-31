/**
 * Payment Method Selector Component
 * Enhanced with glassmorphism and animations
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CreditCard, Check, ShieldCheck } from 'lucide-react';
import { motion } from '@/lib/motion';
import { glass } from '@/lib/glass';
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
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl',
          'border border-primary/30 bg-primary/5',
          'ring-1 ring-primary/20'
        )}
      >
        {/* Icon with animation */}
        <motion.div 
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10"
          whileHover={{ scale: 1.05 }}
        >
          <CreditCard className="w-5 h-5 text-primary" />
        </motion.div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">Банковская карта</span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded">
              Tinkoff
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-xs text-muted-foreground">
              Visa, Mastercard, МИР
            </p>
          </div>
        </div>

        {/* Price (if provided) */}
        {priceRubCents && (
          <div className="text-right shrink-0">
            <span className="font-semibold">{formatRubles(priceRubCents)}</span>
          </div>
        )}

        {/* Selected indicator */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
        </motion.div>
      </motion.div>
    </div>
  );
}
