/**
 * Comprehensive audio processing pipeline
 * 
 * 1. Upload audio to storage
 * 2. Analyze with Audio Flamingo 3 (style, genre, mood, vocals detection)
 * 3. If vocals detected: extract lyrics with Whisper
 * 4. If both vocals AND instrumentals: separate stems
 * 5. Save results to reference_audio table
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PipelineRequest {
  audio_url: string;           // URL of audio to process
  audio_base64?: string;       // Base64 data URI for APIs that don't accept URLs
  user_id: string;             // User ID
  file_name?: string;          // Original file name
  file_size?: number;          // File size in bytes
  duration_seconds?: number;   // Duration if known
  source?: string;             // Source: telegram, web, etc.
  telegram_chat_id?: number;   // For progress notifications
  telegram_file_id?: string;   // Original Telegram file ID
  telegram_message_id?: number; // Existing Telegram progress message to edit (prevents spam)
  skip_stems?: boolean;        // Skip stem separation
  skip_lyrics?: boolean;       // Skip lyrics extraction
  force_reprocess?: boolean;   // Force reprocess even if exists
  reference_id?: string;       // Existing reference ID to update
  user_classification?: {      // User-provided classification
    audio_type?: string;
    vocal_gender?: string;
  };
}

interface StemUrls {
  vocal?: string;
  instrumental?: string;
  drums?: string;
  bass?: string;
  other?: string;
}

// ==================== LANGUAGE MAP ====================
// Maps full language names to ISO 639-1 codes for Whisper
const LANGUAGE_MAP: Record<string, string> = {
  'russian': 'ru',
  'english': 'en',
  'spanish': 'es',
  'french': 'fr',
  'german': 'de',
  'italian': 'it',
  'portuguese': 'pt',
  'chinese': 'zh',
  'mandarin': 'zh',
  'cantonese': 'zh',
  'japanese': 'ja',
  'korean': 'ko',
  'arabic': 'ar',
  'hindi': 'hi',
  'turkish': 'tr',
  'polish': 'pl',
  'ukrainian': 'uk',
  'dutch': 'nl',
  'swedish': 'sv',
  'norwegian': 'no',
  'danish': 'da',
  'finnish': 'fi',
  'greek': 'el',
  'hebrew': 'he',
  'czech': 'cs',
  'romanian': 'ro',
  'hungarian': 'hu',
  'thai': 'th',
  'vietnamese': 'vi',
  'indonesian': 'id',
  'malay': 'ms',
  'filipino': 'tl',
  'tagalog': 'tl',
  'bengali': 'bn',
  'tamil': 'ta',
  'telugu': 'te',
  'marathi': 'mr',
  'gujarati': 'gu',
  'punjabi': 'pa',
  'urdu': 'ur',
  'persian': 'fa',
  'farsi': 'fa',
  'swahili': 'sw',
};

function normalizeLanguage(lang: string | null | undefined): string | undefined {
  if (!lang || lang === 'unknown' || lang === 'N/A' || lang === 'n/a') return undefined;
  const lowerLang = lang.toLowerCase().trim();
  // If already ISO code (2 letters)
  if (lowerLang.length === 2) return lowerLang;
  // Map full name to code
  return LANGUAGE_MAP[lowerLang] || undefined;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ==================== TELEGRAM THROTTLING ====================
// Prevent message edit spam - Telegram has rate limits
let lastProgressUpdate = 0;
const PROGRESS_THROTTLE_MS = 3000; // Minimum 3 seconds between progress updates

async function sendTelegramProgress(
  chatId: number, 
  text: string, 
  messageId?: number,
  forceUpdate = false // Skip throttle for important updates
): Promise<number | undefined> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken || !chatId) return messageId;

  // Throttle progress updates (unless forced)
  const now = Date.now();
  if (!forceUpdate && messageId && (now - lastProgressUpdate < PROGRESS_THROTTLE_MS)) {
    console.log('⏳ Throttling Telegram update, skipping...');
    return messageId;
  }
  lastProgressUpdate = now;

  try {
    if (messageId) {
      // Edit existing message
      const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'MarkdownV2',
        }),
      });
      const data = await response.json();
      
      // Handle message not found - send new message instead
      if (!data.ok) {
        console.warn('⚠️ Failed to edit message:', data.description);
        if (data.error_code === 400) {
          // Message was deleted or not found - send new one
          console.log('📤 Sending new message instead...');
          const newResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: 'MarkdownV2',
            }),
          });
          const newData = await newResponse.json();
          return newData.ok ? newData.result?.message_id : undefined;
        }
        return messageId; // Keep old ID
      }
      
      return data.ok ? messageId : undefined;
    } else {
      // Send new message
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'MarkdownV2',
        }),
      });
      const data = await response.json();
      return data.ok ? data.result?.message_id : undefined;
    }
  } catch (error) {
    console.error('Failed to send Telegram progress:', error);
    return messageId;
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let progressMessageId: number | undefined;
  
  // Reset throttle for each request
  lastProgressUpdate = 0;

  try {
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });
    const body: PipelineRequest = await req.json();
    
    const {
      audio_url,
      audio_base64,
      user_id,
      file_name = 'audio.mp3',
      file_size,
      duration_seconds,
      source = 'unknown',
      telegram_chat_id,
      telegram_file_id,
      telegram_message_id,
      skip_stems = false,
      skip_lyrics = false,
      force_reprocess = false,
      reference_id,
      user_classification,
    } = body;
    
    // Use base64 for Replicate APIs if available, otherwise fall back to URL
    const audioInputForReplicate = audio_base64 || audio_url;

    // If caller already created a progress message, reuse it (edit instead of send)
    progressMessageId = telegram_message_id || progressMessageId;

    console.log('🎵 Starting audio pipeline:', { audio_url, user_id, source, force_reprocess });

    if (!audio_url || !user_id) {
      throw new Error('audio_url and user_id are required');
    }

    // === CHECK FOR EXISTING ANALYSIS (skip if force_reprocess) ===
    if (!force_reprocess && !reference_id) {
      const { data: existing } = await supabase
        .from('reference_audio')
        .select('*')
        .eq('user_id', user_id)
        .or(`file_url.eq.${audio_url},telegram_file_id.eq.${telegram_file_id || ''}`)
        .eq('analysis_status', 'completed')
        .maybeSingle();

      if (existing) {
        console.log('✅ Found existing analysis:', existing.id);
        
        if (telegram_chat_id) {
          await sendTelegramProgress(
            telegram_chat_id,
            `✅ *Аудио уже обработано\\!*\n\n` +
            `📁 ${escapeMarkdown(existing.file_name)}\n\n` +
            `🎵 Используем кэшированный анализ`,
            progressMessageId,
            true // Force update for final message
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            cached: true,
            reference_id: existing.id,
            analysis: {
              has_vocals: existing.has_vocals,
              has_instrumental: existing.has_instrumentals,
              genre: existing.genre,
              mood: existing.mood,
              bpm_estimate: existing.bpm,
              style_prompt: existing.style_description,
              language: existing.detected_language,
            },
            lyrics: existing.transcription,
            stems_status: existing.stems_status,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // === STEP 1: Progress notification ===
    if (telegram_chat_id) {
      // If progressMessageId already exists (passed from caller), edit it. Otherwise send new.
      const nextId = await sendTelegramProgress(
        telegram_chat_id,
        `🎵 *Обработка аудио*\n\n` +
        `📁 ${escapeMarkdown(file_name)}\n\n` +
        `▓░░░░░░░░░ 10%\n` +
        `⏳ Загрузка и анализ стиля\\.\\.\\.`,
        progressMessageId,
        true // Force first update
      );
      progressMessageId = nextId || progressMessageId;
    }

    // === STEP 2: Style Analysis with Audio Flamingo 3 ===
    console.log('🔍 Running Audio Flamingo 3 analysis...');
    console.log('🎵 Using input type:', audio_base64 ? 'base64' : 'url');
    
    // Update progress to 20% - throttled
    if (telegram_chat_id && progressMessageId) {
      await sendTelegramProgress(
        telegram_chat_id,
        `🎵 *Обработка аудио*\n\n` +
        `📁 ${escapeMarkdown(file_name)}\n\n` +
        `▓▓░░░░░░░░ 20%\n` +
        `⏳ Анализ стиля с AI\\.\\.\\.`,
        progressMessageId
      );
    }
    
    const flamingoPrompt = `Analyze this audio track comprehensively.
Answer in EXACTLY this format:

VOCALS: YES or NO (is there singing, rapping, or spoken vocals?)
INSTRUMENTAL: YES or NO (is there significant instrumental music?)
LANGUAGE: the language of vocals, or N/A if no vocals
GENRE: the primary music genre
SUB_GENRE: secondary genre or style
MOOD: the emotional mood
ENERGY: HIGH, MEDIUM, or LOW
TEMPO: FAST, MEDIUM, or SLOW
BPM_ESTIMATE: estimated beats per minute (number)
VOCAL_STYLE: describe the vocal characteristics (gender, style, technique) or N/A
INSTRUMENTS: comma-separated list of instruments heard
PRODUCTION_STYLE: describe the production style (lo-fi, polished, vintage, modern, etc.)
STYLE_PROMPT: write a detailed style description suitable for AI music generation (max 200 chars)

Be precise. If you hear ANY human voice singing/rapping, VOCALS: YES`;

    let analysisResult: {
      hasVocals: boolean;
      hasInstrumental: boolean;
      language: string;
      genre: string | null;
      subGenre: string | null;
      mood: string | null;
      energy: string | null;
      tempo: string | null;
      bpmEstimate: number | null;
      vocalStyle: string | null;
      instruments: string[];
      productionStyle: string | null;
      stylePrompt: string | null;
      fullResponse: string;
    };

    try {
      const flamingoOutput = await replicate.run(
        "zsxkib/audio-flamingo-3:2856d42f07154766b0cc0f3554fb425d7c3422ae77269264fbe0c983ac759fef",
        {
          input: {
            audio: audioInputForReplicate, // Use base64 if available
            prompt: 'Analyze this audio',
            system_prompt: flamingoPrompt,
            enable_thinking: false,
            temperature: 0.1,
            max_length: 1024,
          },
        }
      ) as string;

      console.log('📊 Flamingo output:', flamingoOutput);

      // Parse response
      const parseField = (text: string, field: string): string | null => {
        const regex = new RegExp(`${field}:\\s*([^\\n]+)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : null;
      };

      const vocalsRaw = parseField(flamingoOutput, 'VOCALS') || '';
      const instrumentalRaw = parseField(flamingoOutput, 'INSTRUMENTAL') || '';
      
      // Robust vocal detection
      const hasVocals = /yes/i.test(vocalsRaw) || 
        /singing|singer|rapper|vocal|voice|lyrics/i.test(flamingoOutput);
      const hasInstrumental = /yes/i.test(instrumentalRaw) || 
        /instrumental|instruments|guitar|piano|drums|bass|synth/i.test(flamingoOutput);

      const bpmStr = parseField(flamingoOutput, 'BPM_ESTIMATE');
      const bpmEstimate = bpmStr ? parseInt(bpmStr.replace(/\D/g, '')) || null : null;

      const instrumentsStr = parseField(flamingoOutput, 'INSTRUMENTS');
      const instruments = instrumentsStr 
        ? instrumentsStr.split(',').map(i => i.trim()).filter(Boolean)
        : [];

      analysisResult = {
        hasVocals,
        hasInstrumental,
        language: parseField(flamingoOutput, 'LANGUAGE') || 'unknown',
        genre: parseField(flamingoOutput, 'GENRE'),
        subGenre: parseField(flamingoOutput, 'SUB_GENRE'),
        mood: parseField(flamingoOutput, 'MOOD'),
        energy: parseField(flamingoOutput, 'ENERGY'),
        tempo: parseField(flamingoOutput, 'TEMPO'),
        bpmEstimate,
        vocalStyle: parseField(flamingoOutput, 'VOCAL_STYLE'),
        instruments,
        productionStyle: parseField(flamingoOutput, 'PRODUCTION_STYLE'),
        stylePrompt: parseField(flamingoOutput, 'STYLE_PROMPT'),
        fullResponse: flamingoOutput,
      };

      console.log('✅ Analysis complete:', {
        hasVocals: analysisResult.hasVocals,
        hasInstrumental: analysisResult.hasInstrumental,
        genre: analysisResult.genre,
      });
    } catch (analysisError) {
      console.error('❌ Audio Flamingo failed:', analysisError);
      analysisResult = {
        hasVocals: false,
        hasInstrumental: true,
        language: 'unknown',
        genre: null,
        subGenre: null,
        mood: null,
        energy: null,
        tempo: null,
        bpmEstimate: null,
        vocalStyle: null,
        instruments: [],
        productionStyle: null,
        stylePrompt: null,
        fullResponse: '',
      };
    }

    // === STEP 3: Update progress & extract lyrics if vocals ===
    let lyrics: string | null = null;
    let transcriptionMethod: string | null = null;

    if (analysisResult.hasVocals && !skip_lyrics) {
      if (telegram_chat_id && progressMessageId) {
        await sendTelegramProgress(
          telegram_chat_id,
          `🎵 *Обработка аудио*\n\n` +
          `📁 ${escapeMarkdown(file_name)}\n\n` +
          `✅ Анализ стиля завершён\n` +
          `🎤 Обнаружен вокал\n\n` +
          `▓▓▓▓░░░░░░ 40%\n` +
          `⏳ Извлечение текста песни\\.\\.\\.`,
          progressMessageId,
          true // Force update - stage change
        );
      }

      console.log('🎤 Extracting lyrics with Whisper...');
      
      // Normalize language for Whisper API (needs ISO 639-1 code, not full name)
      const whisperLanguage = normalizeLanguage(analysisResult.language);
      console.log('🌐 Language for Whisper:', analysisResult.language, '->', whisperLanguage);

      try {
        const whisperOutput = await replicate.run(
          "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
          {
            input: {
              audio: audioInputForReplicate, // Use base64 if available
              model: "large-v3",
              language: whisperLanguage, // Now properly normalized
              translate: false,
              temperature: 0,
              transcription: "plain text",
              no_speech_threshold: 0.6,
            },
          }
        ) as { transcription?: string; text?: string };

        lyrics = whisperOutput?.transcription || whisperOutput?.text || null;
        transcriptionMethod = 'whisper-large-v3';
        console.log('✅ Lyrics extracted:', lyrics?.length, 'chars');
      } catch (whisperError) {
        console.error('❌ Whisper failed:', whisperError);
        
        // Fallback to Audio Flamingo for lyrics
        try {
          const lyricsOutput = await replicate.run(
            "zsxkib/audio-flamingo-3:2856d42f07154766b0cc0f3554fb425d7c3422ae77269264fbe0c983ac759fef",
            {
              input: {
                audio: audioInputForReplicate, // Use base64 if available
                prompt: 'What are all the lyrics?',
                system_prompt: 'Transcribe ALL lyrics sung in this audio. Write only the lyrics. If unclear, write [unclear].',
                enable_thinking: true,
                temperature: 0.1,
                max_length: 2048,
              },
            }
          ) as string;
          
          lyrics = lyricsOutput;
          transcriptionMethod = 'audio-flamingo-3';
        } catch (e) {
          console.error('❌ Flamingo lyrics fallback failed:', e);
        }
      }
    }

    // === STEP 4: Stem separation if both vocals AND instrumentals ===
    let stemUrls: StemUrls = {};
    let stemsStatus = 'none';
    const shouldSeparateStems = analysisResult.hasVocals && 
                                 analysisResult.hasInstrumental && 
                                 !skip_stems;

    if (shouldSeparateStems) {
      if (telegram_chat_id && progressMessageId) {
        await sendTelegramProgress(
          telegram_chat_id,
          `🎵 *Обработка аудио*\n\n` +
          `📁 ${escapeMarkdown(file_name)}\n\n` +
          `✅ Анализ стиля завершён\n` +
          `✅ Текст извлечён\n` +
          `🎤 Вокал \\+ 🎸 Инструментал\n\n` +
          `▓▓▓▓▓▓░░░░ 60%\n` +
          `⏳ Запуск разделения на стемы\\.\\.\\.`,
          progressMessageId,
          true // Force update - stage change
        );
      }

      console.log('🎛️ Initiating stem separation...');
      stemsStatus = 'processing';

      try {
        // Use Demucs via Replicate for stem separation
        // Updated to latest version (auto-resolves)
        const demucsOutput = await replicate.run(
          "cjwbw/demucs",
          {
            input: {
              audio: audio_url, // Demucs prefers URLs for large files
              stem: "none", // Return all stems
              model: "htdemucs",
              split: true,
              segment: 40,
            },
          }
        ) as { vocals?: string; drums?: string; bass?: string; other?: string };

        console.log('✅ Demucs output:', Object.keys(demucsOutput || {}));

        if (demucsOutput) {
          stemUrls = {
            vocal: demucsOutput.vocals,
            drums: demucsOutput.drums,
            bass: demucsOutput.bass,
            other: demucsOutput.other,
          };
          
          // Create instrumental by combining drums + bass + other
          // For now store the other stem as closest approximation
          if (demucsOutput.other) {
            stemUrls.instrumental = demucsOutput.other;
          }
          
          stemsStatus = 'completed';
          console.log('✅ Stems extracted:', Object.keys(stemUrls).filter(k => stemUrls[k as keyof StemUrls]));
        }
      } catch (demucsError) {
        console.error('❌ Demucs failed:', demucsError);
        stemsStatus = 'failed';
      }
    } else if (!analysisResult.hasVocals || !analysisResult.hasInstrumental) {
      stemsStatus = 'not_applicable';
    }

    // === STEP 5: Save to reference_audio table ===
    if (telegram_chat_id && progressMessageId) {
      await sendTelegramProgress(
        telegram_chat_id,
        `🎵 *Обработка аудио*\n\n` +
        `📁 ${escapeMarkdown(file_name)}\n\n` +
        `✅ Анализ стиля завершён\n` +
        `${analysisResult.hasVocals ? '✅ Текст извлечён' : '🎸 Инструментал'}\n` +
        `${shouldSeparateStems ? '✅ Стемы разделены' : ''}\n\n` +
        `▓▓▓▓▓▓▓▓░░ 80%\n` +
        `⏳ Сохранение результатов\\.\\.\\.`,
        progressMessageId,
        true // Force update - stage change
      );
    }

    console.log('💾 Saving to reference_audio...');

    const saveData = {
      user_id,
      file_name: file_name.substring(0, 255),
      file_url: audio_url,
      file_size,
      duration_seconds,
      source,
      telegram_file_id: telegram_file_id || null,
      genre: analysisResult.genre,
      mood: analysisResult.mood,
      vocal_style: analysisResult.vocalStyle,
      transcription: lyrics,
      transcription_method: transcriptionMethod,
      has_vocals: analysisResult.hasVocals,
      has_instrumentals: analysisResult.hasInstrumental,
      detected_language: analysisResult.language !== 'unknown' ? analysisResult.language : null,
      bpm: analysisResult.bpmEstimate,
      tempo: analysisResult.tempo,
      energy: analysisResult.energy,
      instruments: analysisResult.instruments.length > 0 ? analysisResult.instruments : null,
      style_description: analysisResult.stylePrompt,
      vocal_stem_url: stemUrls.vocal || null,
      instrumental_stem_url: stemUrls.instrumental || null,
      drums_stem_url: stemUrls.drums || null,
      bass_stem_url: stemUrls.bass || null,
      other_stem_url: stemUrls.other || null,
      stems_status: stemsStatus,
      processing_time_ms: Date.now() - startTime,
      analysis_status: 'completed',
      analyzed_at: new Date().toISOString(),
      analysis_metadata: {
        sub_genre: analysisResult.subGenre,
        production_style: analysisResult.productionStyle,
        full_analysis: analysisResult.fullResponse,
      },
    };

    let savedRef;
    let dbError;

    if (reference_id) {
      // Update existing record
      const result = await supabase
        .from('reference_audio')
        .update(saveData)
        .eq('id', reference_id)
        .select('id')
        .single();
      savedRef = result.data;
      dbError = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from('reference_audio')
        .insert(saveData)
        .select('id')
        .single();
      savedRef = result.data;
      dbError = result.error;
    }

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error('Failed to save audio reference');
    }

    console.log('✅ Saved reference:', savedRef?.id);

    // === STEP 6: Final progress (90%) ===
    // NOTE: Handler (audio.ts) will send the detailed 100% message with action buttons
    // Pipeline only shows 90% "finalizing" state, then returns data for handler to display
    if (telegram_chat_id && progressMessageId) {
      await sendTelegramProgress(
        telegram_chat_id,
        `🎵 *Обработка аудио*\n\n` +
        `📁 ${escapeMarkdown(file_name)}\n\n` +
        `▓▓▓▓▓▓▓▓▓░ 90%\n` +
        `⏳ Завершаем обработку\\.\\.\\.`,
        progressMessageId,
        true // Force final update
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        reference_id: savedRef?.id,
        analysis: {
          has_vocals: analysisResult.hasVocals,
          has_instrumental: analysisResult.hasInstrumental,
          genre: analysisResult.genre,
          sub_genre: analysisResult.subGenre,
          mood: analysisResult.mood,
          energy: analysisResult.energy,
          tempo: analysisResult.tempo,
          bpm_estimate: analysisResult.bpmEstimate,
          vocal_style: analysisResult.vocalStyle,
          instruments: analysisResult.instruments,
          production_style: analysisResult.productionStyle,
          style_prompt: analysisResult.stylePrompt,
          language: analysisResult.language,
        },
        lyrics,
        stems: {
          status: stemsStatus,
          vocal_url: stemUrls.vocal,
          instrumental_url: stemUrls.instrumental,
          drums_url: stemUrls.drums,
          bass_url: stemUrls.bass,
          other_url: stemUrls.other,
        },
        processing_time_ms: Date.now() - startTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Pipeline error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        processing_time_ms: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
