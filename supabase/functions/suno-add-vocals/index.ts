import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isSunoSuccessCode } from "../_shared/suno.ts";

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
      audioUrl,
      prompt,
      customMode = false,
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

    if (!audioFile && !audioUrl) {
      return new Response(
        JSON.stringify({ error: 'Audio file or URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎤 Adding vocals to instrumental:', { customMode, model, userId: user.id, hasFile: !!audioFile, hasUrl: !!audioUrl });

    let uploadUrl: string;

    if (audioUrl) {
      // Use existing URL directly
      uploadUrl = audioUrl;
      console.log('✅ Using existing audio URL:', uploadUrl);
    } else {
      // Upload audio to Supabase Storage
      const fileName = `${user.id}/uploads/${Date.now()}-${audioFile.name || 'audio.mp3'}`;
      
      // Decode base64 if needed
      let audioBuffer: Uint8Array;
      try {
        if (audioFile.data.startsWith('data:')) {
          const base64Data = audioFile.data.split(',')[1];
          audioBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        } else {
          audioBuffer = new Uint8Array(audioFile.data);
        }
        console.log('✅ Audio buffer created:', audioBuffer.length, 'bytes');
      } catch (error) {
        console.error('❌ Failed to decode audio file:', error);
        throw new Error('Invalid audio file format');
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, audioBuffer, {
          contentType: audioFile.type || 'audio/mpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        return new Response(
          JSON.stringify({ error: `Failed to upload audio: ${uploadError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      uploadUrl = publicUrlData.publicUrl;
      console.log('✅ Audio uploaded:', uploadUrl);
    }
    const callBackUrl = `${supabaseUrl}/functions/v1/suno-music-callback`;

    console.log('✅ Audio uploaded, calling Suno API add-vocals');
    console.log('📋 Upload URL:', uploadUrl);
    console.log('📋 Callback URL:', callBackUrl);

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
    if (vocalGender) requestBody.vocalGender = vocalGender;
    if (styleWeight !== undefined) requestBody.styleWeight = styleWeight;
    if (weirdnessConstraint !== undefined) requestBody.weirdnessConstraint = weirdnessConstraint;
    if (audioWeight !== undefined) requestBody.audioWeight = audioWeight;

    // Call Suno API
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate/add-vocals', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const sunoData = await sunoResponse.json();

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      console.error('❌ Suno API error:', JSON.stringify(sunoData, null, 2));
      return new Response(
        JSON.stringify({ 
          error: sunoData.msg || 'Failed to add vocals',
          code: sunoData.code,
          details: sunoData
        }),
        { status: sunoResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sunoTaskId = sunoData.data?.taskId;

    if (!sunoTaskId) {
      console.error('❌ No taskId in Suno response:', JSON.stringify(sunoData, null, 2));
      throw new Error('No taskId in Suno response');
    }

    console.log('✅ Suno add-vocals task created:', sunoTaskId);

    // Create track record
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        user_id: user.id,
        project_id: projectId,
        prompt: prompt || 'Add vocals',
        title: title || null,
        style: style || null,
        status: 'pending',
        provider: 'suno',
        suno_model: model,
        suno_task_id: sunoTaskId,
        generation_mode: 'add_vocals',
        has_vocals: true,
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
        prompt: prompt || 'Add vocals',
        status: 'pending',
        suno_task_id: sunoTaskId,
        model_used: model,
        generation_mode: 'add_vocals',
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
    console.error('Error in suno-add-vocals:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
