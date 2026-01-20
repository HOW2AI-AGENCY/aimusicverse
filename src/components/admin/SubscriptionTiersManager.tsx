/**
 * Subscription Tiers Manager
 * 
 * Container component for managing subscription tiers.
 * All business logic delegated to useSubscriptionTiers hook.
 * 
 * @see src/hooks/admin/useSubscriptionTiers.ts
 */

import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useSubscriptionTiers } from '@/hooks/admin/useSubscriptionTiers';
import { 
  SubscriptionTierCard, 
  SubscriptionTierEditor 
} from './subscription';

export function SubscriptionTiersManager() {
  const tiers = useSubscriptionTiers();

  if (tiers.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Тарифные планы</h2>
          <p className="text-sm text-muted-foreground">
            Управление ценами и настройками подписок
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => tiers.refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Tier Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiers.tiers?.map((tier) => (
          <SubscriptionTierCard 
            key={tier.id}
            tier={tier}
            onEdit={tiers.openEditor}
          />
        ))}
      </div>

      {/* Edit Sheet */}
      <SubscriptionTierEditor
        open={tiers.isEditing}
        tier={tiers.selectedTier}
        editedTier={tiers.editedTier}
        onClose={tiers.closeEditor}
        onSave={tiers.saveChanges}
        onUpdateField={tiers.updateField}
        onUpdateNestedField={tiers.updateNestedField}
        isSaving={tiers.isSaving}
      />
    </div>
  );
}
