import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KlangioRequest {
  audio_url: string;
  mode: 'transcription' | 'chord-recognition' | 'chord-recognition-extended';
  // Transcription options
  model?: 'guitar' | 'piano' | 'drums' | 'voice' | 'multi';
  outputs?: ('midi' | 'musicxml' | 'gp5' | 'pdf')[];
  // Chord recognition options
  vocabulary?: 'simple' | 'full' | 'extended';
  track_id?: string;
  user_id?: string;
}

interface KlangioJobResponse {
  job_id: string;
  status: string;
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

    let endpoint: string;
    let additionalParams: Record<string, string> = {};

    switch (mode) {
      case 'transcription':
        endpoint = "https://api.klang.io/transcription";
        if (model) additionalParams.model = model;
        if (outputs) additionalParams.outputs = outputs.join(",");
        break;
      case 'chord-recognition':
        endpoint = "https://api.klang.io/chord-recognition";
        if (vocabulary) additionalParams.vocabulary = vocabulary;
        break;
      case 'chord-recognition-extended':
        endpoint = "https://api.klang.io/chord-recognition-extended";
        if (vocabulary) additionalParams.vocabulary = vocabulary;
        break;
      default:
        throw new Error(`Unknown mode: ${mode}`);
    }

    // Add additional params to form data
    for (const [key, value] of Object.entries(additionalParams)) {
      formData.append(key, value);
    }

    // Submit job to Klangio
    console.log(`[klangio-analyze] Submitting job to ${endpoint}`);
    const submitResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KLANGIO_API_KEY}`,
      },
      body: formData,
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error(`[klangio-analyze] Klangio API error: ${submitResponse.status} - ${errorText}`);
      throw new Error(`Klangio API error: ${submitResponse.status}`);
    }

    const jobResponse = await submitResponse.json() as KlangioJobResponse;
    const jobId = jobResponse.job_id;
    console.log(`[klangio-analyze] Job created: ${jobId}`);

    // Poll for job completion (max 60 seconds)
    const maxAttempts = 30;
    const pollInterval = 2000; // 2 seconds
    let result: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(`https://api.klang.io/job/${jobId}/status`, {
        headers: {
          "Authorization": `Bearer ${KLANGIO_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        console.warn(`[klangio-analyze] Status check failed: ${statusResponse.status}`);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`[klangio-analyze] Job status: ${statusData.status}`);

      if (statusData.status === "completed") {
        result = statusData;
        break;
      } else if (statusData.status === "failed") {
        throw new Error("Klangio job failed");
      }
    }

    if (!result) {
      throw new Error("Job timed out");
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
          const fileResponse = await fetch(`https://api.klang.io/job/${jobId}/${format}`, {
            headers: {
              "Authorization": `Bearer ${KLANGIO_API_KEY}`,
            },
          });

          if (fileResponse.ok) {
            const fileBlob = await fileResponse.blob();
            
            // Upload to Supabase Storage
            const supabase = createClient(
              Deno.env.get("SUPABASE_URL")!,
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );

            const fileName = `klangio/${user_id || 'anonymous'}/${track_id || jobId}_${format}.${format === 'musicxml' ? 'xml' : format}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
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
    } else {
      // Chord recognition results are in the status response
      finalResult.chords = result.chords || [];
      finalResult.key = result.key;
      finalResult.strumming = result.strumming || [];
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
    case 'midi': return 'audio/midi';
    case 'musicxml': return 'application/xml';
    case 'gp5': return 'application/octet-stream';
    case 'pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}
