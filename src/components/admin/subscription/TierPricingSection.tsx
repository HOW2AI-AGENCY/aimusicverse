/**
 * Tier Pricing Section
 * 
 * Editable pricing fields for USD, Stars, and RUB.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';
import { EditableTierFields } from '@/hooks/admin/useSubscriptionTiers';

interface TierPricingSectionProps {
  editedTier: EditableTierFields;
  customPricing: boolean;
  onUpdateField: <K extends keyof EditableTierFields>(field: K, value: EditableTierFields[K]) => void;
}

export function TierPricingSection({ 
  editedTier, 
  customPricing,
  onUpdateField 
}: TierPricingSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <CreditCard className="h-4 w-4" />
        Цены
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>USD</Label>
          <Input
            type="number"
            step="0.01"
            value={editedTier.price_usd ?? 0}
            onChange={(e) => onUpdateField('price_usd', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label>Stars ⭐</Label>
          <Input
            type="number"
            value={editedTier.price_stars ?? 0}
            onChange={(e) => onUpdateField('price_stars', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label>RUB ₽</Label>
          <Input
            type="number"
            step="0.01"
            value={editedTier.price_robokassa ?? 0}
            onChange={(e) => onUpdateField('price_robokassa', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {customPricing && (
        <div className="space-y-2">
          <Label>Минимальная сумма (USD)</Label>
          <Input
            type="number"
            step="1"
            value={editedTier.min_purchase_amount ?? 0}
            onChange={(e) => onUpdateField('min_purchase_amount', parseFloat(e.target.value) || 0)}
          />
        </div>
      )}
    </div>
  );
}
