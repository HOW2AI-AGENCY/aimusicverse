/**
 * Inline Chosen Result Handler
 * Handles chosen_inline_result events for analytics and actions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { logger } from '../utils/index.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export interface ChosenInlineResult {
  result_id: string;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  query: string;
  inline_message_id?: string;
}

/**
 * Handle chosen inline result event
 * Called when user selects a result from inline query
 */
export async function handleChosenInlineResult(
  chosen: ChosenInlineResult
): Promise<void> {
  const { result_id, from, query, inline_message_id } = chosen;

  logger.info('chosen_inline_result', {
    userId: from.id,
    resultId: result_id,
    query,
    hasInlineMessageId: !!inline_message_id,
  });

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', from.id)
      .single();

    // Determine result type from ID prefix
    const resultType = getResultType(result_id);

    // Log to analytics table
    await logChosenResult({
      userId: profile?.user_id,
      telegramUserId: from.id,
      resultId: result_id,
      resultType,
      query,
      inlineMessageId: inline_message_id,
    });

    // Handle specific result types
    switch (resultType) {
      case 'track':
        await handleTrackChosen(result_id, from.id);
        break;
      case 'generation':
        await handleGenerationChosen(result_id, from.id, inline_message_id);
        break;
      case 'project':
        await handleProjectChosen(result_id, from.id);
        break;
      default:
        // Just log, no special action
        break;
    }
  } catch (error) {
    logger.error('handle_chosen_inline_result_error', error);
  }
}

/**
 * Get result type from result ID
 */
function getResultType(resultId: string): string {
  if (resultId.startsWith('gen_')) return 'generation';
  if (resultId.startsWith('proj_')) return 'project';
  if (resultId.startsWith('hint_')) return 'hint';
  // Default to track (UUIDs are track IDs)
  return 'track';
}

/**
 * Log chosen result to analytics table
 */
async function logChosenResult(data: {
  userId?: string;
  telegramUserId: number;
  resultId: string;
  resultType: string;
  query: string;
  inlineMessageId?: string;
}): Promise<void> {
  try {
    await supabase.from('inline_result_chosen').insert({
      user_id: data.userId,
      telegram_user_id: data.telegramUserId,
      result_id: data.resultId,
      result_type: data.resultType,
      query: data.query,
      inline_message_id: data.inlineMessageId,
    });
  } catch (error) {
    logger.error('log_chosen_result_error', error);
  }
}

/**
 * Handle track selection - increment share count
 */
async function handleTrackChosen(
  resultId: string,
  _telegramUserId: number
): Promise<void> {
  try {
    // result_id is the track UUID
    await supabase.rpc('increment_track_share_count', {
      track_uuid: resultId,
    });

    logger.info('track_shared_via_inline', { trackId: resultId });
  } catch (error) {
    logger.error('handle_track_chosen_error', error);
  }
}

/**
 * Handle generation selection - start inline generation
 */
async function handleGenerationChosen(
  resultId: string,
  telegramUserId: number,
  inlineMessageId?: string
): Promise<void> {
  // Extract style from result ID (gen_rock -> rock)
  const style = resultId.replace('gen_', '');

  logger.info('inline_generation_initiated', {
    telegramUserId,
    style,
    inlineMessageId,
  });

  // Note: Full inline generation would require editMessageText with inline_message_id
  // This is a placeholder for future implementation
  // The actual generation would be triggered and progress updated via inline_message_id
}

/**
 * Handle project selection
 */
async function handleProjectChosen(
  resultId: string,
  _telegramUserId: number
): Promise<void> {
  const projectId = resultId.replace('proj_', '');

  logger.info('project_shared_via_inline', { projectId });

  // Could increment project share count or log analytics
}

/**
 * Edit inline message (for generation progress updates)
 */
export async function editInlineMessage(
  inlineMessageId: string,
  text: string,
  replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> }
): Promise<boolean> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken || !inlineMessageId) return false;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/editMessageText`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inline_message_id: inlineMessageId,
          text,
          parse_mode: 'MarkdownV2',
          reply_markup: replyMarkup,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('edit_inline_message_failed', { error });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('edit_inline_message_error', error);
    return false;
  }
}
