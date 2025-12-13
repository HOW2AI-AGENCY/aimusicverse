import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { track_id, audio_url, analysis_type = 'auto', custom_prompt } = body;
    console.log('Analyzing audio:', { track_id, audio_url, analysis_type });

    if (!audio_url) {
      console.error('Missing audio_url in request');
      throw new Error('audio_url is required');
    }
    
    // Verify audio URL is accessible
    try {
      const audioCheck = await fetch(audio_url, { method: 'HEAD' });
      if (!audioCheck.ok) {
        console.error('Audio URL not accessible:', audioCheck.status);
        throw new Error(`Audio URL not accessible: ${audioCheck.status}`);
      }
      console.log('Audio URL verified accessible');
    } catch (fetchError) {
      console.error('Error checking audio URL:', fetchError);
      throw new Error('Cannot access audio URL');
    }

    // Get track info if track_id provided, otherwise use defaults for standalone analysis
    let track = { user_id: 'anonymous', title: 'audio', style: null, lyrics: null };
    if (track_id) {
      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select('user_id, title, style, lyrics')
        .eq('id', track_id)
        .single();

      if (trackData) {
        track = trackData;
      }
    }

    // Default prompt for automatic analysis
    const systemPrompt = custom_prompt || `Analyze this music track and provide structured information in the following format:

Genre: [main genre]
Mood: [overall mood/emotion]
Tempo: [tempo description, e.g., "fast", "medium", "slow"]
Key: [musical key if identifiable]
Instruments: [comma-separated list of instruments]
Structure: [song structure, e.g., "Intro, Verse, Chorus, Bridge, Outro"]
Style: [detailed style description for music generation, include vocal characteristics, production techniques, and distinctive elements]
Energy Level: [0-100, how energetic/arousing the track is]
Positivity: [0-100, how positive/happy vs negative/sad]

Provide concise, accurate information suitable for music generation AI.`;

    console.log('Creating Replicate prediction...');

    try {
      // Use full version identifier for Audio Flamingo 3
      const output = await replicate.run(
        "zsxkib/audio-flamingo-3:2856d42f07154766b0cc0f3554fb425d7c3422ae77269264fbe0c983ac759fef",
        {
          input: {
            audio: audio_url,
            prompt: 'Analyze this audio',
            system_prompt: systemPrompt,
            enable_thinking: true,
            temperature: 0.1,
            max_length: 1024,
          },
        }
      ) as string;
      
      console.log('Replicate output received');
      var fullResponse = output;
    } catch (replicateError) {
      console.error('Replicate API error:', replicateError);
      throw new Error(`Replicate API error: ${replicateError instanceof Error ? replicateError.message : 'Unknown error'}`);
    }
    console.log('Analysis result:', fullResponse);

    // Parse structured data from response
    const parseField = (text: string, fieldName: string): string | null => {
      const regex = new RegExp(`${fieldName}:\\s*(.+?)(?=\\n[A-Z]|$)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    };

    const parseNumber = (text: string, fieldName: string): number | null => {
      const value = parseField(text, fieldName);
      if (!value) return null;
      const num = parseInt(value.match(/\d+/)?.[0] || '', 10);
      return isNaN(num) ? null : Math.max(0, Math.min(100, num)) / 100;
    };

    const genre = parseField(fullResponse, 'Genre');
    const mood = parseField(fullResponse, 'Mood');
    const tempo = parseField(fullResponse, 'Tempo');
    const keySignature = parseField(fullResponse, 'Key');
    const instrumentsText = parseField(fullResponse, 'Instruments');
    const instruments = instrumentsText ? instrumentsText.split(',').map(i => i.trim()) : [];
    const structure = parseField(fullResponse, 'Structure');
    const styleDescription = parseField(fullResponse, 'Style');
    const arousal = parseNumber(fullResponse, 'Energy Level');
    const valence = parseNumber(fullResponse, 'Positivity');

    // Save analysis to database only if track_id is provided
    let analysis = null;
    if (track_id) {
      const { data: savedAnalysis, error: insertError } = await supabase
        .from('audio_analysis')
        .insert({
          track_id,
          user_id: track.user_id,
          analysis_type,
          full_response: fullResponse,
          genre,
          mood,
          tempo,
          key_signature: keySignature,
          instruments,
          structure,
          style_description: styleDescription,
          arousal,
          valence,
          analysis_metadata: {
            flamingo_arousal: arousal,
            flamingo_valence: valence,
            analyzed_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error saving analysis:', insertError);
      } else {
        analysis = savedAnalysis;
        console.log('Analysis saved:', analysis.id);
      }

      // Update track with analyzed data if it's empty
      const updates: any = {};
      if (!track.style && styleDescription) {
        updates.style = styleDescription;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('tracks')
          .update(updates)
          .eq('id', track_id);
        console.log('Track updated with analysis');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        parsed: {
          genre,
          mood,
          tempo,
          key_signature: keySignature,
          instruments,
          structure,
          style_description: styleDescription,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-audio-flamingo:', error);
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
