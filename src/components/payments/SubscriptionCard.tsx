/**
 * SubscriptionCard Component
 * Displays subscription tier with features and pricing
 */

import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarsPaymentButton } from './StarsPaymentButton';
import { cn } from '@/lib/utils';
import type { StarsProduct } from '@/services/starsPaymentService';

interface SubscriptionCardProps {
  product: StarsProduct;
  isCurrentTier?: boolean;
  onSubscribe?: (product: StarsProduct) => void;
  disabled?: boolean;
  language?: 'en' | 'ru';
}

// Feature lists for each tier
const TIER_FEATURES: Record<string, string[]> = {
  pro: [
    'Unlimited track generation',
    'HD audio quality',
    'Priority processing',
    'Extended stems (8 tracks)',
    'Advanced AI tags',
    'No watermark',
  ],
  premium: [
    'Everything in Pro',
    'Commercial license',
    'API access',
    'Custom AI training',
    'Dedicated support',
    'White-label option',
  ],
  enterprise: [
    'Everything in Premium',
    'Custom integrations',
    'SLA guarantee',
    'Team collaboration',
    'Volume discounts',
    'Priority feature requests',
  ],
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  pro: <Zap className="h-5 w-5" aria-hidden="true" />,
  premium: <Crown className="h-5 w-5" aria-hidden="true" />,
  enterprise: <Sparkles className="h-5 w-5" aria-hidden="true" />,
};

export function SubscriptionCard({
  product,
  isCurrentTier = false,
  onSubscribe,
  disabled = false,
  language = 'en',
}: SubscriptionCardProps) {
  const name = product.name;
  const description = product.description || '';
  const tier = product.subscription_tier || 'pro';
  const features = TIER_FEATURES[tier] || [];
  const icon = TIER_ICONS[tier];

  return (
    <Card
      className={cn(
        'relative transition-all duration-300',
        product.is_featured && 'border-primary shadow-glow scale-105',
        isCurrentTier && 'ring-2 ring-primary'
      )}
    >
      {/* Featured Badge */}
      {product.is_featured && (
        <Badge
          variant="default"
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-telegram text-white shadow-glow z-10"
        >
          Most Popular
        </Badge>
      )}

      {/* Current Tier Badge */}
      {isCurrentTier && (
        <Badge
          variant="default"
          className="absolute top-4 right-4 bg-success text-white"
        >
          <Check className="mr-1 h-3 w-3" aria-hidden="true" />
          Current Plan
        </Badge>
      )}

      <CardHeader className="space-y-3 text-center">
        {/* Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          {icon}
        </div>

        <CardTitle className="text-2xl font-bold capitalize">
          {tier}
        </CardTitle>

        <CardDescription className="text-base">
          {description}
        </CardDescription>

        {/* Price */}
        <div className="pt-4">
          <div className="flex items-baseline justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="text-4xl font-bold">{product.price_stars}</span>
            <span className="text-muted-foreground">Stars</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            / {product.subscription_days} days
          </p>
          {/* Price in USD removed - not available in new type */}
        </div>
      </CardHeader>

      <CardContent>
        {/* Features List */}
        <ul className="space-y-3" role="list">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <StarsPaymentButton
          onClick={() => onSubscribe?.(product)}
          disabled={disabled || isCurrentTier}
          variant={product.is_featured ? 'glow' : 'default'}
          size="lg"
          className="w-full"
        >
          {isCurrentTier ? 'Current Plan' : `Subscribe to ${tier}`}
        </StarsPaymentButton>
      </CardFooter>
    </Card>
  );
}
