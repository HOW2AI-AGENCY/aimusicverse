/**
 * MIDI Callback Handlers
 */

import { answerCallbackQuery } from '../telegram-api.ts';

export async function handleMidiCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  // Cancel MIDI
  if (data === 'cancel_midi') {
    const { handleCancelMidi } = await import('../commands/midi.ts');
    await handleCancelMidi(chatId, userId, messageId, queryId);
    return true;
  }

  // MIDI again
  if (data === 'midi_again') {
    const { handleMidiAgainCallback } = await import('../commands/midi.ts');
    await handleMidiAgainCallback(chatId, userId, queryId);
    return true;
  }

  // MIDI upload
  if (data === 'midi_upload') {
    const { handleMidiUploadCallback } = await import('../commands/midi.ts');
    await handleMidiUploadCallback(chatId, userId, messageId, queryId);
    return true;
  }

  // Select track for MIDI
  if (data.startsWith('midi_track_')) {
    const trackId = data.replace('midi_track_', '');
    const { handleMidiTrackCallback } = await import('../commands/midi.ts');
    await handleMidiTrackCallback(chatId, trackId, messageId, queryId);
    return true;
  }

  // MIDI model: basic-pitch
  if (data.startsWith('midi_bp_')) {
    const trackId = data.replace('midi_bp_', '');
    const { handleMidiModelCallback } = await import('../commands/midi.ts');
    await handleMidiModelCallback(chatId, userId, trackId, 'basic-pitch', messageId, queryId);
    return true;
  }

  // MIDI model: mt3
  if (data.startsWith('midi_mt3_')) {
    const trackId = data.replace('midi_mt3_', '');
    const { handleMidiModelCallback } = await import('../commands/midi.ts');
    await handleMidiModelCallback(chatId, userId, trackId, 'mt3', messageId, queryId);
    return true;
  }

  // MIDI model: pop2piano
  if (data.startsWith('midi_p2p_')) {
    const trackId = data.replace('midi_p2p_', '');
    const { handleMidiModelCallback } = await import('../commands/midi.ts');
    await handleMidiModelCallback(chatId, userId, trackId, 'pop2piano', messageId, queryId);
    return true;
  }

  return false;
}
