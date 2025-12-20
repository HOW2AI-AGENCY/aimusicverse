import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KlangioRequest {
  audio_url: string;
  mode: 'transcription' | 'chord-recognition' | 'chord-recognition-extended' | 'beat-tracking';
  model?: 'guitar' | 'piano' | 'drums' | 'vocal' | 'bass' | 'universal' | 'lead' | 'detect' | 'multi' | 'wind' | 'string' | 'piano_arrangement';
  // OpenAPI spec JobOutputs enum: mxml, midi, pdf, gp5, json, midi_quant
  outputs?: ('midi' | 'mxml' | 'gp5' | 'pdf' | 'midi_quant' | 'json')[];
  title?: string;
  vocabulary?: 'major-minor' | 'full';
  user_id?: string;
  stem_type?: string; // Used for intelligent output selection
}

// Intelligent model selection based on stem type
function getSmartModel(stemType: string | undefined, requestedModel: string | undefined): string {
  // If model explicitly provided, use it
  if (requestedModel && requestedModel !== 'universal') {
    return requestedModel;
  }
  
  const type = (stemType || '').toLowerCase();
  
  if (type.includes('guitar')) return 'guitar';
  if (type.includes('bass')) return 'bass';
  if (type.includes('drum')) return 'drums';
  if (type.includes('piano') || type.includes('keys')) return 'piano';
  if (type.includes('vocal')) return 'vocal';
  if (type.includes('lead')) return 'lead';
  if (type.includes('string')) return 'string';
  if (type.includes('wind')) return 'wind';
  
  // For unknown/other/instrumental - use 'piano' model which has better MIDI support
  // 'universal' model often doesn't generate MIDI for complex polyphonic content
  if (type.includes('instrumental') || type.includes('other') || !type) {
    console.log(`[klangio] stem_type="${stemType}" - using 'piano' model for better MIDI support`);
    return 'piano';
  }
  
  return requestedModel || 'piano';
}

// Intelligent output selection based on stem type
function getSmartOutputs(stemType: string | undefined, requestedOutputs: string[] | undefined): string[] {
  // If outputs explicitly provided, use them
  if (requestedOutputs && requestedOutputs.length > 0) {
    return requestedOutputs;
  }
  
  // Intelligent selection based on stem type
  const type = (stemType || '').toLowerCase();
  
  if (type.includes('guitar')) {
    return ['midi', 'midi_quant', 'gp5', 'pdf', 'mxml'];
  }
  if (type.includes('bass')) {
    return ['midi', 'midi_quant', 'gp5', 'mxml'];
  }
  if (type.includes('drum')) {
    return ['midi', 'midi_quant', 'pdf'];
  }
  if (type.includes('piano') || type.includes('keys')) {
    return ['midi', 'midi_quant', 'pdf', 'mxml'];
  }
  if (type.includes('vocal')) {
    return ['midi', 'pdf', 'mxml'];
  }
  if (type.includes('instrumental') || type.includes('other')) {
    return ['midi', 'midi_quant', 'mxml'];
  }
  
  // Default outputs
  return ['midi', 'midi_quant', 'mxml', 'gp5', 'pdf'];
}

