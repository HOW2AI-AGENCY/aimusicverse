import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KlangioRequest {
  audio_url: string;
  mode: 'transcription' | 'chord-recognition' | 'chord-recognition-extended' | 'beat-tracking';
  // Transcription options - models from OpenAPI: piano, guitar, bass, vocal, universal, lead, detect, drums, multi, wind, string, piano_arrangement
  model?: 'guitar' | 'piano' | 'drums' | 'vocal' | 'bass' | 'universal' | 'lead' | 'detect' | 'multi' | 'wind' | 'string' | 'piano_arrangement';
  // Outputs from OpenAPI: mxml, midi, pdf, gp5, json, midi_quant
  outputs?: ('midi' | 'mxml' | 'gp5' | 'pdf' | 'midi_quant' | 'json')[];
  title?: string;
  // Chord recognition options - vocabulary: major-minor or full
  vocabulary?: 'major-minor' | 'full';
  user_id?: string;
}

const API_BASE = "https://api.klang.io";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KLANGIO_API_KEY = Deno.env.get("KLANGIO_API_KEY");
    if (!KLANGIO_API_KEY) {
      console.error("[klangio] KLANGIO_API_KEY not configured");
      throw new Error("KLANGIO_API_KEY is not configured. Please add your Klangio API key.");
    }

    const { audio_url, mode, model, outputs, vocabulary, user_id, title } = await req.json() as KlangioRequest;

    if (!audio_url || !mode) {
      throw new Error("audio_url and mode are required");
    }

    console.log(`[klangio] Starting ${mode} analysis for: ${audio_url}`);

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

    // IMPORTANT: Only transcription mode accepts outputs parameter
    // Other modes (chord-recognition, beat-tracking) do NOT accept outputs
    switch (mode) {
      case 'transcription':
        baseEndpoint = `${API_BASE}/transcription`;
        // Model is required in query params for transcription
        queryParams.set('model', model || 'guitar');
        if (title) queryParams.set('title', title);
        // Add outputs to query params - valid formats: midi, midi_quant, mxml, gp5, pdf
        // Note: 'json' is NOT a valid output format - notes data is fetched separately via /job/{id}/json
        const validFormats = ['midi', 'midi_quant', 'mxml', 'gp5', 'pdf'];
        const requestedOutputs = outputs || ['midi', 'midi_quant', 'mxml', 'gp5', 'pdf']; // Request all formats by default
        const validOutputs = requestedOutputs.filter(o => validFormats.includes(o));
        if (validOutputs.length === 0) validOutputs.push('midi'); // Ensure at least midi is requested
        console.log(`[klangio] Transcription outputs: requested=${JSON.stringify(requestedOutputs)}, valid=${JSON.stringify(validOutputs)}`);
        // The API expects 'outputs' as query parameters, not in FormData
        validOutputs.forEach(output => queryParams.append('outputs', output));
        break;
        
      case 'chord-recognition':
        baseEndpoint = `${API_BASE}/chord-recognition`;
        // Vocabulary is required for chord recognition - NO outputs parameter!
        queryParams.set('vocabulary', vocabulary || 'major-minor');
        break;
        
      case 'chord-recognition-extended':
        baseEndpoint = `${API_BASE}/chord-recognition-extended`;
        // Vocabulary is required for extended chord recognition - NO outputs parameter!
        queryParams.set('vocabulary', vocabulary || 'full');
        break;
        
      case 'beat-tracking':
        baseEndpoint = `${API_BASE}/beat-tracking`;
        // Beat tracking does NOT accept any outputs parameter!
        break;
        
      default:
        throw new Error(`Unknown mode: ${mode}`);
    }

    const endpoint = queryParams.toString() 
      ? `${baseEndpoint}?${queryParams.toString()}`
      : baseEndpoint;

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

    // Poll for job completion (max 180 seconds for transcription)
    const maxAttempts = mode === 'transcription' ? 90 : 60;
    const pollInterval = 2000; // 2 seconds
    let result: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(`${API_BASE}/job/${jobId}/status`, {
        headers: {
          "kl-api-key": KLANGIO_API_KEY,
        },
      });

      if (!statusResponse.ok) {
        console.warn(`[klangio] Status check failed: ${statusResponse.status}`);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`[klangio] Job status (attempt ${attempt + 1}/${maxAttempts}): ${statusData.status}`,
        statusData.progress ? `Progress: ${statusData.progress}%` : '');

      // Status values from OpenAPI: IN_QUEUE, IN_PROGRESS, COMPLETED, FAILED, CANCELLED, TIMED_OUT
      if (statusData.status === "COMPLETED") {
        result = statusData;
        break;
      } else if (statusData.status === "FAILED" || statusData.status === "CANCELLED" || statusData.status === "TIMED_OUT") {
        const errorMsg = statusData.error || 'Unknown error';
        // Return user-friendly error for "no notes found" case
        if (errorMsg.toLowerCase().includes('no notes found')) {
          return new Response(JSON.stringify({ 
            error: 'no_notes_found',
            message: 'Не удалось распознать музыкальные ноты в записи. Попробуйте записать более чёткий и громкий звук.'
          }), { 
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        throw new Error(`Klangio job ${statusData.status}: ${errorMsg}`);
      }
    }

    if (!result) {
      throw new Error("Job timed out waiting for completion");
    }

    // Fetch results based on mode
    const finalResult: any = {
      job_id: jobId,
      mode,
      status: "completed",
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (mode === 'transcription') {
      // Fetch requested output formats and upload to Supabase Storage
      const outputFormats = outputs || ['midi'];
      const files: Record<string, string> = {};
      let notes: any[] = [];

      console.log(`[klangio] Starting file fetch for formats:`, outputFormats);

      // Map output format names to API endpoints
      const formatToEndpoint: Record<string, string> = {
        'midi': 'midi',
        'midi_quant': 'midi_quant',
        'mxml': 'xml',  // API uses /xml for MusicXML
        'gp5': 'gp5',
        'pdf': 'pdf',
        'json': 'json',
      };

      // Always fetch JSON for notes data
      try {
        console.log("[klangio] Fetching transcription JSON for notes...");
        const jsonResponse = await fetch(`${API_BASE}/job/${jobId}/json`, {
          headers: {
            "kl-api-key": KLANGIO_API_KEY,
          },
        });
        
        if (jsonResponse.ok) {
          const transcriptionData = await jsonResponse.json();
          console.log("[klangio] Transcription JSON:", JSON.stringify(transcriptionData).slice(0, 2000));
          
          // Parse notes from different possible formats
          if (transcriptionData.notes && Array.isArray(transcriptionData.notes)) {
            notes = transcriptionData.notes.map((n: any) => ({
              pitch: n.pitch ?? n.midi ?? n.note ?? 60,
              startTime: n.start_time ?? n.startTime ?? n.time ?? n.onset ?? 0,
              endTime: n.end_time ?? n.endTime ?? n.offset ?? ((n.start_time ?? n.startTime ?? n.time ?? 0) + (n.duration ?? 0.5)),
              duration: n.duration ?? 0.5,
              velocity: n.velocity ?? n.loudness ?? 80,
              noteName: n.note_name ?? n.noteName ?? null,
            }));
          } else if (transcriptionData.events && Array.isArray(transcriptionData.events)) {
            // Some APIs use 'events' instead of 'notes'
            notes = transcriptionData.events.filter((e: any) => e.type === 'note' || e.pitch).map((n: any) => ({
              pitch: n.pitch ?? n.midi ?? 60,
              startTime: n.start ?? n.onset ?? n.time ?? 0,
              endTime: n.end ?? n.offset ?? ((n.start ?? n.time ?? 0) + (n.duration ?? 0.5)),
              duration: n.duration ?? 0.5,
              velocity: n.velocity ?? 80,
              noteName: null,
            }));
          }
          
          console.log(`[klangio] Parsed ${notes.length} notes from transcription`);
        }
      } catch (e) {
        console.error("[klangio] Error fetching transcription JSON:", e);
      }

      for (const format of outputFormats) {
        try {
          const apiEndpoint = formatToEndpoint[format] || format;
          let fileResponse: Response | null = null;
          let fetchSuccess = false;

          // Retry logic: Files might not be immediately available after job completion
          const maxRetries = 3;
          const retryDelay = 2000; // 2 seconds

          for (let retry = 0; retry < maxRetries; retry++) {
            if (retry > 0) {
              console.log(`[klangio] Retry ${retry}/${maxRetries - 1} for ${format} after ${retryDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }

            console.log(`[klangio] Attempting to fetch ${format} from endpoint: /job/${jobId}/${apiEndpoint} (attempt ${retry + 1}/${maxRetries})`);
            fileResponse = await fetch(`${API_BASE}/job/${jobId}/${apiEndpoint}`, {
              headers: {
                "kl-api-key": KLANGIO_API_KEY,
              },
            });

            console.log(`[klangio] Response for ${format}: status=${fileResponse.status}, ok=${fileResponse.ok}, contentType=${fileResponse.headers.get('content-type')}`);

            if (fileResponse.ok) {
              fetchSuccess = true;
              break;
            } else if (fileResponse.status !== 404) {
              // If not 404, don't retry (might be authentication error, etc.)
              break;
            }
          }

          if (fetchSuccess && fileResponse && fileResponse.ok) {
            const fileBlob = await fileResponse.blob();
            console.log(`[klangio] Downloaded ${format}: ${fileBlob.size} bytes, type: ${fileBlob.type}`);
            
            // Create a new blob with the correct MIME type
            const correctMimeType = getContentType(format);
            const typedBlob = new Blob([fileBlob], { type: correctMimeType });
            console.log(`[klangio] Created typed blob for ${format}: ${typedBlob.size} bytes, type: ${typedBlob.type}`);
            
            // Determine file extension
            const extension = format === 'mxml' ? 'xml' : format === 'midi_quant' ? 'mid' : format === 'midi' ? 'mid' : format;
            const fileName = `${user_id || 'anonymous'}/klangio/${jobId}_${format}.${extension}`;
            
            console.log(`[klangio] Uploading ${format} to Storage: bucket=project-assets, path=${fileName}, size=${typedBlob.size}, contentType=${correctMimeType}`);

            const { error: uploadError } = await supabase.storage
              .from("project-assets")
              .upload(fileName, typedBlob, {
                contentType: correctMimeType,
                upsert: true,
              });

            if (uploadError) {
              console.error(`[klangio] ❌ Upload error for ${format}:`, JSON.stringify(uploadError, null, 2));
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from("project-assets")
                .getPublicUrl(fileName);
              files[format] = publicUrl;
              console.log(`[klangio] ✅ Successfully uploaded ${format} to: ${publicUrl}`);
            }
          } else {
            // All retries exhausted or non-404 error
            if (fileResponse) {
              const errorText = await fileResponse.text();
              console.warn(`[klangio] ❌ Failed to fetch ${format} after ${maxRetries} attempts: ${fileResponse.status} - ${errorText}`);
            } else {
              console.warn(`[klangio] ❌ Failed to fetch ${format}: No response received`);
            }
          }
        } catch (e) {
          console.error(`[klangio] ❌ Error fetching ${format}:`, e);
        }
      }

      finalResult.files = files;
      finalResult.notes = notes;

      console.log(`[klangio] ===== TRANSCRIPTION SUMMARY =====`);
      console.log(`[klangio] Files generated:`, Object.keys(files).length);
      console.log(`[klangio] File URLs:`, JSON.stringify(files, null, 2));
      console.log(`[klangio] Notes parsed:`, notes.length);
      console.log(`[klangio] ==================================`);
      
    } else if (mode === 'beat-tracking') {
      // Fetch JSON result for beat tracking
      try {
        console.log("[klangio] Fetching beat tracking JSON...");
        const jsonResponse = await fetch(`${API_BASE}/job/${jobId}/json`, {
          headers: {
            "kl-api-key": KLANGIO_API_KEY,
          },
        });
        
        if (jsonResponse.ok) {
          const beatData = await jsonResponse.json();
          console.log("[klangio] Beat data:", JSON.stringify(beatData).slice(0, 1000));
          
          // API returns beats and downbeats as arrays of timestamps
          finalResult.beats = beatData.beats || [];
          finalResult.downbeats = beatData.downbeats || [];
          finalResult.bpm = beatData.bpm || beatData.tempo;
          
          // Calculate BPM from beats if not provided
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
        } else {
          const errorText = await jsonResponse.text();
          console.warn(`[klangio] Failed to fetch beat JSON: ${jsonResponse.status} - ${errorText}`);
        }
      } catch (e) {
        console.error(`[klangio] Error fetching beat data:`, e);
      }
      
    } else {
      // Chord recognition - fetch JSON result
      try {
        console.log("[klangio] Fetching chord recognition JSON...");
        const jsonResponse = await fetch(`${API_BASE}/job/${jobId}/json`, {
          headers: {
            "kl-api-key": KLANGIO_API_KEY,
          },
        });
        
        if (jsonResponse.ok) {
          const chordData = await jsonResponse.json();
          console.log("[klangio] Chord data:", JSON.stringify(chordData).slice(0, 1000));
          
          // Klangio returns chords as arrays: [start_time, end_time, chord_name]
          // We need to convert to objects for consistency
          let chords: any[] = [];
          
          if (Array.isArray(chordData.chords)) {
            chords = chordData.chords.map((c: any) => {
              // Check if chord is an array [start, end, chord] or an object
              if (Array.isArray(c)) {
                return {
                  chord: c[2] || c[0], // chord name is usually 3rd element
                  startTime: typeof c[0] === 'number' ? c[0] : parseFloat(c[0]) || 0,
                  endTime: typeof c[1] === 'number' ? c[1] : parseFloat(c[1]) || 0,
                };
              }
              // If it's already an object
              return {
                chord: c.chord || c.name || c.label || 'N',
                startTime: c.start_time ?? c.time ?? c.start ?? 0,
                endTime: c.end_time ?? c.end ?? (c.start_time ? c.start_time + 2 : 2),
              };
            });
          }
          
          finalResult.chords = chords;
          finalResult.key = chordData.key || chordData.detected_key || null;
          
          // Handle strumming if available
          if (chordData.strumming && Array.isArray(chordData.strumming)) {
            finalResult.strumming = chordData.strumming.map((s: any) => ({
              time: s.time || s.timestamp || 0,
              direction: s.direction === 'up' || s.direction === 'U' ? 'U' : 'D',
            }));
          } else {
            finalResult.strumming = [];
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
      return 'application/xml'; // Changed from application/vnd.recordare.musicxml+xml for Supabase Storage compatibility
    case 'gp5':
      return 'application/x-guitar-pro'; // More specific MIME type for Guitar Pro files
    case 'pdf':
      return 'application/pdf';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}
