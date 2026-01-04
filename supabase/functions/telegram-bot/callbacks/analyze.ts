/**
 * Analyze Callback Handlers
 */

import { answerCallbackQuery } from '../telegram-api.ts';

export async function handleAnalyzeCallbacks(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  // Analyze command trigger
  if (data === 'analyze') {
    const { handleAnalyzeCommand } = await import('../commands/analyze.ts');
    await handleAnalyzeCommand(chatId, userId, '');
    await answerCallbackQuery(queryId);
    return true;
  }

  // Analyze list
  if (data === 'analyze_list') {
    const { handleAnalyzeList } = await import('../commands/analyze.ts');
    await handleAnalyzeList(chatId, userId, messageId, queryId);
    return true;
  }

  // Select reference for analysis
  if (data.startsWith('analyze_select_')) {
    const refId = data.replace('analyze_select_', '');
    const { handleAnalyzeSelect } = await import('../commands/analyze.ts');
    await handleAnalyzeSelect(chatId, userId, refId, messageId, queryId);
    return true;
  }

  // Transcription menu
  if (data.startsWith('analyze_transcribe_')) {
    const refId = data.replace('analyze_transcribe_', '');
    const { handleTranscribeMenu } = await import('../commands/analyze.ts');
    await handleTranscribeMenu(chatId, userId, refId, messageId, queryId);
    return true;
  }

  // Start transcription with model
  if (data.startsWith('analyze_tr_')) {
    const parts = data.replace('analyze_tr_', '').split('_');
    const model = parts[0];
    const refId = parts.slice(1).join('_');
    const { handleTranscription } = await import('../commands/analyze.ts');
    await handleTranscription(chatId, userId, refId, model, messageId, queryId);
    return true;
  }

  // Chord analysis
  if (data.startsWith('analyze_chords_')) {
    const refId = data.replace('analyze_chords_', '');
    const { handleChordAnalysis } = await import('../commands/analyze.ts');
    await handleChordAnalysis(chatId, userId, refId, messageId, queryId);
    return true;
  }

  // Beat analysis
  if (data.startsWith('analyze_beats_')) {
    const refId = data.replace('analyze_beats_', '');
    const { handleBeatAnalysis } = await import('../commands/analyze.ts');
    await handleBeatAnalysis(chatId, userId, refId, messageId, queryId);
    return true;
  }

  // Full analysis
  if (data.startsWith('analyze_full_')) {
    const refId = data.replace('analyze_full_', '');
    const { handleFullAnalysis } = await import('../commands/analyze.ts');
    await handleFullAnalysis(chatId, userId, refId, messageId, queryId);
    return true;
  }

  return false;
}
