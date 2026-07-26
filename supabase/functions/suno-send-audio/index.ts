import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { getTelegramConfig } from "../_shared/telegram-config.ts";
import { buildTelegramMetadata, formatDuration } from "../_shared/telegram-metadata.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const {
      chatId,
      trackId,
      audioUrl,
      coverUrl,
      title,
      duration,
      status,
      errorMessage,
      versionLabel,
      artistName,
      creatorDisplayName,
      creatorUsername,
      style,
      mode,
      hasVocals,
    } = await req.json();

    if (!chatId) {
      throw new Error("chatId is required");
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

    if (status === "failed") {
      await fetch(`${telegramApiUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          chat_id: chatId,
          text: `❌ Ошибка генерации трека\n\n${errorMessage || "Неизвестная ошибка"}`,
          reply_markup: {
            inline_keyboard: [[{ text: "🔄 Попробовать ещё", callback_data: "generate_retry" }]],
          },
        }),
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!audioUrl) {
      throw new Error("audioUrl is required for successful generation");
    }

    const telegramConfig = getTelegramConfig();
    const botDeepLink = telegramConfig.deepLinkBase;

    // Build proper metadata using the new utility
    const metadata = buildTelegramMetadata({
      title: title || "Новый трек",
      artistName,
      creatorDisplayName,
      creatorUsername,
      durationSeconds: duration,
      style,
      versionLabel,
      mode: mode as any,
      hasVocals,
      trackId,
    });

    const trackTitle = title || "Новый трек";
    const filename = metadata.filename;

    console.log(`📤 Sending audio to Telegram: ${trackTitle}`);
    console.log(`📎 Audio URL: ${audioUrl.substring(0, 100)}...`);

    // Download audio file as blob for proper title display
    let audioBlob: Blob | null = null;
    try {
      console.log("⬇️ Downloading audio file...");
      const audioResponse = await fetch(audioUrl, { signal: controller.signal });
      if (audioResponse.ok) {
        audioBlob = await audioResponse.blob();
        console.log(`✅ Audio downloaded: ${audioBlob.size} bytes`);
      } else {
        console.warn(`⚠️ Failed to download audio: ${audioResponse.status}`);
      }
    } catch (downloadError) {
      console.warn("⚠️ Audio download error:", downloadError);
    }

    // Download thumbnail if available
    let thumbBlob: Blob | null = null;
    if (coverUrl) {
      try {
        const thumbResponse = await fetch(coverUrl, { signal: controller.signal });
        if (thumbResponse.ok) {
          thumbBlob = await thumbResponse.blob();
          console.log(`✅ Thumbnail downloaded: ${thumbBlob.size} bytes`);
        }
      } catch (thumbError) {
        console.warn("⚠️ Thumbnail download error:", thumbError);
      }
    }

    // Use the built caption from metadata
    const caption = metadata.caption;

    let response: Response;
    let result: any;

    // Unified inline keyboard
    const replyMarkup = {
      inline_keyboard: [
        [{ text: "▶️ Открыть трек", url: `${botDeepLink}?startapp=track_${trackId}` }],
        [
          { text: "🔄 Создать ещё", callback_data: "generate_new" },
          { text: "🏠 Меню", callback_data: "main_menu" },
        ],
      ],
    };

    // Use FormData for proper title display in Telegram
    if (audioBlob) {
      console.log("📦 Sending via FormData (blob)...");
      const formData = new FormData();
      formData.append("chat_id", chatId.toString());
      formData.append("audio", audioBlob, filename);
      formData.append("title", metadata.title);
      formData.append("performer", metadata.performer);
      // Escape caption for MarkdownV2
      const { escapeMarkdown } = await import("../_shared/telegram-utils.ts");
      formData.append("caption", escapeMarkdown(caption));
      formData.append("parse_mode", "MarkdownV2");

      if (duration) {
        formData.append("duration", Math.round(duration).toString());
      }

      if (thumbBlob) {
        formData.append("thumbnail", thumbBlob, "cover.jpg");
      }

      formData.append("reply_markup", JSON.stringify(replyMarkup));

      response = await fetch(`${telegramApiUrl}/sendAudio`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      result = await response.json();
    } else {
      // Fallback: send URL directly (titles may not display correctly)
      console.log("📦 Sending via JSON (URL fallback)...");
      // Escape caption for MarkdownV2
      const { escapeMarkdown } = await import("../_shared/telegram-utils.ts");
      const audioMessage = {
        chat_id: chatId,
        audio: audioUrl,
        caption: escapeMarkdown(caption),
        parse_mode: "MarkdownV2",
        title: metadata.title,
        performer: metadata.performer,
        duration: duration ? Math.round(duration) : undefined,
        thumbnail: coverUrl || undefined,
        reply_markup: replyMarkup,
      };

      response = await fetch(`${telegramApiUrl}/sendAudio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(audioMessage),
      });
      result = await response.json();
    }

    if (!response.ok) {
      console.error("❌ Telegram API error:", result);
      throw new Error(`Telegram API error: ${result.description || "Unknown error"}`);
    }

    // Cache file_id for future use
    if (result.result?.audio?.file_id && trackId) {
      try {
        const supabase = getSupabaseClient();

        await supabase.from("tracks").update({ telegram_file_id: result.result.audio.file_id }).eq("id", trackId);

        console.log("✅ Cached telegram_file_id");
      } catch (cacheError) {
        console.warn("⚠️ Failed to cache file_id:", cacheError);
      }
    }

    console.log("✅ Audio sent successfully to Telegram");
    clearTimeout(timeout);

    return new Response(JSON.stringify({ success: true, file_id: result.result?.audio?.file_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("❌ Error in suno-send-audio:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
