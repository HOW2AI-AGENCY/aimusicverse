import { getSupabaseClient } from "../core/supabase-client.ts";
import { BOT_CONFIG, MESSAGES } from "../config.ts";
import { sendMessage } from "../telegram-api.ts";
import {
  buildMessage,
  createSection,
  createKeyValue,
  createLoadingMessage,
  createErrorMessage,
  createSuccessMessage,
} from "../utils/message-formatter.ts";
import { ButtonBuilder } from "../utils/button-builder.ts";
import { trackMessage } from "../utils/message-manager.ts";
import { escapeMarkdownV2, isSafeText } from "../utils/text-processor.ts";

const supabase = getSupabaseClient();

export async function handleGenerate(chatId: number, userId: number, prompt: string) {
  if (!prompt || prompt.trim().length === 0) {
    const helpMsg = buildMessage({
      title: "Как использовать генератор",
      emoji: "❓",
      description: "Укажите описание желаемого трека",
      sections: [
        {
          title: "Примеры",
          content: [
            "/generate энергичный рок трек",
            "/generate спокойная джазовая композиция",
            "/generate --instrumental ambient space music",
          ],
          emoji: "💡",
          style: "list",
        },
        {
          title: "Параметры",
          content: [
            "--instrumental - без вокала",
            "--model=V5 - использовать модель V5",
            "--model=V4 - использовать модель V4",
          ],
          emoji: "⚙️",
          style: "list",
        },
      ],
    });

    const keyboard = new ButtonBuilder()
      .addButton({
        text: "Открыть генератор",
        emoji: "🎼",
        action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate` },
      })
      .addButton({
        text: "Главное меню",
        emoji: "🏠",
        action: { type: "callback", data: "nav_main" },
      })
      .build();

    const result = await sendMessage(chatId, helpMsg, keyboard, "MarkdownV2");

    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, "content", "help", { expiresIn: 60000 });
    }
    return;
  }

  // Validate input
  if (!isSafeText(prompt)) {
    const errorMsg = createErrorMessage("Описание содержит недопустимые символы", [
      "Используйте только обычный текст",
      "Избегайте специальных символов",
    ]);
    await sendMessage(chatId, errorMsg, undefined, "MarkdownV2");
    return;
  }

  try {
    // Parse command options
    let mode = "simple";
    let instrumental = false;
    let model = "V4_5ALL";
    let style = "";
    let actualPrompt = prompt;

    // Check for flags
    const flagRegex = /--([\w]+)(?:=(\S+))?/g;
    let match;
    const flags: Record<string, string> = {};

    while ((match = flagRegex.exec(prompt)) !== null) {
      flags[match[1]] = match[2] || "true";
      actualPrompt = actualPrompt.replace(match[0], "").trim();
    }

    if (flags.instrumental) instrumental = true;
    if (flags.mode) mode = flags.mode;
    if (flags.model) model = flags.model.toUpperCase();
    if (flags.style) style = flags.style; // Fixed: Add support for --style flag

    // Check for inline mode indicators
    if (actualPrompt.toLowerCase().includes("[custom]")) {
      mode = "custom";
      actualPrompt = actualPrompt.replace(/\[custom\]/i, "").trim();
    }

    // Get user from profiles table
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) {
      const errorMsg = createErrorMessage("Профиль не найден", [
        "Откройте Mini App",
        'Нажмите кнопку "Открыть студию"',
      ]);

      const keyboard = new ButtonBuilder()
        .addButton({
          text: "Открыть студию",
          emoji: "🚀",
          action: { type: "webapp", url: BOT_CONFIG.miniAppUrl },
        })
        .build();

      await sendMessage(chatId, errorMsg, keyboard, "MarkdownV2");
      return;
    }

    // Show generation starting message with details
    const genParams: Record<string, string> = {
      Модель: model,
      Тип: instrumental ? "Инструментал" : "С вокалом",
      Режим: mode === "custom" ? "Кастом" : "Простой",
    };

    const startingMsg = buildMessage({
      title: "Запуск генерации",
      emoji: "🎼",
      description: actualPrompt.substring(0, 150) + (actualPrompt.length > 150 ? "..." : ""),
      sections: [
        {
          title: "Параметры",
          content: createKeyValue(genParams),
          emoji: "⚙️",
        },
      ],
    });

    const loadingResult = await sendMessage(chatId, startingMsg, undefined, "MarkdownV2");

    if (loadingResult?.result?.message_id) {
      await trackMessage(chatId, loadingResult.result.message_id, "status", "generation", { expiresIn: 180000 }); // 3 minutes
    }

    // Call suno-music-generate function
    const { data, error: generateError } = await supabase.functions.invoke("suno-music-generate", {
      body: {
        mode,
        instrumental,
        model,
        prompt: actualPrompt,
        // Fixed: Use separate style parameter if provided, otherwise use actualPrompt as fallback for custom mode
        style: mode === "custom" ? style || actualPrompt : undefined,
      },
    });

    if (generateError) {
      console.error("Generation error:", generateError);

      const errorMsg = createErrorMessage("Не удалось запустить генерацию", [
        "Проверьте описание",
        "Попробуйте упростить запрос",
        "Повторите попытку через минуту",
      ]);

      const keyboard = new ButtonBuilder()
        .addButton({
          text: "Попробовать снова",
          emoji: "🔄",
          action: { type: "callback", data: "nav_generate" },
        })
        .addButton({
          text: "Главное меню",
          emoji: "🏠",
          action: { type: "callback", data: "nav_main" },
        })
        .build();

      await sendMessage(chatId, errorMsg, keyboard, "MarkdownV2");
      return;
    }

    const successMsg = createSuccessMessage("Генерация началась!", "Вы получите уведомление, когда трек будет готов", {
      "Время ожидания": "1-3 минуты",
      Треков: "2 (версии A и B)",
    });

    const keyboard = new ButtonBuilder()
      .addButton({
        text: "Проверить статус",
        emoji: "⏳",
        action: { type: "callback", data: "nav_status" },
      })
      .addButton({
        text: "Мои треки",
        emoji: "📚",
        action: { type: "callback", data: "nav_library" },
      })
      .build();

    const result = await sendMessage(chatId, successMsg, keyboard, "MarkdownV2");

    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, "notification", "success", { expiresIn: 60000 });
    }
  } catch (error) {
    console.error("Error in generate command:", error);

    const errorMsg = createErrorMessage("Произошла ошибка", [
      "Повторите попытку",
      "Проверьте соединение",
      "Обратитесь в поддержку",
    ]);

    await sendMessage(chatId, errorMsg, undefined, "MarkdownV2");
  }
}
