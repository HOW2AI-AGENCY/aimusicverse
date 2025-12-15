import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { sanitizeFilename } from "../_shared/sanitize-filename.ts";

const logger = createLogger('suno-upload-extend');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-secret',
};

/**
 * Per SunoAPI docs: Model values are V5, V4_5PLUS, V4_5, V4, V3_5
 */
const VALID_MODELS = ['V5', 'V4_5PLUS', 'V4_5', 'V4', 'V3_5'];
const DEFAULT_MODEL = 'V4_5';

function getApiModelName(uiKey: string): string {
  if (uiKey === 'V4_5ALL') return 'V4_5';
  return VALID_MODELS.includes(uiKey) ? uiKey : DEFAULT_MODEL;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    const telegramBotSecret = Deno.env.get('TELEGRAM_BOT_TOKEN'); // Use bot token as secret

    if (!sunoApiKey) {
      logger.error('SUNO_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body first to check for telegram bot source
    const body = await req.json();
    const {
      source,
      userId: telegramUserId, // User ID passed from telegram bot
      telegramChatId,
      audioUrl: providedAudioUrl, // Pre-uploaded audio URL from bot
      audioFile,
      audioDuration, // Duration in seconds for validation
      customMode = false, // Changed from defaultParamFlag - now consistent with upload-cover
      instrumental = false,
      prompt,
      style,
      title,
      continueAt,
      personaId,
      model = 'V4_5ALL',
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      projectId,
    } = body;

    let userId: string;

    // Check if request is from telegram bot
    if (source === 'telegram_bot') {
      // Verify bot secret
      const botSecret = req.headers.get('x-telegram-bot-secret');
      if (!botSecret || botSecret !== telegramBotSecret) {
        logger.error('Invalid telegram bot secret');
        return new Response(
          JSON.stringify({ error: 'Unauthorized bot request' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!telegramUserId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required for telegram bot requests' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = telegramUserId;
      logger.info('Telegram bot request authenticated', { userId });
    } else {
      // Standard JWT auth for web app
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'No authorization header' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = user.id;
    }

    // Check user credits (only for non-admin, non-telegram-bot users)
    if (source !== 'telegram_bot') {
      const GENERATION_COST = 10;

      // Check if user is admin
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });

      logger.info('User role check', { userId, isAdmin: !!isAdmin });

      // Only check personal balance for non-admin users
      if (!isAdmin) {
        logger.info('Checking user credits balance', { userId });

        const { data: userCredits, error: creditsError } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();

        if (creditsError) {
          logger.error('Failed to fetch user credits', creditsError);
          return new Response(
            JSON.stringify({ error: 'Ошибка проверки баланса' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const userBalance = userCredits?.balance ?? 0;
        logger.info('User credit balance', { userId, balance: userBalance, required: GENERATION_COST });

        // Check if user has enough credits for generation
        if (userBalance < GENERATION_COST) {
          logger.warn('Insufficient user credits', { balance: userBalance, required: GENERATION_COST });
          return new Response(
            JSON.stringify({
              error: `Недостаточно кредитов. Баланс: ${userBalance}, требуется: ${GENERATION_COST}`,
              errorCode: 'INSUFFICIENT_CREDITS',
              balance: userBalance,
              required: GENERATION_COST,
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        logger.info('Admin user - skipping personal balance check, using shared API balance');
      }
    }

    // Determine audio URL - either provided from bot or upload from file
    let publicUrl: string;

    if (providedAudioUrl) {
      // Use pre-uploaded audio URL from telegram bot
      publicUrl = providedAudioUrl;
      logger.info('Using provided audio URL', { publicUrl });
    } else if (audioFile) {
      // Upload audio from file data
      // Sanitize filename to remove special characters
      const originalName = audioFile.name || 'audio.mp3';
      const sanitizedName = sanitizeFilename(originalName);
      const fileName = `${userId}/uploads/${Date.now()}-${sanitizedName}`;
      
      logger.info('Sanitized filename', { original: originalName, sanitized: sanitizedName });
      
      // Decode base64 if needed
      let audioBuffer: Uint8Array;
      if (audioFile.data.startsWith('data:')) {
        const base64Data = audioFile.data.split(',')[1];
        audioBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      } else {
        audioBuffer = new Uint8Array(audioFile.data);
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, audioBuffer, {
          contentType: audioFile.type || 'audio/mpeg',
          upsert: false,
        });

      if (uploadError) {
        logger.error('Upload error', uploadError);
        return new Response(
          JSON.stringify({ error: 'Failed to upload audio' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: { publicUrl: uploadedUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      publicUrl = uploadedUrl;
      logger.info('Audio uploaded', { publicUrl });
    } else {
      return new Response(
        JSON.stringify({ error: 'Audio file or URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Processing extend request', { customMode, model, instrumental });

    // Map UI model key to API model name
    const apiModel = getApiModelName(model);
    logger.debug('Model mapping', { from: model, to: apiModel });

    // Validate audio duration against model limits
    // V5 has 240s limit for audio uploads per requirements
    if (audioDuration) {
      const MODEL_DURATION_LIMITS: Record<string, number> = {
        'V5': 240,
        'V4_5PLUS': 480,
        'V4_5': 60,  // V4_5ALL maps to V4_5
        'V4': 240,
        'V3_5': 180,
      };
      
      const maxDuration = MODEL_DURATION_LIMITS[apiModel] || 480;
      
      if (audioDuration > maxDuration) {
        const minutes = Math.floor(maxDuration / 60);
        const seconds = maxDuration % 60;
        const timeStr = seconds > 0 ? `${minutes}м ${seconds}с` : `${minutes}м`;
        
        logger.warn('Audio duration exceeds model limit', {
          duration: audioDuration,
          model: apiModel,
          limit: maxDuration
        });
        
        return new Response(
          JSON.stringify({
            error: `Длительность аудио (${Math.floor(audioDuration)}с) превышает лимит модели ${apiModel} (${timeStr})`,
            errorCode: 'DURATION_LIMIT_EXCEEDED',
            duration: audioDuration,
            limit: maxDuration,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      logger.info('Audio duration validation passed', { duration: audioDuration, limit: maxDuration });
    }

    // CRITICAL: continueAt is REQUIRED for Suno extend API
    // If not provided, default to audio duration (extend from end) or 0
    const effectiveContinueAt = continueAt ?? (audioDuration ? Math.floor(audioDuration * 0.8) : 0);
    
    if (effectiveContinueAt === null || effectiveContinueAt === undefined) {
      logger.error('continueAt is required for extend operation');
      return new Response(
        JSON.stringify({ 
          error: 'Укажите точку продолжения (continueAt)',
          errorCode: 'CONTINUE_AT_REQUIRED' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    logger.info('Using continueAt value', { continueAt: effectiveContinueAt, providedValue: continueAt, audioDuration });

    // Prepare request body for Suno API
    const requestBody: any = {
      uploadUrl: publicUrl,
      customMode, // Fixed: Now uses customMode consistently with upload-cover
      model: apiModel,
      callBackUrl: `${supabaseUrl}/functions/v1/suno-music-callback`,
      continueAt: effectiveContinueAt, // ALWAYS include continueAt for extend
    };

    if (customMode) {
      // Custom mode - validate required parameters
      if (!style) {
        return new Response(
          JSON.stringify({ error: 'Style is required in custom mode' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      requestBody.instrumental = instrumental;
      requestBody.style = style;
      if (title) requestBody.title = title;

      if (!instrumental && prompt) {
        requestBody.prompt = prompt;
      }

      if (personaId) requestBody.personaId = personaId;
      if (negativeTags) requestBody.negativeTags = negativeTags;
      if (vocalGender) requestBody.vocalGender = vocalGender;
      if (styleWeight !== undefined) requestBody.styleWeight = styleWeight;
      if (weirdnessConstraint !== undefined) requestBody.weirdnessConstraint = weirdnessConstraint;
      if (audioWeight !== undefined) requestBody.audioWeight = audioWeight;
    }

    logger.apiCall('SunoAPI', 'upload-extend', { model: apiModel, customMode, instrumental });

    // Call Suno API
    const response = await fetch('https://api.sunoapi.org/api/v1/generate/upload-extend', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    logger.info('Suno API response', { code: data.code, taskId: data.data?.taskId });

    if (!response.ok || !isSunoSuccessCode(data.code)) {
      logger.error('Suno API error', null, { code: data.code, msg: data.msg });
      
      if (data.code === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Недостаточно кредитов на SunoAPI',
            code: 429 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (data.code === 430) {
        return new Response(
          JSON.stringify({ 
            error: 'Слишком частые запросы, попробуйте позже',
            code: 430 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: data.msg || 'Failed to extend audio' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const taskId = data.data?.taskId;
    
    if (!taskId) {
      logger.error('No task ID in response', null, { data });
      return new Response(
        JSON.stringify({ error: 'No task ID received' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create generation task in database
    const { error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: userId,
        prompt: prompt || style || 'Audio extension',
        status: 'pending',
        suno_task_id: taskId,
        generation_mode: 'upload_extend',
        model_used: model,
        source: source === 'telegram_bot' ? 'telegram' : 'mini_app',
        telegram_chat_id: telegramChatId,
      });

    if (taskError) {
      logger.error('Error creating task', taskError);
    }

    // Create placeholder track
    const { data: trackData, error: trackError } = await supabase
      .from('tracks')
      .insert({
        user_id: userId,
        prompt: prompt || style || 'Audio extension',
        status: 'pending',
        suno_task_id: taskId,
        suno_model: model,
        generation_mode: 'upload_extend',
        title: title || 'Extended Audio',
        style: style,
        has_vocals: !instrumental,
        provider: 'suno',
        project_id: projectId,
        negative_tags: negativeTags,
        vocal_gender: vocalGender,
        style_weight: styleWeight,
      })
      .select()
      .single();

    if (trackError) {
      logger.error('Error creating track', trackError);
    }
    
    logger.success('Extend generation started', { taskId, trackId: trackData?.id });

    return new Response(
      JSON.stringify({ 
        success: true,
        taskId,
        trackId: trackData?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Error in suno-upload-extend', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
