/**
 * Generate Contextual Stem - AI-powered stem generation with track context
 * Uses MusicGen (Replicate) or Stable Audio for context-aware generation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackContext {
  bpm?: number;
  key?: string;
  scale?: string;
  genre?: string;
  mood?: string;
  energy?: string;
  instruments?: string[];
  style_description?: string;
}

interface GenerationRequest {
  trackId: string;
  trackUrl: string;
  stemType: 'drums' | 'bass' | 'piano' | 'strings' | 'synth' | 'sfx' | 'guitar' | 'pad';
  styleHint?: string;
  duration?: number;
  context?: TrackContext;
}

const stemPromptTemplates: Record<string, string> = {
  drums: "Create a drum track with {style} feel. {bpmKey}. Focus on groove and rhythm. {hint}",
  bass: "Generate a bass line that complements the arrangement. {style}. {bpmKey}. Deep and rhythmic. {hint}",
  piano: "Create piano accompaniment with {style} character. {bpmKey}. Melodic and harmonic. {hint}",
  strings: "Generate orchestral strings section. {style}. {bpmKey}. Lush and emotional. {hint}",
  synth: "Create synthesizer layer with {style} texture. {bpmKey}. Electronic and atmospheric. {hint}",
  sfx: "Generate sound effects and risers. {style}. Atmospheric transitions and impacts. {hint}",
  guitar: "Create guitar part with {style} feel. {bpmKey}. Rhythmic or melodic as appropriate. {hint}",
  pad: "Generate ambient pad texture. {style}. {bpmKey}. Atmospheric and sustaining. {hint}",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackId, trackUrl, stemType, styleHint, duration, context }: GenerationRequest = await req.json();

    if (!trackId || !stemType) {
      return new Response(
        JSON.stringify({ error: 'trackId and stemType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseClient();

    // Get user from auth
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get track context if not provided
    let trackContext = context;
    if (!trackContext && trackUrl) {
      console.log('Fetching track context...');
      try {
        const contextResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/analyze-track-context`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audioUrl: trackUrl, trackId }),
          }
        );
        if (contextResponse.ok) {
          trackContext = await contextResponse.json();
        }
      } catch (e) {
        console.warn('Failed to get track context:', e);
      }
    }

    // Build contextual prompt
    const bpmKey = trackContext?.bpm && trackContext?.key 
      ? `${trackContext.bpm} BPM, key of ${trackContext.key} ${trackContext.scale || 'major'}`
      : '120 BPM';
    
    const style = trackContext?.style_description || trackContext?.genre || 'modern';
    const hint = styleHint || '';
    
    const template = stemPromptTemplates[stemType] || stemPromptTemplates.synth;
    const prompt = template
      .replace('{style}', style)
      .replace('{bpmKey}', bpmKey)
      .replace('{hint}', hint)
      .trim();

    console.log('Generation prompt:', prompt);

    // Use Replicate MusicGen for generation
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    
    if (!REPLICATE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'REPLICATE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetDuration = duration || 30;
    
    // Start MusicGen generation
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38',
        input: {
          prompt,
          duration: Math.min(targetDuration, 30),
          temperature: 0.9,
          top_k: 250,
          model_version: 'stereo-melody-large',
          output_format: 'mp3',
        },
      }),
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('Replicate error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Generation service error', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prediction = await replicateResponse.json();
    console.log('Replicate prediction started:', prediction.id);

    // Poll for completion (max 2 minutes)
    let result = prediction;
    const maxAttempts = 24;
    let attempts = 0;

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` },
      });
      
      result = await pollResponse.json();
      attempts++;
      console.log(`Poll attempt ${attempts}: ${result.status}`);
    }

    if (result.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ 
          error: 'Generation timed out or failed',
          status: result.status,
          details: result.error,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioUrl = result.output;
    
    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'No audio generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save to track_stems
    const { data: stem, error: insertError } = await supabase
      .from('track_stems')
      .insert({
        track_id: trackId,
        stem_type: `generated_${stemType}`,
        audio_url: audioUrl,
        source: 'generated',
        generation_prompt: prompt,
        generation_model: 'musicgen-stereo-melody-large',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save stem:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save generated stem', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Stem saved:', stem.id);

    // Send notification
    try {
      const { data: track } = await supabase
        .from('tracks')
        .select('title')
        .eq('id', trackId)
        .single();

      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-telegram-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'stem_generated',
          title: '🎹 Новая дорожка',
          message: `${stemType.charAt(0).toUpperCase() + stemType.slice(1)} для "${track?.title || 'трека'}" готов`,
          metadata: {
            trackId,
            stemId: stem.id,
            stemType,
            audioUrl,
          },
        }),
      });
    } catch (notifyError) {
      console.warn('Notification failed:', notifyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        stemId: stem.id,
        audioUrl,
        stemType: `generated_${stemType}`,
        prompt,
        model: 'musicgen-stereo-melody-large',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
