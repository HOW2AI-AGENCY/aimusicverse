import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { createLogger } from '../_shared/logger.ts';
import { isSunoSuccessCode } from '../_shared/suno.ts';
import { corsHeaders } from '../_shared/cors.ts';

const logger = createLogger('suno-music-generate');

/**
 * Per SunoAPI docs (https://docs.sunoapi.org/suno-api/generate-music):
 * Model parameter accepts: V5, V4_5PLUS, V4_5, V4, V3_5 - NOT chirp-* names
 */
const VALID_MODELS = ['V5', 'V4_5PLUS', 'V4_5', 'V4', 'V3_5'];
const DEFAULT_MODEL = 'V4_5';

// Deprecated models that should be auto-migrated
const DEPRECATED_MODELS: Record<string, string> = {
  'V4AUK': 'V4_5',      // V4AUK deprecated - migrate to V4_5
  'V4_5ALL': 'V4_5',    // V4_5ALL deprecated - migrate to V4_5
  'chirp-v4': 'V4',     // Legacy chirp names
  'chirp-v3-5': 'V3_5',
};

// Fallback chain for model errors
const MODEL_FALLBACK_CHAIN: Record<string, string> = {
  'V5': 'V4_5PLUS',
  'V4_5PLUS': 'V4_5',
  'V4_5': 'V4',
  'V4': 'V3_5',
};

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  'model error': 'Ошибка модели AI. Пробуем другую модель...',
  'Audio generation failed': 'Генерация не удалась. Попробуйте изменить описание.',
  'malformed': 'Проверьте текст песни. Он должен содержать структуру (куплеты, припевы).',
  'artist name': 'Нельзя использовать имена известных артистов. Измените описание.',
  'copyrighted': 'Текст содержит защищённый материал. Измените слова.',
  'rate limit': 'Слишком много запросов. Подождите минуту.',
  'credits': 'Недостаточно кредитов на балансе.',
};

// Model-specific generation costs in user credits
const MODEL_COSTS: Record<string, number> = {
  V5: 12,
  V4_5PLUS: 12,
  V4_5: 12,
  V4_5ALL: 12,
  V4: 10,
  V3_5: 10,
};

// Default cost for unknown models
const DEFAULT_GENERATION_COST = 12;

// Get generation cost for a specific model
function getGenerationCost(modelKey: string): number {
  return MODEL_COSTS[modelKey] ?? DEFAULT_GENERATION_COST;
}

/**
 * Convert UI model key to API model name with fallback
 */
function getApiModelName(uiKey: string): string {
  // Check for deprecated models first
  if (DEPRECATED_MODELS[uiKey]) {
    logger.info('Migrating deprecated model', { from: uiKey, to: DEPRECATED_MODELS[uiKey] });
    return DEPRECATED_MODELS[uiKey];
  }
  // Return as-is if valid, otherwise default
  return VALID_MODELS.includes(uiKey) ? uiKey : DEFAULT_MODEL;
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyError(errorMsg: string): string {
  const lowerError = errorMsg.toLowerCase();
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (lowerError.includes(key.toLowerCase())) {
      return message;
    }
  }
  return errorMsg;
}

/**
 * Check if error is retriable with fallback model
 */
