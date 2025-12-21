/**
 * Audio Upload & Reference Callback Handlers
 */

import { answerCallbackQuery } from '../telegram-api.ts';

export async function handleAudioCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  // Audio upload actions
  if (data.startsWith('audio_action_')) {
    const action = data.replace('audio_action_', '');
    const { handleAudioActionCallback } = await import('../commands/audio-upload.ts');
    await handleAudioActionCallback(chatId, userId, action, messageId, queryId);
    return true;
  }

  // Cancel upload
  if (data === 'cancel_upload') {
    const { handleCancelUploadCallback } = await import('../commands/audio-upload.ts');
    await handleCancelUploadCallback(chatId, userId, messageId, queryId);
    return true;
  }

  // My uploads
  if (data === 'my_uploads') {
    const { handleMyUploads } = await import('../commands/upload.ts');
    await handleMyUploads(chatId, userId, messageId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Start upload
  if (data === 'start_upload') {
    const { handleUploadCommand } = await import('../commands/upload.ts');
    await handleUploadCommand(chatId, userId, '', messageId, true);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Reference handlers
  if (data.startsWith('select_ref_')) {
    const refId = data.replace('select_ref_', '');
    const { handleSelectReference } = await import('../commands/upload.ts');
    await handleSelectReference(chatId, userId, refId, messageId, queryId);
    return true;
  }

  if (data.startsWith('use_ref_cover_')) {
    const refId = data.replace('use_ref_cover_', '');
    const { handleUseReference } = await import('../commands/upload.ts');
    await handleUseReference(chatId, userId, refId, 'cover', messageId, queryId);
    return true;
  }

  if (data.startsWith('use_ref_extend_')) {
    const refId = data.replace('use_ref_extend_', '');
    const { handleUseReference } = await import('../commands/upload.ts');
    await handleUseReference(chatId, userId, refId, 'extend', messageId, queryId);
    return true;
  }

  if (data.startsWith('delete_ref_')) {
    const refId = data.replace('delete_ref_', '');
    const { handleDeleteReference } = await import('../commands/upload.ts');
    await handleDeleteReference(chatId, userId, refId, messageId, queryId);
    return true;
  }

  // Show lyrics from reference
  if (data.startsWith('show_lyrics_')) {
    const refId = data.replace('show_lyrics_', '');
    const { handleShowLyrics } = await import('../commands/upload.ts');
    await handleShowLyrics(chatId, refId, messageId, queryId);
    return true;
  }

  // Generate from reference
  if (data.startsWith('ref_generate_cover_')) {
    const refId = data.replace('ref_generate_cover_', '');
    const { handleGenerateFromReference } = await import('../commands/upload.ts');
    await handleGenerateFromReference(chatId, userId, refId, 'cover', messageId, queryId);
    return true;
  }

  if (data.startsWith('ref_generate_extend_')) {
    const refId = data.replace('ref_generate_extend_', '');
    const { handleGenerateFromReference } = await import('../commands/upload.ts');
    await handleGenerateFromReference(chatId, userId, refId, 'extend', messageId, queryId);
    return true;
  }

  // Recognition
  if (data === 'cancel_recognize') {
    const { handleCancelRecognize } = await import('../commands/recognize.ts');
    await handleCancelRecognize(chatId, userId, messageId, queryId);
    return true;
  }

  if (data === 'recognize_again') {
    const { handleRecognizeAgain } = await import('../commands/recognize.ts');
    await handleRecognizeAgain(chatId, userId);
    await answerCallbackQuery(queryId);
    return true;
  }

  // Guitar
  if (data === 'cancel_guitar') {
    const { handleCancelGuitar } = await import('../commands/guitar.ts');
    await handleCancelGuitar(chatId, userId, messageId, queryId);
    return true;
  }

  if (data === 'guitar_again') {
    const { handleGuitarAgain } = await import('../commands/guitar.ts');
    await handleGuitarAgain(chatId, userId);
    await answerCallbackQuery(queryId);
    return true;
  }

  return false;
}
