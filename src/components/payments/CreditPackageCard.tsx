/**
 * CreditPackageCard Component
 * Modern card for credit packages with Tinkoff pricing
 */

import { cn } from '@/lib/utils';
import { CreditCard, Check, Sparkles, Zap } from 'lucide-react';
import { motion } from '@/lib/motion';
import type { StarsProduct } from '@/services/starsPaymentService';
import { formatRubles } from '@/types/payment';

interface CreditPackageCardProps {
  product: StarsProduct;
  isSelected?: boolean;
  onClick?: (product: StarsProduct) => void;
  className?: string;
}

export function CreditPackageCard({
  product,
  isSelected = false,
  onClick,
  className,
}: CreditPackageCardProps) {
  const name = typeof product.name === 'object' && product.name !== null
    ? (product.name as Record<string, string>).ru || (product.name as Record<string, string>).en 
    : String(product.name || '');
    
  const description = typeof product.description === 'object' && product.description !== null
    ? (product.description as Record<string, string>)?.ru || (product.description as Record<string, string>)?.en
    : product.description;

  const tracksCount = Math.floor((product.credits_amount ?? 0) / 3);
  const pricePerTrack = product.price_rub_cents && product.credits_amount 
    ? Math.round((product.price_rub_cents / 100) / tracksCount) 
    : null;

  return (
    <motion.button
      onClick={() => onClick?.(product)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative w-full text-left p-5 rounded-xl border transition-all duration-200',
        'hover:shadow-lg hover:shadow-primary/5',
        isSelected 
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
          : 'border-border bg-card hover:border-primary/50',
        product.is_featured && 'border-amber-500/50',
        className
      )}
    >
      {/* Featured Badge */}
      {product.is_featured && (
        <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Популярный
        </div>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Credits Info */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-primary">
          {product.credits_amount}
        </span>
        <span className="text-muted-foreground">кредитов</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4" />
          <span>≈ {tracksCount} треков</span>
        </div>
        {pricePerTrack && (
          <div className="flex items-center gap-1">
            <span>~{pricePerTrack} ₽/трек</span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Картой</span>
          </div>
          <div className="text-xl font-bold">
            {product.price_rub_cents 
              ? formatRubles(product.price_rub_cents)
              : '—'
            }
          </div>
        </div>
      </div>
    </motion.button>
  );
}
