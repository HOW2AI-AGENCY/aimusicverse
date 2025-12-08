import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('analyze-audio');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const falApiKey = Deno.env.get('FAL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!falApiKey) {
      throw new Error('FAL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const { audioUrl, trackId, analysisType = 'full' } = await req.json();

    if (!audioUrl) {
      throw new Error('audioUrl is required');
    }

    logger.info('Starting audio analysis', { userId: user.id, analysisType, trackId });

    let transcription = null;
    let styleAnalysis = null;

    // Step 1: Transcribe lyrics using fal.ai/wizper
    if (analysisType === 'full' || analysisType === 'lyrics') {
      logger.info('Transcribing audio with fal.ai/wizper');
      const transcriptionResponse = await fetch('https://fal.run/fal-ai/wizper', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          task: 'transcribe',
          language: 'auto',
          chunk_level: 'segment',
          version: '3',
        }),
      });

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        logger.error('Fal.ai transcription error', null, { status: transcriptionResponse.status, error: errorText });
      } else {
        const transcriptionData = await transcriptionResponse.json();
        transcription = {
          text: transcriptionData.text || '',
          chunks: transcriptionData.chunks || [],
          language: transcriptionData.language || 'unknown',
        };
        logger.success('Transcription completed', { language: transcription.language, textLength: transcription.text.length });
      }
    }

    // Step 2: Analyze style, genre, mood using Lovable AI (with Russian translation)
    if (analysisType === 'full' || analysisType === 'style') {
      logger.info('Analyzing style with Lovable AI');
      
      const analysisPrompt = `Проанализируй этот музыкальный трек и предоставь детальный анализ в формате JSON.

${transcription ? `Текст песни:\n${transcription.text}\n\n` : ''}

Предоставь следующий анализ НА РУССКОМ ЯЗЫКЕ:
1. Жанр(ы) - конкретные жанры и поджанры
2. Стиль - детальное описание музыкального стиля
3. Настроение/Эмоция - эмоциональные характеристики
4. Оценка BPM - приблизительное количество ударов в минуту
5. Тональность - музыкальная тональность, если определяется
6. Инструменты - используемые инструменты
7. Вокальные характеристики - если присутствует вокал
8. Качество продакшена - оценка сведения/мастеринга
9. Теги - 5-10 описательных тегов для генерации музыки
10. Темп - описание темпа (медленный, средний, быстрый)
11. Структура - структура трека (куплет, припев и т.д.)
12. Валентность - эмоциональная окраска от 0 до 1 (0 - грустный, 1 - радостный)
13. Возбуждение - уровень энергии от 0 до 1 (0 - спокойный, 1 - энергичный)

Верни ТОЛЬКО валидный JSON в точно таком формате:
{
  "genre": ["жанр1", "жанр2"],
  "style_description": "детальное описание стиля на русском",
  "mood": "настроение на русском",
  "bpm": 120,
  "key_signature": "тональность",
  "instruments": ["инструмент1", "инструмент2"],
  "tempo": "медленный/средний/быстрый",
  "structure": "описание структуры",
  "valence": 0.7,
  "arousal": 0.6,
  "approachability": "высокая/средняя/низкая",
  "engagement": "высокое/среднее/низкое",
  "tags": ["тег1", "тег2", "тег3"]
}`;

      const styleResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

      if (!styleResponse.ok) {
        const errorText = await styleResponse.text();
        logger.error('Lovable AI analysis error', null, { status: styleResponse.status, error: errorText });
      } else {
        const styleData = await styleResponse.json();
        const analysisText = styleData.choices?.[0]?.message?.content || '{}';
        
        try {
          // Extract JSON from markdown code blocks if present
          const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                           analysisText.match(/```\s*([\s\S]*?)\s*```/);
          const jsonText = jsonMatch ? jsonMatch[1] : analysisText;
          styleAnalysis = JSON.parse(jsonText);
          
          logger.success('Style analysis parsed', { genre: styleAnalysis.genre, mood: styleAnalysis.mood });
        } catch (e) {
          const error = e as Error;
          logger.error('Failed to parse style analysis JSON', error, { rawTextLength: analysisText.length });
          styleAnalysis = { raw: analysisText, parse_error: error.message };
        }
      }
    }

    // Step 3: Save to audio_analysis table and update track
    if (trackId && styleAnalysis) {
      // Save structured analysis to audio_analysis table
      const analysisData: any = {
        track_id: trackId,
        user_id: user.id,
        analysis_type: 'ai_comprehensive',
        genre: styleAnalysis.genre?.join(', ') || null,
        style_description: styleAnalysis.style_description || null,
        mood: styleAnalysis.mood || null,
        bpm: styleAnalysis.bpm || null,
        key_signature: styleAnalysis.key_signature || null,
        instruments: styleAnalysis.instruments || [],
        tempo: styleAnalysis.tempo || null,
        structure: styleAnalysis.structure || null,
        valence: styleAnalysis.valence || null,
        arousal: styleAnalysis.arousal || null,
        approachability: styleAnalysis.approachability || null,
        engagement: styleAnalysis.engagement || null,
        full_response: JSON.stringify(styleAnalysis),
        analysis_metadata: {
          transcription_available: !!transcription,
          language: transcription?.language,
          tags: styleAnalysis.tags || [],
        },
      };

      const { error: analysisError } = await supabase
        .from('audio_analysis')
        .insert(analysisData);

      if (analysisError) {
        logger.error('Failed to save audio analysis', analysisError);
      } else {
        logger.db('INSERT', 'audio_analysis');
      }

      // Update track with lyrics and tags
      const trackUpdates: any = {};
      
      if (transcription) {
        trackUpdates.lyrics = transcription.text;
      }
      
      if (styleAnalysis.tags) {
        trackUpdates.tags = styleAnalysis.tags.join(', ');
      }

      if (Object.keys(trackUpdates).length > 0) {
        await supabase
          .from('tracks')
          .update(trackUpdates)
          .eq('id', trackId);
        logger.db('UPDATE', 'tracks');
      }

      // Log the analysis action
      await supabase.from('track_change_log').insert({
        track_id: trackId,
        user_id: user.id,
        change_type: 'ai_analyze',
        changed_by: 'ai',
        ai_model_used: 'fal_wizper+gemini_2.5_flash',
        metadata: {
          analysis_type: analysisType,
          transcription_success: !!transcription,
          style_analysis_success: !!styleAnalysis,
          language: transcription?.language,
        },
      });
    }

    logger.success('Audio analysis completed');

    return new Response(
      JSON.stringify({ 
        success: true,
        transcription,
        styleAnalysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Error in analyze-audio', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
