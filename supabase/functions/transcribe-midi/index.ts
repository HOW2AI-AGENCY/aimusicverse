import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MIDI Transcription Models - Updated December 2024
const MODELS = {
  // Spotify Basic Pitch - Best for polyphonic pitch detection (vocals, guitar, melody)
  'basic-pitch': {
    replicateId: "spotify/basic-pitch",
    name: "Spotify Basic Pitch",
    description: "Polyphonic pitch detection - best for vocals, guitar, melody",
    inputKey: "audio",
    supportedInstruments: ['vocals', 'voice', 'guitar', 'melody', 'lead', 'piano', 'keys'],
    outputFormat: 'object', // Returns { midi: "url", ... }
  },
  // MT3 fallback - Multi-instrument (if basic-pitch fails)
  'mt3': {
    replicateId: "spotify/basic-pitch", // Using basic-pitch as MT3 is deprecated
    name: "Multi-Instrument (Basic Pitch)",
    description: "Multi-instrument transcription via Basic Pitch",
    inputKey: "audio",
    supportedInstruments: ['drums', 'bass', 'piano', 'guitar', 'strings', 'synth', 'other'],
    outputFormat: 'object',
  },
  // Drums - use basic pitch with specialized handling
  'drums': {
    replicateId: "spotify/basic-pitch",
    name: "Drums (Basic Pitch)",
    description: "Drum transcription via Basic Pitch",
    inputKey: "audio",
    supportedInstruments: ['drums', 'percussion'],
    outputFormat: 'object',
  },
  // Vocal - best for melodic content
  'vocal': {
    replicateId: "spotify/basic-pitch",
    name: "Vocal (Basic Pitch)",
    description: "Vocal melody transcription",
    inputKey: "audio",
    supportedInstruments: ['vocals', 'voice', 'melody', 'lead'],
    outputFormat: 'object',
  },
} as const;

type ModelType = keyof typeof MODELS;

