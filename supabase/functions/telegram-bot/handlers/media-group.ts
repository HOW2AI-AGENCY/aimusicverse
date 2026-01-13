/**
 * Media Group Handler
 * Handles sending multiple tracks as a batch and processing media groups from users
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, escapeMarkdownV2 } from '../telegram-api.ts';
import { musicService } from '../core/services/music.ts';
import { logBotAction } from '../utils/bot-logger.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('media-group-handler');

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_CONFIG.botToken}`;

const supabase = getSupabaseClient();

interface MediaItem {
  type: 'audio' | 'photo' | 'video' | 'document';
  media: string;
  caption?: string;
  parse_mode?: string;
  title?: string;
  performer?: string;
  duration?: number;
}

interface TrackInfo {
  id: string;
  title: string;
  audioUrl: string;
  coverUrl?: string;
  duration?: number | null;
  artist?: string;
}

/**
 * Send multiple tracks as a media group (batch)
 * Telegram allows up to 10 items in a media group
 */
export async function sendTrackBatch(
  chatId: number,
  trackIds: string[],
  options: {
    showProgress?: boolean;
    caption?: string;
  } = {}
): Promise<{ success: boolean; messageIds: number[]; errors: string[] }> {
  const errors: string[] = [];
  const messageIds: number[] = [];
  
  // Limit to 10 tracks (Telegram limit)
  const limitedIds = trackIds.slice(0, 10);
  
  if (options.showProgress) {
    await sendMessage(chatId, `⏳ Подготовка ${limitedIds.length} треков\\.\\.\\.`);
  }
  
  // Fetch track data
  const tracks: TrackInfo[] = [];
  for (const trackId of limitedIds) {
    try {
      const track = await musicService.getTrackById(trackId);
      if (track) {
        const audioUrl = musicService.getAudioUrl(track);
        if (audioUrl) {
          tracks.push({
            id: track.id,
            title: track.title || 'Untitled',
            audioUrl,
            coverUrl: musicService.getCoverUrl(track),
            duration: track.duration_seconds,
            artist: track.artist || 'MusicVerse AI',
          });
        } else {
          errors.push(`Track ${trackId}: audio not available`);
        }
      } else {
        errors.push(`Track ${trackId}: not found`);
      }
    } catch (e) {
      errors.push(`Track ${trackId}: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }
  
  if (tracks.length === 0) {
    await sendMessage(chatId, '❌ Не удалось загрузить треки\\.');
    return { success: false, messageIds: [], errors };
  }
  
  // For audio, we can't use sendMediaGroup - we need to send individually
  // But we can batch them quickly with concurrent sends
  const sendPromises = tracks.map(async (track, index) => {
    try {
      const caption = index === 0 && options.caption 
        ? options.caption 
        : `🎵 *${escapeMarkdownV2(track.title)}*`;
      
      const result = await sendAudioWithMetadata(chatId, track, caption);
      if (result?.result?.message_id) {
        return { success: true, messageId: result.result.message_id };
      }
      return { success: false, error: 'No message ID returned' };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'unknown' };
    }
  });
  
  const results = await Promise.all(sendPromises);
  
  for (const result of results) {
    if (result.success && result.messageId) {
      messageIds.push(result.messageId);
    } else if (result.error) {
      errors.push(result.error);
    }
  }
  
  await logBotAction(0, chatId, 'batch_tracks_sent', {
    track_count: tracks.length,
    success_count: messageIds.length,
    error_count: errors.length,
  });
  
  return { 
    success: messageIds.length > 0, 
    messageIds, 
    errors 
  };
}

/**
 * Send audio with full metadata for native Telegram player
 */
async function sendAudioWithMetadata(
  chatId: number,
  track: TrackInfo,
  caption: string
): Promise<any> {
  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  
  // Download audio
  try {
    const audioResponse = await fetch(track.audioUrl);
    if (audioResponse.ok) {
      const audioBlob = await audioResponse.blob();
      formData.append('audio', audioBlob, `${track.title}.mp3`);
    } else {
      formData.append('audio', track.audioUrl);
    }
  } catch (e) {
    formData.append('audio', track.audioUrl);
  }
  
  formData.append('title', track.title);
  formData.append('performer', track.artist || 'MusicVerse AI');
  if (track.duration) formData.append('duration', track.duration.toString());
  formData.append('caption', caption);
  formData.append('parse_mode', 'MarkdownV2');
  
  // Download and attach thumbnail
  if (track.coverUrl) {
    try {
      const thumbResponse = await fetch(track.coverUrl);
      if (thumbResponse.ok) {
        const thumbBlob = await thumbResponse.blob();
        formData.append('thumbnail', thumbBlob, 'cover.jpg');
      }
    } catch {
      // Ignore thumbnail errors
    }
  }
  
  const response = await fetch(`${TELEGRAM_API}/sendAudio`, {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
}

/**
 * Handle incoming media group from user
 * Stores files temporarily and presents action options
 */
interface MediaGroupFile {
  file_id: string;
  file_type: 'audio' | 'voice' | 'document';
  file_name?: string;
  mime_type?: string;
  duration?: number;
  file_size?: number;
}

// Temporary storage for media groups (userId -> files)
const pendingMediaGroups = new Map<number, {
  files: MediaGroupFile[];
  chatId: number;
  timestamp: number;
  timeoutId?: number;
}>();

/**
 * Add file to pending media group
 * Uses a timeout to collect all files before processing
 */
export function addToMediaGroup(
  userId: number,
  chatId: number,
  file: MediaGroupFile
): void {
  const existing = pendingMediaGroups.get(userId);
  
  if (existing) {
    existing.files.push(file);
    // Clear existing timeout and set new one
    if (existing.timeoutId) {
      clearTimeout(existing.timeoutId);
    }
  } else {
    pendingMediaGroups.set(userId, {
      files: [file],
      chatId,
      timestamp: Date.now(),
    });
  }
  
  // Set timeout to process after 500ms of no new files
  const group = pendingMediaGroups.get(userId)!;
  group.timeoutId = setTimeout(() => {
    processMediaGroup(userId);
  }, 500) as unknown as number;
}

/**
 * Process collected media group
 */
async function processMediaGroup(userId: number): Promise<void> {
  const group = pendingMediaGroups.get(userId);
  if (!group || group.files.length === 0) return;
  
  pendingMediaGroups.delete(userId);
  
  const { files, chatId } = group;
  
  logger.info(`Processing media group: ${files.length} files from user ${userId}`);
  
  // Store files in session for later processing
  await storeMediaGroupSession(userId, files);
  
  // Show options
  const fileTypes = files.map(f => f.file_type);
  const audioCount = fileTypes.filter(t => t === 'audio').length;
  const voiceCount = fileTypes.filter(t => t === 'voice').length;
  
  let description = `📦 *Получено ${files.length} файлов*\n\n`;
  if (audioCount > 0) description += `🎵 Аудио: ${audioCount}\n`;
  if (voiceCount > 0) description += `🎤 Голосовые: ${voiceCount}\n`;
  
  description += `\n👇 *Что сделать с файлами?*`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '☁️ Загрузить в облако', callback_data: 'mg_upload_all' },
        { text: '🔬 Анализировать', callback_data: 'mg_analyze_all' },
      ],
      [
        { text: '🎤 Создать каверы', callback_data: 'mg_cover_all' },
        { text: '➕ Расширить все', callback_data: 'mg_extend_all' },
      ],
      [
        { text: '🎛️ Разделить на стемы', callback_data: 'mg_stems_all' },
      ],
      [
        { text: '❌ Отмена', callback_data: 'mg_cancel' },
      ],
    ],
  };
  
  await sendMessage(chatId, description, keyboard);
  
  await logBotAction(userId, chatId, 'media_group_received', {
    file_count: files.length,
    audio_count: audioCount,
    voice_count: voiceCount,
  });
}

/**
 * Store media group session in database
 */
async function storeMediaGroupSession(
  userId: number,
  files: MediaGroupFile[]
): Promise<void> {
  try {
    // Use telegram_bot_sessions for temporary storage
    await supabase
      .from('telegram_bot_sessions')
      .upsert({
        telegram_user_id: userId,
        session_type: 'media_group',
        session_data: { files },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      }, {
        onConflict: 'telegram_user_id,session_type',
      });
  } catch (e) {
    logger.error('Failed to store media group session:', e);
  }
}

/**
 * Get pending media group files from session
 */
export async function getMediaGroupFiles(userId: number): Promise<MediaGroupFile[]> {
  try {
    const { data } = await supabase
      .from('telegram_bot_sessions')
      .select('session_data')
      .eq('telegram_user_id', userId)
      .eq('session_type', 'media_group')
      .single();
    
    if (data?.session_data?.files) {
      return data.session_data.files as MediaGroupFile[];
    }
  } catch {
    // No session found
  }
  return [];
}

/**
 * Clear media group session
 */
export async function clearMediaGroupSession(userId: number): Promise<void> {
  try {
    await supabase
      .from('telegram_bot_sessions')
      .delete()
      .eq('telegram_user_id', userId)
      .eq('session_type', 'media_group');
  } catch {
    // Ignore errors
  }
}

/**
 * Process all files in media group with specified action
 */
export async function processMediaGroupAction(
  chatId: number,
  userId: number,
  action: 'upload' | 'analyze' | 'cover' | 'extend' | 'stems',
  messageId?: number
): Promise<void> {
  const files = await getMediaGroupFiles(userId);
  
  if (files.length === 0) {
    await sendMessage(chatId, '❌ Файлы не найдены\\. Отправьте аудио снова\\.');
    return;
  }
  
  const actionLabels: Record<string, string> = {
    upload: 'Загрузка в облако',
    analyze: 'Анализ',
    cover: 'Создание каверов',
    extend: 'Расширение треков',
    stems: 'Разделение на стемы',
  };
  
  await sendMessage(chatId, `⏳ ${actionLabels[action]} \\(${files.length} файлов\\)\\.\\.\\.`);
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();
  
  if (!profile) {
    await sendMessage(chatId, '❌ Профиль не найден\\. Откройте Mini App для регистрации\\.');
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // Download file from Telegram
      const fileInfo = await getFileInfo(file.file_id);
      if (!fileInfo?.file_path) {
        errorCount++;
        continue;
      }
      
      const fileUrl = `https://api.telegram.org/file/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/${fileInfo.file_path}`;
      
      // Process based on action
      switch (action) {
        case 'upload':
          await processUploadAction(profile.user_id, file, fileUrl, chatId);
          break;
        case 'analyze':
          await processAnalyzeAction(profile.user_id, file, fileUrl, chatId);
          break;
        case 'cover':
        case 'extend':
          await processGenerationAction(profile.user_id, file, fileUrl, chatId, action);
          break;
        case 'stems':
          await processStemsAction(profile.user_id, file, fileUrl, chatId);
          break;
      }
      
      successCount++;
    } catch (e) {
      logger.error(`Error processing file ${i + 1}:`, e);
      errorCount++;
    }
  }
  
  // Clear session after processing
  await clearMediaGroupSession(userId);
  
  // Send summary
  let summary = `✅ *Обработка завершена*\n\n`;
  summary += `📁 Всего: ${files.length}\n`;
  summary += `✅ Успешно: ${successCount}\n`;
  if (errorCount > 0) summary += `❌ Ошибок: ${errorCount}\n`;
  
  await sendMessage(chatId, summary);
  
  await logBotAction(userId, chatId, 'media_group_processed', {
    action,
    total: files.length,
    success: successCount,
    errors: errorCount,
  });
}

/**
 * Get file info from Telegram
 */
async function getFileInfo(fileId: string): Promise<{ file_path?: string } | null> {
  try {
    const response = await fetch(`${TELEGRAM_API}/getFile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId }),
    });
    
    const result = await response.json();
    if (result.ok) {
      return result.result;
    }
  } catch (e) {
    logger.error('getFile error:', e);
  }
  return null;
}

/**
 * Upload file to cloud storage
 */
async function processUploadAction(
  userId: string,
  file: MediaGroupFile,
  fileUrl: string,
  chatId: number
): Promise<void> {
  const fileName = file.file_name || `audio_${Date.now()}.mp3`;
  
  // Download file
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error('Failed to download file');
  
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  
  // Upload to storage
  const storagePath = `${userId}/${Date.now()}_${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('reference-audio')
    .upload(storagePath, arrayBuffer, {
      contentType: file.mime_type || 'audio/mpeg',
    });
  
  if (uploadError) throw uploadError;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('reference-audio')
    .getPublicUrl(storagePath);
  
  // Create reference_audio record
  await supabase.from('reference_audio').insert({
    user_id: userId,
    file_url: publicUrl,
    file_name: fileName,
    file_size: file.file_size,
    mime_type: file.mime_type,
    duration_seconds: file.duration,
    source: 'telegram_batch',
    telegram_file_id: file.file_id,
  });
}

/**
 * Analyze audio file
 */
async function processAnalyzeAction(
  userId: string,
  file: MediaGroupFile,
  fileUrl: string,
  chatId: number
): Promise<void> {
  // Call analysis pipeline
  const { data, error } = await supabase.functions.invoke('process-audio-pipeline', {
    body: {
      audioUrl: fileUrl,
      userId,
      options: {
        analyzeStyle: true,
        transcribeLyrics: true,
        detectBeats: true,
      },
    },
  });
  
  if (error) throw error;
}

/**
 * Process cover/extend generation
 */
async function processGenerationAction(
  userId: string,
  file: MediaGroupFile,
  fileUrl: string,
  chatId: number,
  mode: 'cover' | 'extend'
): Promise<void> {
  const endpoint = mode === 'cover' ? 'suno-upload-cover' : 'suno-upload-extend';
  
  // Download and convert to base64
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  
  const { data, error } = await supabase.functions.invoke(endpoint, {
    body: {
      userId,
      audioData: `data:${file.mime_type || 'audio/mpeg'};base64,${base64}`,
      fileName: file.file_name || 'audio.mp3',
    },
  });
  
  if (error) throw error;
}

/**
 * Process stem separation
 */
async function processStemsAction(
  userId: string,
  file: MediaGroupFile,
  fileUrl: string,
  chatId: number
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('stem-separation', {
    body: {
      audioUrl: fileUrl,
      userId,
      mode: 'htdemucs',
    },
  });
  
  if (error) throw error;
}
