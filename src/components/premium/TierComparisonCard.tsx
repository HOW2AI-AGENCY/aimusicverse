/**
 * TierComparisonCard - Shows subscription tier comparison
 * Used in Pricing page and upsell dialogs
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Check, X, Crown, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TierFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  premium: boolean | string;
}

const TIER_FEATURES: TierFeature[] = [
  { name: 'Генерация музыки', free: '50 кредитов', pro: '500/мес', premium: '1200/мес' },
  { name: 'Приватные треки', free: false, pro: true, premium: true },
  { name: 'HD качество', free: false, pro: true, premium: true },
  { name: 'Ultra HD качество', free: false, pro: false, premium: true },
  { name: 'MIDI экспорт', free: false, pro: true, premium: true },
  { name: 'Приоритет генерации', free: false, pro: true, premium: true },
  { name: 'Все модели AI', free: false, pro: false, premium: true },
  { name: 'Бонус к покупкам', free: '—', pro: '+50%', premium: '+100%' },
];

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '0 ₽',
    icon: Zap,
    color: 'text-muted-foreground',
    bgGradient: 'from-muted/50 to-muted/30',
  },
  {
    id: 'pro',
    name: 'PRO',
    price: '350 ₽/мес',
    icon: Crown,
    color: 'text-amber-500',
    bgGradient: 'from-amber-500/20 to-orange-500/10',
    popular: true,
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    price: '750 ₽/мес',
    icon: Sparkles,
    color: 'text-purple-500',
    bgGradient: 'from-purple-500/20 to-pink-500/10',
  },
];

interface TierComparisonCardProps {
  highlightTier?: 'free' | 'pro' | 'premium';
  className?: string;
}

export const TierComparisonCard = memo(function TierComparisonCard({
  highlightTier = 'pro',
  className,
}: TierComparisonCardProps) {
  const renderValue = (value: boolean | string, tierIndex: number) => {
    if (typeof value === 'string') {
      return (
        <span className={cn(
          "text-xs font-medium",
          tierIndex === 0 ? 'text-muted-foreground' : 'text-foreground'
        )}>
          {value}
        </span>
      );
    }
    
    if (value) {
      return <Check className="w-4 h-4 text-emerald-500" />;
    }
    
    return <X className="w-4 h-4 text-muted-foreground/50" />;
  };

  return (
    <div className={cn("overflow-x-auto -mx-4 px-4", className)}>
      <table className="w-full min-w-[320px] text-sm">
        {/* Header */}
        <thead>
          <tr>
            <th className="text-left py-3 px-2 text-muted-foreground font-medium">
              Функции
            </th>
            {TIERS.map((tier, idx) => {
              const Icon = tier.icon;
              const isHighlighted = tier.id === highlightTier;
              
              return (
                <th key={tier.id} className="py-3 px-2 text-center">
                  <motion.div
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 px-1 rounded-lg",
                      "bg-gradient-to-b",
                      tier.bgGradient,
                      isHighlighted && "ring-2 ring-primary/50"
                    )}
                    initial={isHighlighted ? { scale: 0.95 } : undefined}
                    animate={isHighlighted ? { scale: 1 } : undefined}
                    transition={{ type: 'spring' }}
                  >
                    {tier.popular && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold uppercase">
                        Популярный
                      </span>
                    )}
                    <Icon className={cn("w-5 h-5", tier.color)} />
                    <span className={cn("font-bold", tier.color)}>
                      {tier.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tier.price}
                    </span>
                  </motion.div>
                </th>
              );
            })}
          </tr>
        </thead>
        
        {/* Body */}
        <tbody>
          {TIER_FEATURES.map((feature, featureIdx) => (
            <motion.tr
              key={feature.name}
              className={cn(
                "border-t border-border/50",
                featureIdx % 2 === 0 && "bg-muted/20"
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: featureIdx * 0.05 }}
            >
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {feature.name}
              </td>
              <td className="py-3 px-2 text-center">
                {renderValue(feature.free, 0)}
              </td>
              <td className={cn(
                "py-3 px-2 text-center",
                highlightTier === 'pro' && "bg-amber-500/5"
              )}>
                {renderValue(feature.pro, 1)}
              </td>
              <td className={cn(
                "py-3 px-2 text-center",
                highlightTier === 'premium' && "bg-purple-500/5"
              )}>
                {renderValue(feature.premium, 2)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
