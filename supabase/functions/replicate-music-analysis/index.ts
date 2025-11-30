import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Replicate from "https://esm.sh/replicate@0.25.2";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const { trackId, audioUrl, analysisTypes } = await req.json();

    if (!trackId || !audioUrl) {
      return new Response(
        JSON.stringify({ error: "Missing trackId or audioUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting Replicate music analysis:", { trackId, audioUrl, analysisTypes });

    const results: any = {
      bpm: null,
      beats_data: null,
      arousal: null,
      valence: null,
      approachability: null,
      engagement: null,
      analysis_metadata: {},
    };

    // Run BPM estimation if requested
    if (analysisTypes?.includes("bpm")) {
      console.log("Running BPM analysis...");
      try {
        const bpmOutput = await replicate.run(
          "mtg/essentia-bpm:latest",
          {
            input: {
              audio: audioUrl,
              algo_type: "deepsquare-k16",
            },
          }
        ) as string;

        // Download and parse the result
        const bpmResponse = await fetch(bpmOutput);
        const bpmText = await bpmResponse.text();
        
        // Parse BPM from markdown output
        const bpmMatch = bpmText.match(/BPM:\s*(\d+\.?\d*)/);
        if (bpmMatch) {
          results.bpm = parseFloat(bpmMatch[1]);
          results.analysis_metadata.bpm_confidence = bpmText.match(/Confidence:\s*(\d+\.?\d*)/)?.[1];
        }
        
        console.log("BPM analysis completed:", results.bpm);
      } catch (error) {
        console.error("BPM analysis error:", error);
        results.analysis_metadata.bpm_error = error instanceof Error ? error.message : "Unknown error";
      }
    }

    // Run beat detection if requested
    if (analysisTypes?.includes("beats")) {
      console.log("Running beat detection...");
      try {
        const beatsOutput = await replicate.run(
          "xavriley/beat_this:latest",
          {
            input: {
              audio: audioUrl,
              use_dbn: false,
            },
          }
        ) as string;

        // Parse beats data
        const beatsLines = beatsOutput.trim().split('\n');
        const beatsData = beatsLines.map(line => {
          const [time, beat] = line.split('\t');
          return { time: parseFloat(time), beat: parseInt(beat) };
        });
        
        results.beats_data = beatsData;
        console.log("Beat detection completed:", beatsData.length, "beats");
      } catch (error) {
        console.error("Beat detection error:", error);
        results.analysis_metadata.beats_error = error instanceof Error ? error.message : "Unknown error";
      }
    }

    // Run arousal/valence analysis if requested
    if (analysisTypes?.includes("emotion")) {
      console.log("Running arousal/valence analysis...");
      try {
        const emotionOutput = await replicate.run(
          "mtg/music-arousal-valence:latest",
          {
            input: {
              audio: audioUrl,
              dataset: "emomusic",
              embedding_type: "msd-musicnn",
              output_format: "json",
            },
          }
        ) as string;

        // Download and parse the result
        const emotionResponse = await fetch(emotionOutput);
        const emotionText = await emotionResponse.text();
        
        // Parse arousal and valence values
        const arousalMatch = emotionText.match(/Arousal:\s*(\d+\.?\d*)/);
        const valenceMatch = emotionText.match(/Valence:\s*(\d+\.?\d*)/);
        
        if (arousalMatch) results.arousal = parseFloat(arousalMatch[1]);
        if (valenceMatch) results.valence = parseFloat(valenceMatch[1]);
        
        console.log("Emotion analysis completed:", { arousal: results.arousal, valence: results.valence });
      } catch (error) {
        console.error("Emotion analysis error:", error);
        results.analysis_metadata.emotion_error = error instanceof Error ? error.message : "Unknown error";
      }
    }

    // Run approachability/engagement analysis if requested
    if (analysisTypes?.includes("approachability")) {
      console.log("Running approachability/engagement analysis...");
      try {
        const approachOutput = await replicate.run(
          "mtg/music-approachability-engagement:latest",
          {
            input: {
              audio: audioUrl,
              model_type: "3class",
            },
          }
        ) as string;

        // Download and parse the result
        const approachResponse = await fetch(approachOutput);
        const approachText = await approachResponse.text();
        
        // Parse approachability and engagement classifications
        const approachMatch = approachText.match(/Approachability:\s*(\w+)/);
        const engagementMatch = approachText.match(/Engagement:\s*(\w+)/);
        
        if (approachMatch) results.approachability = approachMatch[1];
        if (engagementMatch) results.engagement = engagementMatch[1];
        
        console.log("Approachability analysis completed:", { 
          approachability: results.approachability, 
          engagement: results.engagement 
        });
      } catch (error) {
        console.error("Approachability analysis error:", error);
        results.analysis_metadata.approachability_error = error instanceof Error ? error.message : "Unknown error";
      }
    }

    // Get or create audio_analysis record
    const { data: existingAnalysis } = await supabase
      .from("audio_analysis")
      .select("*")
      .eq("track_id", trackId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingAnalysis) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("audio_analysis")
        .update({
          bpm: results.bpm,
          beats_data: results.beats_data,
          arousal: results.arousal,
          valence: results.valence,
          approachability: results.approachability,
          engagement: results.engagement,
          analysis_metadata: {
            ...existingAnalysis.analysis_metadata,
            ...results.analysis_metadata,
            replicate_analysis_date: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAnalysis.id);

      if (updateError) throw updateError;
    } else {
      // Create new record
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        throw new Error("No authorization header");
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );

      if (userError || !user) {
        throw new Error("Unauthorized");
      }

      const { error: insertError } = await supabase
        .from("audio_analysis")
        .insert({
          track_id: trackId,
          user_id: user.id,
          analysis_type: "replicate_music",
          bpm: results.bpm,
          beats_data: results.beats_data,
          arousal: results.arousal,
          valence: results.valence,
          approachability: results.approachability,
          engagement: results.engagement,
          analysis_metadata: {
            ...results.analysis_metadata,
            replicate_analysis_date: new Date().toISOString(),
          },
        });

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Replicate music analysis error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
