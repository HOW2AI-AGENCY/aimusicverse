import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getTelegramConfig, getTrackDeepLink } from '../_shared/telegram-config.ts';
import { escapeMarkdown } from '../_shared/telegram-utils.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('send-telegram-notification');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AudioClipData {
  audioUrl: string;
  title: string;
  duration?: number;
  versionLabel: string;
  lyricsPreview?: string;
  coverUrl?: string;
}

interface NotificationPayload {
  task_id?: string;
  chat_id?: number;
  chatId?: number;
  user_id?: string;
  status?: string;
  track_id?: string;
  trackId?: string;
  type?: string;
  error_message?: string;
  audioUrl?: string;
  coverUrl?: string;
  videoUrl?: string;
  title?: string;
  duration?: number;
  tags?: string;
  style?: string;
  versionsCount?: number;
  versionLabel?: string;
  currentVersion?: number;
  totalVersions?: number;
  generationMode?: string;
  audioClips?: AudioClipData[];
  message?: string;
  progress?: number;
  messageId?: number; // For editing/deleting progress messages
  // Stems complete notification fields
  trackTitle?: string;
  stems?: Array<{ type: string; label: string; audioUrl: string }>;
  stemsCount?: number;
}

interface NotificationSettings {
  notify_completed: boolean;
  notify_failed: boolean;
  notify_progress: boolean;
  notify_stem_ready: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: unknown): Promise<{ ok: boolean; skipped?: boolean; reason?: string; result?: any }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  // Validate chat_id
  if (!chatId || chatId <= 0) {
    logger.warn('Invalid chat_id', { chatId });
    return { ok: false, skipped: true, reason: 'invalid_chat_id' };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2',
      reply_markup: replyMarkup,
    }),
  });

  const result = await response.json();
  
  // Handle "chat not found" gracefully - user may have blocked bot or never started conversation
  if (!result.ok) {
    const errorDesc = result.description || '';
    if (errorDesc.includes('chat not found') || errorDesc.includes('bot was blocked') || errorDesc.includes('user is deactivated')) {
      logger.warn('Chat unavailable', { chatId, reason: errorDesc });
      return { ok: false, skipped: true, reason: 'chat_unavailable' };
    }
    logger.error('Telegram API error', null, { result });
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  return { ok: true, result };
}

/**
 * Edit an existing Telegram message
 */
async function editTelegramMessage(
  chatId: number, 
  messageId: number, 
  text: string, 
  replyMarkup?: unknown
): Promise<{ ok: boolean; skipped?: boolean; reason?: string }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  if (!chatId || chatId <= 0 || !messageId) {
    logger.warn('Invalid chat_id or message_id for edit', { chatId, messageId });
    return { ok: false, skipped: true, reason: 'invalid_ids' };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
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

  const result = await response.json();
  
  if (!result.ok) {
    const errorDesc = result.description || '';
    // Message not modified is OK - content hasn't changed
    if (errorDesc.includes('message is not modified')) {
      return { ok: true };
    }
    if (errorDesc.includes('message to edit not found') || errorDesc.includes('chat not found')) {
      logger.warn('Message not found for edit', { chatId, messageId, reason: errorDesc });
      return { ok: false, skipped: true, reason: 'message_not_found' };
    }
    logger.error('Telegram edit error', null, { result });
    return { ok: false, reason: errorDesc };
  }

  return { ok: true };
}

/**
 * Delete a Telegram message
 */
async function deleteTelegramMessage(chatId: number, messageId: number): Promise<{ ok: boolean; skipped?: boolean }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  if (!chatId || chatId <= 0 || !messageId) {
    return { ok: false, skipped: true };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
    
    const result = await response.json();
    if (!result.ok) {
      logger.warn('Failed to delete message', { chatId, messageId, error: result.description });
    }
    return { ok: result.ok };
  } catch (e) {
    logger.warn('Delete message error', { error: e });
    return { ok: false };
  }
}

