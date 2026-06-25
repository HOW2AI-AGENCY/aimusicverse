/**
 * Artist handlers for Telegram bot
 */

import { sendMessage, editMessageText, answerCallbackQuery, sendPhoto, deleteMessage } from "../telegram-api.ts";
import { getSupabaseClient } from "../core/supabase-client.ts";
import { escapeMarkdownV2 } from "../utils/text-processor.ts";
import { deleteActiveMenu, setActiveMenuMessageId } from "../core/active-menu-manager.ts";
import { BOT_CONFIG } from "../config.ts";

const supabase = getSupabaseClient();

const MINI_APP_URL = BOT_CONFIG.miniAppUrl;

/**
 * Show artists list
 */
export async function handleArtistsCallback(
  chatId: number,
  userId: number,
  messageId: number,
  callbackId: string,
  page: number = 0,
) {
  const pageSize = 8;
  const offset = page * pageSize;

  // Get user_id from profile
  const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

  if (!profile) {
    await answerCallbackQuery(callbackId, "❌ Профиль не найден");
    return;
  }

  // Get user's artists
  const { data: artists, count } = await supabase
    .from("artists")
    .select("id, name, avatar_url, bio, genre_tags, is_public, is_ai_generated", { count: "exact" })
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (!artists || artists.length === 0) {
    const text = `🎤 *Мои артисты*\n\nУ вас пока нет созданных артистов\\.\n\nСоздайте первого AI артиста в приложении\\!`;

    await editMessageText(chatId, messageId, text, {
      inline_keyboard: [
        [{ text: "➕ Создать артиста", url: `${MINI_APP_URL}?startapp=content-hub` }],
        [{ text: "🔙 Назад", callback_data: "nav_main" }],
      ],
    });
    await answerCallbackQuery(callbackId);
    return;
  }

  const totalPages = Math.ceil((count || 0) / pageSize);

  let text = `🎤 *Мои артисты*\n\n`;

  artists.forEach((artist, idx) => {
    const num = offset + idx + 1;
    const publicBadge = artist.is_public ? "🌐" : "🔒";
    const aiBadge = artist.is_ai_generated ? "✨" : "";
    const genres = artist.genre_tags?.slice(0, 2).join(", ") || "";

    text += `${num}\\. ${publicBadge}${aiBadge} *${escapeMarkdownV2(artist.name)}*`;
    if (genres) text += ` \\- _${escapeMarkdownV2(genres)}_`;
    text += "\n";
  });

  if (totalPages > 1) {
    text += `\n📄 Страница ${page + 1} из ${totalPages}`;
  }

  // Build keyboard
  const keyboard: any[][] = [];

  // Artist buttons (2 per row)
  for (let i = 0; i < artists.length; i += 2) {
    const row: any[] = [];
    row.push({
      text: `${offset + i + 1}. ${artists[i].name.substring(0, 15)}`,
      callback_data: `artist_details_${artists[i].id}`,
    });
    if (artists[i + 1]) {
      row.push({
        text: `${offset + i + 2}. ${artists[i + 1].name.substring(0, 15)}`,
        callback_data: `artist_details_${artists[i + 1].id}`,
      });
    }
    keyboard.push(row);
  }

  // Pagination
  if (totalPages > 1) {
    const paginationRow: any[] = [];
    if (page > 0) {
      paginationRow.push({ text: "◀️ Назад", callback_data: `artists_page_${page - 1}` });
    }
    if (page < totalPages - 1) {
      paginationRow.push({ text: "Вперёд ▶️", callback_data: `artists_page_${page + 1}` });
    }
    if (paginationRow.length > 0) keyboard.push(paginationRow);
  }

  // Actions
  keyboard.push([{ text: "➕ Создать артиста", url: `${MINI_APP_URL}?startapp=content-hub` }]);
  keyboard.push([{ text: "🔙 В меню", callback_data: "nav_main" }]);

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}

/**
 * Show artist details
 */
