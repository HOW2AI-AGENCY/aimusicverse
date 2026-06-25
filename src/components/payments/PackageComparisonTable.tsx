/**
 * PackageComparisonTable Component
 * Enhanced table view with glassmorphism and animations
 */

import { cn } from "@/lib/utils";
import { Check, CreditCard, Sparkles, Zap, Crown } from "@/lib/icons";
import { motion } from "@/lib/motion";
import { glass } from "@/lib/glass";
import type { StarsProduct } from "@/services/starsPaymentService";
import { formatRubles } from "@/types/payment";

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
  // Find best value product (lowest price per track)
  const getBestValueId = (): string | undefined => {
    if (products.length === 0) return undefined;

    let bestProductId: string | undefined = undefined;
    let lowestPricePerTrack = Infinity;

    for (const product of products) {
      const tracksCount = Math.floor((product.credits_amount ?? 0) / 12);
      if (tracksCount > 0 && product.price_rub_cents) {
        const pricePerTrack = product.price_rub_cents / 100 / tracksCount;
        if (pricePerTrack < lowestPricePerTrack) {
          lowestPricePerTrack = pricePerTrack;
          bestProductId = product.id;
        }
      }
    }

    return bestProductId;
  };

  const bestValueId = getBestValueId();

  return (
    <div className={cn("space-y-3", className)}>
      {products.map((product, index) => {
        const isSelected = selectedProduct?.id === product.id;
        const isBestValue = product.id === bestValueId;
        const isFeatured = product.is_featured;

        const tracksCount = Math.floor((product.credits_amount ?? 0) / 12);
        const pricePerTrack =
          product.price_rub_cents && tracksCount > 0 ? Math.round(product.price_rub_cents / 100 / tracksCount) : null;

        // Determine savings percentage for larger packages
        const baseCredits = products[0]?.credits_amount ?? 0;
        const basePricePerCredit =
          products[0]?.price_rub_cents && baseCredits ? products[0].price_rub_cents / 100 / baseCredits : 0;
        const currentPricePerCredit =
          product.price_rub_cents && product.credits_amount
            ? product.price_rub_cents / 100 / product.credits_amount
            : 0;
        const savingsPercent =
          basePricePerCredit && currentPricePerCredit && basePricePerCredit > currentPricePerCredit
            ? Math.round((1 - currentPricePerCredit / basePricePerCredit) * 100)
            : 0;

        return (
          <motion.button
            key={product.id}
            onClick={() => onSelect?.(product)}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 400 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "relative w-full text-left p-4 rounded-xl border transition-all duration-200",
              "hover:shadow-lg hover:shadow-primary/5",
              isSelected
                ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-lg shadow-primary/10"
                : cn(glass.card, "hover:border-primary/40"),
              isFeatured && !isSelected && "border-amber-500/40 bg-amber-500/5",
              isBestValue && !isFeatured && !isSelected && "border-green-500/40 bg-green-500/5",
            )}
          >
            {/* Badges */}
            <div className="absolute -top-2.5 left-4 flex items-center gap-2">
              {isFeatured && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.1, type: "spring" }}
                  className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Sparkles className="w-3 h-3" />
                  Популярный
                </motion.div>
              )}
              {isBestValue && !isFeatured && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.1, type: "spring" }}
                  className="px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Crown className="w-3 h-3" />
                  Лучшая цена
                </motion.div>
              )}
              {savingsPercent > 0 && !isFeatured && !isBestValue && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.1, type: "spring" }}
                  className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold"
                >
                  -{savingsPercent}%
                </motion.div>
              )}
            </div>

            {/* Mobile-first responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-1">
              {/* Left: Selection + Credits */}
              <div className="flex items-center gap-3">
                {/* Selection Circle */}
                <motion.div
                  animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                    isSelected ? "border-primary bg-primary shadow-md shadow-primary/30" : "border-muted-foreground/30",
                  )}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Credits */}
                <div className="flex-shrink-0">
                  <div className="text-xl font-bold text-primary">{product.credits_amount}</div>
                  <div className="text-xs text-muted-foreground">кредитов</div>
                </div>

                {/* Tracks - visible on mobile inline */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground sm:hidden">
                  <Zap className="w-4 h-4 text-primary/70" />
                  <span>≈ {tracksCount} треков</span>
                </div>
              </div>

              {/* Middle: Tracks (hidden on mobile, shown on sm+) */}
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground flex-1">
                <Zap className="w-4 h-4 text-primary/70" />
                <span>≈ {tracksCount} треков</span>
              </div>

              {/* Right: Price + Value */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pl-9 sm:pl-0">
                {/* Value Indicator */}
                {pricePerTrack && (
                  <div
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                      isFeatured
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : isBestValue
                          ? "bg-green-500/15 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    ~{pricePerTrack} ₽/трек
                  </div>
                )}

                {/* Price */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg font-bold">
                      {product.price_rub_cents ? formatRubles(product.price_rub_cents) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
