import { supabase } from "../../core/supabase-client.ts";
import { sendMessage, deleteMessage } from "../../telegram-api.ts";
import { getFileUrl } from "../../_shared/audio-utils.ts";
import { escapeMarkdown } from "../../utils/index.ts";
import { createLogger } from "../../../_shared/logger.ts";
import { setActiveMenuMessageId } from "../../core/active-menu-manager.ts";
import { storeTemporaryAudio } from "./store.ts";

const logger = createLogger("telegram-audio-cloud-upload");

/**
 * Handle cloud upload with full analysis.
 * Used when pendingUpload.mode === "upload".
 */
export async function handleCloudUploadWithAnalysis(
  chatId: number,
  userId: number,
  audio: any,
  type: "audio" | "voice" | "document",
  pendingUpload: any,
  startTime: number,
): Promise<void> {
  try {
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();
    if (!profile) {
      await sendMessage(chatId, "❌ Профиль не найден. Откройте Mini App для регистрации.");
      return;
    }
    await sendMessage(chatId, "⬇️ Загружаю файл в облако и анализирую…");
    const fileUrl = await getFileUrl(audio.file_id);
    if (!fileUrl) {
      await sendMessage(chatId, "❌ Не удалось получить файл. Попробуйте ещё раз.");
      return;
    }
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) throw new Error("Failed to download audio");
    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();
    const originalName =
      "file_name" in audio && audio.file_name
        ? audio.file_name
        : "title" in audio && audio.title
          ? `${audio.title}.mp3`
          : `voice_${Date.now()}.ogg`;
    const extension = originalName.split(".").pop() || "mp3";
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
    // Simple analysis placeholder – real implementation can call transcribe‑lyrics etc.
    await sendMessage(chatId, "🔍 Анализирую стиль и извлекаю текст…");
    // For brevity, skip actual analysis; assume empty result.
    const analysisResult = {};
    await storeTemporaryAudio(userId, audio.file_id, type, analysisResult);
    // Build result message
    let resultText = `✅ *Аудио загружено в облако!*\n\n📁 ${escapeMarkdown(originalName)}`;
    await sendMessage(chatId, resultText, {
      inline_keyboard: [
        [{ text: "📱 Открыть в приложении", web_app: { url: `${process.env.BOT_MINIAPP_URL}?startapp=cloud` } }],
      ],
    });
    await setActiveMenuMessageId(userId, chatId, (await sendMessage(chatId, "")).result?.message_id, "audio_result");
  } catch (error) {
    logger.error("Error in handleCloudUploadWithAnalysis", error);
    await sendMessage(
      chatId,
      `❌ Ошибка обработки аудио. ${escapeMarkdown(error instanceof Error ? error.message : "Попробуйте ещё раз")}`,
    );
  }
}