export async function handleArtistDetails(chatId: number, artistId: string, messageId: number, callbackId: string) {
  const { data: artist, error } = await supabase.from("artists").select("*").eq("id", artistId).single();

  if (error || !artist) {
    await answerCallbackQuery(callbackId, "❌ Артист не найден");
    return;
  }

  // Get track count and stats
  const { count: trackCount } = await supabase
    .from("tracks")
    .select("id", { count: "exact", head: true })
    .eq("artist_id", artistId);

  const publicBadge = artist.is_public ? "🌐 Публичный" : "🔒 Приватный";
  const aiBadge = artist.is_ai_generated ? "✨ AI" : "";

  let text = `🎤 *${escapeMarkdownV2(artist.name)}*\n`;
  text += `${publicBadge} ${aiBadge}\n\n`;

  if (artist.bio) {
    text += `📝 _${escapeMarkdownV2(artist.bio)}_\n\n`;
  }

  if (artist.style_description) {
    text += `🎵 *Стиль:* ${escapeMarkdownV2(artist.style_description)}\n\n`;
  }

  if (artist.genre_tags?.length) {
    text += `🏷 *Жанры:* ${artist.genre_tags.map((t: string) => escapeMarkdownV2(t)).join(", ")}\n`;
  }

  if (artist.mood_tags?.length) {
    text += `💫 *Настроение:* ${artist.mood_tags.map((t: string) => escapeMarkdownV2(t)).join(", ")}\n`;
  }

  text += `\n📊 *Треков:* ${trackCount || 0}`;

  const keyboard = [
    [
      { text: "✏️ Редактировать", callback_data: `artist_edit_${artistId}` },
      { text: "🎵 Треки", callback_data: `artist_tracks_${artistId}` },
    ],
    [{ text: "🎤 Создать трек", url: `${MINI_APP_URL}?startapp=generate_artist_${artistId}` }],
    [{ text: "🔙 К списку", callback_data: "nav_artists" }],
  ];

  // Try to send with photo if available
  if (artist.avatar_url) {
    try {
      // Delete old message
      await deleteMessage(chatId, messageId);

      const result = await sendPhoto(chatId, artist.avatar_url, {
        caption: text,
        replyMarkup: { inline_keyboard: keyboard },
      });

      await answerCallbackQuery(callbackId);
      return;
    } catch {
      // Fallback to text message
    }
  }

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}

/**
 * Show artist edit menu
 */
export async function handleArtistEdit(
  chatId: number,
  artistId: string,
  userId: number,
  messageId: number,
  callbackId: string,
) {
  // Verify ownership
  const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

  const { data: artist } = await supabase.from("artists").select("*").eq("id", artistId).single();

  if (!artist) {
    await answerCallbackQuery(callbackId, "❌ Артист не найден");
    return;
  }

  if (artist.user_id !== profile?.user_id) {
    await answerCallbackQuery(callbackId, "❌ Вы не можете редактировать этого артиста");
    return;
  }

  const text =
    `✏️ *Редактирование: ${escapeMarkdownV2(artist.name)}*\n\n` +
    `Для полного редактирования откройте приложение\\.\n` +
    `Быстрые действия доступны ниже:`;

  const keyboard = [
    [{ text: "📝 Редактировать в приложении", url: `${MINI_APP_URL}?startapp=edit_artist_${artistId}` }],
    [
      {
        text: artist.is_public ? "🔒 Сделать приватным" : "🌐 Сделать публичным",
        callback_data: `artist_toggle_public_${artistId}`,
      },
    ],
    [{ text: "🗑 Удалить артиста", callback_data: `artist_delete_confirm_${artistId}` }],
    [{ text: "🔙 Назад", callback_data: `artist_details_${artistId}` }],
  ];

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}

/**
 * Toggle artist public/private
 */
export async function handleArtistTogglePublic(
  chatId: number,
  artistId: string,
  userId: number,
  messageId: number,
  callbackId: string,
) {
  // Verify ownership and check subscription
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, subscription_tier")
    .eq("telegram_id", userId)
    .single();

  const { data: artist } = await supabase.from("artists").select("*").eq("id", artistId).single();

  if (!artist || !profile || artist.user_id !== profile.user_id) {
    await answerCallbackQuery(callbackId, "❌ Нет доступа");
    return;
  }

  // Check if user can make private
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: profile.user_id, _role: "admin" });
  const isPremium = profile.subscription_tier && profile.subscription_tier !== "free";
  const canMakePrivate = isAdmin || isPremium;

  // If trying to make private without permission
  if (artist.is_public && !canMakePrivate) {
    await answerCallbackQuery(callbackId, "❌ Приватные артисты доступны только для подписчиков");
    return;
  }

  // Toggle
  const { error } = await supabase.from("artists").update({ is_public: !artist.is_public }).eq("id", artistId);

  if (error) {
    await answerCallbackQuery(callbackId, "❌ Ошибка обновления");
    return;
  }

  const newStatus = !artist.is_public ? "🌐 Артист теперь публичный" : "🔒 Артист теперь приватный";
  await answerCallbackQuery(callbackId, newStatus);

  // Refresh the edit menu
  await handleArtistEdit(chatId, artistId, userId, messageId, "");
}

