/**
 * Analyze Track Context - Extract musical properties for contextual generation
 * Uses Audio Flamingo for intelligent audio analysis
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  bpm?: number;
  key?: string;
  scale?: string;
  genre?: string;
  mood?: string;
  energy?: string;
  instruments?: string[];
  suggestedInstruments?: string[];
  style_description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl, trackId } = await req.json();

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'audioUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseClient();

    // Check if we already have analysis for this track
    if (trackId) {
      const { data: existingAnalysis } = await supabase
        .from('audio_analysis')
        .select('*')
        .eq('track_id', trackId)
        .eq('analysis_type', 'context')
        .single();

      if (existingAnalysis) {
        console.log('Using cached analysis for track:', trackId);
        return new Response(
          JSON.stringify(existingAnalysis),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Use Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing track context with AI...');

    const analysisPrompt = `Analyze this music track and provide the following information in JSON format:
{
  "bpm": <estimated BPM as number>,
  "key": "<musical key like C, D, E, etc.>",
  "scale": "<major or minor>",
  "genre": "<primary genre>",
  "mood": "<emotional mood>",
  "energy": "<low, medium, or high>",
  "instruments": ["<list of detected instruments>"],
  "suggestedInstruments": ["<instruments that would complement this track>"],
  "style_description": "<brief description of the musical style>"
}

Be accurate and concise. For suggestedInstruments, recommend instruments that would naturally complement the existing arrangement without clashing.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              { type: 'audio_url', audio_url: { url: audioUrl } }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      // Fallback to basic analysis without AI
      console.warn('AI analysis failed, using fallback');
      
      const fallbackAnalysis: AnalysisResult = {
        bpm: 120,
        key: 'C',
        scale: 'major',
        genre: 'pop',
        mood: 'neutral',
        energy: 'medium',
        instruments: ['vocals', 'drums', 'bass', 'synth'],
        suggestedInstruments: ['piano', 'strings', 'pad', 'guitar'],
        style_description: 'Modern pop production',
      };

      return new Response(
        JSON.stringify(fallbackAnalysis),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Parse JSON from AI response
    let analysis: AnalysisResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysis = {
        bpm: 120,
        key: 'C',
        scale: 'major',
        genre: 'electronic',
        mood: 'energetic',
        energy: 'medium',
        instruments: ['synth', 'drums'],
        suggestedInstruments: ['bass', 'pad', 'strings'],
        style_description: content.slice(0, 200),
      };
    }

    // Ensure suggestedInstruments is populated
    if (!analysis.suggestedInstruments?.length) {
      analysis.suggestedInstruments = getSuggestedInstruments(analysis.instruments || []);
    }

    // Cache analysis if we have a trackId
    if (trackId) {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          await supabase.from('audio_analysis').insert({
            track_id: trackId,
            user_id: user.id,
            analysis_type: 'context',
            bpm: analysis.bpm,
            genre: analysis.genre,
            mood: analysis.mood,
            instruments: analysis.instruments,
            style_description: analysis.style_description,
            analysis_metadata: analysis,
          });
        }
      }
    }

    console.log('Track analysis complete:', analysis);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getSuggestedInstruments(existingInstruments: string[]): string[] {
  const instrumentMap: Record<string, string[]> = {
    'vocals': ['pad', 'strings', 'piano'],
    'guitar': ['bass', 'strings', 'synth pad'],
    'piano': ['strings', 'bass', 'drums'],
    'drums': ['bass', 'synth', 'guitar'],
    'bass': ['piano', 'strings', 'pad'],
    'synth': ['bass', 'drums', 'strings'],
    'strings': ['piano', 'pad', 'choir'],
  };

  const suggestions = new Set<string>();
  
  for (const inst of existingInstruments) {
    const lower = inst.toLowerCase();
    for (const [key, values] of Object.entries(instrumentMap)) {
      if (lower.includes(key)) {
        values.forEach(v => suggestions.add(v));
      }
    }
  }

  // Filter out instruments that already exist
  const existingLower = existingInstruments.map(i => i.toLowerCase());
  return Array.from(suggestions).filter(s => 
    !existingLower.some(e => e.includes(s) || s.includes(e))
  ).slice(0, 5);
}
