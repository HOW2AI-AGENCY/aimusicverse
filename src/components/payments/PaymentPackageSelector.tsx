/**
 * Payment Package Selector
 * Beautiful animated package selector for mobile
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, TrendingUp, Crown } from 'lucide-react';
import type { StarsProduct } from '@/services/starsPaymentService';
import { formatRubles } from '@/types/payment';
import { cn } from '@/lib/utils';

interface PaymentPackageSelectorProps {
  products: StarsProduct[];
  selectedProduct: StarsProduct | null;
  onSelect: (product: StarsProduct) => void;
}

export function PaymentPackageSelector({
  products,
  selectedProduct,
  onSelect,
}: PaymentPackageSelectorProps) {
  // Calculate best value (highest credits per ruble)
  const getBestValue = () => {
    if (products.length === 0) return null;
    
    let best = products[0];
    let bestRatio = 0;
    
    products.forEach(p => {
      if (p.price_rub_cents && p.credits_amount) {
        const ratio = p.credits_amount / p.price_rub_cents;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = p;
        }
      }
    });
    
    return best.id;
  };

  const bestValueId = getBestValue();

  // Get product label
  const getProductLabel = (product: StarsProduct) => {
    if (product.is_featured) return { text: 'Популярный', icon: TrendingUp, color: 'bg-primary text-primary-foreground' };
    if (product.id === bestValueId) return { text: 'Выгодно', icon: Crown, color: 'bg-success text-white' };
    return null;
  };

  // Calculate discount percentage based on first package
  const getDiscount = (product: StarsProduct) => {
    if (products.length < 2 || !product.price_rub_cents || !product.credits_amount) return null;
    
    const base = products[0];
    if (!base.price_rub_cents || !base.credits_amount) return null;
    
    const baseRate = base.price_rub_cents / base.credits_amount;
    const productRate = product.price_rub_cents / product.credits_amount;
    
    if (productRate >= baseRate) return null;
    
    const discount = Math.round((1 - productRate / baseRate) * 100);
    return discount > 5 ? discount : null;
  };

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {products.map((product, index) => {
          const isSelected = selectedProduct?.id === product.id;
          const label = getProductLabel(product);
          const discount = getDiscount(product);
          const creditsAmount = product.credits_amount ?? 0;
          const priceRub = product.price_rub_cents;
          const tracksCount = Math.floor(creditsAmount / 3);

          return (
            <motion.button
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              onClick={() => onSelect(product)}
              className={cn(
                'relative w-full p-4 rounded-2xl border-2 transition-all duration-300',
                'flex items-center gap-4 text-left',
                'touch-manipulation active:scale-[0.98]',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
              )}
            >
              {/* Label badge */}
              {label && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    'absolute -top-2 left-4 px-2 py-0.5 rounded-full text-[10px] font-medium',
                    'flex items-center gap-1',
                    label.color
                  )}
                >
                  <label.icon className="w-3 h-3" />
                  {label.text}
                </motion.div>
              )}

              {/* Discount badge */}
              {discount && (
                <motion.div
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: -12 }}
                  className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning text-black"
                >
                  -{discount}%
                </motion.div>
              )}

              {/* Selection indicator */}
              <div className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                isSelected
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/30'
              )}>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Zap className={cn(
                    'w-4 h-4 transition-colors',
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className="font-bold text-lg">{creditsAmount} кредитов</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  ≈ {tracksCount} {tracksCount === 1 ? 'трек' : tracksCount < 5 ? 'трека' : 'треков'}
                </p>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <motion.p 
                  className="font-bold text-xl"
                  animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {priceRub ? formatRubles(priceRub) : '—'}
                </motion.p>
                {priceRub && creditsAmount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatRubles(Math.round(priceRub / creditsAmount))}/кред.
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
