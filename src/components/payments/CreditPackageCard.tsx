/**
 * CreditPackageCard Component
 * Enhanced card with glassmorphism and animations
 */

import { cn } from '@/lib/utils';
import { CreditCard, Check, Sparkles, Zap, Crown, TrendingUp } from 'lucide-react';
import { motion } from '@/lib/motion';
import { glass } from '@/lib/glass';
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

  const tracksCount = Math.floor((product.credits_amount ?? 0) / 12);
  const pricePerTrack = product.price_rub_cents && tracksCount > 0
    ? Math.round((product.price_rub_cents / 100) / tracksCount) 
    : null;

  return (
    <motion.button
      onClick={() => onClick?.(product)}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative w-full text-left p-5 rounded-2xl border transition-all duration-300',
        'hover:shadow-xl hover:shadow-primary/10',
        isSelected 
          ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xl shadow-primary/15' 
          : cn(glass.card, 'hover:border-primary/40'),
        product.is_featured && !isSelected && 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent',
        className
      )}
    >
      {/* Featured Badge */}
      {product.is_featured && (
        <motion.div 
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500 }}
          className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold flex items-center gap-1 shadow-lg shadow-amber-500/30"
        >
          <Sparkles className="w-3 h-3" />
          Популярный
        </motion.div>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-4 pr-8">
        <h3 className="text-lg font-semibold">{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Credits Info with animation */}
      <motion.div 
        className="flex items-baseline gap-2 mb-4"
        animate={isSelected ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {product.credits_amount}
        </span>
        <span className="text-muted-foreground text-sm">кредитов</span>
      </motion.div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-lg">
          <Zap className="w-4 h-4 text-primary" />
          <span>≈ {tracksCount} треков</span>
        </div>
        {pricePerTrack && (
          <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>~{pricePerTrack} ₽/трек</span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Картой</span>
          </div>
          <motion.div 
            className="text-2xl font-bold"
            animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
          >
            {product.price_rub_cents 
              ? formatRubles(product.price_rub_cents)
              : '—'
            }
          </motion.div>
        </div>
      </div>
    </motion.button>
  );
}
