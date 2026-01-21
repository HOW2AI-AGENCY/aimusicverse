import { trackMetric, type MetricEventType } from './utils/metrics.ts';
import { withRetry, storeFailedNotification, isRetryableError } from './utils/telegram-retry.ts';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
  }>;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage & {
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
      telegram_payment_charge_id: string;
      provider_payment_charge_id: string;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: TelegramMessage;
    data?: string;
  };
  inline_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    query: string;
    offset: string;
  };
  pre_checkout_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
  chosen_inline_result?: {
    result_id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    query: string;
    inline_message_id?: string;
  };
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  web_app?: { url: string };
  url?: string;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
}

/**
 * Escape special characters for MarkdownV2
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Internal fetch with retry logic
 */
async function telegramFetchWithRetry(
  endpoint: string,
  options: RequestInit,
  chatId?: number
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(`${TELEGRAM_API}${endpoint}`, options);
      
      if (!response.ok) {
        const error = await response.text();
        const err = new Error(`Telegram API error: ${error}`) as Error & { status: number };
        err.status = response.status;
        throw err;
      }
      
      return response;
    },
    { maxRetries: 3, initialDelayMs: 1000 }
  );
}

export async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: {
    inline_keyboard?: InlineKeyboardButton[][];
  },
  parseMode?: 'MarkdownV2' | 'HTML' | null,
  storeOnFailure: boolean = true
) {
  const startTime = Date.now();
  
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
  };
  
  if (parseMode) {
    body.parse_mode = parseMode;
  }
  
  try {
    const response = await telegramFetchWithRetry(
      '/sendMessage',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      chatId
    );

    const responseTimeMs = Date.now() - startTime;

    trackMetric({
      eventType: 'message_sent',
      success: true,
      telegramChatId: chatId,
      responseTimeMs,
    });

    return await response.json();
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    trackMetric({
      eventType: 'message_failed',
      success: false,
      telegramChatId: chatId,
      errorMessage,
      responseTimeMs,
    });

    // Store for retry if enabled and error is retryable
    if (storeOnFailure && isRetryableError(error)) {
      await storeFailedNotification(chatId, 'sendMessage', body, errorMessage);
    }
    
    throw error;
  }
}

export async function sendPhoto(
  chatId: number,
  photoUrl: string,
  options: {
    caption?: string;
    replyMarkup?: {
      inline_keyboard?: InlineKeyboardButton[][];
    };
  } = {},
  storeOnFailure: boolean = true
) {
  console.log('Sending photo to chat:', chatId, 'URL:', photoUrl);
  
  const body = {
    chat_id: chatId,
    photo: photoUrl,
    caption: options.caption,
    parse_mode: 'MarkdownV2',
    reply_markup: options.replyMarkup,
  };
  
  try {
    const response = await telegramFetchWithRetry(
      '/sendPhoto',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      chatId
    );

    const result = await response.json();
    console.log('sendPhoto success:', result.ok);
    return result;
  } catch (error) {
    console.error('sendPhoto exception:', error);
    
    if (storeOnFailure && isRetryableError(error)) {
      await storeFailedNotification(chatId, 'sendPhoto', body, error instanceof Error ? error.message : String(error));
    }
    
    throw error;
  }
}

