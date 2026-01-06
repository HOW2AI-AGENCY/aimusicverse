/**
 * PackageComparisonTable Component
 * Table view for comparing credit packages with Tinkoff pricing
 */

import { cn } from '@/lib/utils';
import { Check, CreditCard, Sparkles, Zap } from 'lucide-react';
import { motion } from '@/lib/motion';
import type { StarsProduct } from '@/services/starsPaymentService';
import { formatRubles } from '@/types/payment';

interface PackageComparisonTableProps {
  products: StarsProduct[];
  selectedProduct?: StarsProduct | null;
  onSelect?: (product: StarsProduct) => void;
  className?: string;
}

export function PackageComparisonTable({
  products,
  selectedProduct,
  onSelect,
  className,
}: PackageComparisonTableProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {products.map((product, index) => {
        const isSelected = selectedProduct?.id === product.id;
        const name = typeof product.name === 'object'
          ? (product.name as Record<string, string>).ru || (product.name as Record<string, string>).en
          : product.name;

        const tracksCount = Math.floor((product.credits_amount ?? 0) / 3);
        const pricePerTrack = product.price_rub_cents && product.credits_amount
          ? Math.round((product.price_rub_cents / 100) / tracksCount)
          : null;

        return (
          <motion.button
            key={product.id}
            onClick={() => onSelect?.(product)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'relative w-full text-left p-4 rounded-xl border transition-all duration-200',
              'hover:shadow-md',
              isSelected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-primary/50',
              product.is_featured && 'border-amber-500/50'
            )}
          >
            <div className="flex items-center gap-4">
              {/* Featured Badge */}
              {product.is_featured && (
                <div className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Популярный
                </div>
              )}

              {/* Selection Circle */}
              <div className={cn(
                'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                isSelected
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/30'
              )}>
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>

              {/* Credits */}
              <div className="flex-shrink-0 min-w-[80px]">
                <div className="text-xl font-bold text-primary">
                  {product.credits_amount}
                </div>
                <div className="text-xs text-muted-foreground">кредитов</div>
              </div>

              {/* Tracks */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span>≈ {tracksCount} треков</span>
              </div>

              {/* Value Indicator */}
              {pricePerTrack && (
                <div className={cn(
                  'ml-auto px-2 py-1 rounded-md text-xs font-medium',
                  product.is_featured
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-muted text-muted-foreground'
                )}>
                  ~{pricePerTrack} ₽/трек
                </div>
              )}

              {/* Price */}
              <div className="flex-shrink-0 text-right min-w-[100px]">
                <div className="flex items-center gap-1 justify-end">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-lg font-bold">
                    {product.price_rub_cents
                      ? formatRubles(product.price_rub_cents)
                      : '—'
                    }
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
