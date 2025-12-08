import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { trackId, audioUrl, analysisTypes } = await req.json();

    if (!trackId || !audioUrl) {
      return new Response(
        JSON.stringify({ error: "Missing trackId or audioUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting advanced music analysis:", { trackId, audioUrl, analysisTypes });

    // Use Lovable AI for comprehensive music analysis
    const systemPrompt = `You are an expert music analyst. Analyze the audio track and provide detailed technical analysis.
    
Return your analysis in this EXACT JSON format (no markdown, just raw JSON):
{
  "bpm": <number or null>,
  "key_signature": "<string like 'C major' or 'A minor' or null>",
  "genre": "<primary genre>",
  "mood": "<primary mood>",
  "tempo": "<slow/medium/fast>",
  "arousal": <number 0-100 representing energy level>,
  "valence": <number 0-100 representing positivity>,
  "approachability": "<low/medium/high>",
  "engagement": "<low/medium/high>",
  "instruments": ["<instrument1>", "<instrument2>"],
  "structure": "<verse-chorus-verse or other structure>",
  "style_description": "<detailed style description in Russian, 2-3 sentences>"
}`;

    const userPrompt = `Analyze this audio track: ${audioUrl}
    
Based on the audio URL and typical characteristics of AI-generated music, provide a comprehensive analysis.
Consider the following aspects: ${analysisTypes?.join(", ") || "bpm, emotion, approachability, general"}

Important: Return ONLY valid JSON, no additional text or markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    // Parse the JSON response
    let analysisResult;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      analysisResult = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Create a basic result if parsing fails
      analysisResult = {
        bpm: null,
        arousal: 50,
        valence: 50,
        approachability: "medium",
        engagement: "medium",
        style_description: content.slice(0, 500),
      };
    }

    const results = {
      bpm: analysisResult.bpm,
      beats_data: null, // Would require actual audio processing
      arousal: analysisResult.arousal,
      valence: analysisResult.valence,
      approachability: analysisResult.approachability,
      engagement: analysisResult.engagement,
      genre: analysisResult.genre,
      mood: analysisResult.mood,
      tempo: analysisResult.tempo,
      key_signature: analysisResult.key_signature,
      instruments: analysisResult.instruments,
      structure: analysisResult.structure,
      style_description: analysisResult.style_description,
      analysis_metadata: {
        analysis_date: new Date().toISOString(),
        model: "google/gemini-2.5-flash",
        analysis_types: analysisTypes,
      },
    };

    console.log("Analysis results:", results);

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
          bpm: results.bpm ?? existingAnalysis.bpm,
          beats_data: results.beats_data ?? existingAnalysis.beats_data,
          arousal: results.arousal ?? existingAnalysis.arousal,
          valence: results.valence ?? existingAnalysis.valence,
          approachability: results.approachability ?? existingAnalysis.approachability,
          engagement: results.engagement ?? existingAnalysis.engagement,
          genre: results.genre ?? existingAnalysis.genre,
          mood: results.mood ?? existingAnalysis.mood,
          tempo: results.tempo ?? existingAnalysis.tempo,
          key_signature: results.key_signature ?? existingAnalysis.key_signature,
          instruments: results.instruments ?? existingAnalysis.instruments,
          structure: results.structure ?? existingAnalysis.structure,
          style_description: results.style_description ?? existingAnalysis.style_description,
          analysis_metadata: {
            ...existingAnalysis.analysis_metadata,
            ...results.analysis_metadata,
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
          analysis_type: "advanced_ai",
          bpm: results.bpm,
          beats_data: results.beats_data,
          arousal: results.arousal,
          valence: results.valence,
          approachability: results.approachability,
          engagement: results.engagement,
          genre: results.genre,
          mood: results.mood,
          tempo: results.tempo,
          key_signature: results.key_signature,
          instruments: results.instruments,
          structure: results.structure,
          style_description: results.style_description,
          analysis_metadata: results.analysis_metadata,
        });

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Advanced music analysis error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
