import { musicService } from "../core/services/music.ts";
import { createPlayerControls, createProjectControls } from "../keyboards/main-menu.ts";
import {
  sendPhoto,
  editMessageMedia,
  editMessageCaption,
  answerCallbackQuery,
  sendMessage,
  deleteMessage,
} from "../telegram-api.ts";
import { buildMessage, createSection, createKeyValue } from "../utils/message-formatter.ts";
import { ButtonBuilder, mediaPlayerKeyboard, paginationKeyboard } from "../utils/button-builder.ts";
import { trackMessage, messageManager } from "../utils/message-manager.ts";
import { escapeMarkdownV2 } from "../utils/text-processor.ts";
import {
  navigateTo,
  getPreviousRoute,
  canGoBack,
  getBreadcrumb,
  clearNavigationState,
  getNavigationState,
} from "../core/navigation-state.ts";
import { BOT_CONFIG } from "../config.ts";
import { deleteActiveMenu, setActiveMenuMessageId, deleteAndSendNewMenuPhoto } from "../core/active-menu-manager.ts";
import { getMenuImage } from "../keyboards/menu-images.ts";
import { handleSubmenu } from "./dynamic-menu.ts";
import { createLocationIndicator, appendNavigationContext } from "../utils/breadcrumb-builder.ts";

/**
 * Handle navigation to main menu
 * Uses dynamic menu system
 */
export async function handleNavigationMain(chatId: number, messageId?: number, userId?: number) {
  // Clear navigation state
  if (userId) {
    clearNavigationState(userId);
  }

  // Use dynamic menu system
  await handleSubmenu(chatId, userId || 0, "main", messageId);
}

export async function handleNavigationLibrary(chatId: number, userId: number, messageId?: number, page: number = 0) {
  navigateTo(userId, "library", messageId);

  const tracks = await musicService.getUserTracks(userId);

  if (!tracks.length) {
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
      await editMessageCaption(chatId, messageId, noTracksMsg, keyboard);
      await trackMessage(chatId, messageId, "content", "library", { expiresIn: 60000 });
      if (userId) {
        await setActiveMenuMessageId(userId, chatId, messageId, "library");
      }
    } else {
      const libraryImage = getMenuImage("library");
      if (userId) {
        const msgId = await deleteAndSendNewMenuPhoto(chatId, userId, libraryImage, noTracksMsg, keyboard, "library");
        if (msgId) {
          await trackMessage(chatId, msgId, "content", "library", { expiresIn: 60000 });
        }
      } else {
        const result = await sendPhoto(chatId, libraryImage, {
          caption: noTracksMsg,
          replyMarkup: keyboard,
        });
        if (result?.result?.message_id) {
          await trackMessage(chatId, result.result.message_id, "content", "library", { expiresIn: 60000 });
        }
      }
    }
    return;
  }

  // Normalize page
  if (page < 0) page = tracks.length - 1;
  if (page >= tracks.length) page = 0;

  const track = tracks[page];

  // Create enhanced track caption
  const trackInfo: Record<string, string> = {};
  if (track.artist) trackInfo["Исполнитель"] = track.artist;
  if (track.duration_seconds) trackInfo["Длительность"] = musicService.formatDuration(track.duration_seconds);
  if (track.style) trackInfo["Стиль"] = track.style;
  if (track.created_at) trackInfo["Создан"] = new Date(track.created_at).toLocaleDateString("ru-RU");

  const caption = buildMessage({
    title: track.title || "Без названия",
    emoji: "🎵",
    description: `Трек ${page + 1} из ${tracks.length}`,
    sections: [
      {
        title: "Информация",
        content: createKeyValue(trackInfo),
        emoji: "ℹ️",
      },
    ],
  });

  let coverUrl = musicService.getCoverUrl(track);

  // Validate cover URL
  try {
    new URL(coverUrl);
  } catch {
    console.warn(`Invalid cover URL for track ${track.id}:`, coverUrl);
    coverUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop&q=80";
  }

  const keyboard = mediaPlayerKeyboard(track.id, page, tracks.length);

  if (messageId) {
    await messageManager.deleteCategory(chatId, "library", { except: messageId });

    const result = await editMessageMedia(
      chatId,
      messageId,
      {
        type: "photo",
        media: coverUrl,
        caption,
        parse_mode: "MarkdownV2",
      },
      keyboard,
    );

    if (!result) {
      const newResult = await sendPhoto(chatId, coverUrl, {
        caption,
        replyMarkup: keyboard,
      });

      if (newResult?.result?.message_id) {
        await trackMessage(chatId, newResult.result.message_id, "content", "library");
      }
    } else {
      await trackMessage(chatId, messageId, "content", "library");
    }
  } else {
    const result = await sendPhoto(chatId, coverUrl, {
      caption,
      replyMarkup: keyboard,
    });

    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, "content", "library");
    }
  }
}

