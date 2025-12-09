import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MIDI Transcription Models - Updated with correct model versions
const MODELS = {
  // ByteDance Piano Transcription - High-resolution piano with pedals and velocity
  'bytedance-piano': {
    replicateId: "bytedance/piano-transcription:cc4e8e34fb1cde695b6e05a257ce44289acf527f83143d2abea28e6f20d55f12",
    name: "ByteDance Piano (High-Res)",
    description: "High-resolution piano with pedals and velocity detection",
    inputKey: "audio_input",
    modelTypeParam: null,
    supportedInstruments: ['piano', 'keys', 'keyboard'],
    outputFormat: 'array-file', // Returns [{file: "url"}]
  },
  // MT3 - Multi-Task Multitrack Music Transcription (multi-instrument)
  'mt3': {
    replicateId: "cjwbw/omnizart:0f26ad89f797f3a3d7f04b3a5c1e7cccc696b67cf9aa8f63c8f6e40f40cf8e23",
    name: "Omnizart (Multi-Instrument)",
    description: "Best for multi-instrument transcription (drums, bass, piano, etc.)",
    inputKey: "audio",
    modelTypeParam: "music",
    supportedInstruments: ['drums', 'bass', 'piano', 'guitar', 'strings', 'synth', 'other'],
    outputFormat: 'string', // Returns URL string directly
  },
  // ISMIR2021 - Piano-specific transcription (same as MT3 but piano mode)
  'ismir2021': {
    replicateId: "cjwbw/omnizart:0f26ad89f797f3a3d7f04b3a5c1e7cccc696b67cf9aa8f63c8f6e40f40cf8e23",
    name: "Omnizart (Piano)",
    description: "Specialized for piano transcription",
    inputKey: "audio",
    modelTypeParam: "music-piano",
    supportedInstruments: ['piano', 'keys', 'keyboard'],
    outputFormat: 'string',
  },
  // Drums transcription
  'drums': {
    replicateId: "cjwbw/omnizart:0f26ad89f797f3a3d7f04b3a5c1e7cccc696b67cf9aa8f63c8f6e40f40cf8e23",
    name: "Omnizart (Drums)",
    description: "Specialized for drum transcription",
    inputKey: "audio",
    modelTypeParam: "drum",
    supportedInstruments: ['drums', 'percussion'],
    outputFormat: 'string',
  },
  // Vocal transcription
  'vocal': {
    replicateId: "cjwbw/omnizart:0f26ad89f797f3a3d7f04b3a5c1e7cccc696b67cf9aa8f63c8f6e40f40cf8e23",
    name: "Omnizart (Vocal)",
    description: "Vocal melody transcription",
    inputKey: "audio",
    modelTypeParam: "vocal",
    supportedInstruments: ['vocals', 'voice', 'melody', 'lead'],
    outputFormat: 'string',
  },
  // Basic Pitch fallback - use bytedance for now as basic-pitch model is unavailable
  'basic-pitch': {
    replicateId: "bytedance/piano-transcription:cc4e8e34fb1cde695b6e05a257ce44289acf527f83143d2abea28e6f20d55f12",
    name: "Basic Pitch (Melodic)",
    description: "Good for vocals, melody, guitar (using piano model as fallback)",
    inputKey: "audio_input",
    modelTypeParam: null,
    supportedInstruments: ['vocals', 'voice', 'guitar', 'melody', 'lead'],
    outputFormat: 'array-file',
  },
} as const;

type ModelType = keyof typeof MODELS;

// Auto-select best model based on stem type
function getRecommendedModel(stemType?: string): ModelType {
  if (!stemType) return 'mt3'; // Default to MT3 for multi-instrument
  
  const type = stemType.toLowerCase();
  
  // Piano/keyboard - use ByteDance high-resolution piano model
  if (type.includes('piano') || type.includes('keyboard') || type.includes('keys')) {
    return 'bytedance-piano';
  }
  
  // Drums/percussion - use specialized drum model
  if (type.includes('drum') || type.includes('percussion')) {
    return 'drums';
  }
  
  // Bass, complex instruments - use MT3
  if (type.includes('bass') || type.includes('other') ||
      type.includes('synth') || type.includes('strings') ||
      type.includes('instrumental')) {
    return 'mt3';
  }
  
  // Vocals and melodic content - use vocal model
  if (type.includes('vocal') || type.includes('voice') || 
      type.includes('melody') || type.includes('lead')) {
    return 'vocal';
  }
  
  // Guitar - use MT3
  if (type.includes('guitar')) {
    return 'mt3';
  }
  
  // Default to MT3 for unknown content
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
      auto_select = true,
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
    };

    // Add model_type for Omnizart
    if (modelConfig.modelTypeParam) {
      input.mode = modelConfig.modelTypeParam;
    }

    const modelId = modelConfig.replicateId;
    console.log(`Using model: ${modelId}`, { input });

    // Run transcription
    let output: unknown;
    try {
      output = await replicate.run(modelId as `${string}/${string}:${string}`, { input });
    } catch (modelError) {
      console.error('Model error:', modelError);
      
      // Fallback to bytedance piano if primary model fails
      if (selectedModel !== 'bytedance-piano') {
        console.log('Trying fallback to bytedance-piano model...');
        const fallbackConfig = MODELS['bytedance-piano'];
        const fallbackInput = {
          [fallbackConfig.inputKey]: audio_url,
        };
        
        try {
          output = await replicate.run(fallbackConfig.replicateId as `${string}/${string}:${string}`, { input: fallbackInput });
          selectedModel = 'bytedance-piano';
        } catch (fallbackError) {
          console.error('Fallback model also failed:', fallbackError);
          throw new Error(`All transcription models failed. Please try again later.`);
        }
      } else {
        throw new Error(`Model ${modelId} failed: ${modelError instanceof Error ? modelError.message : 'Unknown error'}`);
      }
    }
    
    console.log('Model output:', typeof output, output);

    // Handle different output formats based on model
    let outputUrl: string;

    if (typeof output === 'string') {
      // MT3, ISMIR2021, Omnizart return URL string directly
      outputUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      // ByteDance piano-transcription returns [{file: "url"}]
      const firstItem = output[0];
      if (typeof firstItem === 'string') {
        outputUrl = firstItem;
      } else if (firstItem && typeof firstItem === 'object' && 'file' in firstItem) {
        outputUrl = (firstItem as { file: string }).file;
      } else {
        outputUrl = JSON.stringify(firstItem);
      }
    } else if (output && typeof output === 'object') {
      const outputObj = output as Record<string, unknown>;
      outputUrl = (outputObj.midi || outputObj.file || outputObj.output || Object.values(outputObj)[0]) as string;
    } else {
      throw new Error(`Unexpected model output format: ${JSON.stringify(output)}`);
    }

    if (!outputUrl || typeof outputUrl !== 'string') {
      throw new Error('No valid output URL received from model');
    }

    console.log('Transcription completed, downloading file from:', outputUrl);

    // Download file from Replicate
    const fileResponse = await fetch(outputUrl);
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
        version_label: `MIDI (${MODELS[selectedModel].name})`,
        metadata: {
          model_type: selectedModel,
          model_name: MODELS[selectedModel].name,
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
          model_name: MODELS[selectedModel].name,
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
        model_name: MODELS[selectedModel].name,
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
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
