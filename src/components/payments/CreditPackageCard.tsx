/**
 * CreditPackageCard Component
 * Displays a credit package with pricing and selection state
 */

import { Check, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StarsProduct } from '@/services/starsPaymentService';

interface CreditPackageCardProps {
  product: StarsProduct;
  isSelected?: boolean;
  onClick?: (product: StarsProduct) => void;
  disabled?: boolean;
  language?: 'en' | 'ru';
}

export function CreditPackageCard({
  product,
  isSelected = false,
  onClick,
  disabled = false,
  language = 'en',
}: CreditPackageCardProps) {
  const name = product.name;
  const description = product.description || '';

  // Bonus percentage not available in new type
  const hasBonus = false;

  return (
    <Card
      className={cn(
        'relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
        isSelected && 'ring-2 ring-primary shadow-glow',
        product.is_featured && 'border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onClick?.(product)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-label={`${name} - ${product.price_stars} Stars`}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.(product);
        }
      }}
    >
      {/* Featured Badge */}
      {product.is_featured && (
        <Badge
          variant="default"
          className="absolute -top-2 -right-2 bg-gradient-telegram text-white shadow-glow z-10"
        >
          <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
          Featured
        </Badge>
      )}

      {/* Bonus Badge - disabled */}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
        </div>
      )}

      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <span>{product.credits_amount}</span>
          <span className="text-lg text-muted-foreground">Credits</span>
        </CardTitle>
        <CardDescription className="text-base">
          {name}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <div className="flex items-center gap-1">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="text-3xl font-bold">{product.price_stars}</span>
          </div>
          <span className="text-lg text-muted-foreground">Stars</span>
        </div>

        {/* USD Price not available */}

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground pt-2 border-t">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
