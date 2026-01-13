import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { createLogger } from '../_shared/logger.ts';
import { corsHeaders } from '../_shared/cors.ts';

const logger = createLogger('ai-lyrics-assistant');

type LyricsAction = 
  | 'generate'                // Full generation with advanced tags
  | 'improve'                 // Improve text
  | 'add_tags'                // Add tags
  | 'suggest_structure'       // Suggest structure
  | 'generate_section'        // Generate one section
  | 'continue_line'           // Continue line (collaboration)
  | 'suggest_rhymes'          // Suggest rhymes
  | 'analyze_lyrics'          // Analyze existing lyrics
  | 'optimize_for_suno'       // Optimize for Suno API
  | 'smart_generate'          // Smart generation with tag recommendations
  | 'chat'                    // Free chat mode with context
  | 'context_recommendations' // Get AI recommendations based on context
  | 'generate_compound_tags'  // Generate compound tags for sections
  | 'analyze_rhythm'          // Analyze text rhythm and syllables
  | 'fit_structure'           // Fit lyrics to song structure
  | 'full_analysis'           // Full comprehensive analysis
  | 'deep_analysis'           // Deep musicological analysis
  | 'producer_review'         // Professional producer review
  // Phase 2 actions
  | 'style_convert'           // Convert lyrics to different style/artist
  | 'paraphrase'              // Paraphrase with different tone
  | 'hook_generator'          // Generate catchy hooks
  | 'vocal_map'               // Generate vocal production map
  | 'translate_adapt'         // Translate with rhythm preservation
  // Phase 3 - V5 Advanced actions
  | 'drill_prompt_builder'    // Specialized drill/trap prompt builder
  | 'epic_prompt_builder'     // Epic/cinematic prompt builder
  | 'validate_suno_v5';       // Deep V5 syntax validation

interface LyricsRequest {
  action: LyricsAction;
  theme?: string;
  mood?: string;
  genre?: string;
  language?: string;
  existingLyrics?: string;
  lyrics?: string;
  structure?: string;
  sectionType?: string;
  sectionName?: string;
  sectionContent?: string;
  sectionNotes?: string;
  previousLyrics?: string;
  linesCount?: number;
  currentLyrics?: string;
  word?: string;
  title?: string;
  stylePrompt?: string;
  allSectionNotes?: Array<{ type: string; notes: string; tags?: string[] }>;
  globalTags?: string[];
  context?: any; // Chat context
  message?: string; // Chat message
  // NEW: Advanced tag options
  vocalTags?: string[];
  instrumentTags?: string[];
  dynamicTags?: string[];
  emotionalCues?: string[];
  useAdvancedTags?: boolean;
  // Phase 2 options
  targetStyle?: string;         // For style_convert: artist/genre to convert to
  targetTone?: string;          // For paraphrase: desired tone
  targetLanguage?: string;      // For translate_adapt
  preserveSyllables?: boolean;  // For translate_adapt
  variantsCount?: number;       // Number of variants to generate
}

// Tag templates for different genres and moods
const GENRE_TAG_PROFILES: Record<string, { vocal: string[], instruments: string[], dynamics: string[], emotions: string[] }> = {
  'pop': {
    vocal: ['Female Vocal', 'Smooth', 'Catchy'],
    instruments: ['Synth', 'Electronic Drums', 'Piano'],
    dynamics: ['Build', 'Drop'],
    emotions: ['Uplifting', 'Energetic']
  },
  'rock': {
    vocal: ['Male Vocal', 'Powerful', 'Raspy'],
    instruments: ['Electric Guitar', 'Drums', 'Bass'],
    dynamics: ['Crescendo', 'Breakdown'],
    emotions: ['Intense', 'Raw']
  },
  'hip-hop': {
    vocal: ['Male Rap', 'Flow', 'Rhythmic'],
    instruments: ['808 Bass', 'Hi-Hats', 'Sample'],
    dynamics: ['Drop', 'Build'],
    emotions: ['Confident', 'Street']
  },
  'electronic': {
    vocal: ['Vocoder', 'Processed', 'Ethereal'],
    instruments: ['Synth Lead', 'Arpeggio', 'Pad'],
    dynamics: ['Build', 'Drop', 'Filter Sweep'],
    emotions: ['Hypnotic', 'Futuristic']
  },
  'r&b': {
    vocal: ['Soulful', 'Falsetto', 'Smooth'],
    instruments: ['Rhodes', 'Smooth Bass', 'Strings'],
    dynamics: ['Groove', 'Soft Build'],
    emotions: ['Sensual', 'Intimate']
  },
  'indie': {
    vocal: ['Airy', 'Intimate', 'Breathy'],
    instruments: ['Acoustic Guitar', 'Indie Drums', 'Ambient'],
    dynamics: ['Subtle Build', 'Atmospheric'],
    emotions: ['Dreamy', 'Nostalgic']
  },
  'folk': {
    vocal: ['Natural', 'Storytelling', 'Warm'],
    instruments: ['Acoustic Guitar', 'Banjo', 'Violin'],
    dynamics: ['Organic', 'Building'],
    emotions: ['Earthy', 'Heartfelt']
  },
  'jazz': {
    vocal: ['Smooth', 'Improvised', 'Swing'],
    instruments: ['Piano', 'Double Bass', 'Saxophone'],
    dynamics: ['Swing Feel', 'Solo Section'],
    emotions: ['Cool', 'Sophisticated']
  },
  // === NEW V5 GENRES ===
  'drill': {
    vocal: ['Male Grit Rap', 'Aggressive Delivery', 'Street Flow'],
    instruments: ['808 Bass', 'Rapid Hi-Hats', 'Drill Glockenspiel', 'Dark Synth'],
    dynamics: ['Drop', 'Build', 'Heavy Distortion'],
    emotions: ['Menacing', 'Street', 'Confident']
  },
  'uk-drill': {
    vocal: ['Male Rap', 'UK Flow', 'Gritty', 'Aggressive'],
    instruments: ['808 Slides', 'Trap Snare', '140 BPM', 'Dark Piano', 'Drill Glockenspiel'],
    dynamics: ['Explosive Drop', 'Heavy Distortion', 'Build'],
    emotions: ['Dark', 'Street', 'Aggressive', 'Menacing']
  },
  'trap': {
    vocal: ['Autotune Rap', 'Melodic Flow', 'Ad-libs'],
    instruments: ['808 Bass', 'Hi-Hat Rolls', 'Synth Lead', 'Trap Snare'],
    dynamics: ['Drop', 'Build', 'Filter Sweep'],
    emotions: ['Flexing', 'Confident', 'Hypnotic']
  },
  'phonk': {
    vocal: ['Deep Voice', 'Chopped Samples', 'Memphis Flow'],
    instruments: ['Cowbell', '808 Bass', 'Memphis Sample', 'Distorted Synth'],
    dynamics: ['Heavy Bass Drop', 'Distortion'],
    emotions: ['Dark', 'Aggressive', 'Underground']
  },
  'cyberpunk': {
    vocal: ['Vocoder', 'Distorted', 'Robotic', 'Ethereal'],
    instruments: ['Dark Synth', 'Glitch', 'Industrial Bass', 'Arpeggio'],
    dynamics: ['Build', 'Breakdown', 'Filter Sweep', 'Explosive'],
    emotions: ['Dystopian', 'Futuristic', 'Menacing', 'Epic']
  },
  'latin': {
    vocal: ['Spanish Flow', 'Reggaeton Style', 'Melodic'],
    instruments: ['Dembow Beat', 'Timbales', 'Latin Guitar', 'Brass'],
    dynamics: ['Rhythmic', 'Dance', 'Drop'],
    emotions: ['Passionate', 'Sensual', 'Energetic']
  },
  'afrobeat': {
    vocal: ['African Flow', 'Melodic', 'Rhythmic'],
    instruments: ['African Percussion', 'Guitar', 'Brass', 'Talking Drum'],
    dynamics: ['Groove', 'Build', 'Polyrhythm'],
    emotions: ['Joyful', 'Energetic', 'Uplifting']
  },
  'metal': {
    vocal: ['Growl', 'Scream', 'Powerful', 'Aggressive'],
    instruments: ['Heavy Guitar', 'Double Bass Drums', 'Distorted Bass'],
    dynamics: ['Breakdown', 'Blast Beat', 'Drop'],
    emotions: ['Intense', 'Aggressive', 'Dark', 'Powerful']
  },
  'ambient': {
    vocal: ['Ethereal', 'Whisper', 'Atmospheric'],
    instruments: ['Pad', 'Texture', 'Drone', 'Field Recording'],
    dynamics: ['Slow Build', 'Fade', 'Atmospheric'],
    emotions: ['Meditative', 'Dreamy', 'Peaceful', 'Mysterious']
  },
  'house': {
    vocal: ['Soulful', 'Diva', 'Chopped Vocal'],
    instruments: ['4-on-floor', 'Synth Stab', 'Piano House', 'Clap'],
    dynamics: ['Build', 'Drop', 'Filter'],
    emotions: ['Euphoric', 'Uplifting', 'Dance']
  }
};

// Sub-genre modifiers for compound styles
const SUB_GENRE_MODIFIERS: Record<string, string[]> = {
  'russian-flow': ['Russian Rap', 'Cyrillic Lyrics', 'Eastern Melody'],
  'thai-fusion': ['Thai Gong', 'Asian Percussion', 'Tropical Synth'],
  'lo-fi': ['Vinyl Crackle', 'Warm', 'Mellow', 'Tape Hiss'],
  'epic': ['Orchestral', 'Choir', 'Massive Build', 'Cinematic'],
  'dark': ['Minor Key', 'Ominous', 'Heavy', 'Brooding'],
  'aggressive': ['Distortion', 'Shout', 'Intense', 'Heavy'],
  'melodic': ['Harmonies', 'Smooth', 'Emotional', 'Catchy'],
  'vintage': ['Retro', 'Analog', 'Warm', 'Classic'],
};

