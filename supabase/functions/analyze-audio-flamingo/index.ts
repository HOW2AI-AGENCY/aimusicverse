import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Audio analysis response structure interface
interface AudioAnalysisResponse {
  genre: string;
  subgenres: string[];
  mood: string;
  emotions: string[];
  tempo: 'slow' | 'medium' | 'fast';
  bpm: number;
  key: string;
  scale: 'major' | 'minor' | 'modal' | 'unknown';
  time_signature: string;
  instruments: string[];
  structure: {
    sections: string[];
    has_intro: boolean;
    has_outro: boolean;
    has_bridge: boolean;
  };
  vocals: {
    present: boolean;
    gender: 'male' | 'female' | 'mixed' | 'unknown' | null;
    style: string | null;
    language: string | null;
  };
  production: {
    style: string;
    quality: 'lo-fi' | 'standard' | 'polished' | 'professional';
    era: string;
    techniques: string[];
  };
  energy: {
    level: 'low' | 'medium' | 'high';
    arousal: number; // 0-100
    valence: number; // 0-100 (positivity)
  };
  style_prompt: string;
  tags: string[];
}

// System prompt for structured JSON output
const ANALYSIS_SYSTEM_PROMPT = `You are an expert music analyst AI. Analyze the audio and respond ONLY with a valid JSON object matching this exact structure:

{
  "genre": "main genre (e.g., pop, rock, hip-hop, electronic, jazz, classical)",
  "subgenres": ["array", "of", "subgenres"],
  "mood": "primary mood (e.g., energetic, melancholic, uplifting, dark, chill)",
  "emotions": ["array", "of", "emotions", "detected"],
  "tempo": "slow|medium|fast",
  "bpm": 120,
  "key": "C major|A minor|etc. or 'unknown'",
  "scale": "major|minor|modal|unknown",
  "time_signature": "4/4|3/4|6/8|etc.",
  "instruments": ["array", "of", "instruments", "heard"],
  "structure": {
    "sections": ["intro", "verse", "chorus", "etc."],
    "has_intro": true,
    "has_outro": true,
    "has_bridge": false
  },
  "vocals": {
    "present": true,
    "gender": "male|female|mixed|unknown|null",
    "style": "description of vocal style or null",
    "language": "detected language or null"
  },
  "production": {
    "style": "production style description",
    "quality": "lo-fi|standard|polished|professional",
    "era": "era/decade influence (e.g., '80s synth', 'modern', 'vintage')",
    "techniques": ["reverb", "compression", "distortion", "etc."]
  },
  "energy": {
    "level": "low|medium|high",
    "arousal": 75,
    "valence": 60
  },
  "style_prompt": "Detailed style description for AI music generation (max 200 chars). Include genre, mood, instruments, vocals, and production style.",
  "tags": ["suno", "compatible", "style", "tags"]
}

RULES:
1. Output ONLY valid JSON, no text before or after
2. BPM must be a number between 60-200
3. arousal and valence are 0-100 (integers)
4. If uncertain about a value, use reasonable defaults
5. style_prompt should be concise but descriptive for music generation AI
6. tags should be Suno-compatible style tags`;

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
    const { track_id, reference_id, audio_url, analysis_type = 'auto', custom_prompt } = body;
    console.log('Analyzing audio with Audio Flamingo 3:', { track_id, reference_id, audio_url, analysis_type });

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

    // Get track info if track_id provided
    let track = { user_id: 'anonymous', title: 'audio', style: null, lyrics: null };
    if (track_id) {
      const { data: trackData } = await supabase
        .from('tracks')
        .select('user_id, title, style, lyrics')
        .eq('id', track_id)
        .single();

      if (trackData) {
        track = trackData;
      }
    }

    // Use custom prompt or default structured JSON prompt
    const systemPrompt = custom_prompt || ANALYSIS_SYSTEM_PROMPT;

    console.log('Creating Audio Flamingo 3 prediction...');

    let fullResponse: string;
    try {
      const output = await replicate.run(
        "zsxkib/audio-flamingo-3:2856d42f07154766b0cc0f3554fb425d7c3422ae77269264fbe0c983ac759fef",
        {
          input: {
            audio: audio_url,
            prompt: 'Analyze this audio and provide a detailed structured analysis',
            system_prompt: systemPrompt,
            enable_thinking: true,
            temperature: 0.1,
            max_length: 2048,
          },
        }
      ) as string;
      
      console.log('Replicate output received, length:', output?.length);
      fullResponse = output;
    } catch (replicateError) {
      console.error('Replicate API error:', replicateError);
      throw new Error(`Replicate API error: ${replicateError instanceof Error ? replicateError.message : 'Unknown error'}`);
    }
    
    console.log('Raw analysis result:', fullResponse.substring(0, 500));

    // Parse JSON response from Audio Flamingo
    let parsedAnalysis: AudioAnalysisResponse;
    try {
      // Try to extract JSON from response (handle potential text wrapping)
      let jsonStr = fullResponse;
      
      // Find JSON object in response
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      parsedAnalysis = JSON.parse(jsonStr);
      console.log('Successfully parsed JSON analysis');
    } catch (parseError) {
      console.warn('Failed to parse JSON response, falling back to text parsing:', parseError);
      // Fallback to legacy text parsing
      parsedAnalysis = parseTextResponse(fullResponse);
    }

    // Validate and normalize values
    const normalizedAnalysis = normalizeAnalysis(parsedAnalysis);
    console.log('Normalized analysis:', JSON.stringify(normalizedAnalysis, null, 2).substring(0, 1000));

    // Save analysis to database
    let analysis = null;
    
    // If reference_id is provided, update reference_audio table
    if (reference_id) {
      const { error: refError } = await supabase
        .from('reference_audio')
        .update({
          genre: normalizedAnalysis.genre,
          mood: normalizedAnalysis.mood,
          tempo: normalizedAnalysis.tempo,
          bpm: normalizedAnalysis.bpm,
          energy: normalizedAnalysis.energy.level,
          vocal_style: normalizedAnalysis.vocals.style,
          style_description: normalizedAnalysis.style_prompt,
          instruments: normalizedAnalysis.instruments,
          has_vocals: normalizedAnalysis.vocals.present,
          has_instrumentals: !normalizedAnalysis.vocals.present,
          detected_language: normalizedAnalysis.vocals.language,
          analysis_status: 'completed',
          analyzed_at: new Date().toISOString(),
          analysis_metadata: {
            key_signature: normalizedAnalysis.key,
            scale: normalizedAnalysis.scale,
            time_signature: normalizedAnalysis.time_signature,
            structure: normalizedAnalysis.structure,
            production: normalizedAnalysis.production,
            subgenres: normalizedAnalysis.subgenres,
            emotions: normalizedAnalysis.emotions,
            arousal: normalizedAnalysis.energy.arousal,
            valence: normalizedAnalysis.energy.valence,
            tags: normalizedAnalysis.tags,
            full_response: fullResponse,
            parsed_json: normalizedAnalysis,
          },
        })
        .eq('id', reference_id);
      
      if (refError) {
        console.error('Error updating reference_audio:', refError);
      } else {
        console.log('Reference audio updated:', reference_id);
      }
    }
    
    // If track_id is provided, save to audio_analysis table
    if (track_id) {
      const { data: savedAnalysis, error: insertError } = await supabase
        .from('audio_analysis')
        .insert({
          track_id,
          user_id: track.user_id,
          analysis_type,
          full_response: fullResponse,
          genre: normalizedAnalysis.genre,
          mood: normalizedAnalysis.mood,
          tempo: normalizedAnalysis.tempo,
          bpm: normalizedAnalysis.bpm,
          key_signature: normalizedAnalysis.key,
          instruments: normalizedAnalysis.instruments,
          structure: normalizedAnalysis.structure.sections.join(', '),
          style_description: normalizedAnalysis.style_prompt,
          arousal: normalizedAnalysis.energy.arousal / 100,
          valence: normalizedAnalysis.energy.valence / 100,
          analysis_metadata: {
            scale: normalizedAnalysis.scale,
            time_signature: normalizedAnalysis.time_signature,
            subgenres: normalizedAnalysis.subgenres,
            emotions: normalizedAnalysis.emotions,
            vocals: normalizedAnalysis.vocals,
            production: normalizedAnalysis.production,
            tags: normalizedAnalysis.tags,
            analyzed_at: new Date().toISOString(),
            model: 'audio-flamingo-3',
            version: 'v2-json-structured',
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

      // Update track with analyzed data if empty
      const updates: Record<string, string> = {};
      if (!track.style && normalizedAnalysis.style_prompt) {
        updates.style = normalizedAnalysis.style_prompt;
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
        parsed: normalizedAnalysis,
        raw_response: fullResponse,
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

// Fallback text parsing for backward compatibility
function parseTextResponse(text: string): AudioAnalysisResponse {
  const parseField = (fieldName: string): string | null => {
    const regex = new RegExp(`${fieldName}:\\s*(.+?)(?=\\n[A-Z]|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const parseNumber = (fieldName: string): number => {
    const value = parseField(fieldName);
    if (!value) return 50;
    const num = parseInt(value.match(/\d+/)?.[0] || '50', 10);
    return Math.max(0, Math.min(100, num));
  };

  const genre = parseField('Genre') || 'unknown';
  const mood = parseField('Mood') || 'neutral';
  const tempo = parseField('Tempo')?.toLowerCase() || 'medium';
  const bpmText = parseField('BPM');
  const bpm = bpmText ? parseInt(bpmText.match(/\d+/)?.[0] || '120', 10) : 120;
  const key = parseField('Key') || 'unknown';
  const instrumentsText = parseField('Instruments');
  const instruments = instrumentsText ? instrumentsText.split(',').map(i => i.trim()) : [];
  const structure = parseField('Structure') || '';
  const styleDescription = parseField('Style') || '';
  const vocalStyle = parseField('Vocal Style');
  const hasVocalsText = parseField('Has Vocals');
  const hasVocals = hasVocalsText ? hasVocalsText.toLowerCase().includes('yes') : false;
  const energy = parseField('Energy Level')?.toLowerCase() || 'medium';
  const positivity = parseNumber('Positivity');

  return {
    genre,
    subgenres: [],
    mood,
    emotions: [mood],
    tempo: tempo.includes('fast') ? 'fast' : tempo.includes('slow') ? 'slow' : 'medium',
    bpm: Math.max(60, Math.min(200, bpm)),
    key,
    scale: key.toLowerCase().includes('minor') ? 'minor' : 'major',
    time_signature: '4/4',
    instruments,
    structure: {
      sections: structure.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
      has_intro: structure.toLowerCase().includes('intro'),
      has_outro: structure.toLowerCase().includes('outro'),
      has_bridge: structure.toLowerCase().includes('bridge'),
    },
    vocals: {
      present: hasVocals,
      gender: null,
      style: vocalStyle !== 'none' ? vocalStyle : null,
      language: null,
    },
    production: {
      style: styleDescription,
      quality: 'standard',
      era: 'modern',
      techniques: [],
    },
    energy: {
      level: energy.includes('high') ? 'high' : energy.includes('low') ? 'low' : 'medium',
      arousal: energy.includes('high') ? 75 : energy.includes('low') ? 25 : 50,
      valence: positivity,
    },
    style_prompt: styleDescription.substring(0, 200),
    tags: [genre, mood].filter(Boolean),
  };
}

// Normalize and validate analysis values
function normalizeAnalysis(analysis: Partial<AudioAnalysisResponse>): AudioAnalysisResponse {
  return {
    genre: analysis.genre || 'unknown',
    subgenres: Array.isArray(analysis.subgenres) ? analysis.subgenres : [],
    mood: analysis.mood || 'neutral',
    emotions: Array.isArray(analysis.emotions) ? analysis.emotions : [analysis.mood || 'neutral'],
    tempo: ['slow', 'medium', 'fast'].includes(analysis.tempo as string) 
      ? analysis.tempo as 'slow' | 'medium' | 'fast' 
      : 'medium',
    bpm: typeof analysis.bpm === 'number' 
      ? Math.max(60, Math.min(200, Math.round(analysis.bpm))) 
      : 120,
    key: analysis.key || 'unknown',
    scale: ['major', 'minor', 'modal', 'unknown'].includes(analysis.scale as string)
      ? analysis.scale as 'major' | 'minor' | 'modal' | 'unknown'
      : 'unknown',
    time_signature: analysis.time_signature || '4/4',
    instruments: Array.isArray(analysis.instruments) ? analysis.instruments : [],
    structure: {
      sections: Array.isArray(analysis.structure?.sections) ? analysis.structure.sections : [],
      has_intro: Boolean(analysis.structure?.has_intro),
      has_outro: Boolean(analysis.structure?.has_outro),
      has_bridge: Boolean(analysis.structure?.has_bridge),
    },
    vocals: {
      present: Boolean(analysis.vocals?.present),
      gender: analysis.vocals?.gender || null,
      style: analysis.vocals?.style || null,
      language: analysis.vocals?.language || null,
    },
    production: {
      style: analysis.production?.style || '',
      quality: ['lo-fi', 'standard', 'polished', 'professional'].includes(analysis.production?.quality as string)
        ? analysis.production?.quality as 'lo-fi' | 'standard' | 'polished' | 'professional'
        : 'standard',
      era: analysis.production?.era || 'modern',
      techniques: Array.isArray(analysis.production?.techniques) ? analysis.production.techniques : [],
    },
    energy: {
      level: ['low', 'medium', 'high'].includes(analysis.energy?.level as string)
        ? analysis.energy?.level as 'low' | 'medium' | 'high'
        : 'medium',
      arousal: typeof analysis.energy?.arousal === 'number'
        ? Math.max(0, Math.min(100, Math.round(analysis.energy.arousal)))
        : 50,
      valence: typeof analysis.energy?.valence === 'number'
        ? Math.max(0, Math.min(100, Math.round(analysis.energy.valence)))
        : 50,
    },
    style_prompt: (analysis.style_prompt || '').substring(0, 200),
    tags: Array.isArray(analysis.tags) ? analysis.tags : [],
  };
}