async function sendTelegramAudio(
  chatId: number, 
  audioUrl: string, 
  options: {
    caption?: string;
    title?: string;
    performer?: string;
    duration?: number;
    coverUrl?: string;
    replyMarkup?: unknown;
  }
): Promise<{ ok: boolean; skipped?: boolean; reason?: string; result?: any }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  // Validate chat_id
  if (!chatId || chatId <= 0) {
    logger.warn('Invalid chat_id for audio', { chatId });
    return { ok: false, skipped: true, reason: 'invalid_chat_id' };
  }

  logger.info('Sending audio to Telegram', { chatId, title: options.title });

  // Download audio file as blob for proper title display in Telegram
  let audioBlob: Blob | null = null;
  try {
    logger.debug('Downloading audio file');
    const audioResponse = await fetch(audioUrl);
    if (audioResponse.ok) {
      audioBlob = await audioResponse.blob();
      logger.debug('Audio downloaded', { size: audioBlob.size });
    } else {
      logger.warn('Failed to download audio', { status: audioResponse.status });
    }
  } catch (downloadError) {
    logger.warn('Audio download error', { error: downloadError });
  }

  // Download thumbnail if available
  let thumbBlob: Blob | null = null;
  if (options.coverUrl) {
    try {
      const thumbResponse = await fetch(options.coverUrl);
      if (thumbResponse.ok) {
        thumbBlob = await thumbResponse.blob();
        logger.debug('Thumbnail downloaded', { size: thumbBlob.size });
      }
    } catch (error) {
      logger.warn('Error downloading cover', { error });
    }
  }

  // Sanitize title for filename
  const sanitizeFilename = (name: string) => {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 60);
  };

  const filename = `${sanitizeFilename(options.title || 'track')}.mp3`;

  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  
  // Use blob if downloaded, otherwise fallback to URL
  if (audioBlob) {
    formData.append('audio', audioBlob, filename);
    logger.debug('Sending via FormData (blob)');
  } else {
    formData.append('audio', audioUrl);
    logger.debug('Sending via FormData (URL fallback)');
  }
  
  if (options.caption) formData.append('caption', options.caption);
  if (options.title) formData.append('title', options.title);
  if (options.performer) formData.append('performer', options.performer);
  if (options.duration) formData.append('duration', options.duration.toString());
  if (thumbBlob) formData.append('thumbnail', thumbBlob, 'cover.jpg');
  formData.append('parse_mode', 'MarkdownV2');
  if (options.replyMarkup) formData.append('reply_markup', JSON.stringify(options.replyMarkup));

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  
  // Handle "chat not found" gracefully
  if (!result.ok) {
    const errorDesc = result.description || '';
    if (errorDesc.includes('chat not found') || errorDesc.includes('bot was blocked') || errorDesc.includes('user is deactivated')) {
      logger.warn('Chat unavailable for audio', { chatId, reason: errorDesc });
      return { ok: false, skipped: true, reason: 'chat_unavailable' };
    }
    logger.error('Telegram API error for audio', null, { result });
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  logger.success('Audio sent successfully');
  return { ok: true, result };
}

/**
 * Send video to Telegram chat
 */
