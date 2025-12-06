import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getTelegramConfig, getTrackDeepLink } from '../_shared/telegram-config.ts';
import { escapeMarkdown } from '../_shared/telegram-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AudioClipData {
  audioUrl: string;
  title: string;
  duration?: number;
  versionLabel: string;
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
    console.warn('Invalid chat_id:', chatId);
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
      console.warn(`Chat unavailable (${chatId}): ${errorDesc}`);
      return { ok: false, skipped: true, reason: 'chat_unavailable' };
    }
    console.error('Telegram API error:', result);
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  return { ok: true, result };
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
    console.warn('Invalid chat_id for audio:', chatId);
    return { ok: false, skipped: true, reason: 'invalid_chat_id' };
  }

  console.log(`📤 sendTelegramAudio: chatId=${chatId}, title="${options.title}", audioUrl=${audioUrl.substring(0, 80)}...`);

  // Download audio file as blob for proper title display in Telegram
  let audioBlob: Blob | null = null;
  try {
    console.log('⬇️ Downloading audio file...');
    const audioResponse = await fetch(audioUrl);
    if (audioResponse.ok) {
      audioBlob = await audioResponse.blob();
      console.log(`✅ Audio downloaded: ${audioBlob.size} bytes`);
    } else {
      console.warn(`⚠️ Failed to download audio: ${audioResponse.status}`);
    }
  } catch (downloadError) {
    console.warn('⚠️ Audio download error:', downloadError);
  }

  // Download thumbnail if available
  let thumbBlob: Blob | null = null;
  if (options.coverUrl) {
    try {
      const thumbResponse = await fetch(options.coverUrl);
      if (thumbResponse.ok) {
        thumbBlob = await thumbResponse.blob();
        console.log(`✅ Thumbnail downloaded: ${thumbBlob.size} bytes`);
      }
    } catch (error) {
      console.warn('⚠️ Error downloading cover:', error);
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
    console.log('📦 Sending via FormData (blob)...');
  } else {
    formData.append('audio', audioUrl);
    console.log('📦 Sending via FormData (URL fallback)...');
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
      console.warn(`Chat unavailable for audio (${chatId}): ${errorDesc}`);
      return { ok: false, skipped: true, reason: 'chat_unavailable' };
    }
    console.error('❌ Telegram API error for audio:', result);
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  console.log('✅ Audio sent successfully to Telegram');
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
    console.warn('Invalid chat_id for video:', chatId);
    return { ok: false, skipped: true, reason: 'invalid_chat_id' };
  }

  console.log(`🎬 sendTelegramVideo: chatId=${chatId}, title="${options.title}"`);

  // Download video file as blob
  let videoBlob: Blob | null = null;
  try {
    console.log('⬇️ Downloading video file...');
    const videoResponse = await fetch(videoUrl);
    if (videoResponse.ok) {
      videoBlob = await videoResponse.blob();
      console.log(`✅ Video downloaded: ${videoBlob.size} bytes`);
    } else {
      console.warn(`⚠️ Failed to download video: ${videoResponse.status}`);
    }
  } catch (downloadError) {
    console.warn('⚠️ Video download error:', downloadError);
  }

  // Download thumbnail if available
  let thumbBlob: Blob | null = null;
  if (options.coverUrl) {
    try {
      const thumbResponse = await fetch(options.coverUrl);
      if (thumbResponse.ok) {
        thumbBlob = await thumbResponse.blob();
        console.log(`✅ Thumbnail downloaded: ${thumbBlob.size} bytes`);
      }
    } catch (error) {
      console.warn('⚠️ Error downloading cover:', error);
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
    console.log('📦 Sending video via FormData (blob)...');
  } else {
    formData.append('video', videoUrl);
    console.log('📦 Sending video via FormData (URL fallback)...');
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
      console.warn(`Chat unavailable for video (${chatId}): ${errorDesc}`);
      return { ok: false, skipped: true, reason: 'chat_unavailable' };
    }
    console.error('❌ Telegram API error for video:', result);
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  console.log('✅ Video sent successfully to Telegram');
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
      console.warn('No chat_id available for notification');
      return new Response(
        JSON.stringify({ success: false, error: 'No chat_id available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user wants this type of notification
    const notificationType = type || status || 'general';
    const canSend = await canSendNotification(supabase, user_id, finalChatId, notificationType);
    
    if (!canSend) {
      console.log('Notification blocked by user settings:', { chatId: finalChatId, type: notificationType });
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'user_settings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramConfig = getTelegramConfig();
    const miniAppUrl = telegramConfig.miniAppUrl;
    const botDeepLink = telegramConfig.deepLinkBase;

    // Handle multi-version generation complete (both A and B in sequence)
    if (type === 'generation_complete_multi' && audioClips && audioClips.length > 0) {
      console.log(`📤 Sending multi-version notification with ${audioClips.length} audio clips`);
      
      // Format tags without # prefix (cleaner look)
      const tagsText = tags 
        ? `\n🏷️ ${tags.split(',').slice(0, 3).map(t => escapeMarkdown(t.trim())).join(', ')}`
        : '';
      
      const versionText = audioClips.length > 1 ? `\n🎭 Версий: ${audioClips.length}` : '';
      
      // Send each audio with caption only on first
      for (let i = 0; i < audioClips.length; i++) {
        const clip = audioClips[i];
        const isFirst = i === 0;
        const isLast = i === audioClips.length - 1;
        
        const durationText = clip.duration 
          ? `⏱️ ${Math.floor(clip.duration / 60)}:${String(Math.floor(clip.duration % 60)).padStart(2, '0')}`
          : '';
        
        // Only first message has full caption, others just version label
        const caption = isFirst
          ? `🎵 *${escapeMarkdown('Генерация завершена!')}*\n\n🎶 *${escapeMarkdown(title || 'Новый трек')}*${style ? `\n🎸 ${escapeMarkdown(style.split(',')[0])}` : ''}${tagsText}${versionText}\n\n_Версия ${clip.versionLabel}_ ${durationText ? `\\| ${durationText}` : ''}`
          : `_Версия ${clip.versionLabel}_ ${durationText ? `\\| ${durationText}` : ''}`;
        
        const audioResult = await sendTelegramAudio(finalChatId, clip.audioUrl, {
          caption,
          title: clip.title,
          performer: '@AIMusicVerseBot',
          duration: clip.duration ? Math.round(clip.duration) : undefined,
          coverUrl: isFirst ? coverUrl : undefined, // Cover only on first
          replyMarkup: isLast ? {
            inline_keyboard: [
              [{ text: '🎵 Открыть в приложении', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
              [
                { text: '📝 Текст', callback_data: `lyrics_${finalTrackId}` },
                { text: '🎨 Студия', callback_data: `studio_${finalTrackId}` }
              ],
              [
                { text: '🎵 Создать еще', callback_data: 'generate' },
                { text: '📚 Библиотека', callback_data: 'library' }
              ]
            ]
          } : undefined
        });
        
        if (!audioResult.ok) {
          console.error(`❌ Failed to send audio ${clip.versionLabel}:`, audioResult);
        } else {
          console.log(`✅ Audio ${clip.versionLabel} sent`);
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
      console.log('📤 Sending generation complete notification with audio');
      
      const durationText = duration 
        ? `⏱️ ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`
        : '';
      
      // Format tags without # prefix for cleaner look
      const tagsText = tags 
        ? `\n🏷️ ${tags.split(',').slice(0, 3).map(t => escapeMarkdown(t.trim())).join(', ')}`
        : '';
      
      // Version info - show if multiple versions are being sent
      const versionText = currentVersion && totalVersions && totalVersions > 1
        ? `\n🎭 Версия ${versionLabel || currentVersion} из ${totalVersions}`
        : (versionsCount && versionsCount > 1 ? `\n🎭 Создано версий: ${versionsCount}` : '');
      
      const modeEmoji = generationMode === 'upload_cover' ? '🎤' 
        : generationMode === 'upload_extend' ? '⏩'
        : generationMode === 'add_vocals' ? '🎙️'
        : generationMode === 'add_instrumental' ? '🎸'
        : '🎵';
      
      const modeText = generationMode === 'upload_cover' ? 'Кавер готов' 
        : generationMode === 'upload_extend' ? 'Расширение готово'
        : generationMode === 'add_vocals' ? 'Вокал добавлен'
        : generationMode === 'add_instrumental' ? 'Инструментал добавлен'
        : 'Генерация завершена';
      
      const caption = `${modeEmoji} *${escapeMarkdown(modeText)}\\!*\n\n🎵 *${escapeMarkdown(title || 'Новый трек')}*${style ? `\n🎸 ${escapeMarkdown(style.split(',')[0])}` : ''}${durationText ? `\n${durationText}` : ''}${tagsText}${versionText}\n\n✨ _Создано в @AIMusicVerseBot_ ✨`;
      
      await sendTelegramAudio(finalChatId, audioUrl, {
        caption,
        title: title || 'AI Music Track',
        performer: '@AIMusicVerseBot',
        duration: duration ? Math.round(duration) : undefined,
        coverUrl: coverUrl,
        replyMarkup: {
          inline_keyboard: [
            [{ text: '🎵 Открыть в приложении', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
            [
              { text: '📝 Текст', callback_data: `lyrics_${finalTrackId}` },
              { text: '📊 Статистика', callback_data: `stats_${finalTrackId}` }
            ],
            [
              { text: '🔄 Ремикс', callback_data: `remix_${finalTrackId}` },
              { text: '🎨 Студия', callback_data: `studio_${finalTrackId}` }
            ],
            [
              { text: '🎵 Создать еще', callback_data: 'generate' },
              { text: '📚 Библиотека', callback_data: 'library' }
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
      console.log(`🎬 Processing ${type} notification`);
      
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
        
        const caption = `🎬 *${type === 'video_ready' ? 'Ваш видеоклип готов\\!' : 'Видеоклип'}*\n\n🎵 *${trackTitle}*${trackStyle ? `\n🎸 ${trackStyle}` : ''}\n\n✨ _Создано в @AIMusicVerseBot_ ✨`;
        
        await sendTelegramVideo(finalChatId, finalVideoUrl, {
          caption,
          title: title || trackData?.title || 'Video Clip',
          coverUrl: trackData?.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: '🎵 Открыть в приложении', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
              [
                { text: '📥 Скачать видео', callback_data: `dl_video_${finalTrackId}` },
                { text: '📤 Поделиться', callback_data: `share_video_${finalTrackId}` }
              ],
              [{ text: '🎵 Создать ещё', callback_data: 'generate' }]
            ]
          }
        });

        return new Response(
          JSON.stringify({ success: true, type: type }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle track share type
    if (type === 'track_share' && finalTrackId) {
      console.log(`📤 Processing track_share for track: ${finalTrackId}, chat: ${finalChatId}`);
      
      const { data: track, error: trackError } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', finalTrackId)
        .single();

      if (trackError) {
        console.error('❌ Error fetching track:', trackError);
        return new Response(
          JSON.stringify({ success: false, error: 'Track not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (track?.audio_url) {
        const durationText = track.duration_seconds 
          ? `⏱️ ${Math.floor(track.duration_seconds / 60)}:${String(Math.floor(track.duration_seconds % 60)).padStart(2, '0')}`
          : '';
        
        // Escape tags properly - # is a reserved character in MarkdownV2
        const tagsText = track.tags 
          ? `\n🏷️ ${track.tags.split(',').slice(0, 3).map((t: string) => escapeMarkdown(`#${t.trim().replace(/\s+/g, '_').toLowerCase()}`)).join(' ')}`
          : '';
        
        const caption = `🎵 *${escapeMarkdown(track.title || 'Новый трек')}*${track.style ? `\n🎸 ${escapeMarkdown(track.style.split(',')[0])}` : ''}${durationText ? `\n${durationText}` : ''}${tagsText}\n\n✨ _Создано в @AIMusicVerseBot_ ✨`;
        
        await sendTelegramAudio(finalChatId, track.audio_url, {
          caption,
          title: track.title || 'AIMusicVerse Track',
          performer: '@AIMusicVerseBot',
          duration: track.duration_seconds || undefined,
          coverUrl: track.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: '🎵 Открыть в приложении', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
              [
                { text: '🔄 Создать ремикс', callback_data: `remix_${finalTrackId}` },
                { text: '📤 Поделиться', callback_data: `share_${finalTrackId}` }
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

    // Handle completed status
    if (status === 'completed' && finalTrackId) {
      const { data: track } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', finalTrackId)
        .single();
      
      if (track?.audio_url) {
        const durationSeconds = track.duration_seconds || 0;
        const durationText = `${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, '0')}`;
        
        const tagsText = track.tags 
        ? `\n🏷️ ${track.tags.split(',').slice(0, 3).map((t: string) => escapeMarkdown(`#${t.trim().replace(/\s+/g, '_').toLowerCase()}`)).join(' ')}`
        : '';
        
        const lyricsPreview = track.lyrics 
          ? `\n\n📝 _${escapeMarkdown(track.lyrics.slice(0, 100))}${track.lyrics.length > 100 ? '...' : ''}_`
          : '';
        
        const caption = `🎉 *Ваш трек готов\\!*\n\n🎵 *${escapeMarkdown(track.title || 'Новый трек')}*${track.style ? `\n🎸 ${escapeMarkdown(track.style.split(',')[0])}` : ''}\n⏱️ ${durationText}${tagsText}${lyricsPreview}\n\n✨ _Создано в @AIMusicVerseBot_ ✨`;
        
        await sendTelegramAudio(finalChatId, track.audio_url, {
          caption,
          title: track.title || 'MusicVerse Track',
          performer: '@AIMusicVerseBot',
          duration: durationSeconds,
          coverUrl: track.cover_url,
          replyMarkup: {
            inline_keyboard: [
              [{ text: '🎵 Открыть в приложении', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
              [
                { text: '📝 Текст', callback_data: `lyrics_${finalTrackId}` },
                { text: '📊 Статистика', callback_data: `stats_${finalTrackId}` }
              ],
              [
                { text: '🔄 Ремикс', callback_data: `remix_${finalTrackId}` },
                { text: '📥 Скачать', callback_data: `dl_${finalTrackId}` }
              ],
              [
                { text: '🎵 Создать еще', callback_data: 'generate' },
                { text: '📚 Библиотека', callback_data: 'library' }
              ]
            ]
          }
        });
      } else {
        const trackTitle = escapeMarkdown(track?.title || 'Новый трек');
        const trackStyle = track?.style ? escapeMarkdown(track.style) : '';
        const message = `🎉 *Ваш трек готов\\!*\n\n🎵 *${trackTitle}*\n${trackStyle ? `🎸 Стиль: ${trackStyle}` : ''}\n\nОткройте в приложении для прослушивания\\! 🎧`;
        
        await sendTelegramMessage(finalChatId, message, {
          inline_keyboard: [
            [{ text: '🎧 Открыть трек', url: `${botDeepLink}?startapp=track_${finalTrackId}` }],
            [{ text: '🔄 Создать еще', callback_data: 'generate' }]
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
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
