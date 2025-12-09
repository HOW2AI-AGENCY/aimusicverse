import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model configurations
const MODELS = {
  // Google MT3 - best for complex multi-instrument transcription
  'mt3': {
    id: "turian/multi-task-music-transcription:66659dac66c53d19c38d75a00ac8c0df98342e2ec0a09e22fe4b0e7ea0f0ae76",
    name: "MT3 (Multi-Task)",
    description: "Best for drums, complex polyphonic content",
    inputKey: "audio_file",
    extraParams: { model_type: "mt3" },
  },
  // Spotify Basic Pitch - lightweight, fast, accurate for melodic content
  'basic-pitch': {
    id: "rhelsing/basic-pitch:e70a98ce5f6c38fe2c19b9c7d4d7ed507b92fa4d7db24f4e46c35ddb79dfdfad",
    name: "Basic Pitch (Spotify)",
    description: "Best for vocals, guitar, bass, melodic instruments",
    inputKey: "audio_file",
    extraParams: {},
  },
  // Pop2Piano - creates piano arrangement from any audio
  'pop2piano': {
    id: "m1guelpf/pop2piano:da5dd7bc4a20aed6a30d17ce59f21a0f9b9ed5879f24c87d3c8a6f0a7e4cf4a2",
    name: "Pop2Piano",
    description: "Creates piano arrangement from any song",
    inputKey: "audio",
    extraParams: { composer: "composer1" },
    outputType: "audio", // Returns audio, not MIDI directly
  },
  // ByteDance Piano Transcription - specialized for piano
  'piano': {
    id: "bytedance/piano-transcription:0d3a0c3d5b2e8f9c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c",
    name: "Piano Transcription",
    description: "Specialized for piano recordings",
    inputKey: "audio",
    extraParams: {},
  },
} as const;

type ModelType = keyof typeof MODELS;

// Auto-select best model based on stem type
function getRecommendedModel(stemType?: string): ModelType {
  if (!stemType) return 'mt3';
  
  const type = stemType.toLowerCase();
  
  // Drums benefit from MT3's multi-task approach
  if (type.includes('drum') || type.includes('percussion')) {
    return 'mt3';
  }
  
  // Melodic instruments work great with Basic Pitch
  if (type.includes('vocal') || type.includes('voice') || 
      type.includes('guitar') || type.includes('bass') ||
      type.includes('melody') || type.includes('lead')) {
    return 'basic-pitch';
  }
  
  // Piano/keyboard content
  if (type.includes('piano') || type.includes('keyboard') || type.includes('keys')) {
    return 'basic-pitch'; // Basic Pitch handles piano well
  }
  
  // Default to MT3 for unknown or complex content
  return 'mt3';
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
      auto_select = true, // Auto-select best model for stem type
      pop2piano_composer = 'composer1', // For pop2piano: composer1-7
    } = await req.json();
    
    console.log('Transcribing to MIDI:', { track_id, audio_url, model_type, stem_id, stem_type, auto_select });

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

    // Determine which model to use
    let selectedModel: ModelType = model_type || 'mt3';
    
    if (auto_select && !model_type && stem_type) {
      selectedModel = getRecommendedModel(stem_type);
      console.log(`Auto-selected model "${selectedModel}" for stem type "${stem_type}"`);
    }

    const modelConfig = MODELS[selectedModel];
    if (!modelConfig) {
      throw new Error(`Unknown model type: ${selectedModel}`);
    }

    console.log(`Starting MIDI transcription with ${modelConfig.name}...`);

    // Prepare input based on model
    const input: Record<string, unknown> = {
      [modelConfig.inputKey]: audio_url,
      ...modelConfig.extraParams,
    };

    // Special handling for pop2piano
    if (selectedModel === 'pop2piano') {
      input.composer = pop2piano_composer;
    }

    // Run transcription
    const output = await replicate.run(modelConfig.id, { input });
    
    console.log('Model output:', output);

    // Handle different output formats
    let midiUrl: string;
    let outputType = 'midi';

    if (typeof output === 'string') {
      midiUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      midiUrl = output[0];
    } else if (typeof output === 'object' && output !== null) {
      // Some models return {midi: url} or {audio: url}
      const outputObj = output as Record<string, unknown>;
      midiUrl = (outputObj.midi || outputObj.audio || outputObj.output) as string;
      if (outputObj.audio && !outputObj.midi) {
        outputType = 'audio';
      }
    } else {
      throw new Error('Unexpected model output format');
    }

    if (!midiUrl) {
      throw new Error('No output URL received from model');
    }

    console.log('Transcription completed, downloading file...');

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
    const extension = outputType === 'audio' ? 'mp3' : 'mid';
    const folder = outputType === 'audio' ? 'piano-arrangements' : 'midi';
    const filePath = `${folder}/${track.user_id}/${track_id}${stemSuffix}${modelSuffix}_${sanitizedTitle}_${timestamp}.${extension}`;

    console.log('Uploading to Storage:', filePath);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(filePath, fileBlob, {
        contentType: outputType === 'audio' ? 'audio/mpeg' : 'audio/midi',
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
    const versionType = selectedModel === 'pop2piano' 
      ? 'piano_arrangement'
      : stem_id 
        ? 'stem_midi_transcription' 
        : 'midi_transcription';

    // Create a track version
    const { data: version, error: versionError } = await supabase
      .from('track_versions')
      .insert({
        track_id,
        audio_url: permanentUrl,
        version_type: versionType,
        version_label: selectedModel === 'pop2piano' 
          ? 'Piano Arrangement'
          : `MIDI (${modelConfig.name})`,
        metadata: {
          model_type: selectedModel,
          model_name: modelConfig.name,
          original_audio_url: audio_url,
          transcribed_at: new Date().toISOString(),
          storage_path: filePath,
          stem_id: stem_id || null,
          stem_type: stem_type || null,
          output_type: outputType,
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
          output_type: outputType,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        output_url: permanentUrl,
        midi_url: permanentUrl, // Backward compatibility
        version,
        model_used: selectedModel,
        model_name: modelConfig.name,
        output_type: outputType,
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
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
