/**
 * Subscription Tiers Management Hook
 * 
 * Centralizes all CRUD operations and state management for subscription tiers.
 * Separates data fetching and mutations from UI presentation.
 * 
 * @returns Tiers data, mutations, and editor state
 * 
 * @example
 * ```tsx
 * const tiers = useSubscriptionTiers();
 * 
 * // Display tiers
 * tiers.tiers?.map(tier => <TierCard tier={tier} onEdit={tiers.openEditor} />)
 * 
 * // Save changes
 * tiers.saveChanges();
 * ```
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionTier {
  id: string;
  code: string;
  name: Record<string, string>;
  description: Record<string, string>;
  detailed_description: Record<string, string>;
  icon_emoji: string;
  price_usd: number;
  price_stars: number;
  price_robokassa: number;
  credits_amount: number;
  credits_period: string;
  max_concurrent_generations: number;
  audio_quality: string;
  has_priority: boolean;
  has_stem_separation: boolean;
  has_mastering: boolean;
  has_midi_export: boolean;
  has_api_access: boolean;
  has_dedicated_support: boolean;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  badge_text: string | null;
  features: string[];
  custom_pricing: boolean;
  min_purchase_amount: number;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export type EditableTierFields = Partial<Pick<SubscriptionTier, 
  | 'price_usd' 
  | 'price_stars' 
  | 'price_robokassa'
  | 'credits_amount'
  | 'credits_period'
  | 'max_concurrent_generations'
  | 'is_active'
  | 'is_featured'
  | 'badge_text'
  | 'has_priority'
  | 'has_stem_separation'
  | 'has_mastering'
  | 'has_midi_export'
  | 'has_api_access'
  | 'has_dedicated_support'
  | 'min_purchase_amount'
  | 'cover_url'
  | 'detailed_description'
>>;

export function useSubscriptionTiers() {
  const queryClient = useQueryClient();
  
  // Editor state
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [editedTier, setEditedTier] = useState<EditableTierFields>({});
  const [isEditing, setIsEditing] = useState(false);

  // Query for fetching tiers
  const tiersQuery = useQuery({
    queryKey: ['subscription-tiers-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as SubscriptionTier[];
    }
  });

  // Mutation for updating
  const updateMutation = useMutation({
    mutationFn: async (tier: EditableTierFields & { id: string }) => {
      const { error } = await supabase
        .from('subscription_tiers')
        .update(tier)
        .eq('id', tier.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-tiers-admin'] });
      toast.success('Тариф обновлён');
      setIsEditing(false);
      setSelectedTier(null);
      setEditedTier({});
    },
    onError: (error) => {
      toast.error('Ошибка сохранения: ' + (error as Error).message);
    }
  });

  // Open editor with tier data
  const openEditor = useCallback((tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setEditedTier({
      price_usd: tier.price_usd,
      price_stars: tier.price_stars,
      price_robokassa: tier.price_robokassa,
      credits_amount: tier.credits_amount,
      credits_period: tier.credits_period,
      max_concurrent_generations: tier.max_concurrent_generations,
      is_active: tier.is_active,
      is_featured: tier.is_featured,
      badge_text: tier.badge_text,
      has_priority: tier.has_priority,
      has_stem_separation: tier.has_stem_separation,
      has_mastering: tier.has_mastering,
      has_midi_export: tier.has_midi_export,
      has_api_access: tier.has_api_access,
      has_dedicated_support: tier.has_dedicated_support,
      min_purchase_amount: tier.min_purchase_amount,
      cover_url: tier.cover_url,
      detailed_description: tier.detailed_description,
    });
    setIsEditing(true);
  }, []);

  // Close editor
  const closeEditor = useCallback(() => {
    setIsEditing(false);
    setSelectedTier(null);
    setEditedTier({});
  }, []);

  // Save changes
  const saveChanges = useCallback(() => {
    if (!selectedTier) return;
    
    updateMutation.mutate({
      id: selectedTier.id,
      ...editedTier
    });
  }, [selectedTier, editedTier, updateMutation]);

  // Update a single field
  const updateField = useCallback(<K extends keyof EditableTierFields>(
    field: K, 
    value: EditableTierFields[K]
  ) => {
    setEditedTier(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update nested field (for detailed_description)
  const updateNestedField = useCallback((
    field: 'detailed_description',
    key: string,
    value: string
  ) => {
    setEditedTier(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as Record<string, string> || {}),
        [key]: value
      }
    }));
  }, []);

  return {
    // Data
    tiers: tiersQuery.data,
    isLoading: tiersQuery.isLoading,
    isError: tiersQuery.isError,
    error: tiersQuery.error,
    
    // Editor state
    selectedTier,
    editedTier,
    isEditing,
    isSaving: updateMutation.isPending,
    
    // Actions
    openEditor,
    closeEditor,
    saveChanges,
    updateField,
    updateNestedField,
    refetch: tiersQuery.refetch,
  };
}

// Utility functions
export function getTierIcon(code: string): { type: 'icon' | 'emoji'; value: string } {
  switch (code) {
    case 'free': return { type: 'icon', value: 'zap' };
    case 'basic': return { type: 'emoji', value: '🥉' };
    case 'pro': return { type: 'emoji', value: '🥈' };
    case 'premium': return { type: 'emoji', value: '🥇' };
    case 'enterprise': return { type: 'emoji', value: '🏆' };
    default: return { type: 'icon', value: 'star' };
  }
}

export function formatPeriod(period: string): string {
  const periods: Record<string, string> = {
    day: 'сутки',
    week: 'неделю',
    month: 'месяц',
    year: 'год'
  };
  return periods[period] || period;
}
