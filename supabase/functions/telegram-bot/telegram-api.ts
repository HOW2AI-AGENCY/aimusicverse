import { trackMetric, type MetricEventType } from './utils/metrics.ts';

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
  message?: TelegramMessage;
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
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  web_app?: { url: string };
  url?: string;
}

export async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: {
    inline_keyboard?: InlineKeyboardButton[][];
  }
) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
        reply_markup: replyMarkup,
      }),
    });

    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      trackMetric({
        eventType: 'message_failed',
        success: false,
        telegramChatId: chatId,
        errorMessage: error,
        responseTimeMs,
      });
      throw new Error(`Telegram API error: ${error}`);
    }

    trackMetric({
      eventType: 'message_sent',
      success: true,
      telegramChatId: chatId,
      responseTimeMs,
    });

    return response.json();
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    trackMetric({
      eventType: 'message_failed',
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs,
    });
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
  } = {}
) {
  console.log('Sending photo to chat:', chatId, 'URL:', photoUrl);
  
  try {
    const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: options.caption,
        parse_mode: 'MarkdownV2',
        reply_markup: options.replyMarkup,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('sendPhoto failed:', error);
      throw new Error(`Telegram API error: ${error}`);
    }

    const result = await response.json();
    console.log('sendPhoto success:', result.ok);
    return result;
  } catch (error) {
    console.error('sendPhoto exception:', error);
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

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: {
    inline_keyboard?: InlineKeyboardButton[][];
  }
) {
  const response = await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'MarkdownV2',
      reply_markup: replyMarkup,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    // Игнорируем ошибку "message is not modified" - это не критично
    if (!error.includes('message is not modified')) {
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
    type: 'photo';
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
