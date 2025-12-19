import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const { audioUrl, trackId, recordingId } = await req.json();

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: "audioUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting MT3 transcription for:", audioUrl);

    // Run MT3 model for multi-instrument MIDI transcription
    const output = await replicate.run(
      "turian/multi-task-music-transcription:8d5a91aa4c6f4a55e623d84c0d7c1f0f41b24bbc5eb51bef9e7eb2e23c0c85e5",
      {
        input: {
          audio: audioUrl,
        },
      }
    );

    console.log("MT3 transcription completed:", output);

    // MT3 returns a MIDI file URL
    const midiUrl = typeof output === "string" ? output : (output as any)?.midi || (output as any)?.[0];

    if (!midiUrl) {
      throw new Error("No MIDI output received from MT3");
    }

    // If we have a trackId or recordingId, save the result to the database
    if (trackId || recordingId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      if (recordingId) {
        // Update guitar_recordings table
        const { error: updateError } = await supabase
          .from("guitar_recordings")
          .update({
            midi_url: midiUrl,
            analysis_status: { status: "completed", progress: 100 },
            updated_at: new Date().toISOString(),
          })
          .eq("id", recordingId);

        if (updateError) {
          console.error("Error updating guitar_recordings:", updateError);
        }
      }

      // Log the transcription
      const authHeader = req.headers.get("Authorization");
      let userId = null;
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        userId = user?.id;
      }

      if (userId) {
        await supabase.from("klangio_analysis_logs").insert({
          user_id: userId,
          mode: "transcription",
          model: "mt3-replicate",
          audio_url: audioUrl,
          status: "completed",
          files: { midi: midiUrl },
          completed_at: new Date().toISOString(),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        midiUrl,
        model: "mt3",
        message: "MIDI transcription completed successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("MT3 transcription error:", error);
    const errorMessage = error instanceof Error ? error.message : "Transcription failed";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
