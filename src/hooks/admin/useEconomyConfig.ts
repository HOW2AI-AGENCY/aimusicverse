/**
 * Hook for managing economy_config database table
 * Provides CRUD operations with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EconomyConfigItem {
  key: string;
  value: number;
  description: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface EconomyConfigCategory {
  id: string;
  label: string;
  icon: string;
  keys: string[];
}

// Define categories for grouping config items
export const ECONOMY_CATEGORIES: EconomyConfigCategory[] = [
  {
    id: "costs",
    label: "Стоимость действий",
    icon: "💎",
    keys: [
      "GENERATION_COST",
      "COVER_GENERATION_COST",
      "EXTEND_GENERATION_COST",
      "STEM_SEPARATION_SIMPLE_COST",
      "STEM_SEPARATION_DETAILED_COST",
      "REPLACE_SECTION_COST",
      "MIDI_EXPORT_COST",
      "AUDIO_ANALYSIS_COST",
    ],
  },
  {
    id: "daily_rewards",
    label: "Ежедневные награды",
    icon: "🎁",
    keys: ["DAILY_CHECKIN_CREDITS", "DAILY_CHECKIN_XP", "STREAK_BONUS_CREDITS", "STREAK_BONUS_XP"],
  },
  {
    id: "social_rewards",
    label: "Социальные награды",
    icon: "❤️",
    keys: [
      "SHARE_REWARD_CREDITS",
      "SHARE_REWARD_XP",
      "LIKE_RECEIVED_CREDITS",
      "LIKE_RECEIVED_XP",
      "PUBLIC_TRACK_CREDITS",
      "PUBLIC_TRACK_XP",
      "COMMENT_POSTED_CREDITS",
      "COMMENT_POSTED_XP",
    ],
  },
  {
    id: "creation_rewards",
    label: "Награды за создание",
    icon: "🎵",
    keys: ["ARTIST_CREATED_CREDITS", "ARTIST_CREATED_XP", "PROJECT_CREATED_CREDITS", "PROJECT_CREATED_XP"],
  },
  {
    id: "referral",
    label: "Реферальная программа",
    icon: "👥",
    keys: ["REFERRAL_PERCENT", "REFERRAL_INVITE_BONUS", "REFERRAL_NEW_USER_BONUS"],
  },
  {
    id: "exchange_rates",
    label: "Курсы обмена",
    icon: "💱",
    keys: ["CREDITS_PER_USD", "STARS_PER_USD", "CREDITS_PER_STAR", "PURCHASE_XP_PER_100_STARS"],
  },
];

// Human-readable labels for config keys
export const CONFIG_LABELS: Record<string, string> = {
  GENERATION_COST: "Генерация трека",
  COVER_GENERATION_COST: "Создание кавера",
  EXTEND_GENERATION_COST: "Расширение трека",
  STEM_SEPARATION_SIMPLE_COST: "Простое разделение (2 стема)",
  STEM_SEPARATION_DETAILED_COST: "Детальное разделение (12+ стемов)",
  REPLACE_SECTION_COST: "Замена секции",
  MIDI_EXPORT_COST: "Экспорт MIDI",
  AUDIO_ANALYSIS_COST: "Анализ аудио",
  DAILY_CHECKIN_CREDITS: "Чек-ин (кредиты)",
  DAILY_CHECKIN_XP: "Чек-ин (XP)",
  STREAK_BONUS_CREDITS: "Бонус за стрик (кредиты/день)",
  STREAK_BONUS_XP: "Бонус за стрик (XP/день)",
  SHARE_REWARD_CREDITS: "Шеринг (кредиты)",
  SHARE_REWARD_XP: "Шеринг (XP)",
  LIKE_RECEIVED_CREDITS: "Получение лайка (кредиты)",
  LIKE_RECEIVED_XP: "Получение лайка (XP)",
  PUBLIC_TRACK_CREDITS: "Публикация трека (кредиты)",
  PUBLIC_TRACK_XP: "Публикация трека (XP)",
  COMMENT_POSTED_CREDITS: "Комментарий (кредиты)",
  COMMENT_POSTED_XP: "Комментарий (XP)",
  ARTIST_CREATED_CREDITS: "Создание артиста (кредиты)",
  ARTIST_CREATED_XP: "Создание артиста (XP)",
  PROJECT_CREATED_CREDITS: "Создание проекта (кредиты)",
  PROJECT_CREATED_XP: "Создание проекта (XP)",
  REFERRAL_PERCENT: "Процент от покупки реферала",
  REFERRAL_INVITE_BONUS: "Бонус за приглашение",
  REFERRAL_NEW_USER_BONUS: "Бонус новому пользователю",
  CREDITS_PER_USD: "Кредитов за $1",
  STARS_PER_USD: "Stars за $1",
  CREDITS_PER_STAR: "Кредитов за 1 Star",
  PURCHASE_XP_PER_100_STARS: "XP за 100 Stars покупки",
};

// Fetch all economy config items
export function useEconomyConfig() {
  return useQuery({
    queryKey: ["economy-config"],
    queryFn: async (): Promise<EconomyConfigItem[]> => {
      const { data, error } = await supabase.from("economy_config").select("*").order("key");

      if (error) throw error;

      return (data || []).map((item) => ({
        key: item.key,
        value: typeof item.value === "number" ? item.value : Number(item.value),
        description: item.description,
        updated_at: item.updated_at,
        updated_by: item.updated_by,
      }));
    },
    staleTime: 30000, // 30 seconds
  });
}

// Update a single config item
export function useUpdateEconomyConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: number }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("economy_config")
        .update({
          value: value,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null,
        })
        .eq("key", key);

      if (error) throw error;
      return { key, value };
    },
    onMutate: async ({ key, value }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["economy-config"] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<EconomyConfigItem[]>(["economy-config"]);

      // Optimistically update
      queryClient.setQueryData<EconomyConfigItem[]>(["economy-config"], (old) =>
        old?.map((item) => (item.key === key ? { ...item, value, updated_at: new Date().toISOString() } : item)),
      );

      return { previous };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["economy-config"], context.previous);
      }
      toast.error("Ошибка сохранения", {
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
      });
    },
    onSuccess: ({ key }) => {
      toast.success("Сохранено", {
        description: `${CONFIG_LABELS[key] || key} обновлено`,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["economy-config"] });
    },
  });
}

// Bulk update multiple config items
export function useBulkUpdateEconomyConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ key: string; value: number }>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Update each item
      for (const { key, value } of updates) {
        const { error } = await supabase
          .from("economy_config")
          .update({
            value: value,
            updated_at: new Date().toISOString(),
            updated_by: user?.id || null,
          })
          .eq("key", key);

        if (error) throw error;
      }

      return updates;
    },
    onSuccess: (updates) => {
      queryClient.invalidateQueries({ queryKey: ["economy-config"] });
      toast.success("Сохранено", {
        description: `${updates.length} параметров обновлено`,
      });
    },
    onError: (err) => {
      toast.error("Ошибка сохранения", {
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
      });
    },
  });
}

// Get config items grouped by category
export function getConfigByCategory(items: EconomyConfigItem[]): Map<string, EconomyConfigItem[]> {
  const map = new Map<string, EconomyConfigItem[]>();

  for (const category of ECONOMY_CATEGORIES) {
    const categoryItems = category.keys
      .map((key) => items.find((item) => item.key === key))
      .filter((item): item is EconomyConfigItem => item !== undefined);

    if (categoryItems.length > 0) {
      map.set(category.id, categoryItems);
    }
  }

  // Add uncategorized items
  const allCategoryKeys = ECONOMY_CATEGORIES.flatMap((c) => c.keys);
  const uncategorized = items.filter((item) => !allCategoryKeys.includes(item.key));

  if (uncategorized.length > 0) {
    map.set("other", uncategorized);
  }

  return map;
}