// Generate MIDI file from notes array (fallback when API doesn't return MIDI)
function generateMidiFromNotes(notes: any[], bpm: number = 120): Uint8Array {
  // Standard MIDI File format (SMF Type 0)
  const ticksPerBeat = 480;
  const tempo = Math.round(60000000 / bpm); // microseconds per beat
  
  // Sort notes by start time
  const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime);
  
  // Convert time in seconds to ticks
  const secondsToTicks = (seconds: number) => Math.round(seconds * ticksPerBeat * (bpm / 60));
  
  // Build track data
  const trackEvents: Array<{delta: number, data: number[]}> = [];
  
  // Tempo event (FF 51 03 + 3-byte tempo)
  trackEvents.push({
    delta: 0,
    data: [0xFF, 0x51, 0x03, (tempo >> 16) & 0xFF, (tempo >> 8) & 0xFF, tempo & 0xFF]
  });
  
  // Convert notes to MIDI events (note on/off pairs)
  interface MidiEvent {
    tick: number;
    type: 'on' | 'off';
    pitch: number;
    velocity: number;
  }
  
  const midiEvents: MidiEvent[] = [];
  
  for (const note of sortedNotes) {
    const startTick = secondsToTicks(note.startTime);
    const endTick = secondsToTicks(note.endTime);
    const pitch = Math.min(127, Math.max(0, note.pitch));
    const velocity = Math.min(127, Math.max(1, note.velocity || 80));
    
    midiEvents.push({ tick: startTick, type: 'on', pitch, velocity });
    midiEvents.push({ tick: endTick, type: 'off', pitch, velocity: 0 });
  }
  
  // Sort by tick time
  midiEvents.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    // Note offs before note ons at same tick
    return a.type === 'off' ? -1 : 1;
  });
  
  // Convert to track events with delta times
  let lastTick = 0;
  for (const event of midiEvents) {
    const delta = event.tick - lastTick;
    lastTick = event.tick;
    
    const status = event.type === 'on' ? 0x90 : 0x80; // Channel 0
    trackEvents.push({
      delta,
      data: [status, event.pitch, event.velocity]
    });
  }
  
  // End of track event
  trackEvents.push({
    delta: 0,
    data: [0xFF, 0x2F, 0x00]
  });
  
  // Encode variable-length quantity
  function encodeVLQ(value: number): number[] {
    if (value === 0) return [0];
    const bytes: number[] = [];
    let v = value;
    bytes.unshift(v & 0x7F);
    v >>= 7;
    while (v > 0) {
      bytes.unshift((v & 0x7F) | 0x80);
      v >>= 7;
    }
    return bytes;
  }
  
  // Build track chunk
  const trackData: number[] = [];
  for (const event of trackEvents) {
    trackData.push(...encodeVLQ(event.delta));
    trackData.push(...event.data);
  }
  
  // Header chunk: MThd
  const header = [
    0x4D, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // chunk length (6)
    0x00, 0x00,             // format type 0
    0x00, 0x01,             // 1 track
    (ticksPerBeat >> 8) & 0xFF, ticksPerBeat & 0xFF // ticks per beat
  ];
  
  // Track chunk: MTrk
  const trackLength = trackData.length;
  const track = [
    0x4D, 0x54, 0x72, 0x6B, // "MTrk"
    (trackLength >> 24) & 0xFF,
    (trackLength >> 16) & 0xFF,
    (trackLength >> 8) & 0xFF,
    trackLength & 0xFF,
    ...trackData
  ];
  
  return new Uint8Array([...header, ...track]);
}

