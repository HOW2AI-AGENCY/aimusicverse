import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not set');
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    const body = await req.json();
    const { prompt, duration = 30, temperature = 1.0, top_k = 250, model = 'large' } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required field: prompt" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Generating music with prompt:", prompt, "duration:", duration);

    // Use MusicGen model from Meta
    // Model: facebook/musicgen
    const output = await replicate.run(
      "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
      {
        input: {
          prompt: prompt,
          duration: Math.min(duration, 30), // Max 30 seconds for MusicGen
          model_version: model, // 'melody', 'large', 'small'
          output_format: "mp3",
          normalization_strategy: "peak",
          temperature: temperature,
          top_k: top_k,
          top_p: 0.95,
          classifier_free_guidance: 3,
        }
      }
    );

    console.log("MusicGen response:", output);

    // Output is a URL to the generated audio
    const audioUrl = typeof output === 'string' ? output : (output as { audio?: string })?.audio || output;

    return new Response(
      JSON.stringify({ 
        success: true, 
        audio_url: audioUrl,
        duration: duration,
        model_used: `musicgen-${model}`,
        prompt: prompt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error in musicgen-generate:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
