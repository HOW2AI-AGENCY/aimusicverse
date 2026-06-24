/**
 * SubscriptionCard Component
 * Premium subscription tier card with glassmorphism and animations
 * Feature: professional-payment-flow
 */

import { motion } from '@/lib/motion';
import { Check, Crown, Sparkles, Zap, Star, Infinity } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarsPaymentButton } from './StarsPaymentButton';
import { cn } from '@/lib/utils';
import { glass, gradientGlass } from '@/lib/glass';
import type { StarsProduct } from '@/services/starsPaymentService';

interface SubscriptionCardProps {
  product: StarsProduct;
  isCurrentTier?: boolean;
  onSubscribe?: (product: StarsProduct) => void;
  disabled?: boolean;
}

const TIER_CONFIG: Record<string, {
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
}> = {
  basic: {
    icon: <Zap className="h-6 w-6" aria-hidden="true" />,
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    accentColor: 'text-blue-500',
  },
  pro: {
    icon: <Crown className="h-6 w-6" aria-hidden="true" />,
    gradient: 'from-primary via-generate to-accent',
    accentColor: 'text-primary',
  },
  premium: {
    icon: <Sparkles className="h-6 w-6" aria-hidden="true" />,
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    accentColor: 'text-amber-500',
  },
  enterprise: {
    icon: <Infinity className="h-6 w-6" aria-hidden="true" />,
    gradient: 'from-purple-500 via-violet-500 to-indigo-500',
    accentColor: 'text-purple-500',
  },
};

export function SubscriptionCard({
  product,
  isCurrentTier = false,
  onSubscribe,
  disabled = false,
}: SubscriptionCardProps) {
  const tier = product.subscription_tier || 'pro';
  const config = TIER_CONFIG[tier] || TIER_CONFIG.pro;
  const features = product.features || [];

  // Calculate price per day
  const pricePerDay = product.price_stars && product.subscription_days
    ? (product.price_stars / product.subscription_days).toFixed(1)
    : null;

  return (
    <Card
      className={cn(
        'relative transition-all duration-500 overflow-hidden h-full',
        glass.card,
        product.is_featured && 'ring-2 ring-primary shadow-lg shadow-primary/20',
        isCurrentTier && 'ring-2 ring-green-500 shadow-lg shadow-green-500/20'
      )}
    >
      {/* Gradient top border */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r',
        config.gradient
      )} />

      {/* Background gradient glow */}
      {product.is_featured && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      )}

      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
        <div className={cn(
          'absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-20 blur-xl bg-gradient-to-br',
          config.gradient
        )} />
      </div>

      {/* Popular Badge */}
      {product.is_featured && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="absolute top-4 right-4 z-10"
        >
          <Badge className="bg-gradient-to-r from-primary to-generate text-white border-0 shadow-lg px-3 py-1">
            <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
            Популярно
          </Badge>
        </motion.div>
      )}

      {/* Current Tier Badge */}
      {isCurrentTier && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="absolute top-4 left-4 z-10"
        >
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
            <Check className="mr-1 h-3 w-3" aria-hidden="true" />
            Ваш план
          </Badge>
        </motion.div>
      )}

      <CardHeader className="space-y-4 pt-8">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br p-0.5',
            config.gradient
          )}
        >
          <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
            <span className={config.accentColor}>{config.icon}</span>
          </div>
        </motion.div>

        {/* Name */}
        <h3 className="text-2xl font-bold text-center">{product.name}</h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground text-center line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="text-center pt-4 pb-2">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-bold">{product.price_stars}</span>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-6 w-6 fill-current" aria-hidden="true" />
            </div>
          </div>
          
          <div className="mt-2 space-y-1">
            <p className="text-sm text-muted-foreground">
              за {product.subscription_days} дней
            </p>
            {pricePerDay && (
              <p className="text-xs text-muted-foreground/70">
                ≈ {pricePerDay} ⭐/день
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1">
        {/* Credits Amount */}
        {product.credits_amount && (
          <div className={cn(
            'flex items-center justify-between p-4 rounded-xl mb-4',
            gradientGlass.primary
          )}>
            <span className="text-sm text-muted-foreground">Кредитов в месяц</span>
            <span className="text-2xl font-bold text-primary">
              {product.credits_amount === -1 ? '∞' : product.credits_amount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Features List */}
        {features.length > 0 && (
          <ul className="space-y-3" role="list">
            {features.map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className={cn(
                  'flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center',
                  `bg-gradient-to-br ${config.gradient}`
                )}>
                  <Check className="h-3 w-3 text-white" aria-hidden="true" />
                </div>
                <span className="text-sm text-foreground/90">{feature}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="pt-6 pb-6">
        <StarsPaymentButton
          onClick={() => onSubscribe?.(product)}
          disabled={disabled || isCurrentTier}
          variant={product.is_featured ? 'glow' : 'default'}
          size="lg"
          className={cn(
            'w-full font-semibold',
            product.is_featured && 'shadow-lg shadow-primary/25'
          )}
        >
          {isCurrentTier ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Ваш текущий план
            </>
          ) : (
            <>
              <Star className="mr-2 h-4 w-4 fill-current" />
              Подписаться за {product.price_stars} ⭐
            </>
          )}
        </StarsPaymentButton>
      </CardFooter>
    </Card>
  );
}
