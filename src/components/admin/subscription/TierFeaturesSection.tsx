/**
 * Tier Features Section
 * 
 * Toggle switches for tier features like stem separation, mastering, etc.
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';
import { EditableTierFields } from '@/hooks/admin/useSubscriptionTiers';

interface TierFeaturesSectionProps {
  editedTier: EditableTierFields;
  onUpdateField: <K extends keyof EditableTierFields>(field: K, value: EditableTierFields[K]) => void;
}

interface FeatureToggleProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function FeatureToggle({ label, checked, onCheckedChange }: FeatureToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function TierFeaturesSection({ 
  editedTier, 
  onUpdateField 
}: TierFeaturesSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <Settings className="h-4 w-4" />
        Функции
      </h3>
      
      <div className="space-y-3">
        <FeatureToggle
          label="Приоритетная генерация"
          checked={editedTier.has_priority ?? false}
          onCheckedChange={(checked) => onUpdateField('has_priority', checked)}
        />
        
        <FeatureToggle
          label="Stem-сепарация"
          checked={editedTier.has_stem_separation ?? false}
          onCheckedChange={(checked) => onUpdateField('has_stem_separation', checked)}
        />
        
        <FeatureToggle
          label="Мастеринг"
          checked={editedTier.has_mastering ?? false}
          onCheckedChange={(checked) => onUpdateField('has_mastering', checked)}
        />
        
        <FeatureToggle
          label="MIDI экспорт"
          checked={editedTier.has_midi_export ?? false}
          onCheckedChange={(checked) => onUpdateField('has_midi_export', checked)}
        />
        
        <FeatureToggle
          label="API доступ"
          checked={editedTier.has_api_access ?? false}
          onCheckedChange={(checked) => onUpdateField('has_api_access', checked)}
        />
        
        <FeatureToggle
          label="Выделенная поддержка"
          checked={editedTier.has_dedicated_support ?? false}
          onCheckedChange={(checked) => onUpdateField('has_dedicated_support', checked)}
        />
      </div>
    </div>
  );
}
