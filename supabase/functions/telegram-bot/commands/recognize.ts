import { sendMessage, editMessageText } from "../telegram-api.ts";
import { BOT_CONFIG } from "../config.ts";
import { logger } from "../utils/index.ts";

const RECOGNITION_SESSIONS: Record<string, { chatId: number; userId: number; createdAt: number }> = {};

export function getRecognitionHelp(): string {
  return `🎵 *Распознавание музыки*

Отправьте аудио файл, голосовое сообщение или ссылку на аудио, чтобы узнать название трека.

Поддерживаемые форматы:
• MP3, WAV, M4A, OGG
• Голосовые сообщения
• Ссылки на аудио файлы

Как использовать:
1. Отправьте /recognize
2. Запишите голосовое сообщение или отправьте аудио файл
3. Получите информацию о треке

Или сразу: /recognize <ссылка на аудио>`;
}

export async function handleRecognizeCommand(chatId: number, userId: number, args?: string): Promise<void> {
  try {
    // If URL is provided, recognize immediately
    if (args && (args.startsWith("http://") || args.startsWith("https://"))) {
      await recognizeFromUrl(chatId, args);
      return;
    }

    // Start recognition session
    RECOGNITION_SESSIONS[`${userId}`] = {
      chatId,
      userId,
      createdAt: Date.now(),
    };

    await sendMessage(
      chatId,
      `🎵 *Распознавание музыки*

Отправьте:
• 🎤 Голосовое сообщение с музыкой
• 🎵 Аудио файл (MP3, WAV, M4A)
• 🔗 Ссылку на аудио

Я определю название трека и исполнителя!`,
      {
        inline_keyboard: [
          [
            { text: "❌ Отмена", callback_data: "cancel_recognize" },
            { text: "📱 Открыть Shazam", web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=recognize` } },
          ],
        ],
      },
    );

    // Clean up old sessions
    cleanupOldSessions();
  } catch (error) {
    logger.error("handleRecognizeCommand", error);
    await sendMessage(chatId, "❌ Ошибка запуска распознавания");
  }
}

export function hasRecognitionSession(userId: number): boolean {
  return !!RECOGNITION_SESSIONS[`${userId}`];
}

export function clearRecognitionSession(userId: number): void {
  delete RECOGNITION_SESSIONS[`${userId}`];
}

export async function handleRecognizeAudio(
  chatId: number,
  userId: number,
  fileId: string,
  fileType: "audio" | "voice" | "document",
): Promise<void> {
  try {
    // Clear session
    clearRecognitionSession(userId);

    await sendMessage(chatId, "🔍 Распознаю музыку...");

    // Download file from Telegram
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!botToken || !supabaseUrl || !supabaseKey) {
      throw new Error("Missing configuration");
    }

    // Get file path from Telegram
    const fileInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileInfo = await fileInfoResponse.json();

    if (!fileInfo.ok || !fileInfo.result.file_path) {
      throw new Error("Failed to get file info");
    }

    // Download file
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`;
    const fileResponse = await fetch(fileUrl);
    const fileBuffer = await fileResponse.arrayBuffer();

    // Convert to base64
    const uint8Array = new Uint8Array(fileBuffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const audioBase64 = btoa(binary);

    // Call recognition API
    const recognizeResponse = await fetch(`${supabaseUrl}/functions/v1/recognize-music`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ audioBase64 }),
    });

    if (!recognizeResponse.ok) {
      const errorText = await recognizeResponse.text();
      throw new Error(`Recognition failed: ${errorText}`);
    }

    const result = await recognizeResponse.json();

    if (result.found && result.track) {
      await sendRecognitionResult(chatId, result.track);
    } else {
      await sendMessage(
        chatId,
        `❌ *Музыка не найдена*

Попробуйте:
• Записать более длинный фрагмент (10-15 секунд)
• Поднести устройство ближе к источнику звука
• Убедиться, что музыка играет достаточно громко`,
        {
          inline_keyboard: [
            [
              { text: "🔄 Попробовать ещё", callback_data: "recognize_again" },
              { text: "📱 Shazam в приложении", web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=recognize` } },
            ],
          ],
        },
      );
    }
  } catch (error) {
    logger.error("handleRecognizeAudio", error);
    await sendMessage(chatId, "❌ Ошибка распознавания. Попробуйте позже.");
  }
}

async function recognizeFromUrl(chatId: number, audioUrl: string): Promise<void> {
  try {
    await sendMessage(chatId, "🔍 Распознаю музыку по ссылке...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing configuration");
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/recognize-music`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ audioUrl }),
    });

    if (!response.ok) {
      throw new Error("Recognition failed");
    }

    const result = await response.json();

    if (result.found && result.track) {
      await sendRecognitionResult(chatId, result.track);
    } else {
      await sendMessage(chatId, "❌ Музыка не найдена в этом аудио");
    }
  } catch (error) {
    logger.error("recognizeFromUrl", error);
    await sendMessage(chatId, "❌ Не удалось распознать музыку по ссылке");
  }
}

async function sendRecognitionResult(chatId: number, track: any): Promise<void> {
  const spotifyUrl = track.spotify?.external_urls?.spotify;
  const appleMusicUrl = track.appleMusic?.url;

  let message = `🎵 *Найдено!*

🎤 *${escapeMarkdown(track.artist)}*
📀 *${escapeMarkdown(track.title)}*`;

  if (track.album) {
    message += `\n💿 Альбом: ${escapeMarkdown(track.album)}`;
  }

  if (track.releaseDate) {
    message += `\n📅 Дата: ${track.releaseDate}`;
  }

  if (track.label) {
    message += `\n🏷️ Лейбл: ${escapeMarkdown(track.label)}`;
  }

  const buttons: any[][] = [];

  // Streaming links
  const streamingRow: any[] = [];
  if (spotifyUrl) {
    streamingRow.push({ text: "🎧 Spotify", url: spotifyUrl });
  }
  if (appleMusicUrl) {
    streamingRow.push({ text: "🍎 Apple Music", url: appleMusicUrl });
  }
  if (track.songLink) {
    streamingRow.push({ text: "🔗 Все ссылки", url: track.songLink });
  }
  if (streamingRow.length > 0) {
    buttons.push(streamingRow);
  }

  // Action buttons
  buttons.push([
    { text: "🔄 Распознать ещё", callback_data: "recognize_again" },
    { text: "📱 Открыть Shazam", web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=recognize` } },
  ]);

  await sendMessage(chatId, message, {
    inline_keyboard: buttons,
  });
}

function escapeMarkdown(text: string): string {
  if (!text) return "";
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

function cleanupOldSessions(): void {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  for (const key of Object.keys(RECOGNITION_SESSIONS)) {
    if (now - RECOGNITION_SESSIONS[key].createdAt > maxAge) {
      delete RECOGNITION_SESSIONS[key];
    }
  }
}

export async function handleCancelRecognize(
  chatId: number,
  userId: number,
  messageId?: number,
  callbackId?: string,
): Promise<void> {
  clearRecognitionSession(userId);

  if (messageId) {
    await editMessageText(chatId, messageId, "❌ Распознавание отменено");
  } else {
    await sendMessage(chatId, "❌ Распознавание отменено");
  }
}

export async function handleRecognizeAgain(chatId: number, userId: number): Promise<void> {
  await handleRecognizeCommand(chatId, userId);
}
