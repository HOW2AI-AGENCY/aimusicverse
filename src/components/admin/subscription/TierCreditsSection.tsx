/**
 * Tier Credits Section
 * 
 * Editable credits amount, period, and concurrent generations.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins } from 'lucide-react';
import { EditableTierFields } from '@/hooks/admin/useSubscriptionTiers';

interface TierCreditsSectionProps {
  editedTier: EditableTierFields;
  onUpdateField: <K extends keyof EditableTierFields>(field: K, value: EditableTierFields[K]) => void;
}

export function TierCreditsSection({ 
  editedTier, 
  onUpdateField 
}: TierCreditsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <Coins className="h-4 w-4" />
        Кредиты
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Количество</Label>
          <Input
            type="number"
            value={editedTier.credits_amount ?? 0}
            onChange={(e) => onUpdateField('credits_amount', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label>Период</Label>
          <select
            className="w-full h-10 px-3 rounded-md border bg-background"
            value={editedTier.credits_period ?? 'month'}
            onChange={(e) => onUpdateField('credits_period', e.target.value)}
          >
            <option value="day">Сутки</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="year">Год</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Макс. треков одновременно</Label>
        <Input
          type="number"
          value={editedTier.max_concurrent_generations ?? 2}
          onChange={(e) => onUpdateField('max_concurrent_generations', parseInt(e.target.value) || 2)}
        />
      </div>
    </div>
  );
}
