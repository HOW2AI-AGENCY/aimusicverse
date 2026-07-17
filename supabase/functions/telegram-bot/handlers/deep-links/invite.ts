/**
 * Invite / referral deep link handler.
 */
import { getSupabaseClient } from "../../core/supabase-client.ts";
import { sendMessage } from "../../telegram-api.ts";
import { ButtonBuilder } from "../../utils/button-builder.ts";
import { buildMessage } from "../../utils/message-formatter.ts";
import { BOT_CONFIG } from "../../config.ts";
import { trackDeepLinkAnalytics } from "./deep-link-analytics.ts";

const supabase = getSupabaseClient();

export async function handleInviteDeepLink(chatId: number, userId: number, inviteCode: string): Promise<void> {
  const { data: referrer } = await supabase
    .from("profiles")
    .select("user_id, username, display_name")
    .eq("user_id", inviteCode)
    .single();

  const referrerName = referrer?.display_name || referrer?.username || "друга";

  const caption = buildMessage({
    title: "Добро пожаловать в MusicVerse!",
    emoji: "🎉",
    description: `Вас пригласил ${referrerName}`,
    sections: [
      {
        title: "Бонус за регистрацию",
        content: "🎁 +10 кредитов для генерации музыки",
        emoji: "💰",
      },
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Начать создавать музыку",
      emoji: "🎵",
      action: { type: "webapp", url: BOT_CONFIG.miniAppUrl },
    })
    .build();

  await sendMessage(chatId, caption, keyboard, "MarkdownV2");
  await trackDeepLinkAnalytics("invite", inviteCode, userId, true);
}
