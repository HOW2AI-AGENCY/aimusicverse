import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NoteData {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity: number;
}

interface ChordData {
  chord: string;
  startTime: number;
  endTime: number;
}

interface MelodyInput {
  notes?: NoteData[];
  chords?: ChordData[];
  bpm?: number;
  key?: string;
  timeSignature?: string;
  instrument?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const input: MelodyInput = await req.json();
    console.log('Converting melody to tags:', input);

    const { notes = [], chords = [], bpm = 120, key = 'C major', timeSignature = '4/4', instrument = 'guitar' } = input;

    // Build context for AI
    const uniqueChords = [...new Set(chords.map(c => c.chord))];
    const chordProgression = uniqueChords.slice(0, 8).join(' - ');
    
    // Calculate note range
    const pitches = notes.map(n => n.pitch);
    const minPitch = Math.min(...pitches) || 48;
    const maxPitch = Math.max(...pitches) || 72;
    const range = maxPitch - minPitch;
    
    // Determine melodic characteristics
    let melodicStyle = 'melodic';
    if (range > 24) melodicStyle = 'wide range, expressive';
    else if (range < 12) melodicStyle = 'focused, intimate';
    
    // Determine tempo feel
    let tempoFeel = 'moderate';
    if (bpm < 80) tempoFeel = 'slow, contemplative';
    else if (bpm < 100) tempoFeel = 'relaxed, laid-back';
    else if (bpm < 120) tempoFeel = 'groovy, mid-tempo';
    else if (bpm < 140) tempoFeel = 'upbeat, energetic';
    else tempoFeel = 'fast, driving';

    // Use AI to generate optimized tags
    const systemPrompt = `Ты эксперт по музыкальной теории и генерации музыки с помощью Suno AI.
На основе анализа мелодии пользователя, создай оптимальные теги для генерации похожего трека.

Формат тегов Suno:
- Структурные: [Intro], [Verse], [Chorus], [Bridge], [Outro]
- Динамика: [Build], [Drop], [Breakdown]
- Вокал: [Falsetto], [Whisper], [Belt], [Rap]
- Инструменты: acoustic guitar, piano, strings, synth, bass, drums
- Жанры: pop, rock, folk, jazz, electronic, acoustic
- Настроение: emotional, uplifting, melancholic, energetic, peaceful

Отвечай ТОЛЬКО на русском языке.
Максимум 450 символов в ответе.`;

    const userPrompt = `Мелодия записана на: ${instrument}
Тональность: ${key}
Темп: ${bpm} BPM (${tempoFeel})
Размер: ${timeSignature}
Аккорды: ${chordProgression || 'не определены'}
Характер мелодии: ${melodicStyle}
Количество нот: ${notes.length}

Создай описание стиля и список тегов для генерации трека, который воспроизведёт эту мелодию. Включи:
1. Краткое описание стиля (2-3 предложения)
2. Теги жанра и настроения
3. Теги инструментов
4. Теги структуры песни

Ответ должен быть готов для вставки в поле "Стиль" генератора Suno.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const generatedStyle = aiData.choices?.[0]?.message?.content || '';

    console.log('Generated style:', generatedStyle);

    // Also generate structured tags array
    const structuredTags: string[] = [];
    
    // Add key
    structuredTags.push(`[Key: ${key}]`);
    
    // Add BPM
    structuredTags.push(`[BPM: ${bpm}]`);
    
    // Add time signature if not 4/4
    if (timeSignature !== '4/4') {
      structuredTags.push(`[${timeSignature}]`);
    }
    
    // Add chord progression
    if (chordProgression) {
      structuredTags.push(`[Chords: ${chordProgression}]`);
    }
    
    // Add instrument
    structuredTags.push(instrument);
    
    // Add mood based on key
    if (key.includes('minor')) {
      structuredTags.push('emotional', 'melancholic');
    } else {
      structuredTags.push('uplifting', 'bright');
    }
    
    // Add tempo tag
    if (bpm < 90) structuredTags.push('slow', 'ballad');
    else if (bpm < 120) structuredTags.push('mid-tempo');
    else structuredTags.push('upbeat', 'energetic');

    return new Response(
      JSON.stringify({
        success: true,
        styleDescription: generatedStyle,
        tags: structuredTags,
        metadata: {
          key,
          bpm,
          timeSignature,
          chordProgression,
          instrument,
          melodicStyle,
          tempoFeel,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in melody-to-tags:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
