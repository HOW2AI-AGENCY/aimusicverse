/**
 * Enhanced Quick Actions Handler
 * Provides templates, user history, and quick generation presets
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { BOT_CONFIG } from "../config.ts";
import { sendMessage, editMessageText, answerCallbackQuery } from "../telegram-api.ts";
import { escapeMarkdown, trackMetric } from "../utils/index.ts";
import { createLogger } from "../../_shared/logger.ts";

const logger = createLogger("quick-actions-enhanced");

const supabase = createClient(BOT_CONFIG.supabaseUrl, BOT_CONFIG.supabaseServiceKey);

// ============================================================================
// Quick Templates
// ============================================================================

interface QuickTemplate {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
  instrumental?: boolean;
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: "chill_lofi",
    emoji: "🌙",
    label: "Chill Lo-Fi",
    prompt: "chill lo-fi hip hop, relaxing beats, study music, warm analog sound",
    instrumental: true,
  },
  {
    id: "energetic_pop",
    emoji: "⚡",
    label: "Энергичный поп",
    prompt: "upbeat pop music, catchy melody, energetic drums, feel good vibes",
  },
  {
    id: "epic_cinematic",
    emoji: "🎬",
    label: "Эпик/Кинематограф",
    prompt: "epic cinematic orchestral, dramatic strings, powerful brass, emotional climax",
    instrumental: true,
  },
  {
    id: "dark_trap",
    emoji: "🔥",
    label: "Dark Trap",
    prompt: "dark trap beat, heavy 808 bass, aggressive hi-hats, atmospheric synths",
    instrumental: true,
  },
  {
    id: "romantic_ballad",
    emoji: "💕",
    label: "Романтичная баллада",
    prompt: "romantic ballad, emotional piano, soft strings, heartfelt vocals about love",
  },
  {
    id: "indie_rock",
    emoji: "🎸",
    label: "Indie Rock",
    prompt: "indie rock, jangly guitars, driving drums, authentic raw sound",
  },
  {
    id: "ambient_relax",
    emoji: "🌊",
    label: "Ambient/Релакс",
    prompt: "ambient soundscape, peaceful atmosphere, gentle pads, nature sounds",
    instrumental: true,
  },
  {
    id: "dance_edm",
    emoji: "🕺",
    label: "Dance/EDM",
    prompt: "dance EDM, festival energy, big drop, euphoric synths, four on the floor",
    instrumental: true,
  },
];

// ============================================================================
// Handlers
// ============================================================================

/**
 * Show enhanced quick actions menu
 */
export async function showEnhancedQuickActions(chatId: number, userId: number, messageId?: number): Promise<void> {
  try {
    // Get user's recent styles
    const recentStyles = await getUserRecentStyles(userId);

    let text = "⚡ *Быстрая генерация*\n\n";

    // Show recent styles if available
    if (recentStyles.length > 0) {
      text += "🕐 *Недавние стили:*\n";
    }

    text += "\n🎵 *Готовые шаблоны:*\n" + "_Выберите шаблон для мгновенной генерации_";

    // Build keyboard
    const rows: any[][] = [];

    // Recent styles (max 2)
    if (recentStyles.length > 0) {
      const recentRow = recentStyles.slice(0, 2).map((style, idx) => ({
        text: `🕐 ${style.label}`,
        callback_data: `quick_recent_${idx}`,
      }));
      rows.push(recentRow);
    }

    // Templates in 2 columns
    for (let i = 0; i < QUICK_TEMPLATES.length; i += 2) {
      const row = [];
      row.push({
        text: `${QUICK_TEMPLATES[i].emoji} ${QUICK_TEMPLATES[i].label}`,
        callback_data: `quick_tpl_${QUICK_TEMPLATES[i].id}`,
      });
      if (QUICK_TEMPLATES[i + 1]) {
        row.push({
          text: `${QUICK_TEMPLATES[i + 1].emoji} ${QUICK_TEMPLATES[i + 1].label}`,
          callback_data: `quick_tpl_${QUICK_TEMPLATES[i + 1].id}`,
        });
      }
      rows.push(row);
    }

    // Additional actions
    rows.push([
      { text: "🎵 Мастер генерации", callback_data: "start_wizard" },
      { text: "📝 Свой промпт", callback_data: "custom_prompt" },
    ]);

    rows.push([{ text: "🔙 Назад", callback_data: "nav_main" }]);

    const keyboard = { inline_keyboard: rows };

    if (messageId) {
      await editMessageText(chatId, messageId, text, keyboard);
    } else {
      await sendMessage(chatId, text, keyboard);
    }
  } catch (error) {
    logger.error("Error showing quick actions", error);
    await sendMessage(chatId, "❌ Ошибка загрузки меню\\.");
  }
}

