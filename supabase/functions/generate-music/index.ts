import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = getSupabaseClient();

    // Authenticate user from Authorization header
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, title, lyrics, style, tags, has_vocals, project_id, model, make_instrumental } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Improve prompt using Lovable AI
    let improvedPrompt = prompt;
    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a music prompt enhancement AI. Transform user descriptions into detailed, professional music generation prompts. Include genre, mood, instruments, tempo, and style details. Keep it concise but rich.'
            },
            {
              role: 'user',
              content: `Improve this music prompt: "${prompt}"`
            }
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        improvedPrompt = aiData.choices?.[0]?.message?.content || prompt;
      }
    } catch (error) {
      console.error('AI prompt enhancement failed:', error);
      // Continue with original prompt
    }

    // Create track record with full metadata
    const { data: track, error: trackError } = await supabaseClient
      .from('tracks')
      .insert({
        user_id: user.id,
        project_id: project_id || null,
        title: title || 'Untitled Track',
        prompt: improvedPrompt,
        lyrics: lyrics || null,
        style: style || null,
        tags: tags || null,
        has_vocals: has_vocals !== false && !make_instrumental,
        status: 'pending',
        provider: 'suno_api',
        model_name: model || 'chirp-crow',
      })
      .select()
      .single();

    if (trackError) {
      console.error('Track creation error:', trackError);
      return new Response(
        JSON.stringify({ error: 'Failed to create track' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log generation request
    await supabaseClient.from('track_change_log').insert({
      track_id: track.id,
      user_id: user.id,
      change_type: 'generation_requested',
      changed_by: 'user',
      ai_model_used: model || 'chirp-crow',
      prompt_used: improvedPrompt,
      metadata: {
        original_prompt: prompt,
        improved_prompt: improvedPrompt,
        title,
        style,
        lyrics,
        tags,
        has_vocals: has_vocals !== false && !make_instrumental,
        model,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('Track created successfully:', track.id);

    return new Response(
      JSON.stringify({
        success: true,
        trackId: track.id,
        improvedPrompt: improvedPrompt,
        message: 'Track generation started',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});