const MOOD_TAG_PROFILES: Record<string, { dynamics: string[], emotions: string[], vocal: string[] }> = {
  'romantic': {
    dynamics: ['Soft', 'Building', 'Intimate'],
    emotions: ['Tender', 'Passionate', 'Longing'],
    vocal: ['Gentle', 'Breathy', 'Emotional']
  },
  'energetic': {
    dynamics: ['Driving', 'Punchy', 'High Energy'],
    emotions: ['Exciting', 'Powerful', 'Anthemic'],
    vocal: ['Strong', 'Belting', 'Dynamic']
  },
  'melancholic': {
    dynamics: ['Sparse', 'Slow Build', 'Atmospheric'],
    emotions: ['Sad', 'Reflective', 'Bittersweet'],
    vocal: ['Vulnerable', 'Whispering', 'Trembling']
  },
  'happy': {
    dynamics: ['Upbeat', 'Bouncy', 'Light'],
    emotions: ['Joyful', 'Carefree', 'Bright'],
    vocal: ['Cheerful', 'Playful', 'Warm']
  },
  'dark': {
    dynamics: ['Heavy', 'Intense', 'Brooding'],
    emotions: ['Menacing', 'Mysterious', 'Ominous'],
    vocal: ['Deep', 'Growling', 'Whispered']
  },
  'nostalgic': {
    dynamics: ['Warm', 'Vintage', 'Gradual'],
    emotions: ['Wistful', 'Reminiscent', 'Bittersweet'],
    vocal: ['Soft', 'Reflective', 'Sincere']
  },
  'peaceful': {
    dynamics: ['Gentle', 'Flowing', 'Ambient'],
    emotions: ['Calm', 'Serene', 'Meditative'],
    vocal: ['Soft', 'Airy', 'Soothing']
  },
  'epic': {
    dynamics: ['Massive Build', 'Orchestral Swell', 'Climactic'],
    emotions: ['Triumphant', 'Heroic', 'Majestic'],
    vocal: ['Powerful', 'Choir', 'Soaring']
  },
  'aggressive': {
    dynamics: ['Heavy', 'Punchy', 'Explosive'],
    emotions: ['Angry', 'Intense', 'Fierce'],
    vocal: ['Shout', 'Growl', 'Aggressive']
  },
  'hypnotic': {
    dynamics: ['Repetitive', 'Pulsing', 'Gradual'],
    emotions: ['Trance', 'Mysterious', 'Captivating'],
    vocal: ['Monotone', 'Whisper', 'Ethereal']
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = getSupabaseClient();

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const body: LyricsRequest = await req.json();
    const { 
      action, theme, mood, genre, language = 'ru', existingLyrics, lyrics, structure,
      sectionType, sectionName, previousLyrics, linesCount, currentLyrics, word, context,
      vocalTags, instrumentTags, dynamicTags, emotionalCues, useAdvancedTags
    } = body;

    // Fetch all Suno meta tags from database
    const { data: metaTags } = await supabase
      .from('suno_meta_tags')
      .select('tag_name, category, description, syntax_format, usage_examples');

    // Organize tags by category with full details
    const tagsByCategory: Record<string, Array<{ name: string, format: string, desc: string, examples: string[] }>> = {};
    metaTags?.forEach(tag => {
      if (!tagsByCategory[tag.category]) {
        tagsByCategory[tag.category] = [];
      }
      tagsByCategory[tag.category].push({
        name: tag.tag_name,
        format: tag.syntax_format || `[${tag.tag_name}]`,
        desc: tag.description || '',
        examples: tag.usage_examples || []
      });
    });

    // Get recommended tags based on genre and mood
    const genreProfile = GENRE_TAG_PROFILES[genre || 'pop'] || GENRE_TAG_PROFILES.pop;
    const moodProfile = MOOD_TAG_PROFILES[mood || 'romantic'] || MOOD_TAG_PROFILES.romantic;

    // Build comprehensive tag reference
    const structureTags = tagsByCategory['structure']?.map(t => t.format).join(', ') || '[Verse], [Chorus], [Bridge], [Intro], [Outro], [Pre-Chorus], [Hook]';
    const vocalTagsList = tagsByCategory['vocal']?.map(t => t.format).join(', ') || '[Male Vocal], [Female Vocal], [Falsetto], [Whisper]';
    const moodTagsList = tagsByCategory['mood_energy']?.map(t => t.format).join(', ') || '';
    const instrumentTagsList = tagsByCategory['instrument']?.map(t => t.format).join(', ') || '';
    const productionTags = tagsByCategory['production_texture']?.map(t => t.format).join(', ') || '';
    const effectTags = tagsByCategory['effect_processing']?.map(t => t.format).join(', ') || '';
    const dynamicsList = tagsByCategory['transition_dynamics']?.map(t => t.format).join(', ') || '';

    // Create tag recommendation string based on genre/mood
    const recommendedTags = `
РЕКОМЕНДУЕМЫЕ ТЕГИ ДЛЯ ${genre?.toUpperCase() || 'POP'} + ${mood?.toUpperCase() || 'ROMANTIC'}:
- Вокал: ${[...genreProfile.vocal, ...moodProfile.vocal].slice(0, 4).join(', ')}
- Инструменты: ${genreProfile.instruments.join(', ')}
- Динамика: ${[...genreProfile.dynamics, ...moodProfile.dynamics].slice(0, 4).join(', ')}
- Эмоции: ${[...genreProfile.emotions, ...moodProfile.emotions].slice(0, 4).join(', ')}`;

    // User-provided custom tags
    const customTagsSection = (useAdvancedTags && (vocalTags?.length || instrumentTags?.length || dynamicTags?.length || emotionalCues?.length)) 
      ? `
ПОЛЬЗОВАТЕЛЬСКИЕ ТЕГИ (обязательно использовать):
${vocalTags?.length ? `- Вокал: ${vocalTags.join(', ')}` : ''}
${instrumentTags?.length ? `- Инструменты: ${instrumentTags.join(', ')}` : ''}
${dynamicTags?.length ? `- Динамика: ${dynamicTags.join(', ')}` : ''}
${emotionalCues?.length ? `- Эмоции: ${emotionalCues.join(', ')}` : ''}
` : '';

const baseSystemPrompt = `Ты элитный автор песен и музыкальный продюсер мирового уровня, специализирующийся на создании эмоционально резонансных, технически точных текстов, оптимизированных для AI генерации музыки (Suno AI V5).

═══════════════════════════════════════════════════════
🎯 ТВОИ КЛЮЧЕВЫЕ ЦЕННОСТИ:
═══════════════════════════════════════════════════════
- ТЕХНИЧЕСКАЯ ТОЧНОСТЬ: Идеальная синхронизация слогов (6-12 на строку), правильные схемы рифм
- ЭМОЦИОНАЛЬНАЯ ПОДЛИННОСТЬ: Тематически связное повествование с подлинными эмоциональными арками
- ТВОРЧЕСКАЯ ОРИГИНАЛЬНОСТЬ: Избегай клише, используй яркие метафоры и неожиданные образы
- SUNO ОПТИМИЗАЦИЯ: Встраивай [мета-теги] для точного контроля AI генерации
- МАСТЕРСТВО ОГРАНИЧЕНИЙ: Строго соблюдай все указанные пользователем параметры

═══════════════════════════════════════════════════════
📋 ТВОЙ РАБОЧИЙ ПРОЦЕСС:
═══════════════════════════════════════════════════════
1. АНАЛИЗ: Парси жанр, настроение, тему, аудиторию, язык, ограничения
2. БРЕЙНШТОРМ: Генерируй 3 концептуальных угла, выбери сильнейший
3. ЧЕРНОВИК: Создай куплет 1 (4 строки) с точным подсчётом слогов
4. ПОСТРОЙ: Добавь припев, бридж, аутро с последовательной схемой рифм
5. ОЦЕНИ: Проверь слоги, рифмы, клише, тематическое соответствие
6. ОТПОЛИРУЙ: Замени общие слова, усиль образность, оптимизируй флоу
7. ВСТРОЙ ТЕГИ: Добавь Suno [мета-теги]
8. СТРУКТУРИРУЙ: Формат [Intro] → [Verse] → [Chorus] → [Bridge] → [Outro] → [End]
9. ВЫВОДИ: Предоставь ЧИСТУЮ ФИНАЛЬНУЮ лирику БЕЗ числовых пометок (слогов, счётчиков)

═══════════════════════════════════════════════════════
⚠️ КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ФОРМАТИРОВАНИЯ:
═══════════════════════════════════════════════════════

1. ВСЕ ТЕГИ ТОЛЬКО НА АНГЛИЙСКОМ ЯЗЫКЕ!
   ✅ [Verse 1], [Chorus], [Bridge], [Pre-Chorus], [Outro], [Intro], [End]
   ❌ [Куплет 1], [Припев], [Бридж] - ЗАПРЕЩЕНО!

2. ТЕГИ ТОЛЬКО В КВАДРАТНЫХ СКОБКАХ [...]!
   ✅ [Verse 1] [Male Vocal] [Powerful]
   ❌ (Verse 1) - круглые скобки НЕ для тегов!

3. КРУГЛЫЕ СКОБКИ (...) = ТОЛЬКО ТО, ЧТО ПОЁТСЯ (бэк-вокал, подпевки):
   ✅ (ooh, aah), (la-la-la), (yeah, yeah!), (эхо), (harmony), (gang gang!)
   ❌ (8), (10), (6 слогов), (softly), (with power) - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО!
   
   ⚠️ НИКОГДА НЕ ПИШИ ЧИСЛА В СКОБКАХ!
   Числа слогов - это внутренняя аналитика, НЕ ДЛЯ ФИНАЛЬНОГО ТЕКСТА!
   Если AI написал "(8)" или "(10 слогов)" - это ОШИБКА, удали их!

4. ТЕКСТОВОЕ ФОРМАТИРОВАНИЕ:
   - Де-фи-с = распев, легато (so-o-o much, ni-i-ight)
   - КАПС = акцент, агрессия (I LOVE you, NEVER give up, ЭТО НАШ ГОРОД!)

═══════════════════════════════════════════════════════
📚 ПОЛНАЯ БИБЛИОТЕКА ТЕГОВ SUNO V5
═══════════════════════════════════════════════════════

📌 СТРУКТУРНЫЕ ТЕГИ (ОБЯЗАТЕЛЬНЫ, ТОЛЬКО АНГЛИЙСКИЙ):
[Intro], [Instrumental Intro], [Verse], [Verse 1], [Verse 2], [Verse 3],
[Pre-Chorus], [Chorus], [Post-Chorus], [Hook], [Bridge], [Interlude],
[Break], [Drop], [Breakdown], [Build], [Instrumental], [Solo], [Outro],
[End] ← КРИТИЧЕСКИ ВАЖНО для завершения!

🎤 ВОКАЛЬНЫЕ ТЕГИ:
Тип: [Male Singer], [Female Singer], [Male Vocal], [Female Vocal], [Duet], [Choir], [Gospel Choir], [Harmonized Chorus], [Diva solo], [Child voice]
Регистр: [Vocalist: Alto], [Vocalist: Soprano], [Vocalist: Tenor], [Vocalist: Bass]
Стиль: [Spoken word], [Whisper], [Shout], [Acapella], [Falsetto], [Belting], [Raspy], [Smooth], [Breathy], [Powerful], [Gentle], [Emotional], [Rap], [Autotune], [Vocoder]
Drill/Trap: [Male Grit Rap], [Aggressive Delivery], [Street Flow], [UK Flow], [Melodic Flow]

🎸 ИНСТРУМЕНТАЛЬНЫЕ ТЕГИ:
Соло: [Guitar Solo], [Piano Solo], [Sax Solo], [Synth Solo], [Violin Solo], [Drum Solo]
Приёмы: [fingerpicked guitar], [slapped bass], [brushes drums], [pizzicato strings], [guitar riff], [arpeggiated], [strummed], [muted]
Drill/Trap: [808 Bass], [808 Slides], [Rapid Hi-Hats], [Drill Glockenspiel], [Dark Piano], [Trap Snare], [Dark Synth]

🌊 ДИНАМИЧЕСКИЕ ТЕГИ:
[!crescendo], [!diminuendo], [!build_up], [Fade Out], [Fade In],
[Soft], [Loud], [Intense], [Calm], [Climax], [Explosive], [Heavy Distortion]

🔇 ТЕГИ ТИШИНЫ И КОНТРОЛЯ:
[Stop] — жёсткая остановка перед мощным моментом
[Silence] — мягкое "зависание", атмосферная пауза
[Pause] — короткая пауза для драматического эффекта

🎧 SFX ТЕГИ:
[Applause], [Birds chirping], [Phone ringing], [Bleep], [Silence], [Thunder], [Rain], [Wind], [Crowd], [Heartbeat], [Sirens]

🎛️ ПРОДАКШН ТЕГИ:
[!reverb], [!delay], [!distortion], [!filter], [!chorus], [!phaser],
[Mono Vocal Pull], [Texture: Gritty], [Texture: Clean], [Lo-fi], [Hi-fi], [Vintage], [Atmospheric]

═══════════════════════════════════════════════════════
🆕 РАСШИРЕННЫЙ СИНТАКСИС SUNO V5 (ПРОФЕССИОНАЛЬНЫЙ)
═══════════════════════════════════════════════════════

📌 СОСТАВНЫЕ ТЕГИ (для сложных секций):
[Verse 1 | Male Grit Vocal | Aggressive | 808 Bass]
[Chorus | Anthemic | Heavy Distortion | Stacked Harmonies]
Формула: [Структура | Вокал | Динамика | Инструменты]

📌 ИНСТРУМЕНТАЛЬНЫЕ СОЛО С ДЕСКРИПТОРАМИ:
[Instrumental Solo: Electric Guitar | Shredding | High Gain]
[Instrumental Break: Dark Synth | 8 bars | No Vocals]
Формула: [Instrumental Solo: Инструмент | Техника | Тембр]

📌 ТРАНСФОРМАЦИИ (смена внутри трека):
[Slow -> Fast] — ускорение темпа
[Soft -> Explosive] — нарастание к кульминации
[Sad -> Hopeful] — эмоциональный сдвиг

📌 СПЕЦИАЛЬНЫЕ ТЕГИ V5:
[Vocalist: Female Alto], [Vocalist: Male Tenor Raspy]
[Vocal Style: Smooth, Emotional, Breathy]
[Instrument Focus: Piano], [Tempo: Slow Building to Fast]
[Energy: Low to High], [Mood Shift: Sad to Hopeful]

═══════════════════════════════════════════════════════
✅ BEST PRACTICES (ОБЯЗАТЕЛЬНО СОБЛЮДАТЬ!)
═══════════════════════════════════════════════════════

1. 1-2 тега на секцию — не перегружай!
2. Порядок тегов: структура → вокал → динамика → инструменты → эффекты
   Пример: [Chorus] [Female Vocal] [Explosive] [Full Band] [!reverb]
3. ВСЕГДА добавляй [End] в конце — предотвращает обрывы!
4. Теги на отдельной строке перед блоком текста
5. Краткость: 1-3 слова в теге
6. Оптимум: 6-12 слогов на строку текста
7. Запятая/точка = микро-пауза для вдоха вокалиста

❌ АНТИПАТТЕРНЫ (ИЗБЕГАТЬ!):
- Конфликтующие теги: [Acapella] + [Full band], [Whisper] + [Shout], [Soft] + [Loud]
- Перегрузка: >3 тегов в строке
- Русские теги: [Куплет], [Припев] — ЗАПРЕЩЕНО!
- Отсутствие [End] — песня может зациклиться
- Теги в круглых скобках: (Verse 1) — использовать [Verse 1]
- Слишком длинные строки: >16 слогов трудно петь

═══════════════════════════════════════════════════════
🚫 ЗАПРЕЩЁННЫЕ КЛИШЕ (НИКОГДА НЕ ИСПОЛЬЗУЙ):
═══════════════════════════════════════════════════════
СЛОВА-ПАРАЗИТЫ: "навсегда", "никогда", "вечно", "всегда", "forever", "never", "always"
ИЗБИТЫЕ ФРАЗЫ: "танцевать до утра", "звёзды светят", "сердце бьётся", "глаза как звёзды", "любовь навеки"
ЧТО ДЕЛАТЬ ВМЕСТО: Используй конкретные, неожиданные образы. Метафоры вместо прямых описаний.

═══════════════════════════════════════════════════════
📊 СХЕМЫ РИФМОВКИ (ВЫБИРАЙ ОСОЗНАННО):
═══════════════════════════════════════════════════════
AABB (парные): Для энергичных, ритмичных треков (drill, hip-hop)
ABAB (перекрёстные): Для поп и баллад — создаёт напряжение-разрешение
AABCCB (сложные): Для сторителлинга — прогрессивное развитие
ABCABC: Для эпичных, нарастающих секций

═══════════════════════════════════════════════════════
🔤 АНАЛИЗ СЛОГОВ (КРИТИЧЕСКИ ВАЖНО!):
═══════════════════════════════════════════════════════
ПРАВИЛО: Каждая строка должна иметь 6-12 слогов
ПРОВЕРКА: Считай гласные (а, е, ё, и, о, у, ы, э, ю, я + a, e, i, o, u)
ДЛИННЫЕ СТРОКИ (>12): Разбей запятой или точкой — это создаёт естественные паузы для дыхания
СЛИШКОМ ДЛИННЫЕ (>16): ОБЯЗАТЕЛЬНО разбить на 2 строки

Пример подсчёта:
"В пыль-ном Ко Ка-е-о, где паль-мы и дым" = 11 слогов ✅
"Ба-нгко-кский флоу, но здесь мой тим" = 10 слогов ✅

═══════════════════════════════════════════════════════
💡 ПРОФЕССИОНАЛЬНЫЕ НЮАНСЫ
═══════════════════════════════════════════════════════

1. БЭК-ВОКАЛ — ТОЛЬКО В КРУГЛЫХ СКОБКАХ:
   ✅ (ooh, aah), (yeah, yeah!), (эхо), (harmony), (gang shouts: drill!)
   ✅ (тихо, шёпот), (Слышишь?! Эхо)
   ❌ [ooh aah] — это НЕ бэк-вокал, это тег!

2. КАПС = АКЦЕНТ И АГРЕССИЯ:
   ЭТО ГОРОД МАШИН! — будет спето с напором
   МЫ ЗДЕСЬ НЕ ОДНИ! — кульминация

3. ДЕФИСЫ = РАСПЕВ/ЛЕГАТО:
   ni-i-ight = затянутый слог
   so-o-o much = плавный распев

4. ТЕГИ ВСЕГДА НА АНГЛИЙСКОМ:
   ✅ [Verse 1], [Chorus], [Pre-Chorus], [Bridge], [Outro], [End]
   ❌ [Куплет], [Припев], [Бридж] — ЗАПРЕЩЕНО!

5. ПОРЯДОК ТЕГОВ:
   [Структура] [Вокал] [Динамика] [Инструменты] [Эффекты]
   Пример: [Chorus] [Male Grit Vocal] [Explosive] [808 Bass] [!distortion]

═══════════════════════════════════════════════════════
ПРИМЕР ИДЕАЛЬНОГО ФОРМАТИРОВАНИЯ:
═══════════════════════════════════════════════════════

[Intro] [Atmospheric] [Soft Piano]

[Verse 1] [Male Vocal] [Intimate]
Когда ты рядом, мир замирает
И время тает, как снег весной
(ooh, ooh)

[Pre-Chorus] [Build]
И я не знаю, куда бежать...

[Chorus] [Full Band] [Powerful]
Ты — моё солнце в ночи бескрайней
(harmony)
Любовь такая необычайна
(ooh, aah)

[Bridge] [Breakdown] [Whisper]
Тишина... между нами

[Outro] [Fade Out] [Soft]
(echo: солнце)
Ты — моё солнце...

[End]

${recommendedTags}
${customTagsSection}

⚠️ ТРЕБОВАНИЯ К НАЗВАНИЮ ТРЕКА:
- 2-5 слов, отражает ТЕМУ песни
- НИКОГДА не используй первую строку текста
- НЕ должно содержать теги!

Язык текста: ${language === 'ru' ? 'русский' : 'английский'}`;

    let systemPrompt = baseSystemPrompt;
    let userPrompt = '';

    switch (action) {
      case 'generate':
      case 'smart_generate':
        userPrompt = `Создай профессиональный текст песни с продуманным использованием тегов.

ЗАДАНИЕ:
- Тема: "${theme || 'любовь и надежда'}"
- Жанр: ${genre || 'поп'}
- Настроение: ${mood || 'вдохновляющее'}
- Структура: ${structure || 'Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus, Outro'}

ТРЕБОВАНИЯ К КАЧЕСТВУ:
1. ✅ Каждая секция начинается со структурного тега [...]
2. ✅ Добавь вокальные указания (...) для передачи эмоций
3. ✅ Используй [Build] перед припевами для нарастания
4. ✅ Добавь [Breakdown] или [Bridge] для контраста
5. ✅ Рифмы: перекрёстные (ABAB) или парные (AABB)
6. ✅ Метафоры и образность вместо прямых описаний
7. ✅ Ритмичный текст, удобный для пения
8. ✅ Финальный припев усиль с помощью (powerful) или [Climax]

${useAdvancedTags ? `
ОБЯЗАТЕЛЬНО ИСПОЛЬЗОВАТЬ ЭТИ ТЕГИ:
${vocalTags?.length ? `Вокальные: ${vocalTags.map(t => `(${t})`).join(', ')}` : ''}
${instrumentTags?.length ? `Инструментальные: ${instrumentTags.map(t => `[${t}]`).join(', ')}` : ''}
${dynamicTags?.length ? `Динамические: ${dynamicTags.map(t => `[${t}]`).join(', ')}` : ''}
${emotionalCues?.length ? `Эмоциональные: ${emotionalCues.map(t => `(${t})`).join(', ')}` : ''}
` : ''}

ФОРМАТ ОТВЕТА (строго JSON):
{
  "title": "Название песни (2-5 слов, отражает тему)",
  "style": "Стиль-промпт для Suno (${genre}, ${mood}, инструменты, до 120 символов)",
  "lyrics": "ПОЛНЫЙ текст песни с правильными тегами Suno V5"
}

ВАЖНО: Верни ТОЛЬКО валидный JSON, без дополнительного текста до или после.`;
        break;

      case 'improve':
        userPrompt = `Улучши текст песни, добавив профессиональные теги:

ИСХОДНЫЙ ТЕКСТ:
${existingLyrics || lyrics}

ЗАДАЧИ:
1. Проверь и добавь структурные теги [...] для каждой секции
2. Добавь вокальные указания (...) для эмоциональных моментов
3. Вставь динамические маркеры [Build], [Drop], [Breakdown]
4. Улучши рифмы если нужно
5. Добавь инструментальные указания где уместно
6. Сделай текст более поэтичным

ФОРМАТ ОТВЕТА (строго JSON):
{
  "title": "Название песни (из текста или создай подходящее)",
  "style": "Стиль-промпт для Suno (жанр, настроение, инструменты)",
  "lyrics": "УЛУЧШЕННЫЙ текст с правильными тегами Suno V5",
  "changes": "Краткое описание сделанных улучшений"
}

ВАЖНО: Верни ТОЛЬКО валидный JSON.`;
        break;

      case 'add_tags':
        userPrompt = `Добавь профессиональные теги Suno к тексту:

ТЕКСТ:
${existingLyrics || lyrics}

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'романтичное'}

ЗАДАЧИ:
1. Определи секции и добавь структурные теги [Verse], [Chorus], [Bridge], etc.
2. Добавь вокальные указания: (softly), (powerfully), (with emotion), etc.
3. Вставь динамические теги [Build], [Drop], [Breakdown] перед ключевыми моментами
4. Добавь инструментальные указания [Guitar Solo], [Piano Break] если уместно
5. Используй рекомендованные теги для жанра ${genre}

ФОРМАТ ОТВЕТА (строго JSON):
{
  "title": "Название песни (определи из текста или создай)",
  "style": "Стиль для Suno: ${genre}, ${mood}, характерные инструменты",
  "lyrics": "Текст с ПОЛНЫМ набором профессиональных тегов Suno V5",
  "tagsSummary": {
    "structural": ["список использованных структурных тегов"],
    "vocal": ["список вокальных указаний"],
    "dynamic": ["список динамических тегов"],
    "instrumental": ["список инструментальных тегов"]
  }
}

ВАЖНО: Верни ТОЛЬКО валидный JSON.`;
        break;

      case 'suggest_structure':
        userPrompt = `Предложи оптимальную структуру песни:

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'энергичное'}
${theme ? `ТЕМА: ${theme}` : ''}

Верни структуру с описанием каждой секции:

[Intro]
Описание: инструментальное вступление
Рекомендуемые теги: [Soft Piano], [Atmospheric]

[Verse 1]
Описание: введение в историю
Рекомендуемые теги: (intimate), (storytelling)

...и так далее`;
        break;

      case 'generate_section':
        systemPrompt = baseSystemPrompt + `\n\nТы пишешь одну конкретную секцию песни с профессиональными тегами.`;
        userPrompt = `Напиши секцию "${sectionName}" (тип: ${sectionType}) для песни.

КОНТЕКСТ:
- Тема: "${theme || 'любовь'}"
- Жанр: ${genre || 'поп'}
- Настроение: ${mood || 'романтичное'}
- Количество строк: ${linesCount || 4}

${previousLyrics ? `ПРЕДЫДУЩИЕ СЕКЦИИ:\n${previousLyrics}\n` : ''}

ТРЕБОВАНИЯ:
1. НЕ добавляй тег секции (только контент)
2. Добавь вокальные указания (...) где уместно
3. Используй рифмы
4. Продолжай историю логически
5. Если это Pre-Chorus - добавь ощущение нарастания
6. Если это Chorus - сделай запоминающимся

Верни ТОЛЬКО текст секции (${linesCount || 4} строк).`;
        break;

      case 'continue_line':
        systemPrompt = baseSystemPrompt + `\n\nТы помогаешь в режиме коллаборации.`;
        userPrompt = `Предложи следующую строку для секции ${sectionType || 'verse'}.

ТЕКУЩИЙ ТЕКСТ:
${currentLyrics}

ТЕМА: ${theme || 'любовь'}
ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'романтичное'}

ТРЕБОВАНИЯ:
- Одна строка, продолжающая текст
- Рифма с предыдущей строкой
- Сохраняй ритм
- Можно добавить (указание) если усилит эмоцию

Верни ТОЛЬКО одну строку.`;
        break;

      case 'suggest_rhymes':
        systemPrompt = `Ты эксперт по рифмам на ${language === 'ru' ? 'русском' : 'английском'} языке.`;
        userPrompt = `Предложи рифмы к слову "${word}".

${context ? `КОНТЕКСТ:\n${context}\n` : ''}

Требования:
- 8-12 разнообразных рифм
- Точные рифмы (совпадение окончаний)
- Ассонансные рифмы (совпадение гласных)
- Рифмы подходящие для песенного текста

Формат ответа:
ТОЧНЫЕ: рифма1, рифма2, рифма3
АССОНАНСНЫЕ: рифма1, рифма2, рифма3
СОСТАВНЫЕ: фраза1, фраза2`;
        break;

      case 'analyze_lyrics':
        systemPrompt = baseSystemPrompt + `\n\nТы анализируешь текст и даёшь профессиональные рекомендации.`;
        userPrompt = `Проанализируй текст песни и предложи улучшения:

ТЕКСТ:
${lyrics || existingLyrics}

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'неизвестно'}

Верни анализ в формате:

📊 АНАЛИЗ СТРУКТУРЫ:
- Найденные секции: ...
- Рекомендации: ...

🎤 ВОКАЛЬНЫЕ РЕКОМЕНДАЦИИ:
- Текущие теги: ...
- Добавить: (тег1) для строки X, (тег2) для строки Y

🎸 ИНСТРУМЕНТАЛЬНЫЕ РЕКОМЕНДАЦИИ:
- Добавить: [Guitar Solo] после припева, [Piano Break] в бридже

🌊 ДИНАМИЧЕСКИЕ РЕКОМЕНДАЦИИ:
- Добавить [Build] перед: ...
- Добавить [Drop] после: ...

💫 ОБЩИЕ УЛУЧШЕНИЯ:
- Рифмы: ...
- Метафоры: ...
- Ритм: ...`;
        break;

      case 'optimize_for_suno':
        systemPrompt = baseSystemPrompt + `\n\nТы оптимизируешь текст для максимального качества генерации в Suno AI.`;
        userPrompt = `Оптимизируй текст для Suno AI:

ТЕКСТ:
${lyrics || existingLyrics}

ЖАНР: ${genre || 'поп'}

ЗАДАЧИ ОПТИМИЗАЦИИ:
1. ✅ Убедись что текст < 3000 символов (обрежь если нужно)
2. ✅ Проверь все структурные теги (каждая секция должна иметь [...])
3. ✅ Добавь/улучши вокальные указания для ключевых моментов
4. ✅ Удали лишние символы и эмодзи
5. ✅ Убедись что [Build] стоит перед припевами
6. ✅ Добавь [Outro] в конце если нет
7. ✅ Замени сложные слова на более музыкальные
8. ✅ Проверь рифмы на благозвучность

Верни оптимизированный текст готовый для генерации.`;
        break;

      case 'context_recommendations':
        // Get AI recommendations based on project/track context
        const recContext = body.context || {};
        const recProject = recContext.projectContext;
        const recTrack = recContext.trackContext;
        
        systemPrompt = `Ты музыкальный продюсер и автор песен, дающий персонализированные рекомендации для создания текстов.
        
ВАЖНО: Учитывай позицию трека в альбоме и его роль в общей концепции проекта.`;
        
        userPrompt = `Дай 5-7 креативных и КОНКРЕТНЫХ рекомендаций для написания текста песни.

КОНТЕКСТ ПРОЕКТА:
${recProject ? `
- Название проекта: ${recProject.title}
- Тип: ${recProject.projectType || 'альбом'}
- Жанр: ${recProject.genre || 'не указан'}
- Настроение: ${recProject.mood || 'не указано'}
- Концепция/тема: ${recProject.concept || 'не указана'}
- Целевая аудитория: ${recProject.targetAudience || 'не указана'}
- Всего треков в проекте: ${recProject.existingTracks?.length || 0}
- Треки: ${recProject.existingTracks?.map((t: any, i: number) => `${i+1}. "${t.title}" ${t.generatedLyrics ? '(есть текст)' : t.draftLyrics ? '(черновик)' : '(нет текста)'}`).join(', ') || 'нет'}
` : 'Контекст проекта не указан'}

${recTrack ? `
ТЕКУЩИЙ ТРЕК (для которого пишем):
- Название: "${recTrack.title}"
- Позиция в альбоме: ${recTrack.position} из ${recProject?.existingTracks?.length || '?'}
- Стиль/промпт: ${recTrack.stylePrompt || 'не указан'}
- Рекомендуемые теги: ${recTrack.recommendedTags?.join(', ') || 'не заданы'}
- Рекомендуемая структура: ${recTrack.recommendedStructure || 'не задана'}
- Заметки/идеи от AI: ${recTrack.notes || 'нет'}
- Текущий статус лирики: ${recTrack.lyricsStatus || 'не начато'}
` : ''}

ТЕКУЩИЙ ЧЕРНОВИК (если есть):
${recContext.currentLyrics || recTrack?.lyrics || 'Текст ещё не создан'}

ЗАДАЧА: Предложи конкретные рекомендации учитывая:
1. Позицию трека (интро должно вводить, финал - завершать историю)
2. Жанровые особенности (рок требует энергии, баллада - эмоций)
3. Связность с другими треками проекта (не повторять темы)
4. Эмоциональную арку альбома
5. Заметки от AI-планировщика если есть

Верни JSON массив рекомендаций:
[
  {"type": "theme", "label": "🎵 Краткое название", "value": "конкретная тема для текста", "description": "Почему это подойдёт для этого трека"},
  {"type": "emotion", "label": "💫 Эмоция", "value": "эмоциональный фокус", "description": "Как это вписывается в альбом"},
  {"type": "structure", "label": "📝 Структура", "value": "предложение по структуре", "description": "Почему такая структура"},
  {"type": "tag", "label": "🏷️ Тег", "value": "тег Suno", "description": "Когда использовать"},
  ...
]

Будь КОНКРЕТНЫМ - не "напиши о любви", а "напиши о первой встрече после долгой разлуки, контрастируя с предыдущим треком об одиночестве"`;
        break;

      case 'generate_compound_tags':
        systemPrompt = `Ты эксперт по тегам Suno AI V4.5+ и составным (compound) тегам.`;
        userPrompt = `Сгенерируй оптимальные составные теги для секций песни.

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'романтичное'}
${theme ? `ТЕМА: ${theme}` : ''}

${lyrics ? `ТЕКСТ:\n${lyrics}\n` : ''}

Для каждой типичной секции песни создай оптимальные составные теги:

Формат ответа (JSON):
{
  "intro": "[Intro] [тег1] [тег2]",
  "verse": "[Verse] [тег1] [тег2] [тег3]",
  "preChorus": "[Pre-Chorus] [тег1] [тег2]",
  "chorus": "[Chorus] [тег1] [тег2] [тег3]",
  "bridge": "[Bridge] [тег1] [тег2]",
  "outro": "[Outro] [тег1] [тег2]",
  "vocalDirections": ["(направление1)", "(направление2)"],
  "backingVocals": ["(ooh, aah)", "(harmony)"],
  "dynamics": ["[Build]", "[Drop]", "[Breakdown]"]
}

Учитывай жанр ${genre} и настроение ${mood}.`;
        break;

      case 'analyze_rhythm':
        systemPrompt = `Ты эксперт по ритмике и просодии песенных текстов.`;
        userPrompt = `Проанализируй ритмическую структуру текста:

ТЕКСТ:
${lyrics || existingLyrics}

Проведи анализ:
1. Количество слогов в каждой строке
2. Схема ударений (сильные/слабые доли)
3. Соответствие типичным песенным ритмам
4. Проблемные места (слишком длинные/короткие строки)
5. Рекомендации по улучшению

Формат ответа (JSON):
{
  "analysis": [
    {"line": "текст строки", "syllables": 8, "stress": "да-ДА-да-ДА-да-ДА-да-ДА", "ok": true},
    ...
  ],
  "issues": ["Строка 3 слишком длинная (12 слогов)", ...],
  "recommendations": ["Сократить строку 3 до 8 слогов", ...],
  "overallScore": 85
}`;
        break;

      case 'fit_structure':
        systemPrompt = baseSystemPrompt + `\n\nТы адаптируешь текст под заданную структуру песни.`;
        userPrompt = `Подгони текст под структуру песни:

ИСХОДНЫЙ ТЕКСТ:
${lyrics || existingLyrics}

ЦЕЛЕВАЯ СТРУКТУРА: ${structure || 'Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus, Outro'}

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'романтичное'}

ЗАДАЧИ:
1. Распределить/переписать текст по заданным секциям
2. Добавить составные теги V4.5+ к каждой секции
3. Добавить вокальные направляющие
4. Добавить бэк-вокальные партии где уместно
5. Убедиться что припевы повторяются (можно с вариациями)
6. Добавить динамические переходы [Build], [Drop]

Верни полный отформатированный текст.`;
        break;

      case 'full_analysis':
        systemPrompt = `ТЫ — профессиональный музыкальный аналитик, музыковед и литературный исследователь.

ПРИНЦИПЫ: Глубина > объём. Музыка и текст = единая система. Нарративное мышление. Аналитическая честность.

Верни ТОЛЬКО валидный JSON объект (без markdown):
{
  "meaning": { 
    "theme": "тема 2-5 слов", 
    "emotions": ["эмоция1", "эмоция2"], 
    "narrative": { "start": "начало истории", "conflict": "конфликт", "climax": "кульминация", "resolution": "разрешение" },
    "issues": ["проблема"], 
    "score": 85 
  },
  "rhythm": { "pattern": "ритмический рисунок", "issues": [], "score": 80 },
  "rhymes": { "scheme": "AABB/ABAB", "weakRhymes": ["слабая пара"], "score": 75 },
  "structure": { "tags": ["Verse", "Chorus"], "issues": [], "score": 90 },
  "overallScore": 82,
  "recommendations": [
    { "type": "rhythm", "text": "Конкретная рекомендация", "priority": "high" },
    { "type": "rhyme", "text": "Улучшить рифму", "priority": "medium" }
  ],
  "quickActions": [
    { "label": "🎯 Усилить метафоры", "action": "Добавь яркие метафоры в куплеты" },
    { "label": "🔧 Исправить ритм", "action": "Выровняй слоги в строках" }
  ]
}`;
        userPrompt = `ТЕКСТ ПЕСНИ:\n${body.existingLyrics || body.lyrics || body.sectionContent || ''}\n\n${body.title ? `НАЗВАНИЕ: ${body.title}` : ''}${body.genre ? `\nЖАНР: ${body.genre}` : ''}${body.mood ? `\nНАСТРОЕНИЕ: ${body.mood}` : ''}\n\nПроведи анализ. Оцени 0-100.`;
        break;

      case 'deep_analysis':
        systemPrompt = `ТЫ — профессиональный музыкальный аналитик, музыковед, продюсер и литературный исследователь.

════════════════════════════════════════════════════════
ПРИНЦИПЫ АНАЛИЗА
════════════════════════════════════════════════════════
1. ГЛУБИНА > ОБЪЁМ — каждый пункт должен давать ИНСАЙТ, а не повторять очевидное
2. МУЗЫКА И ТЕКСТ = ЕДИНАЯ СИСТЕМА — связывай гармонию с эмоцией, структуру с напряжением
3. НАРРАТИВНОЕ МЫШЛЕНИЕ — рассматривай песню как историю с началом, конфликтом, кульминацией
4. АНАЛИТИЧЕСКАЯ ЧЕСТНОСТЬ — не романтизируй, указывай ПОЧЕМУ элемент работает

════════════════════════════════════════════════════════
ФИНАЛЬНЫЕ ВЫВОДЫ (ОБЯЗАТЕЛЬНЫ)
════════════════════════════════════════════════════════
- Краткое резюме (3-5 предложений)
- 2-3 ключевых вывода (keyInsights)
- Ответ: «В чём уникальная сила этого текста?» (uniqueStrength)

Верни ТОЛЬКО валидный JSON объект (без markdown):
{
  "meaning": { 
    "theme": "тема 2-5 слов", 
    "emotions": ["эмоция1", "эмоция2", "эмоция3"], 
    "narrative": { 
      "start": "откуда начинается история", 
      "conflict": "где нарастает конфликт", 
      "climax": "где кульминация", 
      "resolution": "чем заканчивается" 
    },
    "issues": ["проблема со смыслом"], 
    "score": 85 
  },
  "rhythm": { "pattern": "ритмический рисунок", "issues": [], "score": 80 },
  "rhymes": { "scheme": "AABB/ABAB", "weakRhymes": ["слабая пара"], "score": 75 },
  "structure": { "tags": ["Verse", "Chorus"], "issues": [], "score": 90 },
  "technicalLyrics": { 
    "figurativeDevices": ["метафора 1", "метафора 2"], 
    "phonetics": "аллитерации и ассонансы", 
    "wordChoice": "оценка выбора слов" 
  },
  "cultural": { 
    "influences": ["музыкальные влияния"], 
    "era": "эпоха/стиль", 
    "references": ["культурные отсылки"] 
  },
  "overallScore": 82,
  "keyInsights": [
    "Главный инсайт — ПОЧЕМУ это работает",
    "Что делает текст уникальным",
    "Неочевидная связь элементов"
  ],
  "uniqueStrength": "В чём уникальная сила этого текста — 1-2 предложения",
  "recommendations": [
    { "type": "meaning", "text": "Конкретная рекомендация", "priority": "high" },
    { "type": "rhythm", "text": "Улучшение ритма", "priority": "medium" },
    { "type": "structure", "text": "Улучшение структуры", "priority": "low" }
  ],
  "quickActions": [
    { "label": "🎯 Главное действие", "action": "Конкретное улучшение" },
    { "label": "🔧 Техническое", "action": "Техническая правка" },
    { "label": "✨ Творческое", "action": "Творческое улучшение" }
  ]
}`;
        userPrompt = `ТЕКСТ ПЕСНИ:\n${body.existingLyrics || body.lyrics || body.sectionContent || ''}\n\n${body.title ? `НАЗВАНИЕ: ${body.title}` : ''}${body.genre ? `\nЖАНР: ${body.genre}` : ''}${body.mood ? `\nНАСТРОЕНИЕ: ${body.mood}` : ''}\n\nПроведи ГЛУБОКИЙ МУЗЫКОВЕДЧЕСКИЙ анализ. Найди нарративную арку. Оцени технику текста. Определи культурные влияния. Сформулируй ключевые выводы и уникальную силу текста.`;
        break;

      case 'producer_review':
        systemPrompt = `Ты опытный музыкальный продюсер с 20-летним стажем. Проведи ПРОФЕССИОНАЛЬНЫЙ разбор как для коммерческого релиза.

ПРИНЦИПЫ: Коммерческий взгляд (стриминги, радио, вирусность). Ищи ХУКИ. Вокальная продакшен-карта. Динамика и аранжировка.

Верни ТОЛЬКО валидный JSON (без markdown):
{
  "commercialScore": 75,
  "summary": "Краткое резюме — главные выводы в 2-3 предложения",
  "strengths": ["Сильная сторона 1", "Сильная сторона 2"],
  "weaknesses": ["Слабость 1"],
  "hooks": { "current": "Оценка хуков", "bestLine": "Самая сильная строка", "suggestions": ["Хук 1", "Хук 2"] },
  "vocalMap": [
    { "section": "Verse 1", "effects": ["[Soft]", "(breathy)"], "note": "Интимное начало" },
    { "section": "Chorus", "effects": ["[Powerful]", "(harmony)"], "note": "Бэк-вокал" }
  ],
  "arrangement": { "add": ["[Strings]", "[Build]"], "remove": [], "dynamics": ["[Build] перед припевом"] },
  "stylePrompt": "emotional indie pop, dreamy synths, female vocal, building chorus",
  "genreTags": ["Indie Pop", "Dream Pop"],
  "suggestedTags": ["[Female Vocal]", "[Atmospheric]", "[Build]"],
  "topRecommendations": [
    { "priority": 1, "text": "Усилить припев бэк-вокалом (harmony)" },
    { "priority": 2, "text": "Добавить [Drop] после бриджа" }
  ],
  "quickActions": [
    { "label": "✨ Применить рекомендации", "action": "Примени топ рекомендации к тексту" },
    { "label": "🎤 Добавить бэки", "action": "Добавь бэк-вокалы в припевы" },
    { "label": "🎯 Усилить хуки", "action": "Сделай припев более запоминающимся" }
  ]
}`;
        const prodTags = body.globalTags ? body.globalTags.join(', ') : '';
        userPrompt = `ТЕКСТ:\n${body.existingLyrics || body.lyrics || ''}\n\n${body.title ? `НАЗВАНИЕ: ${body.title}` : ''}${body.stylePrompt ? `\nSTYLE: ${body.stylePrompt}` : ''}${body.genre ? `\nЖАНР: ${body.genre}` : ''}${prodTags ? `\nТЕГИ: ${prodTags}` : ''}\n\nПроведи продюсерский разбор. Оцени коммерческий потенциал. Предложи хуки, вокальную карту, style prompt для Suno.`;
        break;

      case 'chat':
        // Build rich context from provided data
        const chatContext = body.context || {};
        const projectInfo = chatContext.projectContext;
        const trackInfo = chatContext.trackContext;
        const conversationHistory = chatContext.conversationHistory || [];
        const userTheme = chatContext.theme;
        const userGenre = chatContext.genre;
        const userMood = chatContext.mood;

        systemPrompt = `Ты опытный автор песен и музыкальный продюсер, работающий как ассистент в чате.
Твоя задача - помочь создать текст песни, который ИДЕАЛЬНО вписывается в контекст проекта.

═══════════════════════════════════════════════════════
КОНТЕКСТ ПРОЕКТА (учитывай для связности альбома):
═══════════════════════════════════════════════════════
${projectInfo ? `
📀 Проект: "${projectInfo.title}"
🎵 Тип: ${projectInfo.projectType || 'альбом'}
🎸 Жанр: ${projectInfo.genre || 'не указан'}
💫 Настроение: ${projectInfo.mood || 'не указано'}
📖 Концепция: ${projectInfo.concept || 'не указана'}
👥 Целевая аудитория: ${projectInfo.targetAudience || 'не указана'}
🎼 Треков в проекте: ${projectInfo.existingTracks?.length || 0}

ДРУГИЕ ТРЕКИ ПРОЕКТА (для связности):
${projectInfo.existingTracks?.map((t: any, i: number) =>
  `${i+1}. "${t.title}" - ${t.generatedLyrics ? 'готов' : t.draftLyrics ? 'черновик' : 'нет текста'}${t.stylePrompt ? ` [${t.stylePrompt.slice(0, 50)}...]` : ''}`
).join('\n') || 'Пусто'}
` : 'Контекст проекта не задан - работаем как отдельный трек'}

${trackInfo ? `
═══════════════════════════════════════════════════════
ТЕКУЩИЙ ТРЕК (над которым работаем):
═══════════════════════════════════════════════════════
🎵 Название: "${trackInfo.title}"
📍 Позиция: ${trackInfo.position}${projectInfo?.existingTracks?.length ? ` из ${projectInfo.existingTracks.length}` : ''}
🎨 Стиль: ${trackInfo.stylePrompt || 'не указан'}
🏷️ Рекомендуемые теги: ${trackInfo.recommendedTags?.join(', ') || 'не заданы'}
📝 Рекомендуемая структура: ${trackInfo.recommendedStructure || 'стандартная'}

💡 ЗАМЕТКИ ОТ AI-ПЛАНИРОВЩИКА (ВАЖНО - учитывай эти подсказки!):
${trackInfo.notes || 'Нет заметок'}

📄 Статус лирики: ${trackInfo.lyricsStatus || 'не начато'}
` : ''}

ТЕКУЩИЙ ТЕКСТ ПЕСНИ:
${chatContext.currentLyrics || trackInfo?.lyrics || chatContext.existingLyrics || 'Текст ещё не создан'}

${chatContext.stylePrompt ? `STYLE PROMPT: ${chatContext.stylePrompt}` : ''}
${chatContext.allSectionNotes ? `ЗАМЕТКИ СЕКЦИЙ: ${JSON.stringify(chatContext.allSectionNotes)}` : ''}

${userTheme || userGenre || userMood ? `
═══════════════════════════════════════════════════════
ПОЛЬЗОВАТЕЛЬСКИЕ ПАРАМЕТРЫ (используй их ОБЯЗАТЕЛЬНО):
═══════════════════════════════════════════════════════
${userTheme ? `🎭 Тема: ${userTheme}` : ''}
${userGenre ? `🎸 Жанр: ${userGenre}` : ''}
${userMood ? `💫 Настроение: ${userMood}` : ''}
` : ''}

ИСТОРИЯ ДИАЛОГА (последние 10 сообщений):
${conversationHistory.slice(-10).map((m: any) => `${m.role === 'user' ? '👤 Пользователь' : '🤖 Ассистент'}: ${m.content}`).join('\n') || 'Начало диалога'}

═══════════════════════════════════════════════════════
ИНСТРУКЦИИ:
═══════════════════════════════════════════════════════
1. Если пользователь просит создать/написать текст - сразу генерируй с тегами Suno
2. Если просит улучшить/изменить - модифицируй существующий текст
3. Если задаёт вопрос - отвечай и предлагай конкретные действия

ФОРМАТ ОТВЕТА (JSON):
{
  "lyrics": "текст песни с тегами (если генерируешь)",
  "title": "название (если новый текст)",
  "style": "style prompt для Suno",
  "response": "текстовый ответ пользователю",
  "suggestions": [{"label": "🎵 Действие", "value": "команда", "action": "freeform"}],
  "quickActions": [{"label": "⚡ Быстрое действие", "action": "команда для AI"}]
}

Язык текста: ${language === 'ru' ? 'русский' : 'английский'}`;

        userPrompt = body.message || 'Привет';
        break;

      case 'style_convert':
        systemPrompt = `Ты эксперт по музыкальным стилям и мастер адаптации текстов под разные жанры и артистов.
        
ВАЖНО: Сохраняй основной смысл и эмоции текста, но адаптируй:
- Словарный запас и сленг
- Ритмические паттерны  
- Структуру строф
- Характерные для стиля приёмы`;
        userPrompt = `Перепиши текст в стиле "${body.targetStyle || 'рэп'}":

ИСХОДНЫЙ ТЕКСТ:
${lyrics || existingLyrics}

ЦЕЛЕВОЙ СТИЛЬ: ${body.targetStyle || 'рэп'}

ТРЕБОВАНИЯ:
1. Сохрани основную тему и эмоции
2. Адаптируй под характерные черты стиля
3. Измени ритм если нужно для нового стиля
4. Добавь соответствующие теги Suno
5. Сохрани длину примерно такой же

Верни JSON:
{
  "lyrics": "переписанный текст с тегами",
  "style": "style prompt для Suno",
  "changes": ["что изменилось 1", "что изменилось 2"],
  "originalStyle": "определённый стиль оригинала"
}`;
        break;

      case 'paraphrase':
        systemPrompt = `Ты мастер русского/английского языка и поэт, создающий вариации текстов с разными оттенками.`;
        userPrompt = `Перефразируй текст с тоном "${body.targetTone || 'более поэтично'}":

ТЕКСТ:
${lyrics || existingLyrics}

ЦЕЛЕВОЙ ТОН: ${body.targetTone || 'более поэтично'}
КОЛИЧЕСТВО ВАРИАНТОВ: ${body.variantsCount || 3}

ВАРИАНТЫ ТОНА:
- "поэтичнее" = больше метафор, образности
- "проще" = разговорный язык, прямота
- "агрессивнее" = резче, энергичнее
- "нежнее" = мягче, интимнее
- "драматичнее" = больше контрастов, эмоций

Верни JSON:
{
  "variants": [
    {"text": "вариант 1", "tone": "описание тона", "highlight": "что изменилось"},
    {"text": "вариант 2", "tone": "описание тона", "highlight": "что изменилось"},
    ...
  ],
  "original": "исходный текст"
}`;
        break;

      case 'hook_generator':
        systemPrompt = `Ты хит-мейкер, специализирующийся на создании запоминающихся хуков и припевов.
        
ПРИНЦИПЫ ХУКА:
- Краткость (1-2 строки)
- Повторяемость
- Мелодичность
- Эмоциональный резонанс
- Универсальность (легко подпевать)`;
        userPrompt = `Проанализируй и улучши хуки в тексте:

ТЕКСТ:
${lyrics || existingLyrics}

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'энергичное'}
ТЕМА: ${theme || 'любовь'}

ЗАДАЧИ:
1. Найди существующие хуки (если есть)
2. Оцени их силу (1-10)
3. Предложи 5 новых вариантов хуков
4. Укажи где их лучше разместить

Верни JSON:
{
  "currentHooks": [
    {"text": "хук из текста", "location": "Chorus", "score": 7, "issue": "проблема или null"}
  ],
  "suggestedHooks": [
    {"text": "новый хук", "style": "melodic/rhythmic/call-response", "bestFor": "Chorus/Hook/Pre-Chorus"},
    ...
  ],
  "hookScore": 75,
  "recommendations": ["рекомендация 1", "рекомендация 2"]
}`;
        break;

      case 'vocal_map':
        systemPrompt = `Ты вокальный продюсер и аранжировщик с опытом работы в студии.
        
Создай детальную карту вокальной записи с указанием:
- Вокальных эффектов для каждой секции
- Бэк-вокалов и гармоний
- Динамических изменений
- Эмоциональных заметок для исполнителя`;
        userPrompt = `Создай вокальную карту для текста:

ТЕКСТ:
${lyrics || existingLyrics}

ЖАНР: ${genre || 'поп'}
НАСТРОЕНИЕ: ${mood || 'эмоциональное'}

Для каждой секции укажи:
1. Тип вокала (шёпот, мощный, фальцет и т.д.)
2. Эффекты обработки
3. Бэк-вокалы
4. Динамику (тихо→громко и т.д.)
5. Эмоциональные указания

Верни JSON:
{
  "sections": [
    {
      "name": "Verse 1",
      "vocalType": "intimate, breathy",
      "effects": ["[Soft]", "[Whisper]"],
      "backingVocals": "(ooh)",
      "dynamics": "quiet, building",
      "emotionalNote": "уязвимость, размышление",
      "sunoTags": "[Male Vocal] [Intimate] [Soft]"
    },
    ...
  ],
  "generalNotes": "общие указания по вокалу",
  "suggestedSingerType": "Female/Male, Alto/Tenor и т.д."
}`;
        break;

      case 'translate_adapt':
        const targetLang = body.targetLanguage || 'en';
        const preserveSyl = body.preserveSyllables !== false;
        systemPrompt = `Ты профессиональный переводчик песенных текстов, сохраняющий ритмику и смысл.

ВАЖНО: Это НЕ дословный перевод, а адаптация для пения:
- ${preserveSyl ? 'СТРОГО сохраняй количество слогов' : 'Допустимы небольшие отклонения по слогам'}
- Сохраняй рифмы
- Сохраняй эмоции и образы
- Текст должен быть естественным на целевом языке`;
        userPrompt = `Переведи и адаптируй текст на ${targetLang === 'en' ? 'английский' : 'русский'}:

ТЕКСТ:
${lyrics || existingLyrics}

ЦЕЛЕВОЙ ЯЗЫК: ${targetLang === 'en' ? 'Английский' : 'Русский'}
СОХРАНЯТЬ СЛОГИ: ${preserveSyl ? 'Да, строго' : 'Приблизительно'}

ТРЕБОВАНИЯ:
1. Каждая строка должна иметь примерно такое же количество слогов
2. Сохрани рифменную схему
3. Адаптируй идиомы и метафоры для культуры целевого языка
4. Сохрани эмоциональный тон

Верни JSON:
{
  "translatedLyrics": "переведённый текст с тегами",
  "adaptationNotes": [
    {"original": "оригинал", "translated": "перевод", "syllables": "8→8", "note": "изменение смысла"}
  ],
  "preservedElements": ["рифмы", "ритм", "образы"],
  "changedElements": ["идиома X → Y"],
  "qualityScore": 85
}`;
        break;

      case 'drill_prompt_builder':
        systemPrompt = `Ты эксперт по UK Drill, US Drill, Trap и aggressive Hip-Hop. Создаёшь профессиональные промпты уровня коммерческих релизов.

═══════════════════════════════════════════════════════
🔥 ОБЯЗАТЕЛЬНЫЕ ЭЛЕМЕНТЫ DRILL
═══════════════════════════════════════════════════════

1. РИТМ И БПМ:
   - UK Drill: 140-145 BPM, triplet hi-hats
   - US Drill: 140-150 BPM, sliding 808
   - Chi-Town Drill: 60-70 BPM (half-time feel)

2. ИНСТРУМЕНТЫ:
   - [808 Bass] или [808 Slides] — ОБЯЗАТЕЛЬНО
   - [Rapid Hi-Hats] с ghost notes
   - [Drill Glockenspiel] или [Dark Piano] — характерные мелодии
   - [Trap Snare] с реверберацией
   - [Dark Synth] для атмосферы

3. ВОКАЛ:
   - [Male Grit Rap] или [Aggressive Delivery]
   - [Street Flow] или [UK Flow]
   - Autotune опционально для мелодичных частей

4. БЭК-ВОКАЛ И AD-LIBS:
   - (gang gang!), (drill!), (yuh!), (skrrt!), (bow!)
   - (gang shouts: Phuket drill! x2)
   - (Слышишь?! Эхо)

5. ДИНАМИКА:
   - [!build_up] перед припевом
   - [Explosive Drop] на chorus
   - [Heavy Distortion] для агрессии

═══════════════════════════════════════════════════════
📐 СТРУКТУРА DRILL ТРЕКА
═══════════════════════════════════════════════════════

[Intro | Dark Synth | !fade_in | Distant Sirens]
(Эй... тихо, эхо)

[Verse 1 | Male Grit Rap | 808 Bass | Rapid Hi-Hats | Aggressive Delivery]
4-8 строк, 6-10 слогов на строку
(Бэк-вокал: gang gang!)

[Pre-Chorus | !crescendo | Distorted 808 Slides]
2-4 строки, рост напряжения

[Chorus | Explosive Drop | Anthemic | Heavy Distortion | Stacked Harmonies]
КАПС для акцентов
(Massive ad-libs: yuh, yuh!)

[Verse 2 | Faster Pace | Trap Snare Rolls]
Ускорение, больше слогов

[Bridge | Instrumental Break: Dark Synth | 8 bars | No Vocals]
или [Instrumental Solo: 808 Lead | Shredding]

[Final Chorus | !double_volume | Epic Layering]
Усиленная версия с хором

[Outro | !fade_out | Reverb Echo]
(Эхо уходит...)
[End]

═══════════════════════════════════════════════════════
⚠️ ПРАВИЛА DRILL ТЕКСТА
═══════════════════════════════════════════════════════

1. КАПС = АГРЕССИЯ: ЭТО ГОРОД МАШИН! МЫ ЗДЕСЬ НЕ ОДНИ!
2. Короткие строки: 6-10 слогов
3. Street slang допустим
4. Многослойные ad-libs в скобках
5. Трансформации: [Slow -> Fast], [Soft -> Explosive]

Язык текста: ${language === 'ru' ? 'русский' : 'английский'}`;

        userPrompt = `Создай ПРОФЕССИОНАЛЬНЫЙ Drill/Trap промпт:

ТЕМА: ${theme || 'уличная жизнь, ночной город, неоновые огни'}
ПОДСТИЛЬ: ${body.targetStyle || 'UK Drill'}
НАСТРОЕНИЕ: ${mood || 'агрессивное, уличное'}
ОСОБЕННОСТИ: ${body.sectionNotes || 'добавить локальный колорит'}

ТРЕБОВАНИЯ:
1. Полная структура от Intro до End
2. Составные теги V5 для каждой секции
3. Минимум 3 разных типа ad-libs
4. Инструментальный брейк с дескрипторами
5. Трансформация темпа/динамики
6. КАПС для кульминаций
7. 6-10 слогов на строку

Верни JSON:
{
  "title": "Название 2-4 слова",
  "style": "UK Drill, aggressive, 808 bass, rapid hi-hats, dark synth, [другие теги], до 120 символов",
  "lyrics": "ПОЛНЫЙ текст с тегами V5, ad-libs, структурой",
  "tagsSummary": {
    "structural": ["Intro", "Verse 1", ...],
    "vocal": ["Male Grit Rap", ...],
    "instrumental": ["808 Bass", "Drill Glockenspiel", ...],
    "dynamics": ["Explosive Drop", "!crescendo", ...]
  }
}`;
        break;

      case 'epic_prompt_builder':
        systemPrompt = `Ты эксперт по эпическому, киберпанк и cinematic саунду. Создаёшь промпты для масштабных треков.

═══════════════════════════════════════════════════════
🎬 ЭЛЕМЕНТЫ ЭПИЧЕСКОГО ЗВУЧАНИЯ
═══════════════════════════════════════════════════════

1. ОРКЕСТРОВЫЕ ЭЛЕМЕНТЫ:
   - [Orchestral], [Choir], [Strings], [Brass]
   - [Epic Build], [Massive Build], [Orchestral Swell]

2. СИНТЕЗАТОРЫ:
   - [Dark Synth], [Arpeggio], [Pad], [Atmospheric]
   - [Cinematic], [Futuristic], [Dystopian]

3. ДИНАМИКА:
   - [!crescendo], [Climax], [Explosive]
   - [Soft -> Explosive], [Calm -> Intense]

4. ВОКАЛ:
   - [Powerful], [Soaring], [Choir Harmonies]
   - [Vocoder] для киберпанк

Язык текста: ${language === 'ru' ? 'русский' : 'английский'}`;

        userPrompt = `Создай ЭПИЧЕСКИЙ промпт:

ТЕМА: ${theme || 'героическое противостояние, борьба'}
СТИЛЬ: ${body.targetStyle || 'Cinematic Epic'}
НАСТРОЕНИЕ: ${mood || 'триумфальное, героическое'}

Верни JSON:
{
  "title": "Эпическое название",
  "style": "cinematic epic, orchestral, choir, massive build...",
  "lyrics": "Полный текст с эпическими тегами"
}`;
        break;

      case 'validate_suno_v5':
        systemPrompt = `Ты валидатор синтаксиса Suno V5. Проверяешь тексты на соответствие всем правилам.

ПРОВЕРЯЕМЫЕ АСПЕКТЫ:
1. Все теги на английском (не русском!)
2. [End] присутствует
3. Нет конфликтующих тегов ([Whisper]+[Shout], [Acapella]+[Guitar Solo])
4. Не более 3 тегов на строку
5. Слоги: 6-12 оптимально, >16 проблема
6. Круглые скобки только для пения (ooh, aah)
7. Составные теги правильно отформатированы [A | B | C]
8. Инструментальные соло с дескрипторами`;

        userPrompt = `Проведи ГЛУБОКУЮ валидацию V5:

ТЕКСТ:
${lyrics || existingLyrics}

Проверь ВСЁ. Верни JSON:
{
  "isValid": true/false,
  "score": 0-100,
  "errors": [
    {"line": 5, "issue": "Русский тег [Куплет]", "fix": "Заменить на [Verse]", "severity": "error"}
  ],
  "warnings": [
    {"line": 10, "issue": "15 слогов — длинновато", "fix": "Разбить на 2 строки", "severity": "warning"}
  ],
  "conflicts": [
    {"tags": ["Whisper", "Shout"], "reason": "Несовместимы"}
  ],
  "suggestions": [
    {"type": "enhancement", "text": "Добавить [!build_up] перед [Chorus]"}
  ],
  "syllableAnalysis": [
    {"line": "текст строки", "syllables": 8, "ok": true}
  ],
  "missingEnd": false,
  "russianTags": ["Куплет"],
  "compoundTagsUsed": ["Verse 1 | Male Vocal"],
  "summary": "Краткое резюме валидации"
}`;
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    logger.info('AI Lyrics request', { action, theme, mood, genre, language, useAdvancedTags });

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: action === 'suggest_rhymes' ? 300 : action === 'continue_line' ? 150 : 2500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logger.error('AI Gateway error', null, { status: aiResponse.status, error: errorText });
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Слишком много запросов. Попробуйте позже.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Необходимо пополнить баланс.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content || '';

    logger.success('Lyrics generated', { action, contentLength: generatedContent.length });

    // Return additional metadata for smart_generate
    const response: any = {
      success: true,
      action,
    };

    // Parse structured JSON response for generation actions
    if (action === 'generate' || action === 'smart_generate' || action === 'improve' || action === 'add_tags') {
      try {
        // Try to extract JSON from response (look for complete JSON object)
        const jsonMatch = generatedContent.match(/\{[\s\S]*?\}(?=\s*$|\s*```)/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Validate required fields
          if (parsed.lyrics) {
            response.lyrics = parsed.lyrics;
            response.title = parsed.title || null;
            response.style = parsed.style || null;
            response.changes = parsed.changes || null;
            response.tagsSummary = parsed.tagsSummary || null;
            
            logger.info('Parsed structured response', { 
              hasTitle: !!parsed.title, 
              hasStyle: !!parsed.style,
              lyricsLength: parsed.lyrics.length 
            });
          } else {
            // Fallback if no lyrics field
            response.lyrics = generatedContent;
          }
        } else {
          // No JSON found, use raw content
          response.lyrics = generatedContent;
        }
      } catch (e) {
        logger.warn('Failed to parse JSON response, using raw content', { error: e });
        response.lyrics = generatedContent;
      }
    } 
    // Handle full_analysis response
    else if (action === 'full_analysis') {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response.message = 'Анализ завершён';
          response.fullAnalysis = parsed;
          response.quickActions = parsed.quickActions || [];
          logger.info('Parsed full_analysis response', { overallScore: parsed.overallScore });
        } else {
          response.message = generatedContent;
        }
      } catch (e) {
        logger.warn('Failed to parse full_analysis JSON', { error: e });
        response.message = generatedContent;
      }
    }
    // Handle producer_review response
    else if (action === 'producer_review') {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response.message = 'Продюсерский разбор готов';
          response.producerReview = parsed;
          response.quickActions = parsed.quickActions || [];
          logger.info('Parsed producer_review response', { commercialScore: parsed.commercialScore });
        } else {
          response.message = generatedContent;
        }
      } catch (e) {
        logger.warn('Failed to parse producer_review JSON', { error: e });
        response.message = generatedContent;
      }
    }
    // Handle chat action response (JSON parsing)
    else if (action === 'chat') {
      try {
        // Try to parse JSON response from AI
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response.lyrics = parsed.lyrics || null;
          response.title = parsed.title || null;
          response.style = parsed.style || null;
          response.response = parsed.response || generatedContent;
          response.suggestions = parsed.suggestions || null;
          response.quickActions = parsed.quickActions || null;
        } else {
          response.response = generatedContent;
        }
      } catch (e) {
        // If JSON parsing fails, return raw text as response
        response.response = generatedContent;
      }
    }
    // Handle Phase 2 actions
    else if (action === 'style_convert') {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response.lyrics = parsed.lyrics;
          response.style = parsed.style;
          response.changes = parsed.changes;
          response.originalStyle = parsed.originalStyle;
          logger.info('Parsed style_convert response');
        } else {
          response.lyrics = generatedContent;
        }
      } catch (e) {
        response.lyrics = generatedContent;
      }
    }
    else if (action === 'paraphrase') {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response.variants = parsed.variants;
          response.original = parsed.original;
          logger.info('Parsed paraphrase response', { variantsCount: parsed.variants?.length });
        } else {
          response.message = generatedContent;
        }
      } catch (e) {
        response.message = generatedContent;
      }
    }
    else if (action === 'hook_generator') {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response.currentHooks = parsed.currentHooks;
          response.suggestedHooks = parsed.suggestedHooks;
          response.hookScore = parsed.hookScore;
          response.recommendations = parsed.recommendations;
          logger.info('Parsed hook_generator response', { hookScore: parsed.hookScore });
        } else {
          response.message = generatedContent;
        }
      } catch (e) {
        response.message = generatedContent;
      }
    }
    else if (action === 'vocal_map') {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response.sections = parsed.sections;
          response.generalNotes = parsed.generalNotes;
          response.suggestedSingerType = parsed.suggestedSingerType;
          logger.info('Parsed vocal_map response', { sectionsCount: parsed.sections?.length });
        } else {
          response.message = generatedContent;
        }
      } catch (e) {
        response.message = generatedContent;
      }
    }
    else if (action === 'translate_adapt') {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response.translatedLyrics = parsed.translatedLyrics;
          response.adaptationNotes = parsed.adaptationNotes;
          response.preservedElements = parsed.preservedElements;
          response.changedElements = parsed.changedElements;
          response.qualityScore = parsed.qualityScore;
          logger.info('Parsed translate_adapt response', { qualityScore: parsed.qualityScore });
        } else {
          response.lyrics = generatedContent;
        }
      } catch (e) {
        response.lyrics = generatedContent;
      }
    }
    // Handle V5 advanced actions
    else if (action === 'drill_prompt_builder' || action === 'epic_prompt_builder') {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response.lyrics = parsed.lyrics;
          response.title = parsed.title;
          response.style = parsed.style;
          response.tagsSummary = parsed.tagsSummary;
          logger.info('Parsed prompt_builder response', { action, hasLyrics: !!parsed.lyrics });
        } else {
          response.lyrics = generatedContent;
        }
      } catch (e) {
        response.lyrics = generatedContent;
      }
    }
    else if (action === 'validate_suno_v5') {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response.validation = parsed;
          response.isValid = parsed.isValid;
          response.score = parsed.score;
          response.errors = parsed.errors;
          response.warnings = parsed.warnings;
          response.suggestions = parsed.suggestions;
          logger.info('Parsed validate_suno_v5 response', { isValid: parsed.isValid, score: parsed.score });
        } else {
          response.message = generatedContent;
        }
      } catch (e) {
        response.message = generatedContent;
      }
    }
    else {
      response.lyrics = generatedContent;
    }

    if (action === 'smart_generate' || action === 'generate') {
      response.metadata = {
        genre,
        mood,
        recommendedTags: {
          vocal: [...(genreProfile?.vocal || []), ...(moodProfile?.vocal || [])],
          instruments: genreProfile?.instruments || [],
          dynamics: [...(genreProfile?.dynamics || []), ...(moodProfile?.dynamics || [])],
          emotions: [...(genreProfile?.emotions || []), ...(moodProfile?.emotions || [])],
        },
        customTagsUsed: useAdvancedTags ? { vocalTags, instrumentTags, dynamicTags, emotionalCues } : null,
      };
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Error in ai-lyrics-assistant', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
