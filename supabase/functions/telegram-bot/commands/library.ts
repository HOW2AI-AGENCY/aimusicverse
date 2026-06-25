import { getSupabaseClient } from "../core/supabase-client.ts";
import { BOT_CONFIG } from "../config.ts";
import { sendMessage, editMessageText } from "../telegram-api.ts";
import { buildMessage, createSection, formatRelativeTime, createErrorMessage } from "../utils/message-formatter.ts";
import { ButtonBuilder } from "../utils/button-builder.ts";
import { trackMessage } from "../utils/message-manager.ts";
import { escapeMarkdownV2, truncateText } from "../utils/text-processor.ts";

const supabase = getSupabaseClient();

export async function handleLibrary(chatId: number, userId: number, messageId?: number) {
  try {
    // Get user from profiles table
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) {
      const errorMsg = createErrorMessage("Профиль не найден", ["Откройте приложение для регистрации"]);

      const keyboard = new ButtonBuilder()
        .addButton({
          text: "Открыть студию",
          emoji: "🚀",
          action: { type: "webapp", url: BOT_CONFIG.miniAppUrl },
        })
        .build();

      if (messageId) {
        await editMessageText(chatId, messageId, errorMsg, keyboard);
      } else {
        await sendMessage(chatId, errorMsg, keyboard, "MarkdownV2");
      }
      return;
    }

    // Get last 10 completed tracks with audio
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("id, title, style, created_at, status, audio_url, local_audio_url, duration")
      .eq("user_id", profile.user_id)
      .eq("status", "completed")
      .not("audio_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching tracks:", error);

      const errorMsg = createErrorMessage("Ошибка при загрузке треков", ["Повторите попытку", "Проверьте соединение"]);

      const keyboard = new ButtonBuilder()
        .addButton({
          text: "Попробовать снова",
          emoji: "🔄",
          action: { type: "callback", data: "nav_library" },
        })
        .addButton({
          text: "Главное меню",
          emoji: "🏠",
          action: { type: "callback", data: "nav_main" },
        })
        .build();

      if (messageId) {
        await editMessageText(chatId, messageId, errorMsg, keyboard);
      } else {
        await sendMessage(chatId, errorMsg, keyboard, "MarkdownV2");
      }
      return;
    }

    if (!tracks || tracks.length === 0) {
      const noTracksMsg = buildMessage({
        title: "У вас пока нет треков",
        emoji: "📭",
        description: "Начните создавать музыку прямо сейчас!",
        sections: [
          {
            title: "Как начать",
            content: [
              "Используйте /generate для создания трека",
              "Откройте студию для полного функционала",
              "Загрузите аудио для обработки",
            ],
            emoji: "💡",
            style: "list",
          },
        ],
      });

      const keyboard = new ButtonBuilder()
        .addButton({
          text: "Создать трек",
          emoji: "🎼",
          action: { type: "callback", data: "nav_generate" },
        })
        .addButton({
          text: "Открыть студию",
          emoji: "🚀",
          action: { type: "webapp", url: BOT_CONFIG.miniAppUrl },
        })
        .addButton({
          text: "Главное меню",
          emoji: "🏠",
          action: { type: "callback", data: "nav_main" },
        })
        .build();

      if (messageId) {
        await editMessageText(chatId, messageId, noTracksMsg, keyboard);
        await trackMessage(chatId, messageId, "content", "library", { expiresIn: 60000 });
      } else {
        const result = await sendMessage(chatId, noTracksMsg, keyboard, "MarkdownV2");
        if (result?.result?.message_id) {
          await trackMessage(chatId, result.result.message_id, "content", "library", { expiresIn: 60000 });
        }
      }
      return;
    }

    // Build track list
    const trackItems = tracks.map((track, index) => {
      const title = truncateText(track.title || "Без названия", 40);
      const style = track.style || "Без стиля";
      const timeAgo = formatRelativeTime(new Date(track.created_at));

      return `${index + 1}\\. 🎵 *${escapeMarkdownV2(title)}*\n   🎸 ${escapeMarkdownV2(style)} • ${timeAgo}`;
    });

    const libraryMsg = buildMessage({
      title: "Ваша библиотека",
      emoji: "📚",
      description: `Всего треков: ${tracks.length}`,
      sections: [
        {
          title: "Последние треки",
          content: trackItems.join("\n\n"),
          emoji: "🎵",
        },
      ],
      footer: "Откройте полную библиотеку в приложении",
    });

    const keyboard = new ButtonBuilder()
      .addButton({
        text: "Открыть библиотеку",
        emoji: "📚",
        action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/library` },
      })
      .addRow(
        {
          text: "Создать трек",
          emoji: "🎼",
          action: { type: "callback", data: "nav_generate" },
        },
        {
          text: "Обновить",
          emoji: "🔄",
          action: { type: "callback", data: "nav_library" },
        },
      )
      .addButton({
        text: "Главное меню",
        emoji: "🏠",
        action: { type: "callback", data: "nav_main" },
      })
      .build();

    if (messageId) {
      await editMessageText(chatId, messageId, libraryMsg, keyboard);
      await trackMessage(chatId, messageId, "content", "library", { expiresIn: 300000 }); // 5 minutes
    } else {
      const result = await sendMessage(chatId, libraryMsg, keyboard, "MarkdownV2");
      if (result?.result?.message_id) {
        await trackMessage(chatId, result.result.message_id, "content", "library", { expiresIn: 300000 });
      }
    }
  } catch (error) {
    console.error("Error in library command:", error);

    const errorMsg = createErrorMessage("Ошибка при загрузке библиотеки", [
      "Повторите попытку",
      "Проверьте соединение",
    ]);

    const keyboard = new ButtonBuilder()
      .addButton({
        text: "Попробовать снова",
        emoji: "🔄",
        action: { type: "callback", data: "nav_library" },
      })
      .addButton({
        text: "Главное меню",
        emoji: "🏠",
        action: { type: "callback", data: "nav_main" },
      })
      .build();

    if (messageId) {
      await editMessageText(chatId, messageId, errorMsg, keyboard);
    } else {
      await sendMessage(chatId, errorMsg, keyboard, "MarkdownV2");
    }
  }
}
