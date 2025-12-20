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

    console.log(`[klangio] Starting ${mode} analysis for: ${audio_url}, stem_type: ${stem_type || 'not specified'}`);

    console.log(`[klangio] Starting ${mode} analysis for: ${audio_url}`);

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
        model: model || null,
        status: 'pending',
        audio_url,
        requested_outputs: requestedOutputs,
        vocabulary: vocabulary || null,
        raw_request: { mode, model, outputs, vocabulary, title, audio_url },
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
        queryParams.set('model', model || 'guitar');
        if (title) queryParams.set('title', title);
        // Add outputs - valid formats: midi, midi_quant, mxml, gp5, pdf
        const transcriptionValidFormats = ['midi', 'midi_quant', 'mxml', 'gp5', 'pdf'];
        const requestedOutputs = outputs || ['midi', 'midi_quant', 'mxml', 'gp5', 'pdf'];
        const validOutputs = requestedOutputs.filter((o: string) => transcriptionValidFormats.includes(o));
        if (validOutputs.length === 0) validOutputs.push('midi');
        console.log(`[klangio] Transcription outputs: requested=${JSON.stringify(requestedOutputs)}, valid=${JSON.stringify(validOutputs)}`);
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
      status: "completed",
    };

    const fetchErrors: Record<string, string> = {};
    const uploadErrors: Record<string, string> = {};

    if (mode === 'transcription') {
      // Only fetch files that were actually generated (based on gen_* flags from API response)
      const filesToFetch = generatedFormats.length > 0 ? generatedFormats : ['midi'];
      const files: Record<string, string> = {};
      let notes: any[] = [];

      console.log(`[klangio] Fetching files for formats:`, filesToFetch, '(API confirmed generation)');

      // Map format to API endpoints
      // Note: docs say /midi_unq for quantized MIDI, request uses midi_quant
      const formatToEndpoints: Record<string, string[]> = {
        'midi': ['midi'],           // Un-quantized MIDI -> /midi endpoint
        'midi_quant': ['midi_unq', 'midi_quant'], // Quantized MIDI -> /midi_unq endpoint (confusing naming!)
        'mxml': ['xml'],
        'gp5': ['gp5'],
        'pdf': ['pdf'],
        'json': ['json'],
      };

      // Always fetch JSON for notes data
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
            const bpm = musicInfo.Tempo || 120;
            const measureDuration = musicInfo.MeasureDuration || 1; // in beats
            const secondsPerBeat = 60 / bpm;
            
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
            // Retry logic for each endpoint
            const maxRetries = 3;
            const retryDelay = 2000;

            for (let retry = 0; retry < maxRetries; retry++) {
              if (retry > 0) {
                console.log(`[klangio] Retry ${retry}/${maxRetries - 1} for ${format} via ${apiEndpoint}...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
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
                break;
              }
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

      finalResult.files = files;
      finalResult.notes = notes;

      console.log(`[klangio] ===== TRANSCRIPTION SUMMARY =====`);
      console.log(`[klangio] Files generated: ${Object.keys(files).length}`);
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