const API_BASE = "https://api.klang.io";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let logId: string | null = null;
  let supabase: any = null;

  try {
    const KLANGIO_API_KEY = Deno.env.get("KLANGIO_API_KEY");
    if (!KLANGIO_API_KEY) {
      console.error("[klangio] KLANGIO_API_KEY not configured");
      throw new Error("KLANGIO_API_KEY is not configured. Please add your Klangio API key.");
    }

    supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { audio_url, mode, model, outputs, vocabulary, user_id, title, stem_type } = await req.json() as KlangioRequest;

    if (!audio_url || !mode) {
      throw new Error("audio_url and mode are required");
    }

    // Use intelligent model selection
    const smartModel = getSmartModel(stem_type, model);
    console.log(`[klangio] Starting ${mode} analysis for: ${audio_url}`);
    console.log(`[klangio] stem_type: ${stem_type || 'not specified'}, requested model: ${model || 'none'}, using model: ${smartModel}`);

    // Create initial log entry
    // Use intelligent output selection based on stem_type
    const smartOutputs = getSmartOutputs(stem_type, outputs);
    const requestedOutputs = mode === 'transcription' ? smartOutputs : null;
    console.log(`[klangio] Smart outputs for stem_type "${stem_type}": ${JSON.stringify(smartOutputs)}`);

    const { data: logData, error: logError } = await supabase
      .from('klangio_analysis_logs')
      .insert({
        user_id: user_id || '00000000-0000-0000-0000-000000000000',
        mode,
        model: smartModel,
        status: 'pending',
        audio_url,
        requested_outputs: requestedOutputs,
        vocabulary: vocabulary || null,
        raw_request: { mode, model: smartModel, outputs, vocabulary, title, audio_url, stem_type },
      })
      .select('id')
      .single();

    if (logError) {
      console.warn('[klangio] Failed to create log entry:', logError);
    } else {
      logId = logData.id;
      console.log(`[klangio] Created log entry: ${logId}`);
    }

    // Download audio file
    console.log("[klangio] Downloading audio file...");
    const audioResponse = await fetch(audio_url);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }
    const audioBlob = await audioResponse.blob();
    console.log(`[klangio] Audio downloaded: ${audioBlob.size} bytes`);

    // Prepare form data for Klangio API
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");

    // Build endpoint URL with query parameters
    let baseEndpoint: string;
    const queryParams = new URLSearchParams();

    // Valid output formats from OpenAPI spec JobOutputs enum: mxml, midi, pdf, gp5, json, midi_quant
    const validFormats = ['midi', 'midi_quant', 'mxml', 'gp5', 'pdf', 'json'];
    
    switch (mode) {
      case 'transcription':
        baseEndpoint = `${API_BASE}/transcription`;
        queryParams.set('model', smartModel);
        if (title) queryParams.set('title', title);
        // Add outputs - valid formats: midi, midi_quant, mxml, gp5, pdf
        const transcriptionValidFormats = ['midi', 'midi_quant', 'mxml', 'gp5', 'pdf'];
        const reqOutputs = outputs || smartOutputs;
        const validOutputs = reqOutputs.filter((o: string) => transcriptionValidFormats.includes(o));
        if (validOutputs.length === 0) validOutputs.push('midi');
        console.log(`[klangio] Transcription outputs: requested=${JSON.stringify(reqOutputs)}, valid=${JSON.stringify(validOutputs)}`);
        // Klangio expects 'outputs' in both query params AND form data for proper processing
        validOutputs.forEach((output: string) => {
          queryParams.append('outputs', output);
          formData.append('outputs', output);
        });
        console.log(`[klangio] QueryParams after appending outputs: ${queryParams.toString()}`);
        break;
        
      case 'chord-recognition':
        baseEndpoint = `${API_BASE}/chord-recognition`;
        queryParams.set('vocabulary', vocabulary || 'major-minor');
        break;
        
      case 'chord-recognition-extended':
        baseEndpoint = `${API_BASE}/chord-recognition-extended`;
        queryParams.set('vocabulary', vocabulary || 'full');
        break;
        
      case 'beat-tracking':
        baseEndpoint = `${API_BASE}/beat-tracking`;
        break;
        
      default:
        throw new Error(`Unknown mode: ${mode}`);
    }

    const endpoint = queryParams.toString()
      ? `${baseEndpoint}?${queryParams.toString()}`
      : baseEndpoint;

    console.log(`[klangio] Final queryParams.toString(): ${queryParams.toString()}`);
    console.log(`[klangio] Final endpoint constructed: ${endpoint}`);

    // Submit job to Klangio - use kl-api-key header as per OpenAPI spec
    console.log(`[klangio] Submitting job to ${endpoint}`);
    const submitResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "kl-api-key": KLANGIO_API_KEY,
      },
      body: formData,
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error(`[klangio] API error: ${submitResponse.status} - ${errorText}`);
      
      // Update log with error
      if (logId) {
        await supabase.from('klangio_analysis_logs').update({
          status: 'failed',
          error_message: `API error ${submitResponse.status}: ${errorText}`,
          raw_response: { status: submitResponse.status, body: errorText },
          duration_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        }).eq('id', logId);
      }
      
      if (submitResponse.status === 401) {
        throw new Error("Invalid Klangio API key. Please check your KLANGIO_API_KEY.");
      }
      if (submitResponse.status === 422) {
        throw new Error(`Klangio validation error: ${errorText}`);
      }
      throw new Error(`Klangio API error: ${submitResponse.status}`);
    }

    const jobResponse = await submitResponse.json();
    const jobId = jobResponse.job_id;
    console.log(`[klangio] Job created: ${jobId}`, JSON.stringify(jobResponse, null, 2));

    // Update log with job_id and check which files will be generated
    // TranscriptionJobResponse includes: gen_xml, gen_midi, gen_midi_quant, gen_gp5, gen_pdf
    const generatedFormats: string[] = [];
    if (jobResponse.gen_midi) generatedFormats.push('midi');
    // Check both field names for quantized MIDI (API docs inconsistency)
    if (jobResponse.gen_midi_quant || jobResponse.gen_midi_unq) generatedFormats.push('midi_quant');
    if (jobResponse.gen_xml) generatedFormats.push('mxml');
    if (jobResponse.gen_gp5) generatedFormats.push('gp5');
    if (jobResponse.gen_pdf) generatedFormats.push('pdf');
    console.log(`[klangio] API response flags:`, { 
      gen_midi: jobResponse.gen_midi, 
      gen_midi_unq: jobResponse.gen_midi_unq,
      gen_midi_quant: jobResponse.gen_midi_quant,
      gen_xml: jobResponse.gen_xml, 
      gen_gp5: jobResponse.gen_gp5, 
      gen_pdf: jobResponse.gen_pdf 
    });
    console.log(`[klangio] Will attempt to fetch formats: ${generatedFormats.join(', ')}`);
    
    if (logId) {
      await supabase.from('klangio_analysis_logs').update({
        job_id: jobId,
        status: 'processing',
        raw_response: jobResponse,
      }).eq('id', logId);
    }

    // Poll for job completion
    const maxAttempts = mode === 'transcription' ? 90 : 60;
    const pollInterval = 2000;
    let result: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(`${API_BASE}/job/${jobId}/status`, {
        headers: { "kl-api-key": KLANGIO_API_KEY },
      });

      if (!statusResponse.ok) {
        console.warn(`[klangio] Status check failed: ${statusResponse.status}`);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`[klangio] Job status (${attempt + 1}/${maxAttempts}): ${statusData.status}`);

      if (statusData.status === "COMPLETED") {
        result = statusData;
        console.log(`[klangio] Job completed! Full status data:`, JSON.stringify(statusData, null, 2));
        // Log any generation flags if present
        if (mode === 'transcription') {
          const flags = {
            gen_midi: statusData.gen_midi,
            gen_midi_unq: statusData.gen_midi_unq,
            gen_midi_quant: statusData.gen_midi_quant,
            gen_xml: statusData.gen_xml,
            gen_gp5: statusData.gen_gp5,
            gen_pdf: statusData.gen_pdf,
          };
          console.log(`[klangio] API response flags:`, JSON.stringify(flags, null, 2));
        }
        break;
      } else if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(statusData.status)) {
        const errorMsg = statusData.error || 'Unknown error';
        
        if (logId) {
          await supabase.from('klangio_analysis_logs').update({
            status: 'failed',
            error_message: errorMsg,
            duration_ms: Date.now() - startTime,
            completed_at: new Date().toISOString(),
          }).eq('id', logId);
        }
        
        if (errorMsg.toLowerCase().includes('no notes found')) {
          return new Response(JSON.stringify({ 
            error: 'no_notes_found',
            message: 'Не удалось распознать музыкальные ноты в записи.'
          }), { 
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        throw new Error(`Klangio job ${statusData.status}: ${errorMsg}`);
      }
    }

    if (!result) {
      if (logId) {
        await supabase.from('klangio_analysis_logs').update({
          status: 'failed',
          error_message: 'Job timed out',
          duration_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        }).eq('id', logId);
      }
      throw new Error("Job timed out waiting for completion");
    }

    // Fetch results based on mode
    const finalResult: any = {
      success: true,
      job_id: jobId,
      mode,
      model: smartModel,
      status: "completed",
      available_formats: [] as string[], // Will be populated with formats that were actually fetched
    };

    const fetchErrors: Record<string, string> = {};
    const uploadErrors: Record<string, string> = {};

    if (mode === 'transcription') {
      // Only fetch files that were actually generated (based on gen_* flags from API response)
      const filesToFetch = generatedFormats.length > 0 ? generatedFormats : ['midi'];
      const files: Record<string, string> = {};
      let notes: any[] = [];
      let detectedBpm = 120; // default

      console.log(`[klangio] Fetching files for formats:`, filesToFetch, '(API confirmed generation)');

      // Map format to API endpoints - try multiple endpoints for each format
      // According to Klang.io docs: /midi_unq is for unquantized MIDI (standard MIDI export)
      const formatToEndpoints: Record<string, string[]> = {
        'midi': ['midi_unq', 'midi', 'download/midi', 'result/midi'],
        'midi_quant': ['midi_unq', 'midi_quant', 'download/midi_unq'],
        'mxml': ['xml', 'download/xml'],
        'gp5': ['gp5', 'download/gp5'],
        'pdf': ['pdf', 'download/pdf'],
        'json': ['json'],
      };

      // Always fetch JSON for notes data first
      try {
        console.log("[klangio] Fetching notes JSON...");
        const jsonResponse = await fetch(`${API_BASE}/job/${jobId}/json`, {
          headers: { "kl-api-key": KLANGIO_API_KEY },
        });
        
        if (jsonResponse.ok) {
          const transcriptionData = await jsonResponse.json();
          console.log("[klangio] Transcription JSON structure:", Object.keys(transcriptionData));
          console.log("[klangio] Transcription JSON:", JSON.stringify(transcriptionData).slice(0, 3000));
          
          // Extract notes from various possible structures
          if (transcriptionData.notes && Array.isArray(transcriptionData.notes)) {
            // Simple notes array
            notes = transcriptionData.notes.map((n: any) => ({
              pitch: n.pitch ?? n.midi ?? n.note ?? 60,
              startTime: n.start_time ?? n.startTime ?? n.time ?? n.onset ?? 0,
              endTime: n.end_time ?? n.endTime ?? n.offset ?? ((n.start_time ?? n.startTime ?? n.time ?? 0) + (n.duration ?? 0.5)),
              duration: n.duration ?? 0.5,
              velocity: n.velocity ?? n.loudness ?? 80,
              noteName: n.note_name ?? n.noteName ?? null,
            }));
          } else if (transcriptionData.events && Array.isArray(transcriptionData.events)) {
            // Events array format
            notes = transcriptionData.events.filter((e: any) => e.type === 'note' || e.pitch).map((n: any) => ({
              pitch: n.pitch ?? n.midi ?? 60,
              startTime: n.start ?? n.onset ?? n.time ?? 0,
              endTime: n.end ?? n.offset ?? ((n.start ?? n.time ?? 0) + (n.duration ?? 0.5)),
              duration: n.duration ?? 0.5,
              velocity: n.velocity ?? 80,
              noteName: null,
            }));
          } else if (transcriptionData.Parts && Array.isArray(transcriptionData.Parts)) {
            // Klang.io V3 format: Parts[].Measures[].Voices[].Notes[]
            console.log("[klangio] Detected V3 format with Parts structure");
            const musicInfo = transcriptionData.MusicInfo || {};
            detectedBpm = musicInfo.Tempo || 120;
            const measureDuration = musicInfo.MeasureDuration || 1; // in beats
            const secondsPerBeat = 60 / detectedBpm;
            
            let currentMeasureIndex = 0;
            for (const part of transcriptionData.Parts) {
              if (!part.Measures) continue;
              currentMeasureIndex = 0;
              
              for (const measure of part.Measures) {
                const measureStartTime = currentMeasureIndex * measureDuration * secondsPerBeat;
                if (!measure.Voices) {
                  currentMeasureIndex++;
                  continue;
                }
                
                for (const voice of measure.Voices) {
                  if (!voice.Notes) continue;
                  let noteOffset = 0;
                  
                  for (const note of voice.Notes) {
                    // Skip rests (Midi = [-1])
                    const midiValues = note.Midi || [];
                    const validMidi = midiValues.filter((m: number) => m > 0);
                    
                    if (validMidi.length > 0) {
                      const durationInBeats = note.Duration || 0.25;
                      const durationInSeconds = durationInBeats * measureDuration * secondsPerBeat;
                      const startTime = measureStartTime + (noteOffset * measureDuration * secondsPerBeat);
                      
                      for (const midi of validMidi) {
                        notes.push({
                          pitch: midi,
                          startTime: startTime,
                          endTime: startTime + durationInSeconds,
                          duration: durationInSeconds,
                          velocity: note.Velocity || 80,
                          noteName: null,
                        });
                      }
                    }
                    noteOffset += note.Duration || 0.25;
                  }
                }
                currentMeasureIndex++;
              }
            }
            
            // Also store BPM and other metadata
            if (musicInfo.Tempo) {
              finalResult.bpm = musicInfo.Tempo;
            }
            if (musicInfo.TimeSignature) {
              finalResult.time_signature = musicInfo.TimeSignature;
            }
            if (musicInfo.Key !== undefined) {
              // Convert key number to string (0 = C, 1 = G, etc.)
              const keyNames = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab'];
              finalResult.key = keyNames[musicInfo.Key] || `Key ${musicInfo.Key}`;
            }
          }
          
          console.log(`[klangio] Parsed ${notes.length} notes`);
        } else {
          const errText = await jsonResponse.text();
          fetchErrors['json'] = `${jsonResponse.status}: ${errText}`;
          console.warn(`[klangio] Failed to fetch JSON: ${jsonResponse.status}`);
        }
      } catch (e) {
        fetchErrors['json'] = e instanceof Error ? e.message : 'Unknown error';
        console.error("[klangio] Error fetching JSON:", e);
      }

      // INCREASED wait time for files to be ready after job completion (from 3s to 8s)
      console.log('[klangio] Waiting 8s for files to be ready after job completion...');
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Fetch and upload each file format that API confirmed it generated
      for (const format of filesToFetch) {
        if (format === 'json') continue; // Already handled
        
        try {
          const apiEndpoints = formatToEndpoints[format] || [format];
          let fileResponse: Response | null = null;
          let fetchSuccess = false;
          let usedEndpoint = '';

          // Try each possible endpoint
          for (const apiEndpoint of apiEndpoints) {
            // Enhanced retry logic with exponential backoff - INCREASED retries from 5 to 8
            const maxRetries = 8;
            const baseRetryDelay = 2500; // Increased from 2000

            for (let retry = 0; retry < maxRetries; retry++) {
              if (retry > 0) {
                const delay = baseRetryDelay * Math.pow(1.5, retry - 1);
                console.log(`[klangio] Retry ${retry}/${maxRetries - 1} for ${format} via ${apiEndpoint} (waiting ${delay}ms)...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }

              console.log(`[klangio] Fetching ${format} from /job/${jobId}/${apiEndpoint}`);
              fileResponse = await fetch(`${API_BASE}/job/${jobId}/${apiEndpoint}`, {
                headers: { "kl-api-key": KLANGIO_API_KEY },
              });

              console.log(`[klangio] ${format} via ${apiEndpoint}: status=${fileResponse.status}, content-type=${fileResponse.headers.get('content-type')}`);

              if (fileResponse.ok) {
                fetchSuccess = true;
                usedEndpoint = apiEndpoint;
                break;
              } else if (fileResponse.status !== 404) {
                // Non-404 error, don't retry
                break;
              }
              // For 404, continue retrying - file might still be generating
            }
            
            if (fetchSuccess) {
              console.log(`[klangio] ✅ Successfully fetched ${format} via /${usedEndpoint}`);
              break;
            } else {
              console.log(`[klangio] Endpoint /${apiEndpoint} didn't work, trying next...`);
            }
          }

          if (fetchSuccess && fileResponse && fileResponse.ok) {
            const fileBlob = await fileResponse.blob();
            console.log(`[klangio] Downloaded ${format}: ${fileBlob.size} bytes`);
            
            // Create blob with correct MIME type for storage
            const correctMimeType = getContentType(format);
            const typedBlob = new Blob([fileBlob], { type: correctMimeType });
            
            // Determine file extension
            const extension = format === 'mxml' ? 'xml' : format === 'midi_quant' ? 'mid' : format === 'midi' ? 'mid' : format;
            const fileName = `${user_id || 'anonymous'}/klangio/${jobId}_${format}.${extension}`;
            
            console.log(`[klangio] Uploading ${format} to project-assets/${fileName} (${correctMimeType})`);

            const { error: uploadError } = await supabase.storage
              .from("project-assets")
              .upload(fileName, typedBlob, {
                contentType: correctMimeType,
                upsert: true,
              });

            if (uploadError) {
              uploadErrors[format] = JSON.stringify(uploadError);
              console.error(`[klangio] ❌ Upload error for ${format}:`, uploadError);
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from("project-assets")
                .getPublicUrl(fileName);
              files[format] = publicUrl;
              console.log(`[klangio] ✅ ${format} uploaded: ${publicUrl}`);
            }
          } else {
            if (fileResponse) {
              const errorText = await fileResponse.text();
              fetchErrors[format] = `${fileResponse.status}: ${errorText.slice(0, 200)}`;
              console.warn(`[klangio] ❌ Failed to fetch ${format}: ${fileResponse.status}`);
            }
          }
        } catch (e) {
          fetchErrors[format] = e instanceof Error ? e.message : 'Unknown error';
          console.error(`[klangio] ❌ Error processing ${format}:`, e);
        }
      }

      // FALLBACK: Generate MIDI locally from notes if API didn't return MIDI but we have notes
      if (!files['midi'] && notes.length > 0) {
        console.log(`[klangio] ⚠️ API didn't return MIDI, but we have ${notes.length} notes. Generating MIDI locally...`);
        try {
          const midiData = generateMidiFromNotes(notes, detectedBpm);
          // Convert Uint8Array to ArrayBuffer explicitly for Blob compatibility in Deno
          const arrayBuffer = midiData.buffer.slice(midiData.byteOffset, midiData.byteOffset + midiData.byteLength) as ArrayBuffer;
          const midiBlob = new Blob([arrayBuffer], { type: 'audio/midi' });
          
          console.log(`[klangio] Generated MIDI blob size: ${midiBlob.size} bytes from ${notes.length} notes`);
          
          const fileName = `${user_id || 'anonymous'}/klangio/${jobId}_midi_generated.mid`;
          
          const { error: uploadError } = await supabase.storage
            .from("project-assets")
            .upload(fileName, midiBlob, {
              contentType: 'audio/midi',
              upsert: true,
            });
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("project-assets")
              .getPublicUrl(fileName);
            files['midi'] = publicUrl;
            console.log(`[klangio] ✅ Generated MIDI uploaded: ${publicUrl} (${midiBlob.size} bytes)`);
          } else {
            console.error(`[klangio] ❌ Failed to upload generated MIDI:`, uploadError);
          }
        } catch (e) {
          console.error(`[klangio] ❌ Failed to generate MIDI from notes:`, e);
        }
      }

      finalResult.files = files;
      finalResult.notes = notes;
      finalResult.available_formats = Object.keys(files);

      console.log(`[klangio] ===== TRANSCRIPTION SUMMARY =====`);
      console.log(`[klangio] Model used: ${smartModel}`);
      console.log(`[klangio] Files generated: ${Object.keys(files).length}`);
      console.log(`[klangio] Available formats: ${finalResult.available_formats.join(', ')}`);
      console.log(`[klangio] File URLs:`, files);
      console.log(`[klangio] Notes: ${notes.length}`);
      console.log(`[klangio] Fetch errors:`, fetchErrors);
      console.log(`[klangio] Upload errors:`, uploadErrors);
      console.log(`[klangio] ==================================`);

      // Update log with results
      if (logId) {
        await supabase.from('klangio_analysis_logs').update({
          status: 'completed',
          files,
          notes_count: notes.length,
          fetch_errors: fetchErrors,
          upload_errors: uploadErrors,
          duration_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        }).eq('id', logId);
      }
      
    } else if (mode === 'beat-tracking') {
      try {
        console.log("[klangio] Fetching beat tracking JSON...");
        const jsonResponse = await fetch(`${API_BASE}/job/${jobId}/json`, {
          headers: { "kl-api-key": KLANGIO_API_KEY },
        });
        
        if (jsonResponse.ok) {
          const beatData = await jsonResponse.json();
          console.log("[klangio] Beat data:", JSON.stringify(beatData).slice(0, 1000));
          
          finalResult.beats = beatData.beats || [];
          finalResult.downbeats = beatData.downbeats || [];
          finalResult.bpm = beatData.bpm || beatData.tempo;
          
          if (!finalResult.bpm && finalResult.beats.length >= 2) {
            const beatTimes = finalResult.beats as number[];
            const intervals = [];
            for (let i = 1; i < Math.min(beatTimes.length, 20); i++) {
              intervals.push(beatTimes[i] - beatTimes[i-1]);
            }
            if (intervals.length > 0) {
              const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
              finalResult.bpm = Math.round(60 / avgInterval);
            }
          }

          // Update log
          if (logId) {
            await supabase.from('klangio_analysis_logs').update({
              status: 'completed',
              beats_count: (finalResult.beats || []).length,
              bpm: finalResult.bpm,
              raw_response: beatData,
              duration_ms: Date.now() - startTime,
              completed_at: new Date().toISOString(),
            }).eq('id', logId);
          }
        } else {
          const errorText = await jsonResponse.text();
          fetchErrors['json'] = `${jsonResponse.status}: ${errorText}`;
          console.warn(`[klangio] Failed to fetch beat JSON: ${jsonResponse.status}`);
        }
      } catch (e) {
        console.error(`[klangio] Error fetching beat data:`, e);
      }
      
    } else {
      // Chord recognition
      try {
        console.log("[klangio] Fetching chord recognition JSON...");
        const jsonResponse = await fetch(`${API_BASE}/job/${jobId}/json`, {
          headers: { "kl-api-key": KLANGIO_API_KEY },
        });
        
        if (jsonResponse.ok) {
          const chordData = await jsonResponse.json();
          console.log("[klangio] Chord data:", JSON.stringify(chordData).slice(0, 1000));
          
          let chords: any[] = [];
          
          if (Array.isArray(chordData.chords)) {
            chords = chordData.chords.map((c: any) => {
              if (Array.isArray(c)) {
                return {
                  chord: c[2] || c[0],
                  startTime: typeof c[0] === 'number' ? c[0] : parseFloat(c[0]) || 0,
                  endTime: typeof c[1] === 'number' ? c[1] : parseFloat(c[1]) || 0,
                };
              }
              return {
                chord: c.chord || c.name || c.label || 'N',
                startTime: c.start_time ?? c.time ?? c.start ?? 0,
                endTime: c.end_time ?? c.end ?? (c.start_time ? c.start_time + 2 : 2),
              };
            });
          }
          
          finalResult.chords = chords;
          finalResult.key = chordData.key || chordData.detected_key || null;
          
          if (chordData.strumming && Array.isArray(chordData.strumming)) {
            finalResult.strumming = chordData.strumming.map((s: any) => ({
              time: s.time || s.timestamp || 0,
              direction: s.direction === 'up' || s.direction === 'U' ? 'U' : 'D',
            }));
          } else {
            finalResult.strumming = [];
          }

          // Update log
          if (logId) {
            await supabase.from('klangio_analysis_logs').update({
              status: 'completed',
              chords_count: chords.length,
              key_detected: finalResult.key,
              raw_response: chordData,
              duration_ms: Date.now() - startTime,
              completed_at: new Date().toISOString(),
            }).eq('id', logId);
          }
        } else {
          const errorText = await jsonResponse.text();
          console.warn(`[klangio] Failed to fetch chord JSON: ${jsonResponse.status} - ${errorText}`);
        }
      } catch (e) {
        console.error(`[klangio] Error fetching chord data:`, e);
      }
    }

    console.log(`[klangio] Analysis complete:`, JSON.stringify(finalResult, null, 2).slice(0, 2000));

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[klangio] Error:", error);
    
    // Update log with error if possible
    if (logId && supabase) {
      try {
        await supabase.from('klangio_analysis_logs').update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          duration_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        }).eq('id', logId);
      } catch (e) {
        console.error('[klangio] Failed to update log with error:', e);
      }
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getContentType(format: string): string {
  switch (format) {
    case 'midi':
    case 'midi_quant':
      return 'audio/midi';
    case 'mxml':
      return 'application/vnd.recordare.musicxml+xml';
    case 'gp5':
      return 'application/x-guitar-pro';
    case 'pdf':
      return 'application/pdf';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}
