import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmotionResult {
  arousal: number;
  valence: number;
  quadrant: string;
  confidence: number;
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
    
    const supabase = getSupabaseClient();

    const { 
      track_id, 
      audio_url, 
      embedding_type = 'msd-musicnn',
      update_analysis = true 
    } = await req.json();
    
    console.log('Analyzing music emotion:', { track_id, audio_url, embedding_type });

    if (!audio_url) {
      throw new Error('audio_url is required');
    }

    // Get track info for user_id
    let userId: string | null = null;
    if (track_id) {
      const { data: track } = await supabase
        .from('tracks')
        .select('user_id')
        .eq('id', track_id)
        .single();
      userId = track?.user_id || null;
    }

    // Run mtg/music-arousal-valence model
    console.log('Running mtg/music-arousal-valence...');
    
    const output = await replicate.run(
      "mtg/music-arousal-valence",
      {
        input: {
          audio: audio_url,
          embedding_type: embedding_type,
          dataset: "emomusic",
          output_format: "json"
        }
      }
    ) as string;

    console.log('MTG model output:', output);

    // Parse the JSON response
    // The model returns a URL to a JSON file with arousal and valence values
    let emotionData: EmotionResult;
    
    if (typeof output === 'string' && output.includes('http')) {
      // Fetch the JSON result
      const jsonResponse = await fetch(output);
      const jsonData = await jsonResponse.json();
      
      // MTG model returns values between 0-1
      const arousal = jsonData.arousal ?? jsonData.energy ?? 0.5;
      const valence = jsonData.valence ?? jsonData.positivity ?? 0.5;
      
      emotionData = {
        arousal: Math.max(0, Math.min(1, arousal)),
        valence: Math.max(0, Math.min(1, valence)),
        quadrant: getEmotionQuadrant(arousal, valence),
        confidence: jsonData.confidence ?? 0.8
      };
    } else if (typeof output === 'object') {
      // Direct JSON response
      const arousal = (output as any).arousal ?? 0.5;
      const valence = (output as any).valence ?? 0.5;
      
      emotionData = {
        arousal,
        valence,
        quadrant: getEmotionQuadrant(arousal, valence),
        confidence: (output as any).confidence ?? 0.8
      };
    } else {
      // Fallback: use default values
      console.warn('Unexpected output format, using defaults');
      emotionData = {
        arousal: 0.5,
        valence: 0.5,
        quadrant: 'neutral',
        confidence: 0.5
      };
    }

    console.log('Parsed emotion data:', emotionData);

    // Update audio_analysis table if track_id provided
    if (track_id && userId && update_analysis) {
      // Check if analysis exists
      const { data: existingAnalysis } = await supabase
        .from('audio_analysis')
        .select('id, analysis_metadata')
        .eq('track_id', track_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const analysisMetadata = {
        ...(existingAnalysis?.analysis_metadata || {}),
        mtg_arousal: emotionData.arousal,
        mtg_valence: emotionData.valence,
        mtg_quadrant: emotionData.quadrant,
        mtg_confidence: emotionData.confidence,
        mtg_embedding_type: embedding_type,
        mtg_analyzed_at: new Date().toISOString()
      };

      if (existingAnalysis) {
        // Update existing analysis
        await supabase
          .from('audio_analysis')
          .update({
            arousal: emotionData.arousal,
            valence: emotionData.valence,
            analysis_metadata: analysisMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAnalysis.id);
        
        console.log('Updated existing analysis:', existingAnalysis.id);
      } else {
        // Create new analysis record
        await supabase
          .from('audio_analysis')
          .insert({
            track_id,
            user_id: userId,
            analysis_type: 'emotion',
            arousal: emotionData.arousal,
            valence: emotionData.valence,
            analysis_metadata: analysisMetadata
          });
        
        console.log('Created new emotion analysis');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emotion: emotionData,
        raw_output: output
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-music-emotion:', error);
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

function getEmotionQuadrant(arousal: number, valence: number): string {
  if (arousal >= 0.5 && valence >= 0.5) return 'happy';      // Радостный
  if (arousal >= 0.5 && valence < 0.5) return 'angry';       // Напряжённый
  if (arousal < 0.5 && valence >= 0.5) return 'relaxed';     // Спокойный
  return 'sad';                                               // Грустный
}
