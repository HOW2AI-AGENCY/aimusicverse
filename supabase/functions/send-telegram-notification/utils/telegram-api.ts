import { createLogger } from "../../_shared/logger.ts";

const logger = createLogger("send-telegram-notification");

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: unknown,
): Promise<{ ok: boolean; skipped?: boolean; reason?: string; result?: any }> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");

  // Validate chat_id
  if (!chatId || chatId <= 0) {
    logger.warn("Invalid chat_id", { chatId });
    return { ok: false, skipped: true, reason: "invalid_chat_id" };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "MarkdownV2",
      reply_markup: replyMarkup,
    }),
  });

  const result = await response.json();

  // Handle "chat not found" gracefully - user may have blocked bot or never started conversation
  if (!result.ok) {
    const errorDesc = result.description || "";
    if (
      errorDesc.includes("chat not found") ||
      errorDesc.includes("bot was blocked") ||
      errorDesc.includes("user is deactivated")
    ) {
      logger.warn("Chat unavailable", { chatId, reason: errorDesc });
      return { ok: false, skipped: true, reason: "chat_unavailable" };
    }
    logger.error("Telegram API error", null, { result });
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  return { ok: true, result };
}

/**
 * Edit an existing Telegram message
 */
export async function editTelegramMessage(
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: unknown,
): Promise<{ ok: boolean; skipped?: boolean; reason?: string }> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");

  if (!chatId || chatId <= 0 || !messageId) {
    logger.warn("Invalid chat_id or message_id for edit", { chatId, messageId });
    return { ok: false, skipped: true, reason: "invalid_ids" };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "MarkdownV2",
      reply_markup: replyMarkup,
    }),
  });

  const result = await response.json();

  if (!result.ok) {
    const errorDesc = result.description || "";
    // Message not modified is OK - content hasn't changed
    if (errorDesc.includes("message is not modified")) {
      return { ok: true };
    }
    if (errorDesc.includes("message to edit not found") || errorDesc.includes("chat not found")) {
      logger.warn("Message not found for edit", { chatId, messageId, reason: errorDesc });
      return { ok: false, skipped: true, reason: "message_not_found" };
    }
    logger.error("Telegram edit error", null, { result });
    return { ok: false, reason: errorDesc };
  }

  return { ok: true };
}

/**
 * Delete a Telegram message
 */
export async function deleteTelegramMessage(
  chatId: number,
  messageId: number,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");

  if (!chatId || chatId <= 0 || !messageId) {
    return { ok: false, skipped: true };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });

    const result = await response.json();
    if (!result.ok) {
      logger.warn("Failed to delete message", { chatId, messageId, error: result.description });
    }
    return { ok: result.ok };
  } catch (e) {
    logger.warn("Delete message error", { error: e });
    return { ok: false };
  }
}

export async function sendTelegramAudio(
  chatId: number,
  audioUrl: string,
  options: {
    caption?: string;
    title?: string;
    performer?: string;
    duration?: number;
    coverUrl?: string;
    replyMarkup?: unknown;
  },
): Promise<{ ok: boolean; skipped?: boolean; reason?: string; result?: any }> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");

  // Validate chat_id
  if (!chatId || chatId <= 0) {
    logger.warn("Invalid chat_id for audio", { chatId });
    return { ok: false, skipped: true, reason: "invalid_chat_id" };
  }

  logger.info("Sending audio to Telegram", { chatId, title: options.title });

  // Download audio file as blob for proper title display in Telegram
  let audioBlob: Blob | null = null;
  try {
    logger.debug("Downloading audio file");
    const audioResponse = await fetch(audioUrl);
    if (audioResponse.ok) {
      audioBlob = await audioResponse.blob();
      logger.debug("Audio downloaded", { size: audioBlob.size });
    } else {
      logger.warn("Failed to download audio", { status: audioResponse.status });
    }
  } catch (downloadError) {
    logger.warn("Audio download error", { error: downloadError });
  }

  // Download thumbnail if available
  let thumbBlob: Blob | null = null;
  if (options.coverUrl) {
    try {
      const thumbResponse = await fetch(options.coverUrl);
      if (thumbResponse.ok) {
        thumbBlob = await thumbResponse.blob();
        logger.debug("Thumbnail downloaded", { size: thumbBlob.size });
      }
    } catch (error) {
      logger.warn("Error downloading cover", { error });
    }
  }

  // Sanitize title for filename
  const sanitizeFilename = (name: string) => {
    return name
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 60);
  };

  const filename = `${sanitizeFilename(options.title || "track")}.mp3`;

  const formData = new FormData();
  formData.append("chat_id", chatId.toString());

  // Use blob if downloaded, otherwise fallback to URL
  if (audioBlob) {
    formData.append("audio", audioBlob, filename);
    logger.debug("Sending via FormData (blob)");
  } else {
    formData.append("audio", audioUrl);
    logger.debug("Sending via FormData (URL fallback)");
  }

  if (options.caption) formData.append("caption", options.caption);
  if (options.title) formData.append("title", options.title);
  if (options.performer) formData.append("performer", options.performer);
  if (options.duration) formData.append("duration", options.duration.toString());
  if (thumbBlob) formData.append("thumbnail", thumbBlob, "cover.jpg");
  formData.append("parse_mode", "MarkdownV2");
  if (options.replyMarkup) formData.append("reply_markup", JSON.stringify(options.replyMarkup));

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  // Handle "chat not found" gracefully
  if (!result.ok) {
    const errorDesc = result.description || "";
    if (
      errorDesc.includes("chat not found") ||
      errorDesc.includes("bot was blocked") ||
      errorDesc.includes("user is deactivated")
    ) {
      logger.warn("Chat unavailable for audio", { chatId, reason: errorDesc });
      return { ok: false, skipped: true, reason: "chat_unavailable" };
    }
    logger.error("Telegram API error for audio", null, { result });
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  logger.success("Audio sent successfully");
  return { ok: true, result };
}

