/**
 * Process audio upload and call Suno generation API.
 * Extracted from audio.ts — handles quota check, upload to storage, Suno API call,
 * and database record creation for cover/extend modes.
 */

import { supabase } from "../../core/supabase-client.ts";
import { createLogger } from "../../../_shared/logger.ts";
import type { PendingUpload } from "../../core/db-session-store.ts";

const logger = createLogger("telegram-audio-process-upload");

export async function processAudioUpload(
  userId: string,
  pendingUpload: PendingUpload,
  audioFile: { name: string; type: string; data: string },
  telegramChatId: number,
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    // Security: Check user quota before processing
    const { checkAndDeductQuota } = await import("../../utils/quota-checker.ts");
    const operationType = pendingUpload.mode === "cover" ? "upload_cover" : "upload_extend";

    const quotaCheck = await checkAndDeductQuota(userId, operationType, {
      telegramChatId,
      mode: pendingUpload.mode,
    });

    if (!quotaCheck.allowed) {
      logger.warn("Quota check failed", {
        userId,
        reason: quotaCheck.reason,
        balance: quotaCheck.creditsBalance,
      });
      return {
        success: false,
        error: quotaCheck.reason || "Недостаточно кредитов для выполнения операции",
      };
    }

    logger.info("Quota check passed", {
      userId,
      balance: quotaCheck.creditsBalance,
      subscription: quotaCheck.subscriptionTier,
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");

    if (!sunoApiKey) {
      return { success: false, error: "API key not configured" };
    }

    // Upload audio to Supabase Storage
    const fileName = `${userId}/telegram-uploads/${Date.now()}-${audioFile.name}`;
    const base64Data = audioFile.data.split(",")[1];
    const audioBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage.from("project-assets").upload(fileName, audioBuffer, {
      contentType: audioFile.type,
      upsert: false,
    });

    if (uploadError) {
      logger.error("Upload error", uploadError);
      return { success: false, error: "Failed to upload audio file" };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("project-assets").getPublicUrl(fileName);

    logger.info("Audio uploaded", { publicUrl });

    const isExtend = pendingUpload.mode === "extend";
    const endpoint = isExtend
      ? "https://api.sunoapi.org/api/v1/generate/upload-extend"
      : "https://api.sunoapi.org/api/v1/generate/upload-cover";

    const model = pendingUpload.model || "V4_5";
    const apiModel = model === "V4_5ALL" ? "V4_5" : model;

    // Auto-select V5 for bot (best quality, 480s limit) unless user specified a model
    let selectedModel = apiModel;
    if (!pendingUpload.model) {
      selectedModel = "V5";
      logger.info("Auto-selected V5 model for bot upload");
    } else if (apiModel === "V4_5" && model === "V4_5ALL") {
      selectedModel = "V4_5";
    }

    const hasCustomParams = Boolean(pendingUpload.style || pendingUpload.prompt || pendingUpload.title);

    const requestBody: Record<string, unknown> = {
      uploadUrl: publicUrl,
      model: selectedModel,
      callBackUrl: `${supabaseUrl}/functions/v1/suno-music-callback`,
      customMode: hasCustomParams,
    };

    if (hasCustomParams) {
      requestBody.instrumental = pendingUpload.instrumental || false;
      if (pendingUpload.style) requestBody.style = pendingUpload.style;
      if (pendingUpload.title) requestBody.title = pendingUpload.title;
      if (pendingUpload.prompt && !pendingUpload.instrumental) {
        requestBody.prompt = pendingUpload.prompt;
      }
    }

    logger.apiCall("SunoAPI", isExtend ? "upload-extend" : "upload-cover", { model: selectedModel });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sunoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    logger.info("Suno API response", { code: data.code, taskId: data.data?.taskId });

    if (!response.ok || (data.code !== 200 && data.code !== 201)) {
      if (data.code === 429) {
        return { success: false, error: "Недостаточно кредитов на API" };
      }
      if (data.code === 430) {
        return { success: false, error: "Слишком частые запросы, попробуйте позже" };
      }
      return { success: false, error: data.msg || "API error" };
    }

    const taskId = data.data?.taskId;

    if (!taskId) {
      return { success: false, error: "No task ID received" };
    }

    // Create generation task in database
    const generationMode = isExtend ? "upload_extend" : "upload_cover";

    const { error: taskError } = await supabase.from("generation_tasks").insert({
      user_id: userId,
      prompt: pendingUpload.prompt || pendingUpload.style || `Audio ${pendingUpload.mode}`,
      status: "pending",
      suno_task_id: taskId,
      generation_mode: generationMode,
      model_used: model,
      source: "telegram_bot",
      telegram_chat_id: telegramChatId,
    });

    if (taskError) {
      logger.error("Error creating task", taskError);
    }

    // Create placeholder track
    const { error: trackError } = await supabase.from("tracks").insert({
      user_id: userId,
      prompt: pendingUpload.prompt || pendingUpload.style || `Audio ${pendingUpload.mode}`,
      status: "pending",
      suno_task_id: taskId,
      suno_model: model,
      generation_mode: generationMode,
      title: pendingUpload.title || (isExtend ? "Extended Audio" : "Cover Version"),
      style: pendingUpload.style,
      has_vocals: !pendingUpload.instrumental,
      provider: "suno",
    });

    if (trackError) {
      logger.error("Error creating track", trackError);
    }

    logger.success(`${pendingUpload.mode} generation started`, { taskId });
    return { success: true, taskId };
  } catch (error) {
    logger.error("Error in processAudioUpload", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
    };
  }
}
