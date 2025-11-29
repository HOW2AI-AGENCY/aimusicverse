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
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  web_app?: { url: string };
}

export async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: {
    inline_keyboard?: InlineKeyboardButton[][];
  }
) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return response.json();
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
  const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: options.caption,
      parse_mode: 'Markdown',
      reply_markup: options.replyMarkup,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return response.json();
}

export async function sendAudio(
  chatId: number,
  audioUrl: string,
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
  const response = await fetch(`${TELEGRAM_API}/sendAudio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      audio: audioUrl,
      caption: options.caption,
      title: options.title,
      performer: options.performer,
      duration: options.duration,
      thumbnail: options.thumbnail,
      parse_mode: 'Markdown',
      reply_markup: options.replyMarkup,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
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
  }
) {
  const response = await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
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
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    }),
  });

  return response.json();
}

export async function setMyCommands(commands: Array<{ command: string; description: string }>) {
  const response = await fetch(`${TELEGRAM_API}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  });

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