export async function handleNavigationProjects(chatId: number, userId: number, messageId?: number, page: number = 0) {
  navigateTo(userId, "projects", messageId);
  console.log("Navigation: Projects page", page, "for user", userId);

  const projects = await musicService.getUserProjects(userId);

  console.log("Projects returned:", projects.length);

  if (!projects.length) {
    const noProjectsMsg = buildMessage({
      title: "У вас пока нет проектов",
      emoji: "📭",
      description: "Создайте первый проект в приложении!",
    });

    const keyboard = new ButtonBuilder()
      .addButton({
        text: "Создать проект",
        emoji: "➕",
        action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/projects/new` },
      })
      .addButton({
        text: "Главное меню",
        emoji: "🏠",
        action: { type: "callback", data: "nav_main" },
      })
      .build();

    if (messageId) {
      await editMessageCaption(chatId, messageId, noProjectsMsg, keyboard);
      if (userId) {
        await setActiveMenuMessageId(userId, chatId, messageId, "projects");
      }
    } else {
      const projectsImage = getMenuImage("projects");
      if (userId) {
        await deleteAndSendNewMenuPhoto(chatId, userId, projectsImage, noProjectsMsg, keyboard, "projects");
      } else {
        await sendPhoto(chatId, projectsImage, {
          caption: noProjectsMsg,
          replyMarkup: keyboard,
        });
      }
    }
    return;
  }

  // Normalize page
  if (page < 0) page = projects.length - 1;
  if (page >= projects.length) page = 0;

  console.log("Displaying project", page + 1, "of", projects.length);

  const project = projects[page];
  const caption = musicService.formatProjectCaption(project, page, projects.length);
  const coverUrl = musicService.getProjectCoverUrl(project);
  const keyboard = createProjectControls(project.id, page, projects.length);

  console.log("Project cover URL:", coverUrl);

  if (messageId) {
    const result = await editMessageMedia(
      chatId,
      messageId,
      {
        type: "photo",
        media: coverUrl,
        caption,
        parse_mode: "MarkdownV2",
      },
      keyboard,
    );

    if (!result) {
      await sendPhoto(chatId, coverUrl, {
        caption,
        replyMarkup: keyboard,
      });
    }
  } else {
    await sendPhoto(chatId, coverUrl, {
      caption,
      replyMarkup: keyboard,
    });
  }
}

export async function handleNavigationGenerate(chatId: number, userId: number, messageId?: number) {
  navigateTo(userId, "generate", messageId);

  // Build caption with location indicator
  const locationHeader = createLocationIndicator("generate");

  const caption = buildMessage({
    title: "Генератор музыки",
    emoji: "🎼",
    description: "Выберите способ создания трека",
    sections: [
      {
        title: "Способы генерации",
        content: [
          "/generate <описание> \\- текстовый промпт",
          "/cover \\- создать кавер из аудио",
          "/extend \\- расширить существующий трек",
        ],
        emoji: "💡",
        style: "list",
      },
    ],
    footer: "🏠 Главное меню",
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть генератор",
      emoji: "🚀",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate` },
    })
    .addRow(
      {
        text: "Кавер",
        emoji: "🎤",
        action: { type: "callback", data: "start_cover" },
      },
      {
        text: "Расширить",
        emoji: "➕",
        action: { type: "callback", data: "start_extend" },
      },
    )
    .addRow(
      {
        text: "Загрузить аудио",
        emoji: "📤",
        action: { type: "callback", data: "start_upload" },
      },
      {
        text: "Мои загрузки",
        emoji: "📂",
        action: { type: "callback", data: "my_uploads" },
      },
    )
    .addButton({
      text: "Назад",
      emoji: "🔙",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  if (messageId) {
    await editMessageCaption(chatId, messageId, caption, keyboard);
    if (userId) {
      await setActiveMenuMessageId(userId, chatId, messageId, "generator");
    }
  } else {
    const generatorImage = getMenuImage("generator");
    if (userId) {
      await deleteAndSendNewMenuPhoto(chatId, userId, generatorImage, caption, keyboard, "generator");
    } else {
      await sendPhoto(chatId, generatorImage, {
        caption,
        replyMarkup: keyboard,
      });
    }
  }
}

export async function handleNavigationAnalyze(chatId: number, userId: number, messageId?: number) {
  navigateTo(userId, "analyze", messageId);

  const caption = buildMessage({
    title: "Анализ аудио",
    emoji: "🔬",
    description: "Инструменты для анализа и обработки музыки",
    sections: [
      {
        title: "Доступные функции",
        content: [
          "🎹 MIDI \\- конвертация в MIDI",
          "🎸 Гитара \\- анализ гитарной партии",
          "🔍 Распознавание \\- определить песню",
          "📊 Полный анализ \\- BPM, тональность, аккорды",
        ],
        emoji: "🛠️",
        style: "list",
      },
    ],
    footer: "🏠 Главное меню",
  });

  const keyboard = new ButtonBuilder()
    .addRow(
      {
        text: "MIDI",
        emoji: "🎹",
        action: { type: "callback", data: "start_midi" },
      },
      {
        text: "Гитара",
        emoji: "🎸",
        action: { type: "callback", data: "start_guitar" },
      },
    )
    .addRow(
      {
        text: "Распознать",
        emoji: "🔍",
        action: { type: "callback", data: "start_recognize" },
      },
      {
        text: "Полный анализ",
        emoji: "📊",
        action: { type: "callback", data: "analyze_list" },
      },
    )
    .addButton({
      text: "Назад",
      emoji: "🔙",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  if (messageId) {
    await editMessageCaption(chatId, messageId, caption, keyboard);
    if (userId) {
      await setActiveMenuMessageId(userId, chatId, messageId, "analysis");
    }
  } else {
    const analysisImage = getMenuImage("analysis");
    if (userId) {
      await deleteAndSendNewMenuPhoto(chatId, userId, analysisImage, caption, keyboard, "analysis");
    } else {
      await sendPhoto(chatId, analysisImage, {
        caption,
        replyMarkup: keyboard,
      });
    }
  }
}

export async function handleNavigationSettings(chatId: number, userId: number, messageId?: number) {
  navigateTo(userId, "settings", messageId);

  const caption = buildMessage({
    title: "Настройки",
    emoji: "⚙️",
    description: "Управление аккаунтом и настройками",
    footer: "🏠 Главное меню",
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть настройки",
      emoji: "📱",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/settings` },
    })
    .addRow(
      {
        text: "Купить кредиты",
        emoji: "💎",
        action: { type: "callback", data: "buy_credits" },
      },
      {
        text: "Мой профиль",
        emoji: "👤",
        action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/profile` },
      },
    )
    .addRow(
      {
        text: "Условия",
        emoji: "📜",
        action: { type: "callback", data: "legal_terms" },
      },
      {
        text: "Конфиденциальность",
        emoji: "🔒",
        action: { type: "callback", data: "legal_privacy" },
      },
    )
    .addButton({
      text: "Назад",
      emoji: "🔙",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  if (messageId) {
    await editMessageCaption(chatId, messageId, caption, keyboard);
    if (userId) {
      await setActiveMenuMessageId(userId, chatId, messageId, "settings");
    }
  } else {
    const settingsImage = getMenuImage("settings");
    if (userId) {
      await deleteAndSendNewMenuPhoto(chatId, userId, settingsImage, caption, keyboard, "settings");
    } else {
      await sendPhoto(chatId, settingsImage, {
        caption,
        replyMarkup: keyboard,
      });
    }
  }
}

export async function handleNavigationHelp(chatId: number, userId: number, messageId?: number) {
  navigateTo(userId, "help", messageId);

  const { handleHelp } = await import("../commands/help.ts");
  await handleHelp(chatId);
}

export async function handleNavigationCallback(
  callbackData: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string,
) {
  await answerCallbackQuery(queryId);

  // Check for navigation loops
  const route = callbackData.replace("nav_", "");

  if (callbackData === "nav_main") {
    await handleNavigationMain(chatId, messageId, userId);
  } else if (callbackData === "nav_library") {
    await handleNavigationLibrary(chatId, userId, messageId, 0);
  } else if (callbackData === "nav_projects") {
    await handleNavigationProjects(chatId, userId, messageId, 0);
  } else if (callbackData === "nav_generate") {
    await handleNavigationGenerate(chatId, userId, messageId);
  } else if (callbackData === "nav_analyze") {
    await handleNavigationAnalyze(chatId, userId, messageId);
  } else if (callbackData === "nav_settings") {
    await handleNavigationSettings(chatId, userId, messageId);
  } else if (callbackData === "nav_help") {
    await handleNavigationHelp(chatId, userId, messageId);
  } else if (callbackData === "nav_back") {
    const prevRoute = getPreviousRoute(userId);
    await handleNavigationCallback(`nav_${prevRoute}`, chatId, userId, messageId, queryId);
  } else if (callbackData.startsWith("lib_page_")) {
    const page = parseInt(callbackData.replace("lib_page_", ""));
    await handleNavigationLibrary(chatId, userId, messageId, page);
  } else if (callbackData.startsWith("project_page_")) {
    const page = parseInt(callbackData.replace("project_page_", ""));
    await handleNavigationProjects(chatId, userId, messageId, page);
  } else if (callbackData === "start_cover") {
    const { handleCoverCommand } = await import("../commands/audio-upload.ts");
    await handleCoverCommand(chatId, userId, "", messageId, true); // deleteOriginal for photo messages
  } else if (callbackData === "start_extend") {
    const { handleExtendCommand } = await import("../commands/audio-upload.ts");
    await handleExtendCommand(chatId, userId, "", messageId, true); // deleteOriginal for photo messages
  } else if (callbackData === "start_upload") {
    const { handleUploadCommand } = await import("../commands/upload.ts");
    await handleUploadCommand(chatId, userId, "", messageId, true); // deleteOriginal for photo messages
  } else if (callbackData === "start_midi") {
    const { handleMidiCommand } = await import("../commands/midi.ts");
    await handleMidiCommand(chatId, userId);
  } else if (callbackData === "start_guitar") {
    const { handleGuitarCommand } = await import("../commands/guitar.ts");
    await handleGuitarCommand(chatId, userId);
  } else if (callbackData === "start_recognize") {
    const { handleRecognizeCommand } = await import("../commands/recognize.ts");
    await handleRecognizeCommand(chatId, userId);
  }
}