async function sendTelegramVideo(
  chatId: number, 
  videoUrl: string, 
  options: {
    caption?: string;
    title?: string;
    coverUrl?: string;
    replyMarkup?: unknown;
  }
): Promise<{ ok: boolean; skipped?: boolean; reason?: string; result?: any }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  // Validate chat_id
  if (!chatId || chatId <= 0) {
    logger.warn('Invalid chat_id for video', { chatId });
    return { ok: false, skipped: true, reason: 'invalid_chat_id' };
  }

  logger.info('Sending video to Telegram', { chatId, title: options.title });

  // Download video file as blob
  let videoBlob: Blob | null = null;
  try {
    logger.debug('Downloading video file');
    const videoResponse = await fetch(videoUrl);
    if (videoResponse.ok) {
      videoBlob = await videoResponse.blob();
      logger.debug('Video downloaded', { size: videoBlob.size });
    } else {
      logger.warn('Failed to download video', { status: videoResponse.status });
    }
  } catch (downloadError) {
    logger.warn('Video download error', { error: downloadError });
  }

  // Download thumbnail if available
  let thumbBlob: Blob | null = null;
  if (options.coverUrl) {
    try {
      const thumbResponse = await fetch(options.coverUrl);
      if (thumbResponse.ok) {
        thumbBlob = await thumbResponse.blob();
        logger.debug('Video thumbnail downloaded', { size: thumbBlob.size });
      }
    } catch (error) {
      logger.warn('Error downloading video cover', { error });
    }
  }

  const sanitizeFilename = (name: string) => {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 60);
  };

  const filename = `${sanitizeFilename(options.title || 'video')}.mp4`;

  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  
  if (videoBlob) {
    formData.append('video', videoBlob, filename);
    logger.debug('Sending video via FormData (blob)');
  } else {
    formData.append('video', videoUrl);
    logger.debug('Sending video via FormData (URL fallback)');
  }
  
  if (options.caption) formData.append('caption', options.caption);
  if (thumbBlob) formData.append('thumbnail', thumbBlob, 'cover.jpg');
  formData.append('parse_mode', 'MarkdownV2');
  formData.append('supports_streaming', 'true');
  if (options.replyMarkup) formData.append('reply_markup', JSON.stringify(options.replyMarkup));

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  
  // Handle errors gracefully
  if (!result.ok) {
    const errorDesc = result.description || '';
    if (errorDesc.includes('chat not found') || errorDesc.includes('bot was blocked') || errorDesc.includes('user is deactivated')) {
      logger.warn('Chat unavailable for video', { chatId, reason: errorDesc });
      return { ok: false, skipped: true, reason: 'chat_unavailable' };
    }
    logger.error('Telegram API error for video', null, { result });
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  logger.success('Video sent successfully');
  return { ok: true, result };
}

/**
 * Send document (MIDI, PDF, etc.) to Telegram chat
 */
async function sendTelegramDocument(
  chatId: number, 
  documentUrl: string, 
  options: {
    caption?: string;
    filename?: string;
    replyMarkup?: unknown;
  }
): Promise<{ ok: boolean; skipped?: boolean; reason?: string; result?: any }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  // Validate chat_id
  if (!chatId || chatId <= 0) {
    logger.warn('Invalid chat_id for document', { chatId });
    return { ok: false, skipped: true, reason: 'invalid_chat_id' };
  }

  logger.info('Sending document to Telegram', { chatId, filename: options.filename });

  // Download document file as blob
  let documentBlob: Blob | null = null;
  try {
    logger.debug('Downloading document file');
    const docResponse = await fetch(documentUrl);
    if (docResponse.ok) {
      documentBlob = await docResponse.blob();
      logger.debug('Document downloaded', { size: documentBlob.size });
    } else {
      logger.warn('Failed to download document', { status: docResponse.status });
    }
  } catch (downloadError) {
    logger.warn('Document download error', { error: downloadError });
  }

  const sanitizeFilename = (name: string) => {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 60);
  };

  const filename = options.filename || 'document';

  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  
  if (documentBlob) {
    formData.append('document', documentBlob, sanitizeFilename(filename));
    logger.debug('Sending document via FormData (blob)');
  } else {
    formData.append('document', documentUrl);
    logger.debug('Sending document via FormData (URL fallback)');
  }
  
  if (options.caption) formData.append('caption', options.caption);
  formData.append('parse_mode', 'MarkdownV2');
  if (options.replyMarkup) formData.append('reply_markup', JSON.stringify(options.replyMarkup));

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  
  // Handle errors gracefully
  if (!result.ok) {
    const errorDesc = result.description || '';
    if (errorDesc.includes('chat not found') || errorDesc.includes('bot was blocked') || errorDesc.includes('user is deactivated')) {
      logger.warn('Chat unavailable for document', { chatId, reason: errorDesc });
      return { ok: false, skipped: true, reason: 'chat_unavailable' };
    }
    logger.error('Telegram API error for document', null, { result });
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  logger.success('Document sent successfully');
  return { ok: true, result };
}

/**
 * Check if notification should be sent based on user settings
 */
