/**
 * SubscriptionCard Component
 * Displays subscription tier with features and pricing
 */

import { Check, Crown, Sparkles, Zap, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarsPaymentButton } from './StarsPaymentButton';
import { cn } from '@/lib/utils';
import type { StarsProduct } from '@/services/starsPaymentService';

interface SubscriptionCardProps {
  product: StarsProduct;
  isCurrentTier?: boolean;
  onSubscribe?: (product: StarsProduct) => void;
  disabled?: boolean;
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  basic: <Zap className="h-6 w-6" aria-hidden="true" />,
  pro: <Crown className="h-6 w-6" aria-hidden="true" />,
  enterprise: <Sparkles className="h-6 w-6" aria-hidden="true" />,
};

export function SubscriptionCard({
  product,
  isCurrentTier = false,
  onSubscribe,
  disabled = false,
}: SubscriptionCardProps) {
  const tier = product.subscription_tier || 'pro';
  const icon = TIER_ICONS[tier] || TIER_ICONS.pro;
  const features = product.features || [];

  return (
    <Card
      className={cn(
        'relative transition-all duration-300 overflow-hidden',
        product.is_featured && 'border-primary shadow-glow scale-[1.02]',
        isCurrentTier && 'ring-2 ring-green-500'
      )}
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

      {/* Current Tier Badge */}
      {isCurrentTier && (
        <Badge
          variant="default"
          className="absolute top-3 left-3 bg-green-500 text-white"
        >
          <Check className="mr-1 h-3 w-3" aria-hidden="true" />
          Ваш план
        </Badge>
      )}

      <CardHeader className="space-y-4 pt-6">
        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>

        {/* Name */}
        <h3 className="text-2xl font-bold text-center">{product.name}</h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground text-center">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="text-center pt-2">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold">{product.price_stars}</span>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-5 w-5 fill-current" aria-hidden="true" />
              <span className="text-lg font-medium">Stars</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            / {product.subscription_days} дней
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Credits Amount */}
        {product.credits_amount && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-4">
            <span className="text-muted-foreground">Кредитов в месяц</span>
            <span className="text-xl font-bold text-primary">{product.credits_amount}</span>
          </div>
        )}

        {/* Features List */}
        {features.length > 0 && (
          <ul className="space-y-2" role="list">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        <StarsPaymentButton
          onClick={() => onSubscribe?.(product)}
          disabled={disabled || isCurrentTier}
          variant={product.is_featured ? 'glow' : 'default'}
          size="lg"
          className="w-full"
        >
          {isCurrentTier ? 'Ваш текущий план' : `Купить за ${product.price_stars} Stars`}
        </StarsPaymentButton>
      </CardFooter>
    </Card>
  );
}
