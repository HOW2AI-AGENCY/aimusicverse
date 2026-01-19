/**
 * Hook for managing feature_flags database table
 * Provides CRUD operations with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  enabled: boolean;
  category: string;
  rollout_percentage: number | null;
  min_tier: string | null;
  is_admin_only: boolean | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface FeatureFlagCategory {
  id: string;
  label: string;
  icon: string;
}

// Category definitions
export const FLAG_CATEGORIES: FeatureFlagCategory[] = [
  { id: "core", label: "Основные", icon: "⚡" },
  { id: "studio", label: "Студия", icon: "🎛️" },
  { id: "engagement", label: "Вовлечение", icon: "🎯" },
  { id: "collaboration", label: "Совместная работа", icon: "👥" },
  { id: "general", label: "Общие", icon: "📋" },
];

// Fetch all feature flags
export function useFeatureFlags() {
  return useQuery({
    queryKey: ["feature-flags"],
    queryFn: async (): Promise<FeatureFlag[]> => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });
}

// Toggle a feature flag
export function useToggleFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("feature_flags")
        .update({ 
          enabled,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null,
        })
        .eq("id", id);

      if (error) throw error;
      return { id, enabled };
    },
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ["feature-flags"] });
      const previous = queryClient.getQueryData<FeatureFlag[]>(["feature-flags"]);

      queryClient.setQueryData<FeatureFlag[]>(["feature-flags"], (old) =>
        old?.map((flag) =>
          flag.id === id ? { ...flag, enabled } : flag
        )
      );

      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["feature-flags"], context.previous);
      }
      toast.error("Ошибка сохранения", {
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
      });
    },
    onSuccess: ({ enabled }) => {
      toast.success(enabled ? "Функция включена" : "Функция выключена");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
    },
  });
}

// Update feature flag settings
export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Pick<FeatureFlag, 'rollout_percentage' | 'min_tier' | 'is_admin_only'>> 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("feature_flags")
        .update({ 
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null,
        })
        .eq("id", id);

      if (error) throw error;
      return { id, updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      toast.success("Настройки сохранены");
    },
    onError: (err) => {
      toast.error("Ошибка сохранения", {
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
      });
    },
  });
}

// Check if a feature is enabled (client-side, reads from cache)
export function useIsFeatureEnabled(key: string): boolean {
  const { data: flags } = useFeatureFlags();
  const flag = flags?.find((f) => f.key === key);
  return flag?.enabled ?? false;
}

// Group flags by category
export function getFlagsByCategory(
  flags: FeatureFlag[]
): Map<string, FeatureFlag[]> {
  const map = new Map<string, FeatureFlag[]>();
  
  for (const category of FLAG_CATEGORIES) {
    const categoryFlags = flags.filter((f) => f.category === category.id);
    if (categoryFlags.length > 0) {
      map.set(category.id, categoryFlags);
    }
  }
  
  // Add uncategorized flags
  const knownCategories = FLAG_CATEGORIES.map((c) => c.id);
  const uncategorized = flags.filter((f) => !knownCategories.includes(f.category));
  
  if (uncategorized.length > 0) {
    map.set("other", uncategorized);
  }
  
  return map;
}
