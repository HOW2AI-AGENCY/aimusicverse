/**
 * Comprehensive audio processing pipeline
 *
 * 1. Upload audio to storage
 * 2. Analyze with Audio Flamingo 3 (style, genre, mood, vocals detection)
 * 3. If vocals detected: extract lyrics with Whisper (from vocal stem only)
 * 4. If both vocals AND instrumentals: separate stems
 * 5. Save results to reference_audio table
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorize } from "../_shared/auth.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";
import type { PipelineRequest, StemUrls, AnalysisResult } from "./types.ts";
import { sendTelegramProgress, escapeMarkdown, resetTelegramThrottle } from "./telegram.ts";
import { runFlamingoAnalysis, emptyAnalysis, analysisFromExistingRef } from "./analysis.ts";
import { separateStems, transcribeVocalStem } from "./stems.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = getSupabaseClient();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = await authorize(req);
  if (!__auth.ok) {
    return new Response(JSON.stringify({ error: __auth.error }), {
      status: __auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const startTime = Date.now();
  let progressMessageId: number | undefined;
  resetTelegramThrottle();

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) throw new Error("REPLICATE_API_KEY not configured");

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });
    const body: PipelineRequest = await req.json();

    const {
      audio_url,
      audio_base64,
      user_id: _bodyUserId,
      file_name = "audio.mp3",
      file_size,
      duration_seconds,
      source = "unknown",
      telegram_chat_id,
      telegram_file_id,
      telegram_message_id,
      skip_stems = false,
      skip_analysis = false,
      force_reprocess = false,
      reference_id,
      extract_lyrics_from_vocal = false,
      action,
      user_classification,
    } = body;

    const user_id = __auth.isService ? (_bodyUserId as string) : (__auth.user?.id as string);
    const audioInputForReplicate = audio_base64 || audio_url;
    progressMessageId = telegram_message_id || progressMessageId;

    console.log("🎵 Starting audio pipeline:", { audio_url, user_id, source, force_reprocess });

    if (!audio_url || !user_id) {
      throw new Error("audio_url and user_id are required");
    }

    // === Check cached analysis ===
    if (!force_reprocess && !reference_id) {
      const { data: existing } = await supabase
        .from("reference_audio")
        .select("*")
        .eq("user_id", user_id)
        .or(`file_url.eq.${audio_url},telegram_file_id.eq.${telegram_file_id || ""}`)
        .eq("analysis_status", "completed")
        .maybeSingle();

      if (existing) {
        console.log("✅ Found existing analysis:", existing.id);
        if (telegram_chat_id) {
          await sendTelegramProgress(
            telegram_chat_id,
            `✅ *Аудио уже обработано\\!*\n\n📁 ${escapeMarkdown(existing.file_name)}\n\n🎵 Используем кэшированный анализ`,
            progressMessageId,
            true,
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
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // === STEP 1: Initial progress ===
    if (telegram_chat_id) {
      const nextId = await sendTelegramProgress(
        telegram_chat_id,
        `🎵 *Обработка аудио*\n\n📁 ${escapeMarkdown(file_name)}\n\n▓░░░░░░░░░ 10%\n⏳ Загрузка и анализ стиля\\.\\.\\.`,
        progressMessageId,
        true,
      );
      progressMessageId = nextId || progressMessageId;
    }

    // === STEP 2: Style analysis ===
    let analysisResult: AnalysisResult;

    if (skip_analysis && reference_id) {
      console.log("⏭️ Skipping analysis, loading from reference_id:", reference_id);
      const { data: existingRef } = await supabase.from("reference_audio").select("*").eq("id", reference_id).single();
      if (existingRef) {
        analysisResult = analysisFromExistingRef(existingRef);
      } else {
        const audioType = user_classification?.audio_type || "full";
        analysisResult = emptyAnalysis(audioType !== "instrumental", audioType !== "vocal");
      }
    } else {
      if (telegram_chat_id && progressMessageId) {
        await sendTelegramProgress(
          telegram_chat_id,
          `🎵 *Обработка аудио*\n\n📁 ${escapeMarkdown(file_name)}\n\n▓▓░░░░░░░░ 20%\n⏳ Анализ стиля с AI\\.\\.\\.`,
          progressMessageId,
        );
      }
      analysisResult = await runFlamingoAnalysis(replicate, audioInputForReplicate);
    }

    // === STEP 3: No auto transcription (only from vocal stem) ===
    let lyrics: string | null = null;
    let transcriptionMethod: string | null = null;
    if (analysisResult.hasVocals) {
      console.log("ℹ️ Vocals detected but skipping auto-transcription. Use vocal stem for lyrics extraction.");
    }

    // === STEP 4: Stem separation ===
    let stemUrls: StemUrls = {};
    let stemsStatus = "none";
    const shouldSeparateStems = analysisResult.hasVocals && analysisResult.hasInstrumental && !skip_stems;

    if (shouldSeparateStems) {
      if (telegram_chat_id && progressMessageId) {
        await sendTelegramProgress(
          telegram_chat_id,
          `🎵 *Обработка аудио*\n\n📁 ${escapeMarkdown(file_name)}\n\n✅ Анализ стиля завершён\n🎤 Вокал \\+ 🎸 Инструментал\n\n▓▓▓▓▓░░░░░ 50%\n⏳ Разделение на стемы\\.\\.\\.`,
          progressMessageId,
          true,
        );
      }
      stemsStatus = "processing";
      const stemResult = await separateStems(replicate, audio_url);
      stemUrls = stemResult.stemUrls;
      stemsStatus = stemResult.status;

      // === STEP 4.5: Lyrics from vocal stem ===
      if (
        stemUrls.vocal &&
        stemsStatus === "completed" &&
        (extract_lyrics_from_vocal || action === "transcribe" || action === "full")
      ) {
        if (telegram_chat_id && progressMessageId) {
          await sendTelegramProgress(
            telegram_chat_id,
            `🎵 *Обработка аудио*\n\n📁 ${escapeMarkdown(file_name)}\n\n✅ Анализ стиля\n✅ Стемы разделены\n\n▓▓▓▓▓▓▓░░░ 70%\n⏳ Извлечение текста из вокала\\.\\.\\.`,
            progressMessageId,
            true,
          );
        }
        const trans = await transcribeVocalStem(replicate, stemUrls.vocal, analysisResult.language);
        lyrics = trans.lyrics;
        transcriptionMethod = trans.method;
      }
    } else if (!analysisResult.hasVocals || !analysisResult.hasInstrumental) {
      stemsStatus = "not_applicable";
    }

    // === STEP 5: Save results ===
    if (telegram_chat_id && progressMessageId) {
      await sendTelegramProgress(
        telegram_chat_id,
        `🎵 *Обработка аудио*\n\n📁 ${escapeMarkdown(file_name)}\n\n✅ Анализ стиля завершён\n${analysisResult.hasVocals ? "✅ Текст извлечён" : "🎸 Инструментал"}\n${shouldSeparateStems ? "✅ Стемы разделены" : ""}\n\n▓▓▓▓▓▓▓▓░░ 80%\n⏳ Сохранение результатов\\.\\.\\.`,
        progressMessageId,
        true,
      );
    }

    console.log("💾 Saving to reference_audio...");

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
      detected_language: analysisResult.language !== "unknown" ? analysisResult.language : null,
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
      analysis_status: "completed",
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
      const result = await supabase.from("reference_audio").update(saveData).eq("id", reference_id).select("id").single();
      savedRef = result.data;
      dbError = result.error;
    } else {
      const result = await supabase.from("reference_audio").insert(saveData).select("id").single();
      savedRef = result.data;
      dbError = result.error;
    }

    if (dbError) {
      console.error("❌ Database error:", dbError);
      throw new Error("Failed to save audio reference");
    }
    console.log("✅ Saved reference:", savedRef?.id);

    // === STEP 6: Final progress ===
    if (telegram_chat_id && progressMessageId) {
      await sendTelegramProgress(
        telegram_chat_id,
        `🎵 *Обработка аудио*\n\n📁 ${escapeMarkdown(file_name)}\n\n▓▓▓▓▓▓▓▓▓░ 90%\n⏳ Завершаем обработку\\.\\.\\.`,
        progressMessageId,
        true,
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("❌ Pipeline error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, processing_time_ms: Date.now() - startTime }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