function isRetriableModelError(errorMsg: string): boolean {
  const lowerError = errorMsg.toLowerCase();
  return lowerError.includes('model error') || lowerError.includes('audio generation failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    const miniAppUrl = Deno.env.get('MINI_APP_URL');

    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    const supabase = getSupabaseClient();
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('No authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      logger.error('User authentication failed', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if user is admin - admins use shared API balance, not personal credits
    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });
    
    logger.info('User role check', { userId: user.id, isAdmin: !!isAdmin });

    // Parse body first to get model for cost calculation
    const body = await req.json();
    const {
      mode = 'simple',
      instrumental = false,
      model = 'V4_5ALL',
      prompt,
      title,
      style,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      personaId,
      projectId,
      artistId,
      planTrackId, // Link to project_tracks for status update
      parentTrackId, // Link to parent track for remixes
      language = 'ru',
      isPublic = true, // Track visibility - default public
    } = body;

    // Calculate generation cost based on model
    const generationCost = getGenerationCost(model);

    // Only check personal balance for non-admin users
    if (!isAdmin) {
      logger.info('Checking user credits balance', { userId: user.id });
      
      const { data: userCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creditsError) {
        logger.error('Failed to fetch user credits', creditsError);
        return new Response(
          JSON.stringify({ success: false, error: 'Ошибка проверки баланса' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const userBalance = userCredits?.balance ?? 0;
      logger.info('User credit balance', { userId: user.id, balance: userBalance, required: generationCost, model });

      // Check if user has enough credits for generation
      if (userBalance < generationCost) {
        logger.warn('Insufficient user credits', { balance: userBalance, required: generationCost });
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Недостаточно кредитов. Баланс: ${userBalance}, требуется: ${generationCost}`,
            errorCode: 'INSUFFICIENT_CREDITS',
            balance: userBalance,
            required: generationCost,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
    } else {
      logger.info('Admin user - skipping personal balance check, using shared API balance');
    }
    
    // Update plan track status to in_progress if provided
    if (planTrackId) {
      await supabase
        .from('project_tracks')
        .update({ status: 'in_progress' })
        .eq('id', planTrackId);
    }

    // Validate required fields
    const customMode = mode === 'custom';

    // Prompt validation: required for simple mode and for custom mode with vocals
    // Instrumental tracks in custom mode don't require a prompt (lyrics)
    if (!prompt && (mode === 'simple' || (customMode && !instrumental))) {
      logger.warn('Prompt is required', { mode, instrumental });
      return new Response(
        JSON.stringify({ success: false, error: 'Требуется описание музыки' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (customMode && !style) {
      logger.warn('Style is required in custom mode');
      return new Response(
        JSON.stringify({ success: false, error: 'Укажите стиль музыки в custom режиме' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate prompt length for non-custom mode (Suno limit: 500 chars)
    if (!customMode && prompt.length > 500) {
      logger.warn('Prompt too long for simple mode', { promptLength: prompt.length });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Описание слишком длинное (${prompt.length}/500 символов). Сократите текст или используйте Custom режим.` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (customMode && !instrumental && prompt.length > 5000) {
      logger.warn('Prompt too long', { promptLength: prompt.length });
      return new Response(
        JSON.stringify({ success: false, error: 'Текст слишком длинный (макс. 5000 символов)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch artist data if artistId provided
    let artistData: { id: string; name: string; avatar_url: string | null; suno_persona_id: string | null } | null = null;
    if (artistId) {
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('id, name, avatar_url, suno_persona_id')
        .eq('id', artistId)
        .single();
      
      if (!artistError && artist) {
        artistData = artist;
        logger.info('Found artist', { name: artist.name, hasPersona: !!artist.suno_persona_id });
      }
    }

    // Use persona ID from artist if available, otherwise use direct personaId
    const effectivePersonaId = artistData?.suno_persona_id || personaId;

    // Get creator display name for metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_id, display_name, username, first_name')
      .eq('user_id', user.id)
      .single();

    const telegramChatId = profile?.telegram_id || null;
    const creatorDisplayName = profile?.display_name || profile?.username || profile?.first_name || null;

    // Create track record with artist info and creator metadata - ALL TRACKS ARE PUBLIC BY DEFAULT
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        user_id: user.id,
        project_id: projectId,
        project_track_id: planTrackId || null, // Link to project_track slot immediately
        prompt: prompt,
        title: customMode ? title : null,
        style: style,
        has_vocals: !instrumental,
        status: 'pending',
        provider: 'suno',
        suno_model: model,
        generation_mode: mode,
        vocal_gender: vocalGender,
        style_weight: styleWeight,
        negative_tags: negativeTags,
        is_public: isPublic, // Use value from request, default true
        parent_track_id: parentTrackId || null, // Link to parent track for remixes
        // Store artist reference
        artist_id: artistData?.id || null,
        artist_name: artistData?.name || null,
        artist_avatar_url: artistData?.avatar_url || null,
        // Store creator display name
        creator_display_name: creatorDisplayName,
      })
      .select()
      .single();

    if (trackError || !track) {
      logger.error('Track creation error', trackError);
      throw new Error('Failed to create track record');
    }

    // Create generation task with planTrackId in audio_clips metadata for callback
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        prompt: prompt,
        status: 'pending',
        telegram_chat_id: telegramChatId,
        track_id: track.id,
        source: 'mini_app',
        generation_mode: mode,
        model_used: model,
        audio_clips: planTrackId ? JSON.stringify({ project_track_id: planTrackId }) : null,
      })
      .select()
      .single();

    if (taskError || !task) {
      logger.error('Task creation error', taskError);
      throw new Error('Failed to create generation task');
    }

    // Prepare SunoAPI request
    const callbackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;
    
    // Map UI model key to API model name
    const apiModel = getApiModelName(model);
    logger.info('Model mapping', { from: model, to: apiModel });
    
    const sunoPayload: any = {
      customMode,
      instrumental,
      model: apiModel,
      callBackUrl: callbackUrl,
    };

    if (customMode) {
      sunoPayload.prompt = prompt;
      sunoPayload.style = style;
      if (title) sunoPayload.title = title;
    } else {
      sunoPayload.prompt = prompt;
    }

    if (negativeTags) sunoPayload.negativeTags = negativeTags;
    if (vocalGender) sunoPayload.vocalGender = vocalGender;
    if (styleWeight !== undefined) sunoPayload.styleWeight = styleWeight;
    if (weirdnessConstraint !== undefined) sunoPayload.weirdnessConstraint = weirdnessConstraint;
    if (audioWeight !== undefined) sunoPayload.audioWeight = audioWeight;
    if (effectivePersonaId) sunoPayload.personaId = effectivePersonaId;

    logger.apiCall('suno', '/api/v1/generate', { mode, model: apiModel, instrumental });

    // Call SunoAPI with retry logic for model errors
    let currentModel = apiModel;
    let retryCount = 0;
    const maxRetries = 2;
    let sunoResponse: Response | null = null;
    let sunoData: any = null;
    let lastErrorMsg = '';

    while (retryCount <= maxRetries) {
      sunoPayload.model = currentModel;
      
      const startTime = Date.now();
      sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sunoPayload),
      });

      const duration = Date.now() - startTime;
      sunoData = await sunoResponse.json();
      
      logger.info('Suno API response', { 
        durationMs: duration, 
        status: sunoResponse.status, 
        model: currentModel,
        attempt: retryCount + 1 
      });

      // Log API call
      await supabase.from('api_usage_logs').insert({
        user_id: user.id,
        service: 'suno',
        endpoint: 'generate',
        method: 'POST',
        request_body: { ...sunoPayload, attempt: retryCount + 1 },
        response_status: sunoResponse.status,
        response_body: sunoData,
        duration_ms: duration,
        estimated_cost: 0.05,
      });

      // Check if successful
      if (sunoResponse.ok && isSunoSuccessCode(sunoData.code)) {
        break; // Success - exit loop
      }

      lastErrorMsg = sunoData.msg || 'SunoAPI request failed';
      
      // Check if this is a retriable model error
      if (isRetriableModelError(lastErrorMsg) && MODEL_FALLBACK_CHAIN[currentModel]) {
        const fallbackModel = MODEL_FALLBACK_CHAIN[currentModel];
        logger.warn('Model error, attempting fallback', { 
          from: currentModel, 
          to: fallbackModel, 
          error: lastErrorMsg 
        });
        currentModel = fallbackModel;
        retryCount++;
        continue;
      }

      // Non-retriable error - break out
      break;
    }

    // Handle final error state
    if (!sunoResponse || !sunoResponse.ok || !isSunoSuccessCode(sunoData?.code)) {
      logger.error('SunoAPI error (final)', null, { 
        status: sunoResponse?.status, 
        data: sunoData,
        attempts: retryCount + 1 
      });
      
      const userFriendlyError = getUserFriendlyError(lastErrorMsg);
      
      // Handle rate limiting
      if (sunoResponse?.status === 429) {
        const rateLimitMsg = 'Превышен лимит запросов. Попробуйте через минуту.';
        await supabase.from('generation_tasks').update({ 
          status: 'failed', 
          error_message: rateLimitMsg 
        }).eq('id', task.id);

        await supabase.from('tracks').update({ 
          status: 'failed', 
          error_message: rateLimitMsg 
        }).eq('id', track.id);

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: rateLimitMsg,
            errorCode: 'RATE_LIMIT',
            retryAfter: 60
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }

      // Handle insufficient credits
      if (sunoResponse?.status === 402) {
        const creditsMsg = 'Недостаточно кредитов на аккаунте';
        await supabase.from('generation_tasks').update({ 
          status: 'failed', 
          error_message: creditsMsg 
        }).eq('id', task.id);

        await supabase.from('tracks').update({ 
          status: 'failed', 
          error_message: creditsMsg 
        }).eq('id', track.id);

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: creditsMsg,
            errorCode: 'INSUFFICIENT_CREDITS'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      
      // Update task and track as failed with user-friendly error
      await supabase.from('generation_tasks').update({ 
        status: 'failed', 
        error_message: userFriendlyError 
      }).eq('id', task.id);

      await supabase.from('tracks').update({ 
        status: 'failed', 
        error_message: userFriendlyError 
      }).eq('id', track.id);

      // Determine error code for client
      let errorCode = 'GENERATION_FAILED';
      if (lastErrorMsg.toLowerCase().includes('artist name')) errorCode = 'ARTIST_NAME_NOT_ALLOWED';
      if (lastErrorMsg.toLowerCase().includes('copyrighted')) errorCode = 'COPYRIGHTED_CONTENT';
      if (lastErrorMsg.toLowerCase().includes('malformed')) errorCode = 'MALFORMED_LYRICS';

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: userFriendlyError,
          errorCode,
          originalError: lastErrorMsg,
          canRetry: !['ARTIST_NAME_NOT_ALLOWED', 'COPYRIGHTED_CONTENT', 'MALFORMED_LYRICS'].includes(errorCode)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Update model_used if fallback was used
    if (currentModel !== apiModel) {
      await supabase.from('generation_tasks').update({ 
        model_used: currentModel 
      }).eq('id', task.id);
      
      await supabase.from('tracks').update({ 
        suno_model: currentModel 
      }).eq('id', track.id);
    }

    const sunoTaskId = sunoData.data?.taskId;

    if (!sunoTaskId) {
      throw new Error('No taskId returned from SunoAPI');
    }

    // Update task with Suno taskId
    await supabase
      .from('generation_tasks')
      .update({ 
        suno_task_id: sunoTaskId,
        status: 'processing',
      })
      .eq('id', task.id);

    await supabase
      .from('tracks')
      .update({ 
        suno_task_id: sunoTaskId,
        status: 'processing',
      })
      .eq('id', track.id);

    // Log the generation
    await supabase
      .from('track_change_log')
      .insert({
        track_id: track.id,
        user_id: user.id,
        change_type: 'generation_started',
        changed_by: 'suno_api',
        ai_model_used: model,
        prompt_used: prompt,
        metadata: {
          mode,
          instrumental,
          style,
          model,
          suno_task_id: sunoTaskId,
          artist_id: artistData?.id,
          artist_name: artistData?.name,
        },
      });

    logger.success('Generation started', { trackId: track.id, taskId: task.id, sunoTaskId });

    return new Response(
      JSON.stringify({
        success: true,
        trackId: track.id,
        taskId: task.id,
        sunoTaskId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    logger.error('Error in suno-music-generate', error);
    
    // Try to log error to database if we have context
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabase = getSupabaseClient();
        
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        
        if (user) {
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'error',
              title: 'Ошибка генерации',
              message: (error.message || 'Произошла ошибка при генерации трека').substring(0, 250),
              metadata: { error_type: 'generation_error', original_message: error.message },
            });
        }
      }
    } catch (logError) {
      logger.error('Failed to log error notification', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