async function canSendNotification(
  supabase: any,
  userId: string | undefined,
  chatId: number,
  notificationType: string
): Promise<boolean> {
  try {
    let settings: NotificationSettings | null = null;

    if (userId) {
      const { data } = await supabase
        .from('user_notification_settings')
        .select('notify_completed, notify_failed, notify_progress, notify_stem_ready')
        .eq('user_id', userId)
        .single();
      settings = data as NotificationSettings | null;
    }

    if (!settings) {
      const { data } = await supabase
        .from('user_notification_settings')
        .select('notify_completed, notify_failed, notify_progress, notify_stem_ready')
        .eq('telegram_chat_id', chatId)
        .single();
      settings = data as NotificationSettings | null;
    }

    if (!settings) return true;

    switch (notificationType) {
      case 'completed':
      case 'generation_complete':
        return settings.notify_completed !== false;
      case 'failed':
        return settings.notify_failed !== false;
      case 'progress':
        return settings.notify_progress === true;
      case 'stem_ready':
        return settings.notify_stem_ready !== false;
      default:
        return true;
    }
  } catch {
    return true;
  }
}

/**
 * Get chat_id for a user
 */
async function getChatIdForUser(
  supabase: any,
  userId: string
): Promise<number | null> {
  try {
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('telegram_chat_id')
      .eq('user_id', userId)
      .single();

    if (settings?.telegram_chat_id) {
      return settings.telegram_chat_id as number;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_chat_id, telegram_id')
      .eq('user_id', userId)
      .single();

    return (profile?.telegram_chat_id || profile?.telegram_id || null) as number | null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { 
      chat_id, chatId, user_id, status, track_id, trackId, type, error_message,
      audioUrl, coverUrl, videoUrl, title, duration, tags, style, versionsCount, versionLabel,
      currentVersion, totalVersions, generationMode, audioClips
    } = payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine chat_id
    let finalChatId = chat_id || chatId;
    
    // If no chat_id provided but user_id is, look up chat_id
    if (!finalChatId && user_id) {
      finalChatId = await getChatIdForUser(supabase, user_id) || undefined;
    }

    const finalTrackId = track_id || trackId;

    if (!finalChatId) {
      logger.warn('No chat_id available for notification');
      return new Response(
        JSON.stringify({ success: false, error: 'No chat_id available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user wants this type of notification
    const notificationType = type || status || 'general';
    const canSend = await canSendNotification(supabase, user_id, finalChatId, notificationType);
    
    if (!canSend) {
      logger.info('Notification blocked by user settings', { chatId: finalChatId, type: notificationType });
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'user_settings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramConfig = getTelegramConfig();
    const miniAppUrl = telegramConfig.miniAppUrl;
    const botDeepLink = telegramConfig.deepLinkBase;

    // Handle delete_progress - remove progress message before sending results
    if (type === 'delete_progress' && payload.messageId) {
      logger.info('Deleting progress message', { messageId: payload.messageId });
      await deleteTelegramMessage(finalChatId, payload.messageId);
      return new Response(
        JSON.stringify({ success: true, type: 'delete_progress' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle progress_update - edit existing progress message
    if (type === 'progress_update' && payload.messageId) {
      const progressTitle = escapeMarkdown(title || 'Генерация');
      const progressText = payload.message ? escapeMarkdown(payload.message) : '⏳ Обрабатываем\\.\\.\\.';
      const progressPercent = payload.progress || 50;
      
      const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
      const message = `🎵 *${progressTitle}*\n\n${progressBar} ${progressPercent}%\n${progressText}\n\n🤖 _@AIMusicVerseBot_`;
      
      logger.info('Updating progress message', { messageId: payload.messageId, progress: progressPercent });
      await editTelegramMessage(finalChatId, payload.messageId, message);
      
      return new Response(
        JSON.stringify({ success: true, type: 'progress_update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle error_update - edit progress message to show error
    if (type === 'error_update' && payload.messageId) {
      const escapedError = escapeMarkdown(payload.error_message || 'Произошла ошибка');
      const message = `❌ *Ошибка генерации*\n\n${escapedError}\n\n💡 Попробуйте позже или измените параметры\n\n🤖 _@AIMusicVerseBot_`;
      
      logger.info('Updating progress message with error', { messageId: payload.messageId });
      await editTelegramMessage(finalChatId, payload.messageId, message, {
        inline_keyboard: [
          [{ text: '🔄 Попробовать снова', callback_data: 'generate' }],
          [{ text: '🏠 Меню', callback_data: 'open_main_menu' }]
        ]
      });
      
      return new Response(
        JSON.stringify({ success: true, type: 'error_update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle progress notification (new message)
    if (type === 'progress') {
      const progressTitle = escapeMarkdown(title || 'Генерация');
      const progressText = payload.message ? escapeMarkdown(payload.message) : '⏳ Обрабатываем\\.\\.\\.';
      const progressPercent = payload.progress || 50;
      
      const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
      const message = `🎵 *${progressTitle}*\n\n${progressBar} ${progressPercent}%\n${progressText}\n\n🤖 _@AIMusicVerseBot_`;
      
      const result = await sendTelegramMessage(finalChatId, message);
      
      return new Response(
        JSON.stringify({ success: true, type: 'progress', messageId: result.result?.message_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle multi-version generation complete (both A and B in sequence)
    if (type === 'generation_complete_multi' && audioClips && audioClips.length > 0) {
      logger.info('Sending multi-version notification', { clipsCount: audioClips.length });
      
      // Helper to format duration
      const formatDuration = (d?: number) => d 
        ? `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}`
        : '';
      
      // Send each audio with consistent format
      for (let i = 0; i < audioClips.length; i++) {
        const clip = audioClips[i];
        const isLast = i === audioClips.length - 1;
        const durationFormatted = formatDuration(clip.duration);
        
        // Lyrics preview (2 lines max, clean tags)
        let lyricsText = '';
        if (clip.lyricsPreview) {
          const cleanLyrics = clip.lyricsPreview
            .split('\n')
            .filter(line => !line.trim().startsWith('['))
            .slice(0, 2)
            .join('\n')
            .trim();
          if (cleanLyrics) {
            lyricsText = `\n\n📝 _${escapeMarkdown(cleanLyrics)}${clip.lyricsPreview.length > cleanLyrics.length ? '\\.\\.\\.' : ''}_`;
          }
        }
        
        // Build caption with metadata
        const trackTitle = escapeMarkdown(title || 'Новый трек');
        const styleText = style ? escapeMarkdown(style.split(',')[0].trim()) : '';
        
        const caption = `🎵 *${trackTitle}* — ${clip.versionLabel}\n${styleText ? `🎸 ${styleText} • ` : ''}⏱️ ${durationFormatted}${lyricsText}\n\n🤖 _@AIMusicVerseBot_`;
        
        // Use clip-specific cover or fallback to main cover
        const clipCoverUrl = clip.coverUrl || coverUrl;
        
        const audioResult = await sendTelegramAudio(finalChatId, clip.audioUrl, {
          caption,
          title: `${title || 'Трек'} (${clip.versionLabel})`,
          performer: 'MusicVerse AI',
          duration: clip.duration ? Math.round(clip.duration) : undefined,
          coverUrl: clipCoverUrl, // Cover on EVERY version
          replyMarkup: isLast ? {
            inline_keyboard: [
              [{ text: '▶️ Открыть трек', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
              [
                { text: '🔄 Создать ещё', callback_data: 'generate' },
                { text: '🏠 Меню', callback_data: 'open_main_menu' }
              ]
            ]
          } : undefined
        });
        
        if (!audioResult.ok) {
          logger.error('Failed to send audio', null, { versionLabel: clip.versionLabel, result: audioResult });
        } else {
          logger.success('Audio sent', { versionLabel: clip.versionLabel });
        }
        
        // Small delay between messages
        if (!isLast) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      return new Response(
        JSON.stringify({ success: true, type: 'generation_complete_multi' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle generation complete with direct data (single version)
    if (type === 'generation_complete' && audioUrl) {
      logger.info('Sending generation complete notification');
      
      const formatDuration = (d?: number) => d 
        ? `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}`
        : '';
      
      const durationFormatted = formatDuration(duration);
      
      // Mode-specific emoji
      const modeEmoji = generationMode === 'upload_cover' ? '🎤' 
        : generationMode === 'upload_extend' ? '⏩'
        : generationMode === 'add_vocals' ? '🎙️'
        : generationMode === 'add_instrumental' ? '🎸'
        : '🎵';
      
      const trackTitle = escapeMarkdown(title || 'Новый трек');
      const styleText = style ? escapeMarkdown(style.split(',')[0].trim()) : '';
      const versionInfo = versionLabel ? ` — ${versionLabel}` : '';
      
      const caption = `${modeEmoji} *${trackTitle}*${versionInfo}\n${styleText ? `🎸 ${styleText} • ` : ''}⏱️ ${durationFormatted}\n\n🤖 _@AIMusicVerseBot_`;
      
      await sendTelegramAudio(finalChatId, audioUrl, {
        caption,
        title: title || 'AI Music Track',
        performer: 'MusicVerse AI',
        duration: duration ? Math.round(duration) : undefined,
        coverUrl: coverUrl,
        replyMarkup: {
          inline_keyboard: [
            [{ text: '▶️ Открыть трек', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
            [
              { text: '🔄 Создать ещё', callback_data: 'generate' },
              { text: '🏠 Меню', callback_data: 'open_main_menu' }
            ]
          ]
        }
      });

      return new Response(
        JSON.stringify({ success: true, type: 'generation_complete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle video ready notification
    if ((type === 'video_ready' || type === 'video_share') && (videoUrl || finalTrackId)) {
      logger.info('Processing video notification', { type });
      
      let trackData = null;
      let finalVideoUrl = videoUrl;
      
      // Fetch track data if we have trackId
      if (finalTrackId) {
        const { data: track } = await supabase
          .from('tracks')
          .select('title, style, cover_url, video_url, local_video_url')
          .eq('id', finalTrackId)
          .single();
        trackData = track;
        
        // Use track video if no videoUrl provided
        if (!finalVideoUrl && track) {
          finalVideoUrl = track.local_video_url || track.video_url;
        }
      }
      
      if (finalVideoUrl) {
        const trackTitle = escapeMarkdown(title || trackData?.title || 'Видео клип');
        const trackStyle = trackData?.style ? escapeMarkdown(trackData.style.split(',')[0]) : '';
        
        const caption = `🎬 *${trackTitle}*${trackStyle ? `\n🎸 ${trackStyle}` : ''}\n\n🤖 _@AIMusicVerseBot_`;
        
        await sendTelegramVideo(finalChatId, finalVideoUrl, {
          caption,
          title: title || trackData?.title || 'Video Clip',
          coverUrl: trackData?.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: '▶️ Открыть трек', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
              [
                { text: '🔄 Создать ещё', callback_data: 'generate' },
                { text: '🏠 Меню', callback_data: 'open_main_menu' }
              ]
            ]
          }
        });

        return new Response(
          JSON.stringify({ success: true, type: type }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle section_replaced notification - send audio file with replaced section
    if (type === 'section_replaced' && audioUrl && finalTrackId) {
      logger.info('Processing section_replaced notification', { trackId: finalTrackId });
      
      const trackTitle = escapeMarkdown(title || 'Секция заменена');
      const versionText = versionLabel ? escapeMarkdown(` (версия ${versionLabel})`) : '';
      
      const caption = `✂️ *${trackTitle}*${versionText}\n\n🎵 Секция трека успешно заменена\\!\n\n🤖 _@AIMusicVerseBot_`;
      
      await sendTelegramAudio(finalChatId, audioUrl, {
        caption,
        title: `${title || 'Секция'} - ${versionLabel || 'New'}`,
        performer: 'MusicVerse Studio',
        coverUrl: coverUrl,
        replyMarkup: {
          inline_keyboard: [
            [{ text: '🎛️ Открыть в студии', url: `${botDeepLink}?startapp=studio_${finalTrackId}` }],
            [
              { text: '✅ Применить', callback_data: `apply_version_${finalTrackId}` },
              { text: '❌ Отклонить', callback_data: `discard_version_${finalTrackId}` }
            ],
            [{ text: '🏠 Меню', callback_data: 'open_main_menu' }]
          ]
        }
      });

      return new Response(
        JSON.stringify({ success: true, type: 'section_replaced' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle stems_complete notification - ONE consolidated message for all stems
    if (type === 'stems_complete' && payload.stems && payload.stems.length > 0) {
      logger.info('Processing stems_complete notification', { 
        trackId: finalTrackId, 
        stemsCount: payload.stems.length 
      });
      
      const trackTitle = escapeMarkdown(payload.trackTitle || 'Трек');
      const stemsCount = payload.stemsCount || payload.stems.length;
      const stemsList = payload.stems
        .map((s: { type: string; label: string }) => `• ${s.label}`)
        .join('\n');
      
      const caption = `🎛️ *Стемы готовы\\!*\n\n🎵 *${trackTitle}*\n\nРазделено на ${stemsCount} дорожек:\n${escapeMarkdown(stemsList)}\n\n🤖 _@AIMusicVerseBot_`;
      
      await sendTelegramMessage(finalChatId, caption, {
        inline_keyboard: [
          [{ text: '🎛️ Открыть в студии', url: `${botDeepLink}?startapp=studio_${finalTrackId}` }],
          [{ text: '📥 Скачать все стемы', callback_data: `download_stems_${finalTrackId}` }],
          [{ text: '🏠 Меню', callback_data: 'open_main_menu' }]
        ]
      });

      return new Response(
        JSON.stringify({ success: true, type: 'stems_complete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle stem_ready notification - send audio file with stem (single stem)
    if (type === 'stem_ready' && audioUrl && finalTrackId) {
      logger.info('Processing stem_ready notification', { trackId: finalTrackId });
      
      const stemTitle = escapeMarkdown(title || 'Стем');
      
      const caption = `🎛️ *${stemTitle}*\n\n✨ Стем готов для использования\\!\n\n🤖 _@AIMusicVerseBot_`;
      
      await sendTelegramAudio(finalChatId, audioUrl, {
        caption,
        title: title || 'Stem',
        performer: 'MusicVerse Studio',
        coverUrl: coverUrl,
        replyMarkup: {
          inline_keyboard: [
            [{ text: '🎛️ Открыть в студии', url: `${botDeepLink}?startapp=studio_${finalTrackId}` }],
            [{ text: '📥 Скачать все стемы', callback_data: `download_stems_${finalTrackId}` }],
            [{ text: '🏠 Меню', callback_data: 'open_main_menu' }]
          ]
        }
      });

      return new Response(
        JSON.stringify({ success: true, type: 'stem_ready' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle track share type
    if (type === 'track_share' && finalTrackId) {
      logger.info('Processing track_share', { trackId: finalTrackId });
      
      const { data: track, error: trackError } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', finalTrackId)
        .single();

      if (trackError) {
        logger.error('Error fetching track', trackError);
        return new Response(
          JSON.stringify({ success: false, error: 'Track not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (track?.audio_url) {
        const formatDuration = (d?: number) => d 
          ? `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}`
          : '';
        
        const durationFormatted = formatDuration(track.duration_seconds);
        const trackTitle = escapeMarkdown(track.title || 'Новый трек');
        const styleText = track.style ? escapeMarkdown(track.style.split(',')[0]) : '';
        
        const caption = `🎵 *${trackTitle}*\n${styleText ? `🎸 ${styleText} • ` : ''}⏱️ ${durationFormatted}\n\n🤖 _@AIMusicVerseBot_`;
        
        await sendTelegramAudio(finalChatId, track.audio_url, {
          caption,
          title: track.title || 'MusicVerse Track',
          performer: 'MusicVerse AI',
          duration: track.duration_seconds || undefined,
          coverUrl: track.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: '▶️ Открыть трек', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
              [
                { text: '🔄 Создать ещё', callback_data: 'generate' },
                { text: '🏠 Меню', callback_data: 'open_main_menu' }
              ]
            ]
          }
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle document share (MIDI, PDF, GP5, etc.)
    if (type === 'document_share') {
      const { document_url, document_type, filename, track_title } = payload as any;
      
      if (!document_url) {
        return new Response(
          JSON.stringify({ success: false, error: 'document_url required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      logger.info('Processing document_share', { document_type, filename });

      const docTypeLabels: Record<string, string> = {
        'midi': '🎹 MIDI',
        'pdf': '📄 PDF Ноты',
        'gp5': '🎸 Guitar Pro',
        'mxml': '🎼 MusicXML',
      };

      const typeLabel = docTypeLabels[document_type] || '📎 Файл';
      const trackName = escapeMarkdown(track_title || 'Трек');
      const caption = `${typeLabel}\n🎵 *${trackName}*\n\n🤖 _@AIMusicVerseBot_`;

      await sendTelegramDocument(finalChatId, document_url, {
        caption,
        filename: filename || `transcription.${document_type || 'file'}`,
        replyMarkup: {
          inline_keyboard: [
            [{ text: '🏠 Меню', callback_data: 'open_main_menu' }]
          ]
        }
      });

      return new Response(
        JSON.stringify({ success: true, type: 'document_share' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle completed status
    if (status === 'completed' && finalTrackId) {
      const { data: track } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', finalTrackId)
        .single();
      
      if (track?.audio_url) {
        const formatDuration = (d?: number) => d 
          ? `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}`
          : '';
        
        const durationFormatted = formatDuration(track.duration_seconds);
        const trackTitle = escapeMarkdown(track?.title || 'Новый трек');
        const styleText = track?.style ? escapeMarkdown(track.style.split(',')[0]) : '';
        
        // Lyrics preview (2 lines, no tags)
        let lyricsText = '';
        if (track.lyrics) {
          const cleanLyrics = track.lyrics
            .split('\n')
            .filter((line: string) => !line.trim().startsWith('['))
            .slice(0, 2)
            .join('\n')
            .trim();
          if (cleanLyrics) {
            lyricsText = `\n\n📝 _${escapeMarkdown(cleanLyrics.substring(0, 100))}${cleanLyrics.length > 100 ? '\\.\\.\\.' : ''}_`;
          }
        }
        
        const caption = `🎵 *${trackTitle}*\n${styleText ? `🎸 ${styleText} • ` : ''}⏱️ ${durationFormatted}${lyricsText}\n\n🤖 _@AIMusicVerseBot_`;
        
        await sendTelegramAudio(finalChatId, track.audio_url, {
          caption,
          title: track.title || 'MusicVerse Track',
          performer: 'MusicVerse AI',
          duration: track.duration_seconds,
          coverUrl: track.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: '▶️ Открыть трек', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
              [
                { text: '🔄 Создать ещё', callback_data: 'generate' },
                { text: '🏠 Меню', callback_data: 'open_main_menu' }
              ]
            ]
          }
        });
      } else {
        const trackTitle = escapeMarkdown(track?.title || 'Новый трек');
        const trackStyle = track?.style ? escapeMarkdown(track.style) : '';
        const message = `🎵 *${trackTitle}*${trackStyle ? `\n🎸 ${trackStyle}` : ''}\n\n🤖 _@AIMusicVerseBot_`;
        
        await sendTelegramMessage(finalChatId, message, {
          inline_keyboard: [
            [{ text: '▶️ Открыть трек', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
            [
              { text: '🔄 Создать ещё', callback_data: 'generate' },
              { text: '🏠 Меню', callback_data: 'open_main_menu' }
            ]
          ]
        });
      }
    } else if (status === 'failed') {
      const escapedErrorMessage = escapeMarkdown(error_message || 'Произошла ошибка при генерации');
      const message = `😔 *Не удалось создать трек*\n\n${escapedErrorMessage}\n\n💡 *Попробуйте:*\n• Упростить описание\n• Изменить стиль\n• Попробовать через минуту`;
      
      await sendTelegramMessage(finalChatId, message, {
        inline_keyboard: [
          [{ text: '🔄 Попробовать снова', callback_data: 'generate' }],
          [
            { text: '❓ Помощь', callback_data: 'help' },
            { text: '⬅️ Главное меню', callback_data: 'main_menu' }
          ]
        ]
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Error sending notification', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
