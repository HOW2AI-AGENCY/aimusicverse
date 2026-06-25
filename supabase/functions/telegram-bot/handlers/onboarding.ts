/**
 * Onboarding handler - Interactive tutorial for new Telegram bot users
 * 4-step guided introduction to MusicVerse
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { sendPhoto, editMessageMedia, answerCallbackQuery } from "../telegram-api.ts";
import { buildMessage, createProgressBar } from "../utils/message-formatter.ts";
import { ButtonBuilder } from "../utils/button-builder.ts";
import { getMenuImage } from "../keyboards/menu-images.ts";
import { BOT_CONFIG, CHANNEL_URL, CHANNEL_USERNAME } from "../config.ts";
import { trackMessage } from "../utils/message-manager.ts";

const supabase = getSupabaseClient();

interface OnboardingStep {
  step: number;
  title: string;
  emoji: string;
  description: string;
  features: string[];
  actionText: string;
  actionData: string;
  extraButton?: { text: string; url: string };
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: 1,
    title: "Добро пожаловать в MusicVerse!",
    emoji: "👋",
    description: "Создавайте уникальную музыку с помощью искусственного интеллекта за считанные секунды",
    features: [
      "🎵 Генерация треков по описанию",
      "🎤 Создание каверов из вашего аудио",
      "🎹 Конвертация в MIDI и ноты",
      "📊 Профессиональный анализ музыки",
    ],
    actionText: "Продолжить",
    actionData: "onboarding_step_2",
  },
  {
    step: 2,
    title: "Как создать первый трек",
    emoji: "🎼",
    description: "Просто опишите желаемую музыку - AI сделает остальное",
    features: [
      '✍️ Напишите: "Энергичный рок с гитарой"',
      "⏳ Подождите 1-2 минуты",
      "🎧 Получите готовый трек",
      "📤 Поделитесь с друзьями",
    ],
    actionText: "Далее",
    actionData: "onboarding_step_3",
  },
  {
    step: 3,
    title: "Подпишитесь на канал",
    emoji: "📢",
    description: "Будьте в курсе новостей и получайте советы",
    features: [
      "📰 Новости и обновления платформы",
      "🎵 Примеры сгенерированных треков",
      "💡 Советы по созданию музыки",
      "🎁 Конкурсы и розыгрыши",
    ],
    actionText: "Далее",
    actionData: "onboarding_step_4",
    extraButton: { text: `📢 Подписаться на @${CHANNEL_USERNAME}`, url: CHANNEL_URL },
  },
  {
    step: 4,
    title: "Вы готовы творить!",
    emoji: "🚀",
    description: "Вот ваши стартовые бонусы",
    features: [
      "🎁 50 бесплатных кредитов",
      "🔥 Бонусы за ежедневный вход",
      "🏆 Достижения и награды",
      "💎 Скидки для активных пользователей",
    ],
    actionText: "Начать творить",
    actionData: "onboarding_complete",
  },
];

export async function checkIfNewUser(telegramId: number): Promise<boolean> {
  const { data: onboarding } = await supabase
    .from("user_onboarding")
    .select("completed")
    .eq("telegram_id", telegramId)
    .single();

  // If no record or not completed, user needs onboarding
  return !onboarding?.completed;
}

export async function startOnboarding(chatId: number, userId: number): Promise<void> {
  // Create or update onboarding record
  await supabase.from("user_onboarding").upsert(
    {
      telegram_id: userId,
      current_step: 1,
      started_at: new Date().toISOString(),
      completed: false,
    },
    { onConflict: "telegram_id" },
  );

  await showOnboardingStep(chatId, userId, 1);
}

export async function showOnboardingStep(
  chatId: number,
  userId: number,
  step: number,
  messageId?: number,
): Promise<void> {
  const stepData = ONBOARDING_STEPS[step - 1];
  if (!stepData) {
    // Invalid step, complete onboarding
    await completeOnboarding(chatId, userId, messageId);
    return;
  }

  // Update current step in DB
  await supabase.from("user_onboarding").update({ current_step: step }).eq("telegram_id", userId);

  const progress = createProgressBar({
    current: step,
    total: ONBOARDING_STEPS.length,
    width: 10,
    filledChar: "▓",
    emptyChar: "░",
    showPercentage: false,
  });

  const caption = buildMessage({
    title: stepData.title,
    emoji: stepData.emoji,
    description: stepData.description,
    sections: [
      {
        title: step === 2 ? "Как это работает" : step === 3 ? "Ваши бонусы" : "Возможности",
        content: stepData.features,
        emoji: "✨",
        style: "list",
      },
    ],
    footer: `Шаг ${step} из ${ONBOARDING_STEPS.length}  ${progress}`,
  });

  const keyboardBuilder = new ButtonBuilder();

  // Extra button for channel subscription (step 3)
  if (stepData.extraButton) {
    keyboardBuilder.addButton({
      text: stepData.extraButton.text,
      emoji: "",
      action: { type: "url", url: stepData.extraButton.url },
    });
  }

  // Main action button
  keyboardBuilder.addButton({
    text: stepData.actionText,
    emoji: step === ONBOARDING_STEPS.length ? "🎵" : "➡️",
    action: { type: "callback", data: stepData.actionData },
  });

  // Back button for steps 2+
  if (step > 1) {
    keyboardBuilder.addButton({
      text: "Назад",
      emoji: "⬅️",
      action: { type: "callback", data: `onboarding_step_${step - 1}` },
    });
  }

  // Skip button
  keyboardBuilder.addButton({
    text: "Пропустить обучение",
    emoji: "⏭️",
    action: { type: "callback", data: "onboarding_skip" },
  });

  const keyboard = keyboardBuilder.build();
  const menuImage = await getMenuImage("mainMenu");

  if (messageId) {
    await editMessageMedia(
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
  } else {
    const result = await sendPhoto(chatId, menuImage, {
      caption,
      replyMarkup: keyboard,
    });

    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, "menu", "main_menu", { persistent: true });
    }
  }
}

export async function completeOnboarding(chatId: number, userId: number, messageId?: number): Promise<void> {
  // Mark onboarding as completed
  await supabase
    .from("user_onboarding")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("telegram_id", userId);

  // Import and show dashboard
  const { handleDashboard } = await import("./dashboard.ts");
  await handleDashboard(chatId, userId, messageId, true);
}

export async function handleOnboardingCallback(
  callbackData: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string,
): Promise<boolean> {
  if (!callbackData.startsWith("onboarding_")) {
    return false;
  }

  await answerCallbackQuery(queryId);

  if (callbackData === "onboarding_skip") {
    await completeOnboarding(chatId, userId, messageId);
    return true;
  }

  if (callbackData === "onboarding_complete") {
    await completeOnboarding(chatId, userId, messageId);
    return true;
  }

  if (callbackData === "onboarding_try_generate") {
    // Show quick generate options then continue to step 3
    await showOnboardingStep(chatId, userId, 3, messageId);
    return true;
  }

  const stepMatch = callbackData.match(/onboarding_step_(\d+)/);
  if (stepMatch) {
    const step = parseInt(stepMatch[1]);
    await showOnboardingStep(chatId, userId, step, messageId);
    return true;
  }

  return false;
}
