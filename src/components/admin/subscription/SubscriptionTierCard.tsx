/**
 * Subscription Tier Card
 * 
 * Displays a single subscription tier with pricing and features.
 * Purely presentational component.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit2, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubscriptionTier, getTierIcon, formatPeriod } from '@/hooks/admin/useSubscriptionTiers';

interface SubscriptionTierCardProps {
  tier: SubscriptionTier;
  onEdit: (tier: SubscriptionTier) => void;
}

function TierIcon({ code }: { code: string }) {
  const icon = getTierIcon(code);
  
  if (icon.type === 'emoji') {
    return <span className="text-xl">{icon.value}</span>;
  }
  
  if (icon.value === 'zap') {
    return <Zap className="h-5 w-5 text-yellow-500" />;
  }
  
  return <Star className="h-5 w-5" />;
}

export function SubscriptionTierCard({ tier, onEdit }: SubscriptionTierCardProps) {
  return (
    <Card 
      className={cn(
        "relative cursor-pointer transition-all hover:shadow-md",
        tier.is_featured && "ring-2 ring-primary",
        !tier.is_active && "opacity-60"
      )}
      onClick={() => onEdit(tier)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TierIcon code={tier.code} />
            <CardTitle className="text-lg">
              {tier.name.ru || tier.code}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {tier.badge_text && (
              <Badge variant="secondary" className="text-xs">
                {tier.badge_text}
              </Badge>
            )}
            {!tier.is_active && (
              <Badge variant="outline" className="text-xs">
                Неактивен
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {tier.description.ru || tier.description.en}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Pricing Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold">${tier.price_usd}</div>
            <div className="text-xs text-muted-foreground">USD</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold">{tier.price_stars}</div>
            <div className="text-xs text-muted-foreground">Stars</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold">{tier.price_robokassa}₽</div>
            <div className="text-xs text-muted-foreground">RUB</div>
          </div>
        </div>

        <Separator />

        {/* Credits Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Кредиты</span>
          <span className="font-medium">
            {tier.credits_amount}/{formatPeriod(tier.credits_period)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Треков</span>
          <span className="font-medium">{tier.max_concurrent_generations}</span>
        </div>

        {/* Features Badges */}
        <div className="flex flex-wrap gap-1">
          {tier.has_priority && <Badge variant="outline" className="text-xs">Приоритет</Badge>}
          {tier.has_stem_separation && <Badge variant="outline" className="text-xs">Стемы</Badge>}
          {tier.has_mastering && <Badge variant="outline" className="text-xs">Мастеринг</Badge>}
          {tier.has_api_access && <Badge variant="outline" className="text-xs">API</Badge>}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(tier);
          }}
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Редактировать
        </Button>
      </CardContent>
    </Card>
  );
}
