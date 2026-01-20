import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { isSunoSuccessCode } from '../_shared/suno.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getStemSeparationCost } from '../_shared/economy.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');

    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    const supabase = getSupabaseClient();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    const body = await req.json();
    const { taskId, audioId, mode = 'simple', userId } = body;

    console.log('🎵 Vocal separation request:', { taskId, audioId, mode, userId });

    if (!taskId || !audioId || !userId) {
      throw new Error('taskId, audioId, and userId are required');
    }

    // Calculate cost based on mode
    const cost = getStemSeparationCost(mode as 'simple' | 'detailed');
    console.log(`💰 Stem separation cost: ${cost} credits (mode: ${mode})`);

    // Check user credits balance
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (creditsError || !userCredits) {
      console.error('❌ Failed to check user credits:', creditsError);
      throw new Error('Failed to check user credits');
    }

    if (userCredits.balance < cost) {
      console.error('❌ Insufficient credits:', { balance: userCredits.balance, required: cost });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Недостаточно кредитов',
          required: cost,
          balance: userCredits.balance 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
      );
    }

    // Verify track ownership
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .eq('suno_task_id', taskId)
      .eq('user_id', userId)
      .single();

    if (trackError || !track) {
      console.error('❌ Track not found:', trackError);
      throw new Error('Track not found or access denied');
    }

    console.log('✅ Track verified:', track.id);

    const callbackUrl = `${supabaseUrl}/functions/v1/suno-vocal-callback`;
    
    // FIXED: Use correct API parameters
    // mode: 'simple' -> type: 'separate_vocal' (vocal + instrumental)
    // mode: 'detailed' -> type: 'split_stem' (vocals, drums, bass, etc.)
    const apiType = mode === 'detailed' ? 'split_stem' : 'separate_vocal';
    
    const requestBody = {
      taskId,
      audioId,
      type: apiType,
      callBackUrl: callbackUrl,
    };

    console.log('📤 Calling Suno API:', requestBody);

    const startTime = Date.now();
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/vocal-removal/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;
    const sunoData = await sunoResponse.json();
    
    console.log(`📥 Response (${duration}ms):`, JSON.stringify(sunoData, null, 2));
    console.log(`💰 Cost: $0.02`);

    // Log API call
    const { error: logError } = await supabase.from('api_usage_logs').insert({
      user_id: userId,
      service: 'suno',
      endpoint: 'vocal-removal',
      method: 'POST',
      request_body: requestBody,
      response_status: sunoResponse.status,
      response_body: sunoData,
      duration_ms: duration,
      estimated_cost: 0.02,
    });

    if (logError) console.error('⚠️ Log error:', logError);

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      throw new Error(sunoData.msg || 'SunoAPI request failed');
    }

    const separationTaskId = sunoData.data?.taskId;
    if (!separationTaskId) {
      throw new Error('No taskId returned from separation API');
    }

    console.log('✅ Separation initiated:', separationTaskId);

    // Deduct credits after successful API call
    const { error: deductError } = await supabase.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: cost,
      p_action_type: mode === 'detailed' ? 'stem_separation_detailed' : 'stem_separation_simple',
      p_description: `Разделение на стемы (${mode === 'detailed' ? 'детальное' : 'простое'})`,
      p_metadata: { track_id: track.id, mode, separation_task_id: separationTaskId },
    });

    if (deductError) {
      console.error('⚠️ Failed to deduct credits:', deductError);
      // Don't fail the request, but log it
    } else {
      console.log(`✅ Deducted ${cost} credits for stem separation (${mode})`);
    }

    // Log credit transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -cost,
      transaction_type: 'debit',
      action_type: mode === 'detailed' ? 'stem_separation_detailed' : 'stem_separation_simple',
      description: `Разделение на стемы (${mode === 'detailed' ? 'детальное' : 'простое'})`,
      metadata: { track_id: track.id, mode, separation_task_id: separationTaskId },
    });

    // Save separation task mapping for callback lookup
    const { error: taskError } = await supabase
      .from('stem_separation_tasks')
      .insert({
        separation_task_id: separationTaskId,
        track_id: track.id,
        original_task_id: taskId,
        original_audio_id: audioId,
        mode: mode,
        status: 'processing',
      });

    if (taskError) {
      console.error('⚠️ Failed to save separation task:', taskError);
    }

    // Log in track changelog
    await supabase.from('track_change_log').insert({
      track_id: track.id,
      user_id: userId,
      change_type: 'vocal_separation_started',
      changed_by: 'suno_api',
      metadata: { separation_task_id: separationTaskId, mode, api_type: apiType, credits_spent: cost },
    });

    return new Response(
      JSON.stringify({ success: true, trackId: track.id, separationTaskId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
