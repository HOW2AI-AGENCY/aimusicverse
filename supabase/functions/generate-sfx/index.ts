/**
 * Sound Effects Generation via Replicate/fal.ai
 * Generates high-quality sound effects from text descriptions
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, duration = 5 } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try fal.ai first (faster), fallback to Replicate
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');

    if (!FAL_API_KEY && !REPLICATE_API_KEY) {
      console.error('Neither FAL_API_KEY nor REPLICATE_API_KEY configured');
      return new Response(
        JSON.stringify({ error: 'SFX API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating SFX: "${prompt.slice(0, 50)}..." (${duration}s)`);

    let audioUrl: string | null = null;

    // Try fal.ai AudioGen
    if (FAL_API_KEY) {
      try {
        console.log('Attempting fal.ai AudioGen...');
        const falResponse = await fetch('https://queue.fal.run/fal-ai/audiogen', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            duration_seconds: Math.min(30, Math.max(1, duration)),
          }),
        });

        if (falResponse.ok) {
          const falData = await falResponse.json();
          audioUrl = falData.audio?.url || falData.audio_url;
          if (audioUrl) {
            console.log('fal.ai AudioGen succeeded');
          }
        } else {
          console.log('fal.ai AudioGen failed:', await falResponse.text());
        }
      } catch (err) {
        console.log('fal.ai error:', err);
      }
    }

    // Fallback to Replicate MusicGen (can generate SFX too)
    if (!audioUrl && REPLICATE_API_KEY) {
      try {
        console.log('Attempting Replicate MusicGen for SFX...');
        const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${REPLICATE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: 'b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38',
            input: {
              prompt: `sound effect: ${prompt}`,
              duration: Math.min(30, Math.max(1, duration)),
              model_version: 'stereo-melody-large',
              output_format: 'mp3',
            },
          }),
        });

        if (replicateResponse.ok) {
          const prediction = await replicateResponse.json();
          
          // Poll for completion
          let attempts = 0;
          while (attempts < 60) {
            const statusResponse = await fetch(
              `https://api.replicate.com/v1/predictions/${prediction.id}`,
              {
                headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` },
              }
            );
            const status = await statusResponse.json();
            
            if (status.status === 'succeeded') {
              audioUrl = status.output;
              console.log('Replicate MusicGen succeeded');
              break;
            } else if (status.status === 'failed') {
              console.error('Replicate generation failed:', status.error);
              break;
            }
            
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
          }
        } else {
          console.log('Replicate MusicGen failed:', await replicateResponse.text());
        }
      } catch (err) {
        console.log('Replicate error:', err);
      }
    }

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate sound effect' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the audio URL for client to fetch
    return new Response(
      JSON.stringify({ 
        success: true,
        audioUrl,
        prompt,
        duration 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SFX generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
