/**
 * CreditPackageCard Component
 * Displays a credit package with pricing and selection state
 */

import { Check, Sparkles, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StarsProduct } from '@/services/starsPaymentService';

interface CreditPackageCardProps {
  product: StarsProduct;
  isSelected?: boolean;
  onClick?: (product: StarsProduct) => void;
  disabled?: boolean;
}

export function CreditPackageCard({
  product,
  isSelected = false,
  onClick,
  disabled = false,
}: CreditPackageCardProps) {
  return (
    <Card
      className={cn(
        'relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg overflow-hidden',
        isSelected && 'ring-2 ring-primary shadow-glow',
        product.is_featured && 'border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onClick?.(product)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-label={`${product.name} - ${product.price_stars} Stars`}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.(product);
        }
      }}
    >
      {/* Popular Badge */}
      {product.is_featured && (
        <Badge
          variant="default"
          className="absolute top-3 right-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-glow z-10"
        >
          <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
          Популярно
        </Badge>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 left-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
        </div>
      )}

      <CardContent className="p-5 space-y-4">
        {/* Product Name */}
        <h3 className="text-xl font-bold">{product.name}</h3>
        
        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{product.price_stars}</span>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-5 w-5 fill-current" aria-hidden="true" />
            <span className="text-lg font-medium">Stars</span>
          </div>
        </div>

        {/* Credits Amount */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <span className="text-muted-foreground">Кредитов</span>
          <span className="text-2xl font-bold text-primary">{product.credits_amount}</span>
        </div>
      </CardContent>
    </Card>
  );
}
