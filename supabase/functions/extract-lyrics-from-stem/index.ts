/**
 * Extract lyrics from vocal stem using Whisper
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = getSupabaseClient();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });
    const { reference_id, vocal_stem_url } = await req.json();

    if (!reference_id || !vocal_stem_url) {
      throw new Error('reference_id and vocal_stem_url are required');
    }

    console.log('🎤 Extracting lyrics from vocal stem:', reference_id);

    // Run Whisper on vocal stem
    const whisperOutput = await replicate.run(
      "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
      {
        input: {
          audio: vocal_stem_url,
          model: "large-v3",
          translate: false,
          temperature: 0,
          transcription: "plain text",
          no_speech_threshold: 0.6,
        },
      }
    ) as { transcription?: string; text?: string };

    const lyrics = whisperOutput?.transcription || whisperOutput?.text || null;
    console.log('✅ Lyrics extracted:', lyrics?.length, 'chars');

    // Update reference_audio with lyrics
    const { error: updateError } = await supabase
      .from('reference_audio')
      .update({
        transcription: lyrics,
        transcription_method: 'whisper-large-v3-from-vocal-stem',
      })
      .eq('id', reference_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, lyrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