// Auto-select best model based on stem type
function getRecommendedModel(stemType?: string): ModelType {
  if (!stemType) return 'basic-pitch';
  
  const type = stemType.toLowerCase();
  
  // Drums/percussion
  if (type.includes('drum') || type.includes('percussion')) {
    return 'drums';
  }
  
  // Vocals and melodic content
  if (type.includes('vocal') || type.includes('voice') || 
      type.includes('melody') || type.includes('lead')) {
    return 'vocal';
  }
  
  // Default to basic-pitch for everything else
  return 'basic-pitch';
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Attempt ${attempt + 1} failed: ${lastError.message}`);
      
      // Don't retry on 4xx errors (except 429)
      if (lastError.message.includes('422') || lastError.message.includes('404')) {
        throw lastError;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

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
      model_type,
      stem_id,
      stem_type,
      auto_select = true,
    } = await req.json();
    
    console.log('Transcribing to MIDI:', { track_id, audio_url, model_type, stem_id, stem_type, auto_select });

    if (!audio_url) {
      throw new Error('audio_url is required');
    }

    // Get track info if track_id provided, otherwise use defaults
    let track = { user_id: 'anonymous', title: 'audio' };
    if (track_id) {
      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select('user_id, title')
        .eq('id', track_id)
        .single();

      if (trackData) {
        track = trackData;
      }
    }

    // Determine which model to use
    let selectedModel: ModelType = model_type || 'basic-pitch';
    
    if (auto_select && !model_type && stem_type) {
      selectedModel = getRecommendedModel(stem_type);
      console.log(`Auto-selected model "${selectedModel}" for stem type "${stem_type}"`);
    }

    const modelConfig = MODELS[selectedModel];
    if (!modelConfig) {
      throw new Error(`Unknown model type: ${selectedModel}`);
    }

    console.log(`Starting MIDI transcription with ${modelConfig.name}...`);

    // Prepare input for Spotify Basic Pitch
    const input = {
      audio: audio_url,
      // Optional parameters for Basic Pitch
      onset_threshold: 0.5,
      frame_threshold: 0.3,
      minimum_note_length: 58, // milliseconds
      minimum_frequency: 32, // Hz
      maximum_frequency: 2000, // Hz
    };

    console.log('Running transcription with input:', input);

    // Run transcription with retry
    let output: unknown;
    try {
      output = await retryWithBackoff(async () => {
        return await replicate.run("spotify/basic-pitch", { input });
      }, 3, 2000);
    } catch (modelError) {
      console.error('Model error:', modelError);
      throw new Error(`MIDI transcription failed: ${modelError instanceof Error ? modelError.message : 'Unknown error'}. Please try again.`);
    }
    
    console.log('Model output:', typeof output, JSON.stringify(output).slice(0, 500));

    // Handle Spotify Basic Pitch output format
    // Output is: { midi: "url", notes_sonified: "url", notes_csv: "url" }
    let midiUrl: string | undefined;

    if (output && typeof output === 'object') {
      const outputObj = output as Record<string, unknown>;
      
      // Basic Pitch returns { midi: "url", ... }
      if (typeof outputObj.midi === 'string') {
        midiUrl = outputObj.midi;
      } else if (typeof outputObj.output === 'string') {
        midiUrl = outputObj.output;
      } else if (Array.isArray(outputObj.midi) && outputObj.midi.length > 0) {
        midiUrl = outputObj.midi[0];
      }
    } else if (typeof output === 'string') {
      midiUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      const first = output[0];
      midiUrl = typeof first === 'string' ? first : (first as any)?.file || (first as any)?.midi;
    }

    if (!midiUrl || typeof midiUrl !== 'string') {
      console.error('Unexpected output format:', JSON.stringify(output));
      throw new Error('No valid MIDI URL received from model');
    }

    console.log('Transcription completed, downloading from:', midiUrl);

    // Download file from Replicate
    const fileResponse = await fetch(midiUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download output: ${fileResponse.statusText}`);
    }
    
    const fileArrayBuffer = await fileResponse.arrayBuffer();
    const fileBlob = new Uint8Array(fileArrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedTitle = (track.title || 'track').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const stemSuffix = stem_type ? `_${stem_type}` : '';
    const modelSuffix = `_${selectedModel}`;
    const filePath = `midi/${track.user_id}/${track_id}${stemSuffix}${modelSuffix}_${sanitizedTitle}_${timestamp}.mid`;

    console.log('Uploading to Storage:', filePath);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(filePath, fileBlob, {
        contentType: 'audio/midi',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-assets')
      .getPublicUrl(filePath);

    const permanentUrl = urlData.publicUrl;
    console.log('File uploaded successfully:', permanentUrl);

    // Determine version type
    const versionType = stem_id 
      ? 'stem_midi_transcription' 
      : 'midi_transcription';

    // Create a track version
    const { data: version, error: versionError } = await supabase
      .from('track_versions')
      .insert({
        track_id,
        audio_url: permanentUrl,
        version_type: versionType,
        version_label: `MIDI (${modelConfig.name})`,
        metadata: {
          model_type: selectedModel,
          model_name: modelConfig.name,
          original_audio_url: audio_url,
          transcribed_at: new Date().toISOString(),
          storage_path: filePath,
          stem_id: stem_id || null,
          stem_type: stem_type || null,
          output_type: 'midi',
          auto_selected: auto_select && !model_type,
        },
      })
      .select()
      .single();

    if (versionError) {
      console.error('Error saving version:', versionError);
      throw versionError;
    }

    console.log('Version saved:', version.id);

    // Log the change
    await supabase
      .from('track_change_log')
      .insert({
        track_id,
        user_id: track.user_id,
        change_type: versionType,
        changed_by: 'system',
        version_id: version.id,
        ai_model_used: selectedModel,
        metadata: {
          model_name: modelConfig.name,
          output_url: permanentUrl,
          storage_path: filePath,
          stem_id: stem_id || null,
          stem_type: stem_type || null,
          output_type: 'midi',
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        output_url: permanentUrl,
        midi_url: permanentUrl,
        version,
        model_used: selectedModel,
        model_name: modelConfig.name,
        output_type: 'midi',
        stem_id,
        stem_type,
        auto_selected: auto_select && !model_type,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in transcribe-midi:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
