import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    if (!sunoApiKey) {
      console.error('SUNO_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
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

    const {
      audioFile,
      customMode = false,
      instrumental = false,
      prompt,
      style,
      title,
      personaId,
      model = 'V4_5ALL',
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      projectId,
    } = await req.json();

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'Audio file is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Uploading and covering audio:', { customMode, model, instrumental });

    // Upload audio to Supabase Storage
    const fileName = `${user.id}/uploads/${Date.now()}-${audioFile.name || 'audio.mp3'}`;
    
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
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload audio' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-assets')
      .getPublicUrl(fileName);

    console.log('Audio uploaded to:', publicUrl);

    // Map UI model key to API model name
    const apiModel = getApiModelName(model);
    console.log(`Model mapping: ${model} -> ${apiModel}`);

    // Prepare request body for Suno API
    const requestBody: any = {
      uploadUrl: publicUrl,
      customMode,
      instrumental,
      model: apiModel,
      callBackUrl: `${supabaseUrl}/functions/v1/suno-music-callback`,
    };

    if (customMode) {
      // Custom mode
      if (!style) {
        return new Response(
          JSON.stringify({ error: 'Style is required in custom mode' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
    } else {
      // Non-custom mode
      if (!prompt) {
        return new Response(
          JSON.stringify({ error: 'Prompt is required in non-custom mode' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      requestBody.prompt = prompt;
    }

    console.log('Calling Suno API with:', JSON.stringify(requestBody, null, 2));

    // Call Suno API
    const response = await fetch('https://api.sunoapi.org/api/v1/generate/upload-cover', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('Suno API response:', JSON.stringify(data, null, 2));

    if (!response.ok || data.code !== 200) {
      console.error('Suno API error:', data);
      
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
        JSON.stringify({ error: data.msg || 'Failed to cover audio' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const taskId = data.data?.taskId;
    
    if (!taskId) {
      console.error('No task ID in response:', data);
      return new Response(
        JSON.stringify({ error: 'No task ID received' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create generation task in database
    const { error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        prompt: prompt || style || 'Audio cover',
        status: 'pending',
        suno_task_id: taskId,
        generation_mode: 'upload_cover',
        model_used: model,
        source: 'mini_app',
      });

    if (taskError) {
      console.error('Error creating task:', taskError);
    }

    // Create placeholder track
    const { data: trackData, error: trackError } = await supabase
      .from('tracks')
      .insert({
        user_id: user.id,
        prompt: prompt || style || 'Audio cover',
        status: 'pending',
        suno_task_id: taskId,
        suno_model: model,
        generation_mode: 'upload_cover',
        title: title || 'Covered Audio',
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
      console.error('Error creating track:', trackError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        taskId,
        trackId: trackData?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in suno-upload-cover:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