/**
 * Send video to Telegram chat
 */
export async function sendTelegramVideo(
  chatId: number,
  videoUrl: string,
  options: {
    caption?: string;
    title?: string;
    coverUrl?: string;
    replyMarkup?: unknown;
  },
): Promise<{ ok: boolean; skipped?: boolean; reason?: string; result?: any }> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");

  // Validate chat_id
  if (!chatId || chatId <= 0) {
    logger.warn("Invalid chat_id for video", { chatId });
    return { ok: false, skipped: true, reason: "invalid_chat_id" };
  }

  logger.info("Sending video to Telegram", { chatId, title: options.title });

  // Download video file as blob
  let videoBlob: Blob | null = null;
  try {
    logger.debug("Downloading video file");
    const videoResponse = await fetch(videoUrl);
    if (videoResponse.ok) {
      videoBlob = await videoResponse.blob();
      logger.debug("Video downloaded", { size: videoBlob.size });
    } else {
      logger.warn("Failed to download video", { status: videoResponse.status });
    }
  } catch (downloadError) {
    logger.warn("Video download error", { error: downloadError });
  }

  // Download thumbnail if available
  let thumbBlob: Blob | null = null;
  if (options.coverUrl) {
    try {
      const thumbResponse = await fetch(options.coverUrl);
      if (thumbResponse.ok) {
        thumbBlob = await thumbResponse.blob();
        logger.debug("Video thumbnail downloaded", { size: thumbBlob.size });
      }
    } catch (error) {
      logger.warn("Error downloading video cover", { error });
    }
  }

  const sanitizeFilename = (name: string) => {
    return name
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 60);
  };

  const filename = `${sanitizeFilename(options.title || "video")}.mp4`;

  const formData = new FormData();
  formData.append("chat_id", chatId.toString());

  if (videoBlob) {
    formData.append("video", videoBlob, filename);
    logger.debug("Sending video via FormData (blob)");
  } else {
    formData.append("video", videoUrl);
    logger.debug("Sending video via FormData (URL fallback)");
  }

  if (options.caption) formData.append("caption", options.caption);
  if (thumbBlob) formData.append("thumbnail", thumbBlob, "cover.jpg");
  formData.append("parse_mode", "MarkdownV2");
  formData.append("supports_streaming", "true");
  if (options.replyMarkup) formData.append("reply_markup", JSON.stringify(options.replyMarkup));

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  // Handle errors gracefully
  if (!result.ok) {
    const errorDesc = result.description || "";
    if (
      errorDesc.includes("chat not found") ||
      errorDesc.includes("bot was blocked") ||
      errorDesc.includes("user is deactivated")
    ) {
      logger.warn("Chat unavailable for video", { chatId, reason: errorDesc });
      return { ok: false, skipped: true, reason: "chat_unavailable" };
    }
    logger.error("Telegram API error for video", null, { result });
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  logger.success("Video sent successfully");
  return { ok: true, result };
}

/**
 * Send document (MIDI, PDF, etc.) to Telegram chat
 */
export async function sendTelegramDocument(
  chatId: number,
  documentUrl: string,
  options: {
    caption?: string;
    filename?: string;
    replyMarkup?: unknown;
  },
): Promise<{ ok: boolean; skipped?: boolean; reason?: string; result?: any }> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");

  // Validate chat_id
  if (!chatId || chatId <= 0) {
    logger.warn("Invalid chat_id for document", { chatId });
    return { ok: false, skipped: true, reason: "invalid_chat_id" };
  }

  logger.info("Sending document to Telegram", { chatId, filename: options.filename });

  // Download document file as blob
  let documentBlob: Blob | null = null;
  try {
    logger.debug("Downloading document file");
    const docResponse = await fetch(documentUrl);
    if (docResponse.ok) {
      documentBlob = await docResponse.blob();
      logger.debug("Document downloaded", { size: documentBlob.size });
    } else {
      logger.warn("Failed to download document", { status: docResponse.status });
    }
  } catch (downloadError) {
    logger.warn("Document download error", { error: downloadError });
  }

  const sanitizeFilename = (name: string) => {
    return name
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 60);
  };

  const filename = options.filename || "document";

  const formData = new FormData();
  formData.append("chat_id", chatId.toString());

  if (documentBlob) {
    formData.append("document", documentBlob, sanitizeFilename(filename));
    logger.debug("Sending document via FormData (blob)");
  } else {
    formData.append("document", documentUrl);
    logger.debug("Sending document via FormData (URL fallback)");
  }

  if (options.caption) formData.append("caption", options.caption);
  formData.append("parse_mode", "MarkdownV2");
  if (options.replyMarkup) formData.append("reply_markup", JSON.stringify(options.replyMarkup));

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  // Handle errors gracefully
  if (!result.ok) {
    const errorDesc = result.description || "";
    if (
      errorDesc.includes("chat not found") ||
      errorDesc.includes("bot was blocked") ||
      errorDesc.includes("user is deactivated")
    ) {
      logger.warn("Chat unavailable for document", { chatId, reason: errorDesc });
      return { ok: false, skipped: true, reason: "chat_unavailable" };
    }
    logger.error("Telegram API error for document", null, { result });
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  logger.success("Document sent successfully");
  return { ok: true, result };
}
