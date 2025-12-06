import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    // Use Replicate's Whisper model for transcription with the official model identifier
    const createResponse = await fetch('https://api.replicate.com/v1/models/openai/whisper/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          audio: `data:audio/webm;base64,${audio}`,
          language: language,
          model: "large-v3",
          translate: false,
          transcription: "plain text"
        }
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Replicate API error:', createResponse.status, errorText);
      throw new Error(`Replicate API error: ${createResponse.status}`);
    }

    const prediction = await createResponse.json();
    console.log('Prediction created:', prediction.id);

    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_KEY}`,
        },
      });

      if (!pollResponse.ok) {
        throw new Error(`Poll error: ${pollResponse.status}`);
      }

      result = await pollResponse.json();
      attempts++;
      console.log(`Poll attempt ${attempts}: ${result.status}`);
    }

    if (result.status === 'failed') {
      throw new Error(`Transcription failed: ${result.error || 'Unknown error'}`);
    }

    if (result.status !== 'succeeded') {
      throw new Error('Transcription timed out');
    }

    const transcribedText = result.output?.transcription || result.output?.text || result.output || '';
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
