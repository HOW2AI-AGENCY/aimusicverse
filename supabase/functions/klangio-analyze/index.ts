import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KlangioRequest {
  audio_url: string;
  mode: 'transcription' | 'chord-recognition' | 'chord-recognition-extended' | 'beat-tracking';
  // Transcription options
  model?: 'guitar' | 'piano' | 'drums' | 'vocal' | 'multi' | 'universal';
  outputs?: ('midi' | 'mxml' | 'gp5' | 'pdf' | 'midi_quant')[];
  // Chord recognition options
  vocabulary?: 'major-minor' | 'full';
  track_id?: string;
  user_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KLANGIO_API_KEY = Deno.env.get("KLANGIO_API_KEY");
    if (!KLANGIO_API_KEY) {
      throw new Error("KLANGIO_API_KEY is not configured");
    }

    const { audio_url, mode, model, outputs, vocabulary, track_id, user_id } = await req.json() as KlangioRequest;

    if (!audio_url || !mode) {
      throw new Error("audio_url and mode are required");
    }

    console.log(`[klangio-analyze] Starting ${mode} analysis for: ${audio_url}`);

    // Download audio file
    const audioResponse = await fetch(audio_url);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }
    const audioBlob = await audioResponse.blob();

    // Prepare form data for Klangio API
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");

    // Build endpoint URL with query parameters
    let baseEndpoint: string;
    const queryParams = new URLSearchParams();

    switch (mode) {
      case 'transcription':
        baseEndpoint = "https://api.klang.io/transcription";
        if (model) queryParams.set('model', model);
        // Add outputs to form data (array)
        if (outputs && outputs.length > 0) {
          outputs.forEach(output => formData.append('outputs', output));
        } else {
          formData.append('outputs', 'midi');
        }
        break;
      case 'chord-recognition':
        baseEndpoint = "https://api.klang.io/chord-recognition";
        queryParams.set('vocabulary', vocabulary || 'major-minor');
        break;
      case 'chord-recognition-extended':
        baseEndpoint = "https://api.klang.io/chord-recognition-extended";
        queryParams.set('vocabulary', vocabulary || 'full');
        break;
      case 'beat-tracking':
        baseEndpoint = "https://api.klang.io/beat-tracking";
        break;
      default:
        throw new Error(`Unknown mode: ${mode}`);
    }

    const endpoint = queryParams.toString() 
      ? `${baseEndpoint}?${queryParams.toString()}`
      : baseEndpoint;

    // Submit job to Klangio - use kl-api-key header as per OpenAPI spec
    console.log(`[klangio-analyze] Submitting job to ${endpoint}`);
    const submitResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "kl-api-key": KLANGIO_API_KEY,
      },
      body: formData,
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error(`[klangio-analyze] Klangio API error: ${submitResponse.status} - ${errorText}`);
      throw new Error(`Klangio API error: ${submitResponse.status}`);
    }

    const jobResponse = await submitResponse.json();
    const jobId = jobResponse.job_id;
    console.log(`[klangio-analyze] Job created: ${jobId}`);

    // Poll for job completion (max 120 seconds)
    const maxAttempts = 60;
    const pollInterval = 2000; // 2 seconds
    let result: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(`https://api.klang.io/job/${jobId}/status`, {
        headers: {
          "kl-api-key": KLANGIO_API_KEY,
        },
      });

      if (!statusResponse.ok) {
        console.warn(`[klangio-analyze] Status check failed: ${statusResponse.status}`);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`[klangio-analyze] Job status: ${statusData.status}`);

      // Status values from OpenAPI: IN_QUEUE, IN_PROGRESS, COMPLETED, FAILED, CANCELLED, TIMED_OUT
      if (statusData.status === "COMPLETED") {
        result = statusData;
        break;
      } else if (statusData.status === "FAILED" || statusData.status === "CANCELLED" || statusData.status === "TIMED_OUT") {
        throw new Error(`Klangio job ${statusData.status}: ${statusData.error || 'Unknown error'}`);
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

    if (mode === 'transcription') {
      // Fetch requested output formats
      const outputFormats = outputs || ['midi'];
      const files: Record<string, string> = {};

      for (const format of outputFormats) {
        try {
          // Map format names to API endpoints
          const apiFormat = format === 'mxml' ? 'xml' : format;
          
          const fileResponse = await fetch(`https://api.klang.io/job/${jobId}/${apiFormat}`, {
            headers: {
              "kl-api-key": KLANGIO_API_KEY,
            },
          });

          if (fileResponse.ok) {
            const fileBlob = await fileResponse.blob();
            
            // Upload to Supabase Storage
            const supabase = createClient(
              Deno.env.get("SUPABASE_URL")!,
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );

            const extension = format === 'mxml' ? 'xml' : format;
            const fileName = `${user_id || 'anonymous'}/klangio/${track_id || jobId}_${format}.${extension}`;
            const { error: uploadError } = await supabase.storage
              .from("project-assets")
              .upload(fileName, fileBlob, {
                contentType: getContentType(format),
                upsert: true,
              });

            if (uploadError) {
              console.error(`[klangio-analyze] Upload error for ${format}:`, uploadError);
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from("project-assets")
                .getPublicUrl(fileName);
              files[format] = publicUrl;
            }
          }
        } catch (e) {
          console.error(`[klangio-analyze] Error fetching ${format}:`, e);
        }
      }

      finalResult.files = files;
    } else if (mode === 'beat-tracking') {
      // Fetch JSON result for beat tracking
      try {
        const jsonResponse = await fetch(`https://api.klang.io/job/${jobId}/json`, {
          headers: {
            "kl-api-key": KLANGIO_API_KEY,
          },
        });
        
        if (jsonResponse.ok) {
          const beatData = await jsonResponse.json();
          finalResult.beats = beatData.beats || [];
          finalResult.downbeats = beatData.downbeats || [];
          finalResult.bpm = beatData.bpm;
        }
      } catch (e) {
        console.error(`[klangio-analyze] Error fetching beat data:`, e);
      }
    } else {
      // Chord recognition - fetch JSON result
      try {
        const jsonResponse = await fetch(`https://api.klang.io/job/${jobId}/json`, {
          headers: {
            "kl-api-key": KLANGIO_API_KEY,
          },
        });
        
        if (jsonResponse.ok) {
          const chordData = await jsonResponse.json();
          finalResult.chords = chordData.chords || [];
          finalResult.key = chordData.key;
          finalResult.strumming = chordData.strumming || [];
        }
      } catch (e) {
        console.error(`[klangio-analyze] Error fetching chord data:`, e);
      }
    }

    console.log(`[klangio-analyze] Analysis complete:`, JSON.stringify(finalResult, null, 2));

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[klangio-analyze] Error:", error);
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
    case 'mxml': return 'application/xml';
    case 'gp5': return 'application/octet-stream';
    case 'pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}
