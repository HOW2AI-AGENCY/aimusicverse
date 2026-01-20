/**
 * Tier Display Section
 * 
 * Controls for badge text, active status, and featured flag.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Eye } from 'lucide-react';
import { EditableTierFields } from '@/hooks/admin/useSubscriptionTiers';

interface TierDisplaySectionProps {
  editedTier: EditableTierFields;
  onUpdateField: <K extends keyof EditableTierFields>(field: K, value: EditableTierFields[K]) => void;
}

export function TierDisplaySection({ 
  editedTier, 
  onUpdateField 
}: TierDisplaySectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <Eye className="h-4 w-4" />
        Отображение
      </h3>
      
      <div className="space-y-2">
        <Label>Бейдж</Label>
        <Input
          placeholder="Популярный, Лучшая цена..."
          value={editedTier.badge_text ?? ''}
          onChange={(e) => onUpdateField('badge_text', e.target.value || null)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Активен</Label>
        <Switch
          checked={editedTier.is_active ?? true}
          onCheckedChange={(checked) => onUpdateField('is_active', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Рекомендуемый</Label>
        <Switch
          checked={editedTier.is_featured ?? false}
          onCheckedChange={(checked) => onUpdateField('is_featured', checked)}
        />
      </div>
    </div>
  );
}
