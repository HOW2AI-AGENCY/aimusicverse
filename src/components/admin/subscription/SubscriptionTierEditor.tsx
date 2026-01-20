/**
 * Subscription Tier Editor
 * 
 * Sheet component for editing subscription tier details.
 * Divided into sections for better organization.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Zap, Star } from 'lucide-react';
import { 
  SubscriptionTier, 
  EditableTierFields, 
  getTierIcon 
} from '@/hooks/admin/useSubscriptionTiers';
import { TierPricingSection } from './TierPricingSection';
import { TierCreditsSection } from './TierCreditsSection';
import { TierFeaturesSection } from './TierFeaturesSection';
import { TierDisplaySection } from './TierDisplaySection';
import { TierTelegramSection } from './TierTelegramSection';

interface SubscriptionTierEditorProps {
  open: boolean;
  tier: SubscriptionTier | null;
  editedTier: EditableTierFields;
  onClose: () => void;
  onSave: () => void;
  onUpdateField: <K extends keyof EditableTierFields>(field: K, value: EditableTierFields[K]) => void;
  onUpdateNestedField: (field: 'detailed_description', key: string, value: string) => void;
  isSaving: boolean;
}

function EditorTierIcon({ code }: { code: string }) {
  const icon = getTierIcon(code);
  
  if (icon.type === 'emoji') {
    return <span className="text-xl">{icon.value}</span>;
  }
  
  if (icon.value === 'zap') {
    return <Zap className="h-5 w-5 text-yellow-500" />;
  }
  
  return <Star className="h-5 w-5" />;
}

export function SubscriptionTierEditor({
  open,
  tier,
  editedTier,
  onClose,
  onSave,
  onUpdateField,
  onUpdateNestedField,
  isSaving,
}: SubscriptionTierEditorProps) {
  if (!tier) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <EditorTierIcon code={tier.code} />
            {tier.name.ru || tier.code}
          </SheetTitle>
          <SheetDescription>
            Редактирование тарифного плана
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
          <div className="space-y-6 py-6">
            <TierPricingSection 
              editedTier={editedTier}
              customPricing={tier.custom_pricing}
              onUpdateField={onUpdateField}
            />
            
            <Separator />
            
            <TierCreditsSection
              editedTier={editedTier}
              onUpdateField={onUpdateField}
            />
            
            <Separator />
            
            <TierFeaturesSection
              editedTier={editedTier}
              onUpdateField={onUpdateField}
            />
            
            <Separator />
            
            <TierTelegramSection
              editedTier={editedTier}
              onUpdateField={onUpdateField}
              onUpdateNestedField={onUpdateNestedField}
            />
            
            <Separator />
            
            <TierDisplaySection
              editedTier={editedTier}
              onUpdateField={onUpdateField}
            />
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button
            className="flex-1"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Сохранить
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
