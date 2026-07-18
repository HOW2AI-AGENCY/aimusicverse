import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { getTelegramConfig, getTrackDeepLink, getBotMention } from "../_shared/telegram-config.ts";
import { escapeMarkdown } from "../_shared/telegram-utils.ts";
import { createLogger } from "../_shared/logger.ts";
import { authorize } from "../_shared/auth.ts";
import type { NotificationPayload } from "./types.ts";
import {
  sendTelegramMessage,
  editTelegramMessage,
  deleteTelegramMessage,
  sendTelegramAudio,
  sendTelegramVideo,
  sendTelegramDocument,
} from "./utils/telegram-api.ts";
import { canSendNotification, getChatIdForUser } from "./utils/settings.ts";

// Get bot mention once at module level
const BOT_MENTION = getBotMention();

const logger = createLogger("send-telegram-notification");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // HIGH-1 FIX: require service-role token or authenticated user.
  // authorize() already returns ok:true for a service-role call, so !auth.ok
  // covers both "not a service call" and "not an authenticated user".
  const auth = await authorize(req, { requireAdmin: false });
  if (!auth.ok) {
    logger.warn("Unauthorized attempt to send notification", { status: 401 });
    return new Response(JSON.stringify({ success: false, error: "Unauthorized — internal use only" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const {
      chat_id,
      chatId,
      user_id,
      status,
      track_id,
      trackId,
      type,
      error_message,
      audioUrl,
      coverUrl,
      videoUrl,
      title,
      duration,
      tags,
      style,
      versionsCount,
      versionLabel,
      currentVersion,
      totalVersions,
      generationMode,
      audioClips,
    } = payload;

    const supabase = getSupabaseClient();

    // Determine chat_id
    let finalChatId = chat_id || chatId;

    // If no chat_id provided but user_id is, look up chat_id
    if (!finalChatId && user_id) {
      finalChatId = (await getChatIdForUser(supabase, user_id)) || undefined;
    }

    const finalTrackId = track_id || trackId;

    if (!finalChatId) {
      logger.warn("No chat_id available for notification");
      return new Response(JSON.stringify({ success: false, error: "No chat_id available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user wants this type of notification
    const notificationType = type || status || "general";
    const canSend = await canSendNotification(supabase, user_id, finalChatId, notificationType);

    if (!canSend) {
      logger.info("Notification blocked by user settings", { chatId: finalChatId, type: notificationType });
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "user_settings" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const telegramConfig = getTelegramConfig();
    const miniAppUrl = telegramConfig.miniAppUrl;
    const botDeepLink = telegramConfig.deepLinkBase;

    // Handle delete_progress - remove progress message before sending results
    if (type === "delete_progress" && payload.messageId) {
      logger.info("Deleting progress message", { messageId: payload.messageId });
      await deleteTelegramMessage(finalChatId, payload.messageId);
      return new Response(JSON.stringify({ success: true, type: "delete_progress" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle progress_update - edit existing progress message
    if (type === "progress_update" && payload.messageId) {
      const progressTitle = escapeMarkdown(title || "Генерация");
      const progressText = payload.message ? escapeMarkdown(payload.message) : "⏳ Обрабатываем\\.\\.\\.";
      const progressPercent = payload.progress || 50;

      const progressBar =
        "▓".repeat(Math.floor(progressPercent / 10)) + "░".repeat(10 - Math.floor(progressPercent / 10));
      const message = `🎵 *${progressTitle}*\n\n${progressBar} ${progressPercent}%\n${progressText}\n\n🤖 _${BOT_MENTION}_`;

      logger.info("Updating progress message", { messageId: payload.messageId, progress: progressPercent });
      await editTelegramMessage(finalChatId, payload.messageId, message);

      return new Response(JSON.stringify({ success: true, type: "progress_update" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle error_update - edit progress message to show error
    if (type === "error_update" && payload.messageId) {
      const escapedError = escapeMarkdown(payload.error_message || "Произошла ошибка");
      const message = `❌ *Ошибка генерации*\n\n${escapedError}\n\n💡 Попробуйте позже или измените параметры\n\n🤖 _${BOT_MENTION}_`;

      logger.info("Updating progress message with error", { messageId: payload.messageId });
      await editTelegramMessage(finalChatId, payload.messageId, message, {
        inline_keyboard: [
          [{ text: "🔄 Попробовать снова", callback_data: "generate" }],
          [{ text: "🏠 Меню", callback_data: "open_main_menu" }],
        ],
      });

      return new Response(JSON.stringify({ success: true, type: "error_update" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle progress notification (new message)
    if (type === "progress") {
      const progressTitle = escapeMarkdown(title || "Генерация");
      const progressText = payload.message ? escapeMarkdown(payload.message) : "⏳ Обрабатываем\\.\\.\\.";
      const progressPercent = payload.progress || 50;

      const progressBar =
        "▓".repeat(Math.floor(progressPercent / 10)) + "░".repeat(10 - Math.floor(progressPercent / 10));
      const message = `🎵 *${progressTitle}*\n\n${progressBar} ${progressPercent}%\n${progressText}\n\n🤖 _${BOT_MENTION}_`;

      const result = await sendTelegramMessage(finalChatId, message);

      return new Response(JSON.stringify({ success: true, type: "progress", messageId: result.result?.message_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle multi-version generation complete (both A and B in sequence)
    if (type === "generation_complete_multi" && audioClips && audioClips.length > 0) {
      logger.info("Sending multi-version notification", { clipsCount: audioClips.length });

      // Helper to format duration
      const formatDuration = (d?: number) =>
        d ? `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, "0")}` : "";

      // Send each audio with consistent format
      for (let i = 0; i < audioClips.length; i++) {
        const clip = audioClips[i];
        const isLast = i === audioClips.length - 1;
        const durationFormatted = formatDuration(clip.duration);

        // Lyrics preview (2 lines max, clean tags)
        let lyricsText = "";
        if (clip.lyricsPreview) {
          const cleanLyrics = clip.lyricsPreview
            .split("\n")
            .filter((line) => !line.trim().startsWith("["))
            .slice(0, 2)
            .join("\n")
            .trim();
          if (cleanLyrics) {
            lyricsText = `\n\n📝 _${escapeMarkdown(cleanLyrics)}${clip.lyricsPreview.length > cleanLyrics.length ? "\\.\\.\\." : ""}_`;
          }
        }

        // Build caption with metadata
        const trackTitle = escapeMarkdown(title || "Новый трек");
        const styleText = style ? escapeMarkdown(style.split(",")[0].trim()) : "";

        const caption = `🎵 *${trackTitle}* — ${clip.versionLabel}\n${styleText ? `🎸 ${styleText} • ` : ""}⏱️ ${durationFormatted}${lyricsText}\n\n🤖 _${BOT_MENTION}_`;

        // Use clip-specific cover or fallback to main cover
        const clipCoverUrl = clip.coverUrl || coverUrl;

        const audioResult = await sendTelegramAudio(finalChatId, clip.audioUrl, {
          caption,
          title: `${title || "Трек"} (${clip.versionLabel})`,
          performer: "MusicVerse AI",
          duration: clip.duration ? Math.round(clip.duration) : undefined,
          coverUrl: clipCoverUrl, // Cover on EVERY version
          replyMarkup: isLast
            ? {
                inline_keyboard: [
                  [{ text: "▶️ Открыть трек", url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
                  [
                    { text: "🔄 Создать ещё", callback_data: "generate" },
                    { text: "🏠 Меню", callback_data: "open_main_menu" },
                  ],
                ],
              }
            : undefined,
        });

        if (!audioResult.ok) {
          logger.error("Failed to send audio", null, { versionLabel: clip.versionLabel, result: audioResult });
        } else {
          logger.success("Audio sent", { versionLabel: clip.versionLabel });
        }

        // Small delay between messages
        if (!isLast) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      return new Response(JSON.stringify({ success: true, type: "generation_complete_multi" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle generation complete with direct data (single version)
    if (type === "generation_complete" && audioUrl) {
      logger.info("Sending generation complete notification");

      const formatDuration = (d?: number) =>
        d ? `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, "0")}` : "";

      const durationFormatted = formatDuration(duration);

      // Mode-specific emoji
      const modeEmoji =
        generationMode === "upload_cover"
          ? "🎤"
          : generationMode === "upload_extend"
            ? "⏩"
            : generationMode === "add_vocals"
              ? "🎙️"
              : generationMode === "add_instrumental"
                ? "🎸"
                : "🎵";

      const trackTitle = escapeMarkdown(title || "Новый трек");
      const styleText = style ? escapeMarkdown(style.split(",")[0].trim()) : "";
      const versionInfo = versionLabel ? ` — ${versionLabel}` : "";

      const caption = `${modeEmoji} *${trackTitle}*${versionInfo}\n${styleText ? `🎸 ${styleText} • ` : ""}⏱️ ${durationFormatted}\n\n🤖 _${BOT_MENTION}_`;

      await sendTelegramAudio(finalChatId, audioUrl, {
        caption,
        title: title || "AI Music Track",
        performer: "MusicVerse AI",
        duration: duration ? Math.round(duration) : undefined,
        coverUrl: coverUrl,
        replyMarkup: {
          inline_keyboard: [
            [{ text: "▶️ Открыть трек", url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
            [
              { text: "🔄 Создать ещё", callback_data: "generate" },
              { text: "🏠 Меню", callback_data: "open_main_menu" },
            ],
          ],
        },
      });

      return new Response(JSON.stringify({ success: true, type: "generation_complete" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle video ready notification
    if ((type === "video_ready" || type === "video_share") && (videoUrl || finalTrackId)) {
      logger.info("Processing video notification", { type });

      let trackData = null;
      let finalVideoUrl = videoUrl;

      // Fetch track data if we have trackId
      if (finalTrackId) {
        const { data: track } = await supabase
          .from("tracks")
          .select("title, style, cover_url, video_url, local_video_url")
          .eq("id", finalTrackId)
          .single();
        trackData = track;

        // Use track video if no videoUrl provided
        if (!finalVideoUrl && track) {
          finalVideoUrl = track.local_video_url || track.video_url;
        }
      }

      if (finalVideoUrl) {
        const trackTitle = escapeMarkdown(title || trackData?.title || "Видео клип");
        const trackStyle = trackData?.style ? escapeMarkdown(trackData.style.split(",")[0]) : "";

        const caption = `🎬 *${trackTitle}*${trackStyle ? `\n🎸 ${trackStyle}` : ""}\n\n🤖 _${BOT_MENTION}_`;

        await sendTelegramVideo(finalChatId, finalVideoUrl, {
          caption,
          title: title || trackData?.title || "Video Clip",
          coverUrl: trackData?.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: "▶️ Открыть трек", url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
              [
                { text: "🔄 Создать ещё", callback_data: "generate" },
                { text: "🏠 Меню", callback_data: "open_main_menu" },
              ],
            ],
          },
        });

        return new Response(JSON.stringify({ success: true, type: type }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle section_replaced notification - send audio file with replaced section
    if (type === "section_replaced" && audioUrl && finalTrackId) {
      logger.info("Processing section_replaced notification", { trackId: finalTrackId });

      const trackTitle = escapeMarkdown(title || "Секция заменена");
      const versionText = versionLabel ? escapeMarkdown(` (версия ${versionLabel})`) : "";

      const caption = `✂️ *${trackTitle}*${versionText}\n\n🎵 Секция трека успешно заменена\\!\n\n🤖 _${BOT_MENTION}_`;

      await sendTelegramAudio(finalChatId, audioUrl, {
        caption,
        title: `${title || "Секция"} - ${versionLabel || "New"}`,
        performer: "MusicVerse Studio",
        coverUrl: coverUrl,
        replyMarkup: {
          inline_keyboard: [
            [{ text: "🎛️ Открыть в студии", url: `${botDeepLink}?startapp=studio_${finalTrackId}` }],
            [
              { text: "✅ Применить", callback_data: `apply_version_${finalTrackId}` },
              { text: "❌ Отклонить", callback_data: `discard_version_${finalTrackId}` },
            ],
            [{ text: "🏠 Меню", callback_data: "open_main_menu" }],
          ],
        },
      });

      return new Response(JSON.stringify({ success: true, type: "section_replaced" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle stems_complete notification - ONE consolidated message for all stems
    if (type === "stems_complete" && payload.stems && payload.stems.length > 0) {
      logger.info("Processing stems_complete notification", {
        trackId: finalTrackId,
        stemsCount: payload.stems.length,
      });

      const trackTitle = escapeMarkdown(payload.trackTitle || "Трек");
      const stemsCount = payload.stemsCount || payload.stems.length;
      const stemsList = payload.stems.map((s: { type: string; label: string }) => `• ${s.label}`).join("\n");

      const caption = `🎛️ *Стемы готовы\\!*\n\n🎵 *${trackTitle}*\n\nРазделено на ${stemsCount} дорожек:\n${escapeMarkdown(stemsList)}\n\n🤖 _${BOT_MENTION}_`;

      await sendTelegramMessage(finalChatId, caption, {
        inline_keyboard: [
          [{ text: "🎛️ Открыть в студии", url: `${botDeepLink}?startapp=studio_${finalTrackId}` }],
          [{ text: "📥 Скачать все стемы", callback_data: `download_stems_${finalTrackId}` }],
          [{ text: "🏠 Меню", callback_data: "open_main_menu" }],
        ],
      });

      return new Response(JSON.stringify({ success: true, type: "stems_complete" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle stem_ready notification - send audio file with stem (single stem)
    if (type === "stem_ready" && audioUrl && finalTrackId) {
      logger.info("Processing stem_ready notification", { trackId: finalTrackId });

      const stemTitle = escapeMarkdown(title || "Стем");

      const caption = `🎛️ *${stemTitle}*\n\n✨ Стем готов для использования\\!\n\n🤖 _${BOT_MENTION}_`;

      await sendTelegramAudio(finalChatId, audioUrl, {
        caption,
        title: title || "Stem",
        performer: "MusicVerse Studio",
        coverUrl: coverUrl,
        replyMarkup: {
          inline_keyboard: [
            [{ text: "🎛️ Открыть в студии", url: `${botDeepLink}?startapp=studio_${finalTrackId}` }],
            [{ text: "📥 Скачать все стемы", callback_data: `download_stems_${finalTrackId}` }],
            [{ text: "🏠 Меню", callback_data: "open_main_menu" }],
          ],
        },
      });

      return new Response(JSON.stringify({ success: true, type: "stem_ready" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle track share type
    if (type === "track_share" && finalTrackId) {
      logger.info("Processing track_share", { trackId: finalTrackId });

      const { data: track, error: trackError } = await supabase
        .from("tracks")
        .select("*")
        .eq("id", finalTrackId)
        .single();

      if (trackError) {
        logger.error("Error fetching track", trackError);
        return new Response(JSON.stringify({ success: false, error: "Track not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (track?.audio_url) {
        const formatDuration = (d?: number) =>
          d ? `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, "0")}` : "";

        const durationFormatted = formatDuration(track.duration_seconds);
        const trackTitle = escapeMarkdown(track.title || "Новый трек");
        const styleText = track.style ? escapeMarkdown(track.style.split(",")[0]) : "";

        const caption = `🎵 *${trackTitle}*\n${styleText ? `🎸 ${styleText} • ` : ""}⏱️ ${durationFormatted}\n\n🤖 _${BOT_MENTION}_`;

        await sendTelegramAudio(finalChatId, track.audio_url, {
          caption,
          title: track.title || "MusicVerse Track",
          performer: "MusicVerse AI",
          duration: track.duration_seconds || undefined,
          coverUrl: track.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: "▶️ Открыть трек", url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
              [
                { text: "🔄 Создать ещё", callback_data: "generate" },
                { text: "🏠 Меню", callback_data: "open_main_menu" },
              ],
            ],
          },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle document share (MIDI, PDF, GP5, etc.)
    if (type === "document_share") {
      const { document_url, document_type, filename, track_title } = payload as any;

      if (!document_url) {
        return new Response(JSON.stringify({ success: false, error: "document_url required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      logger.info("Processing document_share", { document_type, filename });

      const docTypeLabels: Record<string, string> = {
        midi: "🎹 MIDI",
        pdf: "📄 PDF Ноты",
        gp5: "🎸 Guitar Pro",
        mxml: "🎼 MusicXML",
      };

      const typeLabel = docTypeLabels[document_type] || "📎 Файл";
      const trackName = escapeMarkdown(track_title || "Трек");
      const caption = `${typeLabel}\n🎵 *${trackName}*\n\n🤖 _${BOT_MENTION}_`;

      await sendTelegramDocument(finalChatId, document_url, {
        caption,
        filename: filename || `transcription.${document_type || "file"}`,
        replyMarkup: {
          inline_keyboard: [[{ text: "🏠 Меню", callback_data: "open_main_menu" }]],
        },
      });

      return new Response(JSON.stringify({ success: true, type: "document_share" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle completed status
    if (status === "completed" && finalTrackId) {
      const { data: track } = await supabase.from("tracks").select("*").eq("id", finalTrackId).single();

      if (track?.audio_url) {
        const formatDuration = (d?: number) =>
          d ? `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, "0")}` : "";

        const durationFormatted = formatDuration(track.duration_seconds);
        const trackTitle = escapeMarkdown(track?.title || "Новый трек");
        const styleText = track?.style ? escapeMarkdown(track.style.split(",")[0]) : "";

        // Lyrics preview (2 lines, no tags)
        let lyricsText = "";
        if (track.lyrics) {
          const cleanLyrics = track.lyrics
            .split("\n")
            .filter((line: string) => !line.trim().startsWith("["))
            .slice(0, 2)
            .join("\n")
            .trim();
          if (cleanLyrics) {
            lyricsText = `\n\n📝 _${escapeMarkdown(cleanLyrics.substring(0, 100))}${cleanLyrics.length > 100 ? "\\.\\.\\." : ""}_`;
          }
        }

        const caption = `🎵 *${trackTitle}*\n${styleText ? `🎸 ${styleText} • ` : ""}⏱️ ${durationFormatted}${lyricsText}\n\n🤖 _${BOT_MENTION}_`;

        await sendTelegramAudio(finalChatId, track.audio_url, {
          caption,
          title: track.title || "MusicVerse Track",
          performer: "MusicVerse AI",
          duration: track.duration_seconds,
          coverUrl: track.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: "▶️ Открыть трек", url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
              [
                { text: "🔄 Создать ещё", callback_data: "generate" },
                { text: "🏠 Меню", callback_data: "open_main_menu" },
              ],
            ],
          },
        });
      } else {
        const trackTitle = escapeMarkdown(track?.title || "Новый трек");
        const trackStyle = track?.style ? escapeMarkdown(track.style) : "";
        const message = `🎵 *${trackTitle}*${trackStyle ? `\n🎸 ${trackStyle}` : ""}\n\n🤖 _${BOT_MENTION}_`;

        await sendTelegramMessage(finalChatId, message, {
          inline_keyboard: [
            [{ text: "▶️ Открыть трек", url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
            [
              { text: "🔄 Создать ещё", callback_data: "generate" },
              { text: "🏠 Меню", callback_data: "open_main_menu" },
            ],
          ],
        });
      }
    } else if (status === "failed") {
      const escapedErrorMessage = escapeMarkdown(error_message || "Произошла ошибка при генерации");
      const message = `😔 *Не удалось создать трек*\n\n${escapedErrorMessage}\n\n💡 *Попробуйте:*\n• Упростить описание\n• Изменить стиль\n• Попробовать через минуту`;

      await sendTelegramMessage(finalChatId, message, {
        inline_keyboard: [
          [{ text: "🔄 Попробовать снова", callback_data: "generate" }],
          [
            { text: "❓ Помощь", callback_data: "help" },
            { text: "⬅️ Главное меню", callback_data: "main_menu" },
          ],
        ],
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Error sending notification", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
