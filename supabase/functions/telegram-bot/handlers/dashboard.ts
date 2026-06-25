/**
 * Dashboard handler - Personalized user dashboard for Telegram bot
 * Shows quick stats, balance, and main actions
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { sendPhoto, editMessageMedia, escapeMarkdownV2 } from "../telegram-api.ts";
import { buildMessage, createKeyValue, createProgressBar } from "../utils/message-formatter.ts";
import { ButtonBuilder } from "../utils/button-builder.ts";
import { getMenuImage } from "../keyboards/menu-images.ts";
import { navigateTo, clearNavigationState } from "../core/navigation-state.ts";
import { BOT_CONFIG } from "../config.ts";
import { deleteActiveMenu, deleteAndSendNewMenuPhoto, setActiveMenuMessageId } from "../core/active-menu-manager.ts";
import { trackMessage, messageManager } from "../utils/message-manager.ts";
import { buildDynamicKeyboard } from "./dynamic-menu.ts";
import { logBotAction } from "../utils/bot-logger.ts";

const supabase = getSupabaseClient();

interface DashboardData {
  firstName: string;
  username: string | null;
  balance: number;
  level: number;
  experience: number;
  streak: number;
  trackCount: number;
  likesReceived: number;
  totalPlays: number;
  activeGenerations: number;
  subscriptionTier: string | null;
}

async function getDashboardData(telegramId: number): Promise<DashboardData | null> {
  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, username, user_id, subscription_tier")
    .eq("telegram_id", telegramId)
    .single();

  if (!profile) return null;

  // Get credits in parallel
  const [creditsResult, trackCountResult, activeGenResult] = await Promise.all([
    supabase
      .from("user_credits")
      .select("balance, level, experience, current_streak, total_likes_received, total_plays")
      .eq("user_id", profile.user_id)
      .single(),
    supabase
      .from("tracks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.user_id)
      .eq("status", "completed"),
    supabase
      .from("generation_tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.user_id)
      .in("status", ["pending", "processing"]),
  ]);

  return {
    firstName: profile.first_name,
    username: profile.username,
    balance: creditsResult.data?.balance || 0,
    level: creditsResult.data?.level || 1,
    experience: creditsResult.data?.experience || 0,
    streak: creditsResult.data?.current_streak || 0,
    trackCount: trackCountResult.count || 0,
    likesReceived: creditsResult.data?.total_likes_received || 0,
    totalPlays: creditsResult.data?.total_plays || 0,
    activeGenerations: activeGenResult.count || 0,
    subscriptionTier: profile.subscription_tier,
  };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Доброе утро";
  if (hour >= 12 && hour < 18) return "Добрый день";
  if (hour >= 18 && hour < 23) return "Добрый вечер";
  return "Доброй ночи";
}

function getStreakEmoji(streak: number): string {
  if (streak === 0) return "";
  if (streak < 3) return "🔥";
  if (streak < 7) return "🔥🔥";
  if (streak < 14) return "🔥🔥🔥";
  return "💎🔥";
}

function getTierEmoji(tier: string | null): string {
  switch (tier) {
    case "basic":
      return "⭐";
    case "premium":
      return "💎";
    case "enterprise":
      return "👑";
    default:
      return "";
  }
}

export async function handleDashboard(
  chatId: number,
  userId: number,
  messageId?: number,
  isNewUser: boolean = false,
): Promise<void> {
  // Clear navigation state and delete old menus to prevent duplication
  clearNavigationState(userId);
  navigateTo(userId, "main", messageId);

  // Always delete old main_menu messages first (except current if editing)
  await messageManager.deleteCategory(chatId, "main_menu", messageId ? { except: messageId } : undefined);

  const data = await getDashboardData(userId);
  const menuImage = await getMenuImage("mainMenu");

  if (!data) {
    // New user or profile not found - show welcome
    const caption = buildMessage({
      title: "Добро пожаловать в MusicVerse!",
      emoji: "🎵",
      description: "Создавайте профессиональную музыку с помощью AI",
      sections: [
        {
          title: "Начните прямо сейчас",
          content: ["Опишите желаемую музыку", "AI создаст уникальный трек", "Скачайте и поделитесь"],
          emoji: "✨",
          style: "list",
        },
      ],
    });

    const keyboard = new ButtonBuilder()
      .addButton({
        text: "Создать первый трек",
        emoji: "🎵",
        action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate` },
      })
      .addButton({
        text: "Открыть студию",
        emoji: "🚀",
        action: { type: "webapp", url: BOT_CONFIG.miniAppUrl },
      })
      .build();

    const result = await sendPhoto(chatId, menuImage, {
      caption,
      replyMarkup: keyboard,
    });

    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, "menu", "main_menu", { persistent: true });
      await setActiveMenuMessageId(userId, chatId, result.result.message_id, "main_menu");
    }
    return;
  }

  // Build personalized dashboard
  const greeting = getGreeting();
  const streakEmoji = getStreakEmoji(data.streak);
  const tierEmoji = getTierEmoji(data.subscriptionTier);

  // IMPORTANT: We use MarkdownV2 in sendPhoto/editMessageMedia, so all dynamic text must be escaped.
  const headerLineRaw = `${greeting}, ${data.firstName}! ${tierEmoji}`;
  const headerLine = escapeMarkdownV2(headerLineRaw);

  const balanceLine = escapeMarkdownV2(`💰 ${data.balance} кредитов`);
  const streakLine = data.streak > 0 ? escapeMarkdownV2(` │ ${streakEmoji} ${data.streak} дн`) : "";
  const levelLine = escapeMarkdownV2(` │ Ур. ${data.level}`);

  const statsLine = escapeMarkdownV2(`🎵 ${data.trackCount} треков │ ❤️ ${data.likesReceived} │ ▶️ ${data.totalPlays}`);

  const activeGenLine =
    data.activeGenerations > 0
      ? `\n\n⚡ *Генерируется:* ${data.activeGenerations} ${escapeMarkdownV2("трек(ов)")}`
      : "";

  const caption = `*${headerLine}*\n━━━━━━━━━━━━━━━━━━\n\n${balanceLine}${streakLine}${levelLine}\n\n${statsLine}${activeGenLine}\n\n👇 *Выберите действие:*`;

  // Load dynamic keyboard from database
  let keyboard;
  try {
    const dynamicButtons = await buildDynamicKeyboard("main");
    if (dynamicButtons && dynamicButtons.length > 0) {
      keyboard = { inline_keyboard: dynamicButtons };
    }
  } catch (e) {
    // Fallback to static keyboard if dynamic fails
    console.error("Failed to load dynamic keyboard:", e);
  }

  // Fallback to static keyboard
  if (!keyboard) {
    keyboard = new ButtonBuilder()
      .addButton({
        text: "Создать трек",
        emoji: "🎵",
        action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate` },
      })
      .addRow(
        {
          text: "Библиотека",
          emoji: "📚",
          action: { type: "callback", data: "nav_library" },
        },
        {
          text: "Проекты",
          emoji: "📁",
          action: { type: "callback", data: "nav_projects" },
        },
      )
      .addRow(
        {
          text: "Анализ",
          emoji: "🔬",
          action: { type: "callback", data: "nav_analyze" },
        },
        {
          text: "Профиль",
          emoji: "👤",
          action: { type: "callback", data: "nav_profile" },
        },
      )
      .addButton({
        text: "Быстрые действия",
        emoji: "⚡",
        action: { type: "callback", data: "quick_actions" },
      })
      .build();
  }

  // Log dashboard view
  await logBotAction(userId, chatId, "dashboard_view", {
    has_data: !!data,
    balance: data.balance,
    level: data.level,
  });

  if (messageId) {
    const editResult = await editMessageMedia(
      chatId,
      messageId,
      {
        type: "photo",
        media: menuImage,
        caption,
        parse_mode: "MarkdownV2",
      },
      keyboard,
    );

    // If edit failed (message doesn't exist), send a new one
    if (!editResult) {
      await deleteActiveMenu(userId, chatId);
      const result = await sendPhoto(chatId, menuImage, {
        caption,
        replyMarkup: keyboard,
      });
      if (result?.result?.message_id) {
        await trackMessage(chatId, result.result.message_id, "menu", "main_menu", { persistent: true });
        await setActiveMenuMessageId(userId, chatId, result.result.message_id, "main_menu");
      }
    } else {
      await trackMessage(chatId, messageId, "menu", "main_menu", { persistent: true });
      await setActiveMenuMessageId(userId, chatId, messageId, "main_menu");
    }
  } else {
    // Delete previous active menu before sending new one
    await deleteActiveMenu(userId, chatId);

    const result = await sendPhoto(chatId, menuImage, {
      caption,
      replyMarkup: keyboard,
    });

    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, "menu", "main_menu", { persistent: true });
      await setActiveMenuMessageId(userId, chatId, result.result.message_id, "main_menu");
    }
  }
}
