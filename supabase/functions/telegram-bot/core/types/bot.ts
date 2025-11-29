// TypeScript типы для Telegram Bot

export interface Track {
  id: string;
  title: string | null;
  artist?: string;
  duration_seconds: number | null;
  cover_url: string | null;
  local_cover_url: string | null;
  audio_url: string | null;
  local_audio_url: string | null;
  fileId?: string;
  tags: string | null;
  style: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  play_count: number | null;
  prompt: string;
  lyrics: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
  type: string | null;
}

export interface GenerationTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  error_message: string | null;
  created_at: string;
  track_id: string | null;
  telegram_chat_id: number | null;
}

export interface BotSession {
  chatId: number;
  userId: number;
  currentTrackIndex: number;
  currentProjectIndex: number;
  lastMessageId?: number;
  view: 'main' | 'library' | 'projects' | 'settings' | 'track_detail' | 'share';
  selectedTrackId?: string;
  selectedProjectId?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  web_app?: { url: string };
  url?: string;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
}

export interface InputMediaPhoto {
  type: 'photo';
  media: string;
  caption?: string;
  parse_mode?: 'Markdown' | 'HTML';
}
