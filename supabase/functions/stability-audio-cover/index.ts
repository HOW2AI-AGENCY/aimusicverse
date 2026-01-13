import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { createLogger } from "../_shared/logger.ts";
import { sanitizeFilename } from "../_shared/sanitize-filename.ts";

const logger = createLogger('stability-audio-cover');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-secret',
};

const FAL_API_URL = 'https://queue.fal.run/fal-ai/stable-audio-25/audio-to-audio';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const falApiKey = Deno.env.get('FAL_API_KEY');
    const telegramBotSecret = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!falApiKey) {
      logger.error('FAL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Stability AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseClient();

    const body = await req.json();
    const {
      source,
      userId: telegramUserId,
      telegramChatId,
      audioUrl: providedAudioUrl,
      audioFile,
      audioDuration,
      prompt,
      style,
      title,
      strength = 0.7, // How much the original audio influences the output (0=ignore original, 1=keep original)
      numInferenceSteps = 8,
      guidanceScale = 1,
      projectId,
    } = body;

    let userId: string;

    // Check if request is from telegram bot
    if (source === 'telegram_bot') {
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

      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });

      if (!isAdmin) {
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
      }
    }

    // Determine audio URL
    let publicUrl: string;

    if (providedAudioUrl) {
      publicUrl = providedAudioUrl;
      logger.info('Using provided audio URL', { publicUrl });
    } else if (audioFile) {
      const originalName = audioFile.name || 'audio.mp3';
      const sanitizedName = sanitizeFilename(originalName);
      const fileName = `${userId}/stability-covers/${Date.now()}-${sanitizedName}`;
      
      let audioBuffer: Uint8Array;
      if (audioFile.data.startsWith('data:')) {
        const base64Data = audioFile.data.split(',')[1];
        audioBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      } else {
        audioBuffer = new Uint8Array(audioFile.data);
      }

      const { error: uploadError } = await supabase.storage
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

    // Validate audio duration (Stable Audio 2.5 has max ~45 seconds for audio-to-audio)
    const MAX_DURATION = 45;
    if (audioDuration && audioDuration > MAX_DURATION) {
      logger.warn('Audio duration exceeds limit', { duration: audioDuration, limit: MAX_DURATION });
      return new Response(
        JSON.stringify({
          error: `Длительность аудио (${Math.floor(audioDuration)}с) превышает лимит Stable Audio (${MAX_DURATION}с)`,
          errorCode: 'DURATION_LIMIT_EXCEEDED',
          duration: audioDuration,
          limit: MAX_DURATION,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build prompt from style and prompt
    const fullPrompt = [style, prompt].filter(Boolean).join(', ') || 'High quality music remix';

    logger.info('Submitting to Stable Audio 2.5', { 
      prompt: fullPrompt.substring(0, 100), 
      strength,
      audioDuration 
    });

    // Submit request to fal.ai queue
    const falResponse = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        audio_url: publicUrl,
        strength: Math.max(0.1, Math.min(1.0, strength)), // Clamp between 0.1 and 1.0
        num_inference_steps: numInferenceSteps,
        guidance_scale: guidanceScale,
        total_seconds: audioDuration ? Math.min(audioDuration, MAX_DURATION) : undefined,
      }),
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      logger.error('Fal.ai API error', null, { status: falResponse.status, error: errorText });
      return new Response(
        JSON.stringify({ error: `Stability AI error: ${errorText}` }),
        { status: falResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const falData = await falResponse.json();
    const requestId = falData.request_id;

    if (!requestId) {
      logger.error('No request ID in response', null, { falData });
      return new Response(
        JSON.stringify({ error: 'No request ID received from Stability AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Stable Audio request submitted', { requestId });

    // Create generation task in database
    const { error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: userId,
        prompt: fullPrompt,
        status: 'pending',
        suno_task_id: `stability_${requestId}`, // Prefix to identify provider
        generation_mode: 'stability_cover',
        model_used: 'stable-audio-2.5',
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
        prompt: fullPrompt,
        status: 'pending',
        suno_task_id: `stability_${requestId}`,
        suno_model: 'stable-audio-2.5',
        generation_mode: 'stability_cover',
        title: title || 'Stability AI Cover',
        style: style,
        has_vocals: true,
        provider: 'stability',
        project_id: projectId,
      })
      .select()
      .single();

    if (trackError) {
      logger.error('Error creating track', trackError);
    }

    logger.success('Stability Audio generation started', { requestId, trackId: trackData?.id });

    // Start polling for result in background
    pollForResult(supabase, falApiKey, requestId, trackData?.id, userId, telegramChatId);

    return new Response(
      JSON.stringify({ 
        success: true,
        taskId: `stability_${requestId}`,
        trackId: trackData?.id,
        provider: 'stability',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Error in stability-audio-cover', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Background polling for result (non-blocking)
async function pollForResult(
  supabase: any,
  falApiKey: string,
  requestId: string,
  trackId: string | undefined,
  userId: string,
  telegramChatId?: number
) {
  const maxAttempts = 60; // 5 minutes max
  const pollInterval = 5000; // 5 seconds
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    try {
      // Check status
      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/stable-audio-25/audio-to-audio/requests/${requestId}/status`,
        {
          headers: {
            'Authorization': `Key ${falApiKey}`,
          },
        }
      );

      const statusData = await statusResponse.json();
      logger.info('Poll status', { requestId, status: statusData.status, attempt });

      if (statusData.status === 'COMPLETED') {
        // Fetch result
        const resultResponse = await fetch(
          `https://queue.fal.run/fal-ai/stable-audio-25/audio-to-audio/requests/${requestId}`,
          {
            headers: {
              'Authorization': `Key ${falApiKey}`,
            },
          }
        );

        const resultData = await resultResponse.json();
        const audioUrl = resultData.audio?.url;

        if (audioUrl && trackId) {
          // Update track with result
          await supabase
            .from('tracks')
            .update({
              status: 'completed',
              audio_url: audioUrl,
              streaming_url: audioUrl,
            })
            .eq('id', trackId);

          // Update generation task
          await supabase
            .from('generation_tasks')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('suno_task_id', `stability_${requestId}`);

          // Deduct credits
          await supabase.rpc('deduct_user_credits', {
            p_user_id: userId,
            p_amount: 10,
            p_action_type: 'stability_cover',
            p_description: 'Stability AI cover generation',
          });

          logger.success('Stability Audio generation completed', { trackId, audioUrl });

          // Send Telegram notification if applicable
          if (telegramChatId) {
            await fetch(`${supabaseUrl}/functions/v1/send-telegram-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chatId: telegramChatId,
                message: '🎵 Ваш кавер от Stability AI готов!',
                trackId,
              }),
            }).catch(e => logger.error('Telegram notification failed', e));
          }
        }
        return;
      }

      if (statusData.status === 'FAILED') {
        logger.error('Stability Audio generation failed', null, { requestId, error: statusData.error });
        
        if (trackId) {
          await supabase
            .from('tracks')
            .update({ status: 'failed', error_message: statusData.error || 'Generation failed' })
            .eq('id', trackId);
        }

        await supabase
          .from('generation_tasks')
          .update({ status: 'failed', error_message: statusData.error || 'Generation failed' })
          .eq('suno_task_id', `stability_${requestId}`);
        
        return;
      }

      // Continue polling for IN_QUEUE or IN_PROGRESS
    } catch (error) {
      logger.error('Poll error', error);
    }
  }

  // Timeout
  logger.error('Stability Audio generation timeout', null, { requestId });
  if (trackId) {
    await supabase
      .from('tracks')
      .update({ status: 'failed', error_message: 'Generation timeout' })
      .eq('id', trackId);
  }
}
