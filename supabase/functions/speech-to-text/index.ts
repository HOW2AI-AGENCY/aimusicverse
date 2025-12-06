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

    // Map language codes to full names for Whisper API
    const languageMap: Record<string, string> = {
      'ru': 'russian',
      'en': 'english',
      'uk': 'ukrainian',
      'de': 'german',
      'fr': 'french',
      'es': 'spanish',
      'it': 'italian',
      'pt': 'portuguese',
      'zh': 'chinese',
      'ja': 'japanese',
      'ko': 'korean'
    };
    
    const whisperLanguage = languageMap[language] || 'russian';
    console.log('Processing audio for speech-to-text, language:', whisperLanguage);

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    // Use incredibly-fast-whisper model
    const output = await replicate.run(
      "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
      {
        input: {
          audio: `data:audio/webm;base64,${audio}`,
          language: whisperLanguage,
          task: "transcribe",
          batch_size: 64
        }
      }
    );

    console.log('Whisper output:', JSON.stringify(output));

    // Extract transcription from output
    let transcribedText = '';
    if (typeof output === 'string') {
      transcribedText = output;
    } else if (output && typeof output === 'object') {
      transcribedText = (output as any).text || (output as any).transcription || '';
    }
    
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
