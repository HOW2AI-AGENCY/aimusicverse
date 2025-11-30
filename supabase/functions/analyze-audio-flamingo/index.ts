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

    const { track_id, audio_url, analysis_type = 'auto', custom_prompt } = await req.json();
    console.log('Analyzing audio:', { track_id, audio_url, analysis_type });

    if (!audio_url) {
      throw new Error('audio_url is required');
    }

    // Get track info
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('user_id, title, style, lyrics')
      .eq('id', track_id)
      .single();

    if (trackError || !track) {
      throw new Error('Track not found');
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

Provide concise, accurate information suitable for music generation AI.`;

    console.log('Creating Replicate prediction...');

    // Use Replicate SDK with the correct model identifier (without :latest)
    const output = await replicate.run(
      "zsxkib/audio-flamingo-3",
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

    const fullResponse = output;
    console.log('Analysis result:', fullResponse);

    // Parse structured data from response
    const parseField = (text: string, fieldName: string): string | null => {
      const regex = new RegExp(`${fieldName}:\\s*(.+?)(?=\\n[A-Z]|$)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    };

    const genre = parseField(fullResponse, 'Genre');
    const mood = parseField(fullResponse, 'Mood');
    const tempo = parseField(fullResponse, 'Tempo');
    const keySignature = parseField(fullResponse, 'Key');
    const instrumentsText = parseField(fullResponse, 'Instruments');
    const instruments = instrumentsText ? instrumentsText.split(',').map(i => i.trim()) : [];
    const structure = parseField(fullResponse, 'Structure');
    const styleDescription = parseField(fullResponse, 'Style');

    // Save analysis to database
    const { data: analysis, error: insertError } = await supabase
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
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving analysis:', insertError);
      throw insertError;
    }

    console.log('Analysis saved:', analysis.id);

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
