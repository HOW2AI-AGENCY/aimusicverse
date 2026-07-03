import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BotCommand {
  command: string;
  description: string;
  enabled: boolean;
}

export interface BotConfig {
  welcome_message: string;
  track_ready_message: string;
  error_message: string;
  notifications_enabled: boolean;
  error_notifications_enabled: boolean;
  system_notifications_enabled: boolean;
  rate_limiting_enabled: boolean;
  commands: BotCommand[];
}

const DEFAULT_CONFIG: BotConfig = {
  welcome_message: "🎵 Добро пожаловать в MusicVerse AI!\n\nЯ помогу вам создавать музыку с помощью ИИ.",
  track_ready_message: "🎉 Ваш трек готов!",
  error_message: "😔 Не удалось выполнить операцию. Попробуйте позже.",
  notifications_enabled: true,
  error_notifications_enabled: true,
  system_notifications_enabled: false,
  rate_limiting_enabled: true,
  commands: [
    { command: "/start", description: "Запустить бота", enabled: true },
    { command: "/help", description: "Справка по командам", enabled: true },
    { command: "/generate", description: "Создать трек", enabled: true },
    { command: "/library", description: "Моя библиотека", enabled: true },
    { command: "/cover", description: "Создать кавер", enabled: true },
    { command: "/extend", description: "Расширить трек", enabled: true },
    { command: "/upload", description: "Загрузить аудио", enabled: true },
    { command: "/cancel", description: "Отменить операцию", enabled: true },
  ],
};

export function useBotConfig() {
  return useQuery({
    queryKey: ["bot-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("telegram_bot_config").select("config_key, config_value");

      if (error) throw error;

      // Values arrive as JSON strings or raw Json; parsed per-key and merged
      // over defaults, so the unknown-typed accumulator is narrowed at return.
      const config: Partial<Record<keyof BotConfig, unknown>> = {};

      data?.forEach((item) => {
        const key = item.config_key as keyof BotConfig;
        try {
          config[key] = typeof item.config_value === "string" ? JSON.parse(item.config_value) : item.config_value;
        } catch {
          config[key] = item.config_value;
        }
      });

      return { ...DEFAULT_CONFIG, ...(config as Partial<BotConfig>) };
    },
  });
}

export function useUpdateBotConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<BotConfig>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const promises = Object.entries(updates).map(([key, value]) => {
        return supabase.from("telegram_bot_config").upsert(
          {
            config_key: key,
            config_value: JSON.stringify(value),
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          },
          {
            onConflict: "config_key",
          },
        );
      });

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        throw new Error(errors[0].error?.message || "Failed to update config");
      }

      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-config"] });
      toast.success("Настройки бота сохранены");
    },
    onError: (error) => {
      toast.error("Ошибка сохранения настроек: " + error.message);
    },
  });
}