/**
 * Handle quick action callback
 */
export async function handleEnhancedQuickActionCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string,
): Promise<boolean> {
  try {
    // Template selection
    if (data.startsWith("quick_tpl_")) {
      const templateId = data.replace("quick_tpl_", "");
      await handleTemplateSelection(chatId, userId, messageId, templateId, queryId);
      return true;
    }

    // Recent style selection
    if (data.startsWith("quick_recent_")) {
      const index = parseInt(data.replace("quick_recent_", ""));
      await handleRecentStyleSelection(chatId, userId, messageId, index, queryId);
      return true;
    }

    // Confirm template generation
    if (data.startsWith("quick_confirm_")) {
      const templateId = data.replace("quick_confirm_", "");
      await confirmTemplateGeneration(chatId, userId, messageId, templateId, false, queryId);
      return true;
    }

    // Confirm instrumental generation
    if (data.startsWith("quick_confirm_inst_")) {
      const templateId = data.replace("quick_confirm_inst_", "");
      await confirmTemplateGeneration(chatId, userId, messageId, templateId, true, queryId);
      return true;
    }

    // Start wizard
    if (data === "start_wizard") {
      const { startGenerationWizard } = await import("../wizards/generation-wizard.ts");
      await startGenerationWizard(chatId, userId);
      await answerCallbackQuery(queryId);
      return true;
    }

    // Custom prompt
    if (data === "custom_prompt") {
      await showCustomPromptInput(chatId, userId, messageId, queryId);
      return true;
    }

    // Back to quick actions
    if (data === "quick_back") {
      await showEnhancedQuickActions(chatId, userId, messageId);
      await answerCallbackQuery(queryId);
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Error handling quick action callback", error);
    await answerCallbackQuery(queryId, "Произошла ошибка");
    return false;
  }
}

/**
 * Handle template selection - show confirmation
 */
async function handleTemplateSelection(
  chatId: number,
  userId: number,
  messageId: number,
  templateId: string,
  queryId: string,
): Promise<void> {
  const template = QUICK_TEMPLATES.find((t) => t.id === templateId);

  if (!template) {
    await answerCallbackQuery(queryId, "Шаблон не найден");
    return;
  }

  await answerCallbackQuery(queryId, `${template.emoji} ${template.label}`);

  const text =
    `${template.emoji} *${escapeMarkdown(template.label)}*\n\n` +
    `📝 *Промпт:*\n_"${escapeMarkdown(template.prompt)}"_\n\n` +
    `🎸 Режим: ${template.instrumental ? "Инструментал" : "С вокалом"}\n\n` +
    "🎵 *Подтвердите генерацию:*";

  const keyboard = {
    inline_keyboard: [
      [{ text: "🎵 Сгенерировать!", callback_data: `quick_confirm_${templateId}` }],
      [
        {
          text: template.instrumental ? "🎤 С вокалом" : "🎸 Инструментал",
          callback_data: template.instrumental ? `quick_confirm_${templateId}` : `quick_confirm_inst_${templateId}`,
        },
      ],
      [{ text: "⬅️ Назад", callback_data: "quick_back" }],
    ],
  };

  await editMessageText(chatId, messageId, text, keyboard);
}

/**
 * Handle recent style selection
 */
async function handleRecentStyleSelection(
  chatId: number,
  userId: number,
  messageId: number,
  index: number,
  queryId: string,
): Promise<void> {
  const recentStyles = await getUserRecentStyles(userId);

  if (index >= recentStyles.length) {
    await answerCallbackQuery(queryId, "Стиль не найден");
    return;
  }

  const style = recentStyles[index];
  await answerCallbackQuery(queryId, `🕐 ${style.label}`);

  // Start generation with recent style
  await startQuickGeneration(chatId, userId, messageId, style.prompt, style.instrumental || false, "recent");
}

/**
 * Confirm and start template generation
 */
async function confirmTemplateGeneration(
  chatId: number,
  userId: number,
  messageId: number,
  templateId: string,
  forceInstrumental: boolean,
  queryId: string,
): Promise<void> {
  const template = QUICK_TEMPLATES.find((t) => t.id === templateId);

  if (!template) {
    await answerCallbackQuery(queryId, "Шаблон не найден");
    return;
  }

  await answerCallbackQuery(queryId, "🎵 Запускаем генерацию!");

  const instrumental = forceInstrumental || template.instrumental || false;
  await startQuickGeneration(chatId, userId, messageId, template.prompt, instrumental, "template");

  // Save to recent styles
  await saveRecentStyle(userId, {
    label: template.label,
    prompt: template.prompt,
    instrumental,
  });
}

/**
 * Show custom prompt input
 */
async function showCustomPromptInput(
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string,
): Promise<void> {
  await answerCallbackQuery(queryId);

  const text =
    "📝 *Свой промпт*\n\n" +
    "Отправьте текстом описание желаемого трека\\.\n\n" +
    "*Примеры:*\n" +
    '• _"Весёлая летняя песня о дружбе"_\n' +
    '• _"Меланхоличный indie rock с гитарой"_\n' +
    '• _"Энергичный trap бит, 140 BPM"_\n\n' +
    "💡 Чем детальнее описание, тем лучше результат\\!";

  const keyboard = {
    inline_keyboard: [[{ text: "⬅️ Назад к шаблонам", callback_data: "quick_back" }]],
  };

  await editMessageText(chatId, messageId, text, keyboard);

  // Set session mode to await custom prompt
  await supabase.from("telegram_bot_sessions").upsert({
    telegram_user_id: userId,
    session_type: "custom_prompt",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
}

/**
 * Start quick generation
 */
async function startQuickGeneration(
  chatId: number,
  userId: number,
  messageId: number,
  prompt: string,
  instrumental: boolean,
  source: string,
): Promise<void> {
  try {
    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) {
      await editMessageText(chatId, messageId, "❌ Профиль не найден\\.");
      return;
    }

    // Update message
    await editMessageText(
      chatId,
      messageId,
      "🎵 *Генерация началась\\!*\n\n" +
        `📝 ${escapeMarkdown(prompt.substring(0, 100))}${prompt.length > 100 ? "\\.\\.\\." : ""}\n` +
        `🎸 Режим: ${instrumental ? "Инструментал" : "С вокалом"}\n\n` +
        "⏳ Обычно занимает 1\\-3 минуты\\.\n" +
        "🔔 Вы получите уведомление когда трек будет готов\\!",
    );

    // Call generation
    const { data: result, error } = await supabase.functions.invoke("suno-generate", {
      body: {
        prompt,
        userId: profile.user_id,
        instrumental,
        source: `telegram_quick_${source}`,
        chatId,
        messageId,
      },
    });

    if (error) {
      logger.error("Quick generation error", error);
      await editMessageText(
        chatId,
        messageId,
        "❌ *Ошибка генерации*\n\n" +
          `${escapeMarkdown(error.message || "Неизвестная ошибка")}\n\n` +
          "Попробуйте ещё раз\\.",
      );
    }

    trackMetric({
      eventType: "quick_generation_started",
      success: !error,
      telegramChatId: chatId,
      metadata: { source, instrumental, taskId: result?.task_id },
    });
  } catch (error) {
    logger.error("Error in startQuickGeneration", error);
    await editMessageText(chatId, messageId, "❌ Ошибка запуска генерации\\.");
  }
}

// ============================================================================
// User History
// ============================================================================

interface RecentStyle {
  label: string;
  prompt: string;
  instrumental?: boolean;
}

async function getUserRecentStyles(userId: number): Promise<RecentStyle[]> {
  try {
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) return [];

    // Get recent generation styles from generation_tag_usage
    const { data } = await supabase
      .from("generation_tag_usage")
      .select("prompt_text, tags_used")
      .eq("user_id", profile.user_id)
      .eq("success", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!data || data.length === 0) return [];

    // Convert to RecentStyle format
    const styles: RecentStyle[] = data
      .filter((item) => item.prompt_text)
      .slice(0, 3)
      .map((item) => ({
        label: truncate(item.prompt_text || "", 25),
        prompt: item.prompt_text || "",
      }));

    return styles;
  } catch (error) {
    logger.error("Error getting recent styles", error);
    return [];
  }
}

async function saveRecentStyle(userId: number, style: RecentStyle): Promise<void> {
  try {
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) return;

    // This will be saved automatically when generation starts
    // via generation_tag_usage table
  } catch (error) {
    logger.error("Error saving recent style", error);
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

logger.info("Enhanced quick actions module loaded");
