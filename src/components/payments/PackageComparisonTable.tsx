/**
 * PackageComparisonTable Component
 * Shows a clear comparison of credit packages with value indicators
 */

import { Check, Star, Zap, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StarsProduct } from '@/services/starsPaymentService';

interface PackageComparisonTableProps {
  products: StarsProduct[];
  selectedProduct: StarsProduct | null;
  onSelect: (product: StarsProduct) => void;
}

/**
 * Calculate value per star (credits per star spent)
 */
function getValuePerStar(product: StarsProduct): number {
  if (!product.price_stars || product.price_stars === 0) return 0;
  return (product.credits_amount ?? 0) / product.price_stars;
}

/**
 * Get tracks that can be generated with credits
 * Approximately 3 credits = 1 track
 */
function getTracksEstimate(credits: number): number {
  return Math.floor(credits / 3);
}

/**
 * Find the best value product
 */
function getBestValueProduct(products: StarsProduct[]): StarsProduct | null {
  if (products.length === 0) return null;
  return products.reduce((best, current) => {
    return getValuePerStar(current) > getValuePerStar(best) ? current : best;
  });
}

export function PackageComparisonTable({
  products,
  selectedProduct,
  onSelect,
}: PackageComparisonTableProps) {
  const bestValue = getBestValueProduct(products);

  return (
    <div className="space-y-4">
      {/* Conversion Info */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-muted-foreground">
          <strong className="text-foreground">3 кредита = 1 трек</strong> — генерация AI-музыки
        </span>
      </div>

      {/* Packages List */}
      <div className="space-y-3">
        {products.map((product) => {
            const isSelected = selectedProduct?.id === product.id;
            const isBestValue = bestValue?.id === product.id && products.length > 1;
            const creditsAmount = product.credits_amount ?? 0;
            const tracksCount = getTracksEstimate(creditsAmount);
            const valuePerStar = getValuePerStar(product);

          return (
            <button
              key={product.id}
              onClick={() => onSelect(product)}
              className={cn(
                'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                'hover:scale-[1.01] hover:shadow-md',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50',
                isBestValue && !isSelected && 'border-green-500/50 bg-green-500/5'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Package Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">{creditsAmount}</span>
                    <span className="text-muted-foreground">кредитов</span>
                    {isBestValue && (
                      <Badge className="bg-green-500 text-white">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Лучшая цена
                      </Badge>
                    )}
                    {product.is_featured && !isBestValue && (
                      <Badge variant="secondary">Популярно</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ≈ {tracksCount} {tracksCount === 1 ? 'трек' : tracksCount < 5 ? 'трека' : 'треков'}
                  </p>
                </div>

                {/* Right: Price */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold">{product.price_stars}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {valuePerStar.toFixed(2)} кр/★
                  </p>
                </div>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/20">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">Выбрано</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