/**
 * Confirm delete artist
 */
export async function handleArtistDeleteConfirm(
  chatId: number,
  artistId: string,
  messageId: number,
  callbackId: string,
) {
  const { data: artist } = await supabase.from("artists").select("name").eq("id", artistId).single();

  const text =
    `⚠️ *Удаление артиста*\n\n` +
    `Вы уверены, что хотите удалить артиста *${escapeMarkdownV2(artist?.name || "")}*?\n\n` +
    `Это действие нельзя отменить\\. Треки останутся, но без привязки к артисту\\.`;

  const keyboard = [
    [
      { text: "❌ Отмена", callback_data: `artist_edit_${artistId}` },
      { text: "🗑 Удалить", callback_data: `artist_delete_${artistId}` },
    ],
  ];

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}

/**
 * Delete artist
 */
export async function handleArtistDelete(
  chatId: number,
  artistId: string,
  userId: number,
  messageId: number,
  callbackId: string,
) {
  // Verify ownership
  const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

  const { data: artist } = await supabase.from("artists").select("user_id, name").eq("id", artistId).single();

  if (!artist || artist.user_id !== profile?.user_id) {
    await answerCallbackQuery(callbackId, "❌ Нет доступа");
    return;
  }

  const { error } = await supabase.from("artists").delete().eq("id", artistId);

  if (error) {
    await answerCallbackQuery(callbackId, "❌ Ошибка удаления");
    return;
  }

  await answerCallbackQuery(callbackId, "✅ Артист удалён");

  // Go back to artists list
  await handleArtistsCallback(chatId, userId, messageId, "");
}

/**
 * Show artist tracks
 */
export async function handleArtistTracks(
  chatId: number,
  artistId: string,
  messageId: number,
  callbackId: string,
  page: number = 0,
) {
  const pageSize = 8;
  const offset = page * pageSize;

  const { data: artist } = await supabase.from("artists").select("name").eq("id", artistId).single();

  const { data: tracks, count } = await supabase
    .from("tracks")
    .select("id, title, audio_url, play_count, created_at", { count: "exact" })
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (!tracks || tracks.length === 0) {
    const text = `🎵 *Треки артиста ${escapeMarkdownV2(artist?.name || "")}*\n\nТреков пока нет\\.`;

    await editMessageText(chatId, messageId, text, {
      inline_keyboard: [
        [{ text: "🎤 Создать трек", url: `${MINI_APP_URL}?startapp=generate_artist_${artistId}` }],
        [{ text: "🔙 К артисту", callback_data: `artist_details_${artistId}` }],
      ],
    });
    await answerCallbackQuery(callbackId);
    return;
  }

  const totalPages = Math.ceil((count || 0) / pageSize);

  let text = `🎵 *Треки: ${escapeMarkdownV2(artist?.name || "")}*\n\n`;

  tracks.forEach((track, idx) => {
    const num = offset + idx + 1;
    const plays = track.play_count || 0;
    text += `${num}\\. *${escapeMarkdownV2(track.title || "Без названия")}*`;
    if (plays > 0) text += ` \\(▶️ ${plays}\\)`;
    text += "\n";
  });

  const keyboard: any[][] = [];

  // Track buttons
  for (let i = 0; i < tracks.length; i += 2) {
    const row: any[] = [];
    row.push({ text: `${offset + i + 1}. 🎵`, callback_data: `track_details_${tracks[i].id}` });
    if (tracks[i + 1]) {
      row.push({ text: `${offset + i + 2}. 🎵`, callback_data: `track_details_${tracks[i + 1].id}` });
    }
    keyboard.push(row);
  }

  // Pagination
  if (totalPages > 1) {
    const paginationRow: any[] = [];
    if (page > 0) paginationRow.push({ text: "◀️", callback_data: `artist_tracks_page_${artistId}_${page - 1}` });
    paginationRow.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
    if (page < totalPages - 1)
      paginationRow.push({ text: "▶️", callback_data: `artist_tracks_page_${artistId}_${page + 1}` });
    keyboard.push(paginationRow);
  }

  keyboard.push([{ text: "🔙 К артисту", callback_data: `artist_details_${artistId}` }]);

  await editMessageText(chatId, messageId, text, { inline_keyboard: keyboard });
  await answerCallbackQuery(callbackId);
}
