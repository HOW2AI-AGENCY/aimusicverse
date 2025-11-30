import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { track_id, audio_url, model_type = 'mt3' } = await req.json();
    console.log('Transcribing to MIDI:', { track_id, audio_url, model_type });

    if (!audio_url) {
      throw new Error('audio_url is required');
    }

    // Get track info
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('user_id, title')
      .eq('id', track_id)
      .single();

    if (trackError || !track) {
      throw new Error('Track not found');
    }

    console.log('Starting MIDI transcription with Replicate...');

    // Run MIDI transcription model
    const midiUrl = await replicate.run(
      "turian/multi-task-music-transcription:66659dac66c53d19c38d75a00ac8c0df98342e2ec0a09e22fe4b0e7ea0f0ae76",
      {
        input: {
          audio_file: audio_url,
          model_type: model_type,
        },
      }
    ) as string;

    console.log('MIDI transcription completed:', midiUrl);

    // Create a track version for the MIDI file
    const { data: version, error: versionError } = await supabase
      .from('track_versions')
      .insert({
        track_id,
        audio_url: midiUrl,
        version_type: 'midi_transcription',
        metadata: {
          model_type,
          original_audio_url: audio_url,
          transcribed_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (versionError) {
      console.error('Error saving MIDI version:', versionError);
      throw versionError;
    }

    console.log('MIDI version saved:', version.id);

    // Log the change
    await supabase
      .from('track_change_log')
      .insert({
        track_id,
        user_id: track.user_id,
        change_type: 'midi_transcription',
        changed_by: 'system',
        version_id: version.id,
        metadata: {
          model_type,
          midi_url: midiUrl,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        midi_url: midiUrl,
        version,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in transcribe-midi:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
