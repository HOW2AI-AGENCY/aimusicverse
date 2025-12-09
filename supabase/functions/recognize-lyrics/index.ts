import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Replicate from 'https://esm.sh/replicate@0.25.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LyricsRequest {
  audioUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const replicateApiKey = Deno.env.get('REPLICATE_API_KEY');
    if (!replicateApiKey) {
      console.error('REPLICATE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'REPLICATE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audioUrl } = await req.json() as LyricsRequest;

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'audioUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Recognizing lyrics from:', audioUrl);

    const replicate = new Replicate({ auth: replicateApiKey });

    // Use az-lyrics model for lyrics transcription
    const output = await replicate.run(
      'zsxkib/az-lyrics:2b6cd66ec2d7afe22d6ef1c2e4a8cbc5b22eb3e8c4f69b0a9c3ef7dc5a5d8c2a',
      {
        input: {
          audio: audioUrl,
          language: 'auto', // Auto-detect language
          output_format: 'plain', // Return plain text
        }
      }
    );

    console.log('Lyrics recognition output:', output);

    // Parse output based on model response format
    let lyricsText = '';
    let language = 'unknown';
    
    if (typeof output === 'string') {
      lyricsText = output;
    } else if (output && typeof output === 'object') {
      // Handle structured output
      if ('lyrics' in output) {
        lyricsText = (output as any).lyrics;
      } else if ('text' in output) {
        lyricsText = (output as any).text;
      } else if ('transcription' in output) {
        lyricsText = (output as any).transcription;
      }
      if ('language' in output) {
        language = (output as any).language;
      }
    }

    if (!lyricsText || lyricsText.trim() === '') {
      // Fallback to Whisper for transcription if az-lyrics fails
      console.log('Falling back to Whisper for transcription...');
      
      const whisperOutput = await replicate.run(
        'vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c',
        {
          input: {
            audio: audioUrl,
            task: 'transcribe',
            language: 'None', // Auto-detect
            timestamp: 'word',
            batch_size: 64,
          }
        }
      );

      if (whisperOutput && typeof whisperOutput === 'object' && 'text' in whisperOutput) {
        lyricsText = (whisperOutput as any).text;
        language = (whisperOutput as any).language || 'auto';
      }
    }

    if (!lyricsText || lyricsText.trim() === '') {
      return new Response(
        JSON.stringify({
          success: true,
          lyrics: null,
          message: 'Could not recognize lyrics in the audio'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        lyrics: {
          text: lyricsText.trim(),
          language,
          confidence: 0.85 // Estimated confidence
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recognize-lyrics:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
