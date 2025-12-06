import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Replicate from "https://esm.sh/replicate@0.25.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio, language = 'ru' } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    console.log('Processing audio for speech-to-text, language:', language);

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    // Use Replicate SDK to run Whisper model
    const output = await replicate.run(
      "openai/whisper",
      {
        input: {
          audio: `data:audio/webm;base64,${audio}`,
          language: language,
          model: "large-v3",
          translate: false,
          transcription: "plain text"
        }
      }
    );

    console.log('Whisper output:', output);

    // Extract transcription from output
    const transcribedText = typeof output === 'string' 
      ? output 
      : (output as any)?.transcription || (output as any)?.text || '';
    
    console.log('Transcription result:', transcribedText?.substring(0, 100));

    return new Response(
      JSON.stringify({ text: transcribedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Speech-to-text error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
