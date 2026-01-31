/**
 * Payment Method Selector Component
 * Professional glassmorphism design with animations
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CreditCard, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from '@/lib/motion';
import { glass, gradientGlass } from '@/lib/glass';
import { formatRubles } from '@/types/payment';

interface PaymentMethodSelectorProps {
  priceRubCents?: number;
  className?: string;
}

export function PaymentMethodSelector({
  priceRubCents,
  className,
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ShieldCheck className="w-4 h-4 text-success" />
        <span>Безопасный способ оплаты</span>
      </motion.div>

      {/* Payment method card */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
        className={cn(
          'relative flex items-center gap-4 p-4 rounded-2xl',
          'border-2 border-primary/40',
          glass.card,
          'ring-2 ring-primary/20 ring-offset-2 ring-offset-background'
        )}
      >
        {/* Gradient background effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
        
        {/* Icon container with gradient */}
        <motion.div 
          className={cn(
            'relative flex items-center justify-center w-14 h-14 rounded-xl',
            'bg-gradient-to-br from-primary/30 to-primary/10',
            'border border-primary/20'
          )}
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <CreditCard className="w-6 h-6 text-primary" />
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <Check className="w-2.5 h-2.5 text-success-foreground" />
          </motion.div>
        </motion.div>
        
        {/* Info section */}
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-base">Банковская карта</span>
            <motion.span 
              className={cn(
                'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                'bg-gradient-to-r from-primary/30 to-primary/20 text-primary',
                'rounded-full border border-primary/30'
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Tinkoff
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Visa • Mastercard • МИР
            </p>
            <Sparkles className="w-3 h-3 text-warning" />
          </div>
        </div>

        {/* Price display */}
        {priceRubCents && (
          <motion.div 
            className="relative text-right shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              {formatRubles(priceRubCents)}
            </span>
          </motion.div>
        )}

        {/* Selected checkmark */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, delay: 0.25 }}
          className={cn(
            'relative flex items-center justify-center w-7 h-7 rounded-full shrink-0',
            'bg-gradient-to-br from-primary to-primary/80',
            'shadow-lg shadow-primary/30'
          )}
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      </motion.div>
    </div>
  );
}
