/**
 * Legacy auto‑upload pipeline (telegram‑bot)
 * Extracted from original audio.ts to reduce file size.
 * Retains full functionality for pendingUpload.mode === "cover" | "extend".
 */

import { supabase } from "../../core/supabase-client.ts";
import { sendMessage, deleteMessage } from "../../telegram-api.ts";
import { getFileUrl } from "../../_shared/audio-utils.ts";
import { escapeMarkdown, trackMetric } from "../../utils/index.ts";
import { createLogger } from "../../../_shared/logger.ts";
import { setActiveMenuMessageId } from "../../core/active-menu-manager.ts";
import { storeTemporaryAudio } from "./store.ts";

const logger = createLogger("telegram-audio-auto-upload");

/**
 * Auto‑upload with full processing pipeline.
 * Called when pendingUpload.mode is "cover" or "extend".
 */
export async function handleAutoUploadWithPipeline(
  chatId: number,
  userId: number,
  audio: any,
  type: "audio" | "voice" | "document",
  startTime: number,
): Promise<void> {
  let progressMessageId: number | undefined;
  try {
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();
    if (!profile) {
      await sendMessage(chatId, "❌ Профиль не найден. Откройте Mini App для регистрации.");
      return;
    }

    // Prepare filename
    const originalName =
      "file_name" in audio && audio.file_name
        ? audio.file_name
        : "title" in audio && audio.title
          ? `${audio.title}.mp3`
          : type === "voice"
            ? `voice_${Date.now()}.ogg`
            : `audio_${Date.now()}.mp3`;

    const fileUrl = await getFileUrl(audio.file_id);
    if (!fileUrl) {
      await sendMessage(chatId, "❌ Не удалось получить файл. Попробуйте ещё раз.");
      return;
    }

    // Download
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) throw new Error("Failed to download audio");
    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();

    // Upload to storage
    const extension = originalName.split(".").pop()?.toLowerCase() || "mp3";
    const sanitizedName = `audio_${Date.now()}.${extension}`;
    const storagePath = `${profile.user_id}/reference-audio/${sanitizedName}`;
    const { error: uploadError } = await supabase.storage
      .from("reference-audio")
      .upload(storagePath, new Uint8Array(audioBuffer), {
        contentType: audioBlob.type || "audio/mpeg",
        upsert: false,
      });
    if (uploadError) {
      logger.error("Cloud upload error", uploadError);
      await sendMessage(chatId, "❌ Ошибка загрузки файла. Попробуйте позже.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("reference-audio").getPublicUrl(storagePath);

    // Invoke processing function (pipeline defined elsewhere)
    const { data: pipelineResult, error: pipelineError } = await supabase.functions.invoke("process-audio-pipeline", {
      body: {
        audio_url: publicUrl,
        user_id: profile.user_id,
        file_name: originalName,
        source: "telegram_auto",
        telegram_chat_id: chatId,
        telegram_file_id: audio.file_id,
      },
    });
    if (pipelineError) throw pipelineError;

    // Store temporary reference for later actions
    await storeTemporaryAudio(userId, audio.file_id, type, {
      style: pipelineResult?.analysis?.style_prompt,
      genre: pipelineResult?.analysis?.genre,
      mood: pipelineResult?.analysis?.mood,
      lyrics: pipelineResult?.lyrics,
      hasVocals: pipelineResult?.analysis?.has_vocals,
    });

    // Cleanup progress message if any
    if (progressMessageId) {
      try {
        await deleteMessage(chatId, progressMessageId);
      } catch {}
    }

    // Build final result message
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    const analysis = pipelineResult?.analysis || {};
    let resultText = `✅ *Аудио сохранено и проанализировано!*
\n📁 ${escapeMarkdown(originalName)}\n⏱ Время обработки: ${processingTime} сек`;
    if (analysis.has_vocals && analysis.has_instrumental) resultText += "\n🎤 Тип: Вокал + Инструментал";
    else if (analysis.has_vocals) resultText += "\n🎤 Тип: Вокал";
    else resultText += "\n🎸 Тип: Инструментал";
    // Add simple analysis blockquote
    const lines: string[] = [];
    if (analysis.genre) lines.push(`🎵 Жанр: ${analysis.genre}`);
    if (analysis.mood) lines.push(`💫 Настроение: ${analysis.mood}`);
    if (analysis.bpm_estimate) lines.push(`🥁 BPM: ${analysis.bpm_estimate}`);
    if (analysis.energy) lines.push(`⚡ Энергия: ${analysis.energy}`);
    if (analysis.vocal_style && analysis.has_vocals) lines.push(`🎙 Вокал: ${analysis.vocal_style}`);
    if (analysis.instruments?.length) lines.push(`🎹 Инструменты: ${analysis.instruments.slice(0, 5).join(", ")}`);
    if (lines.length) {
      resultText += "\n\n" + lines.map((l) => `>${escapeMarkdown(l)}`).join("\n");
    }
    if (pipelineResult?.lyrics) {
      const preview = pipelineResult.lyrics.substring(0, 100);
      resultText += `\n\n📝 *Текст:*\n_${escapeMarkdown(preview)}${pipelineResult.lyrics.length > 100 ? "..." : ""}_`;
    }

    const resultMsg = await sendMessage(chatId, resultText, {
      inline_keyboard: [
        [{ text: "📱 Открыть в приложении", web_app: { url: `${process.env.BOT_MINIAPP_URL}?startapp=cloud` } }],
      ],
    });
    if (resultMsg?.result?.message_id) {
      await setActiveMenuMessageId(userId, chatId, resultMsg.result.message_id, "audio_result");
    }
    trackMetric({
      eventType: "upload_completed",
      success: true,
      telegramChatId: chatId,
      responseTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    logger.error("Error in auto‑upload pipeline", error);
    if (progressMessageId) {
      try {
        await deleteMessage(chatId, progressMessageId);
      } catch {}
    }
    await sendMessage(
      chatId,
      `❌ Ошибка обработки аудио.\n\n${escapeMarkdown(error instanceof Error ? error.message : "Попробуйте ещё раз")}`,
    );
    trackMetric({
      eventType: "upload_failed",
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}
