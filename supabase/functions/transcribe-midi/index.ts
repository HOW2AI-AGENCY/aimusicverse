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

    const { 
      track_id, 
      audio_url, 
      model_type = 'mt3',
      stem_id,
      stem_type,
    } = await req.json();
    
    console.log('Transcribing to MIDI:', { track_id, audio_url, model_type, stem_id, stem_type });

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

    console.log('MIDI transcription completed, downloading file...');

    // Download MIDI from Replicate
    const midiResponse = await fetch(midiUrl);
    if (!midiResponse.ok) {
      throw new Error(`Failed to download MIDI: ${midiResponse.statusText}`);
    }
    
    const midiArrayBuffer = await midiResponse.arrayBuffer();
    const midiBlob = new Uint8Array(midiArrayBuffer);

    // Generate unique filename with stem info if applicable
    const timestamp = Date.now();
    const sanitizedTitle = (track.title || 'track').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const stemSuffix = stem_type ? `_${stem_type}` : '';
    const midiPath = `midi/${track.user_id}/${track_id}${stemSuffix}_${sanitizedTitle}_${timestamp}.mid`;

    console.log('Uploading MIDI to Storage:', midiPath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(midiPath, midiBlob, {
        contentType: 'audio/midi',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload MIDI: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-assets')
      .getPublicUrl(midiPath);

    const permanentMidiUrl = urlData.publicUrl;
    console.log('MIDI uploaded successfully:', permanentMidiUrl);

    // Create a track version for the MIDI file
    const { data: version, error: versionError } = await supabase
      .from('track_versions')
      .insert({
        track_id,
        audio_url: permanentMidiUrl,
        version_type: stem_id ? 'stem_midi_transcription' : 'midi_transcription',
        metadata: {
          model_type,
          original_audio_url: audio_url,
          transcribed_at: new Date().toISOString(),
          storage_path: midiPath,
          stem_id: stem_id || null,
          stem_type: stem_type || null,
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
        change_type: stem_id ? 'stem_midi_transcription' : 'midi_transcription',
        changed_by: 'system',
        version_id: version.id,
        metadata: {
          model_type,
          midi_url: permanentMidiUrl,
          storage_path: midiPath,
          stem_id: stem_id || null,
          stem_type: stem_type || null,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        midi_url: permanentMidiUrl,
        version,
        stem_id,
        stem_type,
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
