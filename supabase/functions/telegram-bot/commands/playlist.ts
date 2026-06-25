/**
 * Playlist Command Handler
 * Add tracks to playlists in Telegram
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { sendMessage, editMessageText, answerCallbackQuery } from "../telegram-api.ts";
import { escapeMarkdown } from "../utils/index.ts";
import { BOT_CONFIG } from "../config.ts";

const supabase = getSupabaseClient();

export async function handleAddToPlaylist(chatId: number, telegramUserId: number, trackId: string, messageId?: number) {
  try {
    // Get auth user_id from telegram_id via profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("telegram_id", telegramUserId)
      .single();

    if (!profile?.user_id) {
      await sendMessage(chatId, "❌ Пользователь не найден");
      return;
    }

    // Get user's playlists from the playlists table
    const { data: playlists, error } = await supabase
      .from("playlists")
      .select("id, title, track_count")
      .eq("user_id", profile.user_id)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching playlists:", error);
      await sendMessage(chatId, "❌ Ошибка загрузки плейлистов");
      return;
    }

    const message =
      `📁 *Добавить в плейлист*\n\n` +
      (playlists && playlists.length > 0 ? `Выберите плейлист:` : `У вас пока нет плейлистов\\.\nСоздайте первый\\!`);

    const playlistButtons =
      playlists?.map((p) => [
        {
          text: `📁 ${p.title} (${p.track_count || 0})`,
          callback_data: `playlist_add_${p.id}_${trackId}`,
        },
      ]) || [];

    const keyboard = {
      inline_keyboard: [
        ...playlistButtons,
        [{ text: "➕ Создать новый плейлист", callback_data: `playlist_new_${trackId}` }],
        [{ text: "⬅️ Назад", callback_data: `track_details_${trackId}` }],
      ],
    };

    if (messageId) {
      await editMessageText(chatId, messageId, message, keyboard);
    } else {
      await sendMessage(chatId, message, keyboard);
    }
  } catch (error) {
    console.error("Error handling add to playlist:", error);
    await sendMessage(chatId, "❌ Ошибка при загрузке плейлистов");
  }
}

export async function handlePlaylistAdd(chatId: number, playlistId: string, trackId: string, queryId: string) {
  try {
    // Get current max position
    const { data: existing } = await supabase
      .from("playlist_tracks")
      .select("position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existing?.[0]?.position !== undefined ? existing[0].position + 1 : 0;

    // Add track to playlist
    const { error } = await supabase.from("playlist_tracks").insert({
      playlist_id: playlistId,
      track_id: trackId,
      position: nextPosition,
    });

    if (error) {
      if (error.code === "23505") {
        await answerCallbackQuery(queryId, "⚠️ Трек уже в этом плейлисте");
      } else {
        console.error("Error adding to playlist:", error);
        await answerCallbackQuery(queryId, "❌ Ошибка добавления");
      }
      return;
    }

    await answerCallbackQuery(queryId, "✅ Трек добавлен в плейлист!");
  } catch (error) {
    console.error("Error in playlist add:", error);
    await answerCallbackQuery(queryId, "❌ Ошибка");
  }
}

export async function handlePlaylistNew(chatId: number, trackId: string, messageId?: number) {
  const message = `➕ *Создание плейлиста*\n\n` + `Для создания плейлиста откройте приложение:`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "📱 Открыть приложение",
          url: `https://t.me/${BOT_CONFIG.botUsername}/app?startapp=new_playlist_${trackId}`,
        },
      ],
      [{ text: "⬅️ Назад", callback_data: `add_playlist_${trackId}` }],
    ],
  };

  if (messageId) {
    await editMessageText(chatId, messageId, message, keyboard);
  } else {
    await sendMessage(chatId, message, keyboard);
  }
}
