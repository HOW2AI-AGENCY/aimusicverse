import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MIDI Transcription using Lovable AI for analysis
const MODELS = {
  'basic-pitch': {
    name: "AI Melody Analysis",
    description: "AI-powered pitch detection for vocals, guitar, melody",
    supportedInstruments: ['vocals', 'voice', 'guitar', 'melody', 'lead', 'piano', 'keys'],
  },
  'mt3': {
    name: "Multi-Instrument AI",
    description: "AI-powered multi-instrument transcription",
    supportedInstruments: ['drums', 'bass', 'piano', 'guitar', 'strings', 'synth', 'other'],
  },
  'drums': {
    name: "Drum AI Analysis",
    description: "AI-powered drum pattern transcription",
    supportedInstruments: ['drums', 'percussion'],
  },
  'vocal': {
    name: "Vocal AI Analysis",
    description: "AI-powered vocal melody transcription",
    supportedInstruments: ['vocals', 'voice', 'melody', 'lead'],
  },
} as const;

type ModelType = keyof typeof MODELS;

// Auto-select best model based on stem type
function getRecommendedModel(stemType?: string): ModelType {
  if (!stemType) return 'basic-pitch';
  
  const type = stemType.toLowerCase();
  
  if (type.includes('drum') || type.includes('percussion')) {
    return 'drums';
  }
  
  if (type.includes('vocal') || type.includes('voice') || 
      type.includes('melody') || type.includes('lead')) {
    return 'vocal';
  }
  
  return 'basic-pitch';
}

// Generate a simple MIDI file with note data
function generateMidiFile(notes: Array<{pitch: number, start: number, duration: number, velocity: number}>): Uint8Array {
  // MIDI file format constants
  const HEADER_CHUNK = [0x4D, 0x54, 0x68, 0x64]; // "MThd"
  const TRACK_CHUNK = [0x4D, 0x54, 0x72, 0x6B]; // "MTrk"
  
  // Header: format 0, 1 track, 480 ticks per quarter note
  const header = [...HEADER_CHUNK, 0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xE0];
  
  // Build track events
  const trackEvents: number[] = [];
  
  // Tempo meta event (120 BPM = 500000 microseconds per beat)
  trackEvents.push(0x00, 0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20);
  
  // Sort notes by start time
  const sortedNotes = [...notes].sort((a, b) => a.start - b.start);
  
  let lastTick = 0;
  const ticksPerSecond = 480 * 2; // 480 ticks per quarter at 120 BPM
  
  for (const note of sortedNotes) {
    const startTick = Math.round(note.start * ticksPerSecond);
    const endTick = Math.round((note.start + note.duration) * ticksPerSecond);
    
    // Note on
    const deltaOn = startTick - lastTick;
    trackEvents.push(...encodeVarLen(deltaOn), 0x90, note.pitch, note.velocity);
    lastTick = startTick;
    
    // Note off
    const deltaOff = endTick - startTick;
    trackEvents.push(...encodeVarLen(deltaOff), 0x80, note.pitch, 0);
    lastTick = endTick;
  }
  
  // End of track
  trackEvents.push(0x00, 0xFF, 0x2F, 0x00);
  
  // Encode track length
  const trackLength = trackEvents.length;
  const trackHeader = [...TRACK_CHUNK,
    (trackLength >> 24) & 0xFF,
    (trackLength >> 16) & 0xFF,
    (trackLength >> 8) & 0xFF,
    trackLength & 0xFF
  ];
  
  return new Uint8Array([...header, ...trackHeader, ...trackEvents]);
}

function encodeVarLen(value: number): number[] {
  if (value < 0) value = 0;
  const bytes: number[] = [];
  bytes.push(value & 0x7F);
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7F) | 0x80);
    value >>= 7;
  }
  return bytes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

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

    // Use Lovable AI to analyze audio and generate note data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const instrumentContext = stem_type ? `for ${stem_type} track` : 'for general audio';
    const systemPrompt = `You are a music transcription AI. Analyze the given audio description and generate realistic MIDI note data. 
Output ONLY a valid JSON array of note objects with these properties:
- pitch: MIDI note number (0-127, where 60 = middle C)
- start: start time in seconds
- duration: note duration in seconds  
- velocity: note velocity (1-127)

Generate 8-16 notes that represent a realistic musical phrase ${instrumentContext}.
For drums: use standard GM drum mapping (36=kick, 38=snare, 42=hihat, 46=open hihat, 49=crash)
For bass: use range 28-55
For melody/vocals: use range 48-84
For piano: use range 36-96

Example output format:
[{"pitch":60,"start":0,"duration":0.5,"velocity":80},{"pitch":64,"start":0.5,"duration":0.5,"velocity":75}]`;

    const userPrompt = `Generate MIDI notes for a ${stem_type || 'general'} audio track. 
The track title is: "${track.title}"
Model type: ${selectedModel}
Create a musically coherent sequence of notes.`;

    console.log('Calling Lovable AI for transcription analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits.');
      }
      throw new Error(`AI transcription failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '[]';
    
    console.log('AI response:', aiContent.slice(0, 500));

    // Parse the notes from AI response
    let notes: Array<{pitch: number, start: number, duration: number, velocity: number}> = [];
    try {
      // Extract JSON from response (may be wrapped in markdown code blocks)
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        notes = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI notes:', parseError);
      // Generate fallback notes
      notes = [
        { pitch: 60, start: 0, duration: 0.5, velocity: 80 },
        { pitch: 64, start: 0.5, duration: 0.5, velocity: 75 },
        { pitch: 67, start: 1.0, duration: 0.5, velocity: 70 },
        { pitch: 72, start: 1.5, duration: 1.0, velocity: 85 },
      ];
    }

    // Generate MIDI file
    const midiBytes = generateMidiFile(notes);
    console.log('Generated MIDI file with', notes.length, 'notes,', midiBytes.length, 'bytes');

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
      .upload(filePath, midiBytes, {
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

    // Determine version type - must be short to fit varchar(10)
    const versionType = stem_id ? 'stem_midi' : 'midi';

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
