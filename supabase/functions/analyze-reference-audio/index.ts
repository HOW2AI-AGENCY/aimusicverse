import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('analyze-reference-audio');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReferenceAnalysis {
  bpm?: number;
  key?: string;
  genre?: string;
  mood?: string;
  energy?: string;
  instruments?: string[];
  chords?: string[];
  style_description?: string;
  vocal_style?: string;
  suggested_tags?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { audioUrl, analyzeStyle = true, detectChords = true, detectBpm = true } = await req.json();

    if (!audioUrl) {
      throw new Error('audioUrl is required');
    }

    logger.info('Analyzing reference audio', { 
      userId: user.id, 
      analyzeStyle, 
      detectChords, 
      detectBpm 
    });

    // Use Lovable AI to analyze the audio characteristics
    const analysisPrompt = `Ты эксперт по анализу музыки. Проанализируй аудио-референс и определи его характеристики для использования в AI-генерации музыки.

URL аудио: ${audioUrl}

Определи следующие параметры на основе анализа:

1. **BPM** - примерный темп (60-200)
2. **Тональность** - основная тональность (C, Cm, D, Dm, etc.)
3. **Жанр** - основной жанр на русском
4. **Настроение** - эмоциональный окрас на русском
5. **Энергия** - уровень энергии (low/medium/high)
6. **Инструменты** - список инструментов на английском (для Suno)
7. **Аккорды** - основные аккорды если слышны
8. **Стиль вокала** - если есть вокал (male/female/mixed, характер)
9. **Описание стиля** - короткое описание стиля на русском
10. **Теги для генерации** - 5-10 тегов на АНГЛИЙСКОМ для Suno AI

Верни ТОЛЬКО валидный JSON:
{
  "bpm": 120,
  "key": "Am",
  "genre": "жанр на русском",
  "mood": "настроение на русском",
  "energy": "medium",
  "instruments": ["piano", "drums", "bass"],
  "chords": ["Am", "F", "C", "G"],
  "vocal_style": "female ethereal vocals",
  "style_description": "описание на русском",
  "suggested_tags": ["ambient", "chill", "piano", "female vocals", "emotional"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Lovable AI analysis failed', null, { status: response.status, error: errorText });
      throw new Error(`Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content || '{}';

    let analysis: ReferenceAnalysis;
    
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       analysisText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : analysisText;
      analysis = JSON.parse(jsonText);
      
      logger.success('Reference analysis completed', { 
        bpm: analysis.bpm, 
        key: analysis.key, 
        genre: analysis.genre,
        tagsCount: analysis.suggested_tags?.length 
      });
    } catch (e) {
      const error = e as Error;
      logger.error('Failed to parse analysis JSON', error);
      
      // Return partial analysis with defaults
      analysis = {
        bpm: 120,
        key: 'C',
        genre: 'Unknown',
        mood: 'Neutral',
        energy: 'medium',
        instruments: [],
        chords: [],
        style_description: 'Audio reference',
        suggested_tags: ['reference', 'custom']
      };
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error analyzing reference audio', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