export async function sendAudio(
  chatId: number,
  audioSource: string, // URL or file_id
  options: {
    caption?: string;
    title?: string;
    performer?: string;
    duration?: number;
    thumbnail?: string;
    replyMarkup?: {
      inline_keyboard?: InlineKeyboardButton[][];
    };
  } = {}
) {
  const startTime = Date.now();
  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  
  // If it's a URL (starts with http), download and send as blob for proper filename
  // If it's a file_id, send as string
  if (audioSource.startsWith('http')) {
    try {
      console.log('Downloading audio from URL for proper metadata...');
      const audioResponse = await fetch(audioSource);
      if (audioResponse.ok) {
        const audioBlob = await audioResponse.blob();
        const filename = options.title ? `${options.title}.mp3` : 'track.mp3';
        formData.append('audio', audioBlob, filename);
      } else {
        // Fallback to URL if download fails
        formData.append('audio', audioSource);
      }
    } catch (e) {
      console.warn('Failed to download audio, using URL:', e);
      formData.append('audio', audioSource);
    }
  } else {
    // file_id - send as string
    formData.append('audio', audioSource);
  }
  
  if (options.title) formData.append('title', options.title);
  if (options.performer) formData.append('performer', options.performer);
  if (options.duration) formData.append('duration', options.duration.toString());
  if (options.caption) formData.append('caption', options.caption);
  formData.append('parse_mode', 'MarkdownV2');
  
  // Download and attach thumbnail
  if (options.thumbnail && options.thumbnail.startsWith('http')) {
    try {
      const thumbResponse = await fetch(options.thumbnail);
      if (thumbResponse.ok) {
        const thumbBlob = await thumbResponse.blob();
        formData.append('thumbnail', thumbBlob, 'cover.jpg');
      }
    } catch (e) {
      console.warn('Failed to attach thumbnail:', e);
    }
  }
  
  if (options.replyMarkup) {
    formData.append('reply_markup', JSON.stringify(options.replyMarkup));
  }
  
  try {
    const response = await fetch(`${TELEGRAM_API}/sendAudio`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    const responseTimeMs = Date.now() - startTime;
    
    if (!result.ok) {
      console.error('sendAudio error:', result);
      trackMetric({
        eventType: 'audio_failed',
        success: false,
        telegramChatId: chatId,
        errorMessage: JSON.stringify(result),
        responseTimeMs,
        metadata: { title: options.title },
      });
      throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
    }

    trackMetric({
      eventType: 'audio_sent',
      success: true,
      telegramChatId: chatId,
      responseTimeMs,
      metadata: { title: options.title },
    });

    return result;
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    trackMetric({
      eventType: 'audio_failed',
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs,
      metadata: { title: options.title },
    });
    throw error;
  }
}

/**
 * Send a document (file) to a Telegram chat
 * Supports sending by URL or file_id
 */
export async function sendDocument(
  chatId: number,
  documentSource: string, // URL or file_id
  options: {
    caption?: string;
    filename?: string;
    replyMarkup?: {
      inline_keyboard?: InlineKeyboardButton[][];
    };
  } = {}
) {
  const startTime = Date.now();
  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  
  // Sanitize filename
  const sanitizeFilename = (name: string) => {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 60);
  };
  
  // If it's a URL, try to download and send as blob for proper filename
  if (documentSource.startsWith('http')) {
    try {
      console.log('Downloading document from URL...');
      const docResponse = await fetch(documentSource);
      if (docResponse.ok) {
        const docBlob = await docResponse.blob();
        const filename = options.filename || 'document';
        formData.append('document', docBlob, sanitizeFilename(filename));
      } else {
        // Fallback to URL if download fails
        formData.append('document', documentSource);
      }
    } catch (e) {
      console.warn('Failed to download document, using URL:', e);
      formData.append('document', documentSource);
    }
  } else {
    // file_id - send as string
    formData.append('document', documentSource);
  }
  
  if (options.caption) formData.append('caption', options.caption);
  formData.append('parse_mode', 'MarkdownV2');
  
  if (options.replyMarkup) {
    formData.append('reply_markup', JSON.stringify(options.replyMarkup));
  }
  
  try {
    const response = await fetch(`${TELEGRAM_API}/sendDocument`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    const responseTimeMs = Date.now() - startTime;
    
    if (!result.ok) {
      console.error('sendDocument error:', result);
      trackMetric({
        eventType: 'document_failed' as MetricEventType,
        success: false,
        telegramChatId: chatId,
        errorMessage: JSON.stringify(result),
        responseTimeMs,
        metadata: { filename: options.filename },
      });
      throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
    }

    trackMetric({
      eventType: 'document_sent' as MetricEventType,
      success: true,
      telegramChatId: chatId,
      responseTimeMs,
      metadata: { filename: options.filename },
    });

    return result;
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    trackMetric({
      eventType: 'document_failed' as MetricEventType,
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs,
      metadata: { filename: options.filename },
    });
    throw error;
  }
}

/**
 * Answer pre-checkout query (for Telegram payments)
 */
export async function answerPreCheckoutQuery(
  preCheckoutQueryId: string,
  options: { ok: boolean; error_message?: string }
) {
  const response = await fetch(`${TELEGRAM_API}/answerPreCheckoutQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pre_checkout_query_id: preCheckoutQueryId,
      ok: options.ok,
      error_message: options.error_message,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('answerPreCheckoutQuery error:', error);
    throw new Error(`Telegram API error: ${error}`);
  }

  return response.json();
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: {
    inline_keyboard?: InlineKeyboardButton[][];
  },
  parseMode?: 'MarkdownV2' | 'HTML' | null
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup: replyMarkup,
  };
  
  if (parseMode) {
    body.parse_mode = parseMode;
  }
  
  const response = await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    // Игнорируем некритичные ошибки Telegram
    const ignorableErrors = [
      'message is not modified',
      'there is no text in the message to edit',
      'message to edit not found',
    ];
    const shouldIgnore = ignorableErrors.some(e => error.includes(e));
    if (!shouldIgnore) {
      console.error('editMessageText error:', error);
    }
    return null;
  }

  return response.json();
}

export async function editMessageMedia(
  chatId: number,
  messageId: number,
  media: {
    type: 'photo' | 'video' | 'animation';
    media: string;
    caption?: string;
    parse_mode?: 'MarkdownV2' | 'HTML';
  },
  replyMarkup?: {
    inline_keyboard?: InlineKeyboardButton[][];
  }
) {
  const response = await fetch(`${TELEGRAM_API}/editMessageMedia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      media,
      reply_markup: replyMarkup,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    // Игнорируем ошибку "message is not modified" - это не критично
    if (!error.includes('message is not modified')) {
      console.error('editMessageMedia error:', error);
    }
    return null;
  }

  return response.json();
}

export async function deleteMessage(chatId: number, messageId: number) {
  const response = await fetch(`${TELEGRAM_API}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('deleteMessage error:', error);
    return null;
  }

  return response.json();
}

export async function editMessageCaption(
  chatId: number,
  messageId: number,
  caption: string,
  replyMarkup?: {
    inline_keyboard?: InlineKeyboardButton[][];
  }
) {
  const response = await fetch(`${TELEGRAM_API}/editMessageCaption`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      caption,
      parse_mode: 'MarkdownV2',
      reply_markup: replyMarkup,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (!error.includes('message is not modified')) {
      console.error('editMessageCaption error:', error);
    }
    return null;
  }

  return response.json();
}

export async function answerCallbackQuery(queryId: string, text?: string) {
  const response = await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: queryId,
      text,
    }),
  });

  return response.json();
}

export async function setWebhook(url: string) {
  const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      allowed_updates: ['message', 'callback_query', 'inline_query'],
      drop_pending_updates: true,
    }),
  });

  return response.json();
}

export async function setMyCommands(commands: Array<{ command: string; description: string }>) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return response.json();
}

export async function setUserEmojiStatus(userId: number, emojiId: string | null) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  interface EmojiStatusBody {
    user_id: number;
    emoji_status_custom_emoji_id?: string;
  }

  const body: EmojiStatusBody = { user_id: userId };
  if (emojiId) {
    body.emoji_status_custom_emoji_id = emojiId;
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/setUserEmojiStatus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return response.json();
}

export async function getWebhookInfo() {
  const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
  return response.json();
}

export function parseCommand(text?: string): { command: string; args: string } | null {
  if (!text || !text.startsWith('/')) return null;

  const parts = text.split(' ');
  const command = parts[0].replace('/', '').split('@')[0];
  const args = parts.slice(1).join(' ');

  return { command, args };
}
