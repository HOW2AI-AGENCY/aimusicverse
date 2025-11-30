import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      prompt,
      customMode = false,
      style,
      title,
      personaId,
      model = 'V4_5ALL',
      negativeTags,
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

    console.log('Adding instrumental to vocals:', { customMode, model });

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
    const { data: publicUrlData } = supabase.storage
      .from('project-assets')
      .getPublicUrl(fileName);

    const uploadUrl = publicUrlData.publicUrl;
    const callBackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;

    console.log('Calling Suno API add-instrumental with uploadUrl:', uploadUrl);

    // Build request body
    const requestBody: any = {
      uploadUrl,
      customMode,
      callBackUrl,
      model,
    };

    if (prompt) requestBody.prompt = prompt;
    
    if (customMode) {
      if (style) requestBody.style = style;
      if (title) requestBody.title = title;
    }

    if (personaId) requestBody.personaId = personaId;
    if (negativeTags) requestBody.negativeTags = negativeTags;
    if (styleWeight !== undefined) requestBody.styleWeight = styleWeight;
    if (weirdnessConstraint !== undefined) requestBody.weirdnessConstraint = weirdnessConstraint;
    if (audioWeight !== undefined) requestBody.audioWeight = audioWeight;

    // Call Suno API
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate/add-instrumental', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const sunoData = await sunoResponse.json();

    if (!sunoResponse.ok || sunoData.code !== 200) {
      console.error('Suno API error:', sunoData);
      return new Response(
        JSON.stringify({ error: sunoData.msg || 'Failed to add instrumental' }),
        { status: sunoResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sunoTaskId = sunoData.data?.taskId;

    if (!sunoTaskId) {
      throw new Error('No taskId in Suno response');
    }

    console.log('Suno add-instrumental task created:', sunoTaskId);

    // Create track record
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        user_id: user.id,
        project_id: projectId,
        prompt: prompt || 'Add instrumental',
        title: title || null,
        style: style || null,
        status: 'pending',
        provider: 'suno',
        suno_model: model,
        suno_task_id: sunoTaskId,
        generation_mode: 'add_instrumental',
        has_vocals: false,
      })
      .select()
      .single();

    if (trackError) {
      console.error('Track creation error:', trackError);
      throw trackError;
    }

    // Create generation task
    const { error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        track_id: track.id,
        prompt: prompt || 'Add instrumental',
        status: 'pending',
        suno_task_id: sunoTaskId,
        model_used: model,
        generation_mode: 'add_instrumental',
      });

    if (taskError) {
      console.error('Task creation error:', taskError);
      throw taskError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        taskId: sunoTaskId,
        trackId: track.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in suno-add-instrumental:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
