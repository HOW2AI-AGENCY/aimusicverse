/**
 * Unified Audio Analysis Service
 * Consolidates all AI analyzers under a single API
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type {
  AnalysisRequest,
  AnalysisType,
  AnalysisProvider,
  AnalysisStatus,
  UnifiedAnalysisResult,
  NoteData,
  ChordData,
  VocalInfo,
  EnergyInfo,
  ProductionInfo,
  DEFAULT_PROVIDER_FOR_TYPE,
} from "./types";

const log = logger.child({ module: "AudioAnalysisService" });

// ==========================================
// Main Analysis Service
// ==========================================

class AudioAnalysisService {
  private static instance: AudioAnalysisService;

  private constructor() {}

  static getInstance(): AudioAnalysisService {
    if (!AudioAnalysisService.instance) {
      AudioAnalysisService.instance = new AudioAnalysisService();
    }
    return AudioAnalysisService.instance;
  }

  /**
   * Main analysis entry point
   */
  async analyze(request: AnalysisRequest): Promise<UnifiedAnalysisResult> {
    const { analysisTypes, onProgress } = request;

    log.info("Starting unified analysis", {
      types: analysisTypes,
      hasAudioUrl: !!request.audioUrl,
      trackId: request.trackId,
    });

    onProgress?.("analyzing", "Начинаем анализ...");

    try {
      // Resolve audio URL if not provided
      const audioUrl = await this.resolveAudioUrl(request);
      if (!audioUrl) {
        throw new Error("Не удалось получить аудио URL");
      }

      // Route to appropriate providers
      const results = await this.routeToProviders(audioUrl, request);

      // Merge all results
      const mergedResult = this.mergeResults(results);

      // Save to database if trackId provided
      if (request.trackId && request.userId) {
        await this.saveToDatabase(request.trackId, request.userId, mergedResult);
      }

      onProgress?.("completed", "Анализ завершён");
      log.info("Analysis completed", { trackId: request.trackId });

      return mergedResult;
    } catch (error) {
      log.error("Analysis failed", error);
      onProgress?.("failed", error instanceof Error ? error.message : "Ошибка анализа");
      throw error;
    }
  }

  /**
   * Analyze with Flamingo (comprehensive style analysis)
   */
  async analyzeWithFlamingo(
    audioUrl: string,
    options: {
      trackId?: string;
      referenceId?: string;
      customPrompt?: string;
    } = {},
  ): Promise<UnifiedAnalysisResult> {
    log.info("Calling Flamingo analysis", { audioUrl: audioUrl.slice(0, 50) });

    const { data, error } = await supabase.functions.invoke("analyze-audio-flamingo", {
      body: {
        audio_url: audioUrl,
        track_id: options.trackId,
        reference_id: options.referenceId,
        custom_prompt: options.customPrompt,
        analysis_type: "auto",
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || "Flamingo analysis failed");

    return this.normalizeFlamingoResult(data.parsed);
  }

  /**
   * Analyze with Lovable AI (emotion/engagement)
   */
  async analyzeWithLovableAI(
    audioUrl: string,
    options: {
      trackId?: string;
      analysisTypes?: string[];
    } = {},
  ): Promise<UnifiedAnalysisResult> {
    log.info("Calling Lovable AI analysis", { audioUrl: audioUrl.slice(0, 50) });

    const { data, error } = await supabase.functions.invoke("replicate-music-analysis", {
      body: {
        trackId: options.trackId,
        audioUrl,
        analysisTypes: options.analysisTypes || ["bpm", "emotion", "approachability"],
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || "Lovable AI analysis failed");

    return this.normalizeLovableAIResult(data.results);
  }

  /**
   * Analyze with Klangio (transcription/beats/chords)
   */
  async analyzeWithKlangio(
    audioUrl: string,
    options: {
      mode: "transcription" | "chord-recognition" | "chord-recognition-extended" | "beat-tracking";
      model?: string;
      outputs?: string[];
      vocabulary?: "major-minor" | "full";
      userId?: string;
      title?: string;
      stemType?: string;
    },
  ): Promise<UnifiedAnalysisResult> {
    log.info("Calling Klangio analysis", { mode: options.mode });

    const { data, error } = await supabase.functions.invoke("klangio-analyze", {
      body: {
        audio_url: audioUrl,
        mode: options.mode,
        model: options.model,
        outputs: options.outputs,
        vocabulary: options.vocabulary,
        user_id: options.userId,
        title: options.title,
        stem_type: options.stemType,
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || "Klangio analysis failed");

    return this.normalizeKlangioResult(data, options.mode);
  }

  /**
   * Quick BPM detection (local browser-based)
   */
  async detectBPMLocal(audioUrl: string): Promise<number | null> {
    try {
      // Import web-audio-beat-detector dynamically
      const { analyze } = await import("web-audio-beat-detector");

      // Fetch and decode audio
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Analyze BPM
      const analysisResult = await analyze(audioBuffer);
      const detectedBpm = typeof analysisResult === "number" ? analysisResult : (analysisResult as { bpm: number }).bpm;

      await audioContext.close();
      return Math.round(detectedBpm);
    } catch (error) {
      log.warn("Local BPM detection failed", { error: String(error) });
      return null;
    }
  }

  // ==========================================
  // Private Helpers
  // ==========================================

  private async resolveAudioUrl(request: AnalysisRequest): Promise<string | null> {
    if (request.audioUrl) return request.audioUrl;

    if (request.audioFile) {
      // Upload file to storage
      const fileName = `analysis/${Date.now()}-${request.audioFile.name}`;
      const { error } = await supabase.storage.from("project-assets").upload(fileName, request.audioFile);

      if (error) throw error;

      const { data } = supabase.storage.from("project-assets").getPublicUrl(fileName);

      return data.publicUrl;
    }

    if (request.trackId) {
      const { data } = await supabase.from("tracks").select("audio_url").eq("id", request.trackId).single();

      return data?.audio_url || null;
    }

    if (request.referenceId) {
      const { data } = await supabase.from("reference_audio").select("file_url").eq("id", request.referenceId).single();

      return data?.file_url || null;
    }

    return null;
  }

  private async routeToProviders(audioUrl: string, request: AnalysisRequest): Promise<UnifiedAnalysisResult[]> {
    const results: UnifiedAnalysisResult[] = [];
    const { analysisTypes, provider } = request;

    // Group analysis types by provider
    const providerTasks: Record<AnalysisProvider, AnalysisType[]> = {
      flamingo: [],
      "lovable-ai": [],
      klangio: [],
      local: [],
    };

    for (const type of analysisTypes) {
      const targetProvider = provider || this.getDefaultProvider(type);
      providerTasks[targetProvider].push(type);
    }

    // Execute in parallel
    const promises: Promise<UnifiedAnalysisResult>[] = [];

    if (providerTasks["flamingo"].length > 0) {
      promises.push(
        this.analyzeWithFlamingo(audioUrl, {
          trackId: request.trackId,
          referenceId: request.referenceId,
          customPrompt: request.customPrompt,
        }),
      );
    }

    if (providerTasks["lovable-ai"].length > 0) {
      promises.push(
        this.analyzeWithLovableAI(audioUrl, {
          trackId: request.trackId,
          analysisTypes: providerTasks["lovable-ai"].map((t) => this.mapTypeToLovableAI(t)),
        }),
      );
    }

    if (providerTasks["klangio"].length > 0) {
      // Klangio needs separate calls for each mode
      for (const type of providerTasks["klangio"]) {
        const mode = this.mapTypeToKlangioMode(type);
        if (mode) {
          promises.push(
            this.analyzeWithKlangio(audioUrl, {
              mode,
              model: request.model,
              vocabulary: request.vocabulary,
              userId: request.userId,
              title: request.title,
              stemType: request.stemType,
            }),
          );
        }
      }
    }

    if (providerTasks["local"].length > 0) {
      // Local BPM detection
      const localBpm = await this.detectBPMLocal(audioUrl);
      if (localBpm) {
        results.push({ bpm: localBpm, provider: "local" });
      }
    }

    // Wait for all providers
    const providerResults = await Promise.allSettled(promises);

    for (const result of providerResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        log.warn("Provider failed", { error: String(result.reason) });
      }
    }

    return results;
  }

  private getDefaultProvider(type: AnalysisType): AnalysisProvider {
    const defaults: Record<AnalysisType, AnalysisProvider> = {
      full: "flamingo",
      style: "flamingo",
      "music-theory": "flamingo",
      emotion: "lovable-ai",
      transcription: "klangio",
      beats: "klangio",
      chords: "klangio",
      lyrics: "lovable-ai",
    };
    return defaults[type] || "flamingo";
  }

  private mapTypeToLovableAI(type: AnalysisType): string {
    const mapping: Record<AnalysisType, string> = {
      full: "general",
      style: "general",
      "music-theory": "bpm",
      emotion: "emotion",
      transcription: "general",
      beats: "bpm",
      chords: "general",
      lyrics: "general",
    };
    return mapping[type] || "general";
  }

  private mapTypeToKlangioMode(type: AnalysisType): "transcription" | "chord-recognition" | "beat-tracking" | null {
    const mapping: Record<string, "transcription" | "chord-recognition" | "beat-tracking" | null> = {
      transcription: "transcription",
      beats: "beat-tracking",
      chords: "chord-recognition",
    };
    return mapping[type] || null;
  }

  private mergeResults(results: UnifiedAnalysisResult[]): UnifiedAnalysisResult {
    const merged: UnifiedAnalysisResult = {};

    for (const result of results) {
      // Merge with priority to non-null values
      Object.entries(result).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          Object.assign(merged, { [key]: value });
        }
      });
    }

    merged.analyzedAt = new Date().toISOString();
    return merged;
  }

  private async saveToDatabase(trackId: string, userId: string, result: UnifiedAnalysisResult): Promise<void> {
    // Check if record exists
    const { data: existing } = await supabase.from("audio_analysis").select("id").eq("track_id", trackId).maybeSingle();

    const analysisData = {
      track_id: trackId,
      user_id: userId,
      analysis_type: "unified",
      genre: result.genre || null,
      mood: result.mood || null,
      tempo: result.energy?.level || null,
      bpm: result.bpm || null,
      key_signature: result.key || null,
      instruments: result.instruments || null,
      structure: result.structure?.sections?.join(", ") || null,
      style_description: result.styleDescription || null,
      arousal: result.arousal ? result.arousal / 100 : null,
      valence: result.valence ? result.valence / 100 : null,
      analysis_metadata: JSON.parse(
        JSON.stringify({
          provider: result.provider || null,
          subgenres: result.subgenres || null,
          emotions: result.emotions || null,
          production: result.production || null,
          beats: result.beats || null,
          chords: result.chords || null,
        }),
      ),
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existing) {
      const result = await supabase.from("audio_analysis").update(analysisData).eq("id", existing.id);
      error = result.error;
    } else {
      const result = await supabase.from("audio_analysis").insert(analysisData);
      error = result.error;
    }

    if (error) {
      log.warn("Failed to save analysis to database", { message: error.message });
    }
  }

  // ==========================================
  // Result Normalizers
  // ==========================================

  private normalizeFlamingoResult(data: Record<string, unknown>): UnifiedAnalysisResult {
    type FlamingoShape = {
      genre?: string;
      subgenres?: string[];
      mood?: string;
      emotions?: string[];
      bpm?: number;
      key?: string;
      scale?: "unknown" | "major" | "minor" | "modal";
      time_signature?: string;
      instruments?: string[];
      vocals?: VocalInfo;
      structure?: {
        sections?: string[];
        has_intro?: boolean;
        has_outro?: boolean;
        has_bridge?: boolean;
      };
      energy?: EnergyInfo;
      production?: ProductionInfo;
      style_prompt?: string;
      tags?: string[];
    };
    const d = data as FlamingoShape;
    return {
      genre: d.genre,
      subgenres: d.subgenres,
      mood: d.mood,
      emotions: d.emotions,
      bpm: d.bpm,
      key: d.key,
      scale: d.scale,
      timeSignature: d.time_signature,
      instruments: d.instruments,
      hasVocals: d.vocals?.present,
      vocalInfo: d.vocals,
      structure: {
        sections: d.structure?.sections,
        hasIntro: d.structure?.has_intro,
        hasOutro: d.structure?.has_outro,
        hasBridge: d.structure?.has_bridge,
      },
      energy: d.energy,
      arousal: d.energy?.arousal,
      valence: d.energy?.valence,
      production: d.production,
      styleDescription: d.style_prompt,
      styleTags: d.tags,
      provider: "flamingo",
    };
  }

  private normalizeLovableAIResult(data: Record<string, unknown>): UnifiedAnalysisResult {
    type LovableShape = {
      genre?: string;
      mood?: string;
      bpm?: number;
      key_signature?: string;
      instruments?: string[];
      arousal?: number;
      valence?: number;
      style_description?: string;
      structure?: string;
    };
    const d = data as LovableShape;
    return {
      genre: d.genre,
      mood: d.mood,
      bpm: d.bpm,
      key: d.key_signature,
      instruments: d.instruments,
      arousal: d.arousal,
      valence: d.valence,
      styleDescription: d.style_description,
      structure: d.structure ? { sections: [d.structure] } : undefined,
      provider: "lovable-ai",
    };
  }

  private normalizeKlangioResult(data: Record<string, unknown>, mode: string): UnifiedAnalysisResult {
    type KNote = {
      pitch?: number;
      start_time?: number;
      startTime?: number;
      end_time?: number;
      endTime?: number;
      velocity?: number;
      note_name?: string;
      noteName?: string;
    };
    type KBeat = { time?: number; confidence?: number };
    type KChord = {
      chord?: string;
      label?: string;
      start_time?: number;
      startTime?: number;
      end_time?: number;
      endTime?: number;
      confidence?: number;
    };
    type KlangioShape = {
      bpm?: number;
      key?: string;
      time_signature?: string;
      notes?: KNote[];
      beats?: KBeat[];
      chords?: KChord[];
      downbeats?: number[];
      files?: { midi?: string; midi_quant?: string; pdf?: string; mxml?: string; gp5?: string };
    };
    const d = data as KlangioShape;
    const result: UnifiedAnalysisResult = { provider: "klangio" };

    if (mode === "transcription") {
      result.notes = d.notes?.map((n) => ({
        pitch: n.pitch ?? 0,
        startTime: n.start_time ?? n.startTime ?? 0,
        endTime: n.end_time ?? n.endTime ?? 0,
        velocity: n.velocity ?? 80,
        noteName: n.note_name ?? n.noteName,
      }));
      result.bpm = d.bpm;
      result.key = d.key;
      result.timeSignature = d.time_signature;
      result.midiUrl = d.files?.midi;
      result.midiQuantUrl = d.files?.midi_quant;
      result.pdfUrl = d.files?.pdf;
      result.musicXmlUrl = d.files?.mxml;
      result.gp5Url = d.files?.gp5;
    }

    if (mode === "beat-tracking") {
      result.beats = d.beats?.map((b) => ({ time: b.time ?? 0, confidence: b.confidence }));
      result.downbeats = d.downbeats;
      result.bpm = d.bpm;
    }

    if (mode === "chord-recognition" || mode === "chord-recognition-extended") {
      result.chords = d.chords?.map((c) => ({
        chord: c.chord ?? c.label ?? "",
        startTime: c.start_time ?? c.startTime ?? 0,
        endTime: c.end_time ?? c.endTime ?? 0,
        confidence: c.confidence,
      }));
      result.key = d.key;
    }

    return result;
  }
}

// ==========================================
// Export Singleton
// ==========================================

export const audioAnalysisService = AudioAnalysisService.getInstance();
export default audioAnalysisService;
