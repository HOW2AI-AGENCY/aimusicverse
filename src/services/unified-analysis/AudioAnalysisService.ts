/**
 * Unified Audio Analysis Service
 * Consolidates all AI analyzers under a single API.
 *
 * As of the D6 refactor (sprints-042-045), the public analysis methods
 * return `Result<T, AudioAnalysisServiceError>` instead of throwing. Existing
 * callers (e.g. `useUnifiedAnalysis`) that expect thrown errors can use the
 * `tryAnalyze` / `tryAnalyzeWithFlamingo` / etc. throwing wrappers, which
 * preserve the historical API surface.
 *
 * @see src/lib/result.ts for the Result contract
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { ok, err } from "@/lib/result";
import type { Result } from "@/lib/result";
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
import {
  getDefaultProvider,
  mapTypeToLovableAI,
  mapTypeToKlangioMode,
  mergeResults,
  normalizeFlamingoResult,
  normalizeLovableAIResult,
  normalizeKlangioResult,
} from "./audioAnalysisNormalizers";

const log = logger.child({ module: "AudioAnalysisService" });

// ==========================================
// Custom error class
// ==========================================

/**
 * Domain error for AudioAnalysisService. Carries the failing step
 * (provider + mode) and the original underlying error for diagnostics.
 */
export class AudioAnalysisServiceError extends Error {
  public code: string;
  public provider?: AnalysisProvider;
  public mode?: string;
  public details?: unknown;

  constructor(
    message: string,
    code: string,
    options: { provider?: AnalysisProvider; mode?: string; details?: unknown; cause?: unknown } = {},
  ) {
    super(message);
    this.name = "AudioAnalysisServiceError";
    this.code = code;
    this.provider = options.provider;
    this.mode = options.mode;
    this.details = options.details;
    // Preserve the underlying error for `cause` chains (ES2022).
    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

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

  // ============================================================================
  // Result-returning public surface (preferred API)
  // ============================================================================

  /**
   * Main analysis entry point — Result-returning variant.
   */
  async analyze(request: AnalysisRequest): Promise<Result<UnifiedAnalysisResult, AudioAnalysisServiceError>> {
    const { onProgress } = request;

    log.info("Starting unified analysis", {
      types: request.analysisTypes,
      hasAudioUrl: !!request.audioUrl,
      trackId: request.trackId,
    });

    onProgress?.("analyzing", "Начинаем анализ...");

    // Resolve audio URL if not provided
    const audioUrlResult = await this.resolveAudioUrl(request);
    if (audioUrlResult.kind === "err") {
      onProgress?.("failed", audioUrlResult.error.message);
      return audioUrlResult;
    }
    const audioUrl = audioUrlResult.value;
    if (!audioUrl) {
      const e = new AudioAnalysisServiceError("Не удалось получить аудио URL", "AUDIO_URL_RESOLVE_FAILED", {
        details: { request: { trackId: request.trackId, referenceId: request.referenceId } },
      });
      onProgress?.("failed", e.message);
      return err(e);
    }

    // Route to appropriate providers
    const routeResult = await this.routeToProviders(audioUrl, request);
    if (routeResult.kind === "err") {
      onProgress?.("failed", routeResult.error.message);
      return routeResult;
    }

    // Merge all results
    const mergedResult = mergeResults(routeResult.value);

    // Save to database if trackId provided
    if (request.trackId && request.userId) {
      await this.saveToDatabase(request.trackId, request.userId, mergedResult);
    }

    onProgress?.("completed", "Анализ завершён");
    log.info("Analysis completed", { trackId: request.trackId });

    return ok(mergedResult);
  }

  /**
   * Throwing wrapper for {@link analyze}. Preserves the historical throwing
   * API for callers that have not migrated to Result pattern-matching.
   */
  async tryAnalyze(request: AnalysisRequest): Promise<UnifiedAnalysisResult> {
    const r = await this.analyze(request);
    if (r.kind === "err") throw r.error;
    return r.value;
  }

  /**
   * Analyze with Flamingo (comprehensive style analysis) — Result variant.
   */
  async analyzeWithFlamingo(
    audioUrl: string,
    options: {
      trackId?: string;
      referenceId?: string;
      customPrompt?: string;
    } = {},
  ): Promise<Result<UnifiedAnalysisResult, AudioAnalysisServiceError>> {
    log.info("Calling Flamingo analysis", { audioUrl: audioUrl.slice(0, 50) });

    try {
      const { data, error } = await supabase.functions.invoke("analyze-audio-flamingo", {
        body: {
          audio_url: audioUrl,
          track_id: options.trackId,
          reference_id: options.referenceId,
          custom_prompt: options.customPrompt,
          analysis_type: "auto",
        },
      });

      if (error) {
        return err(
          new AudioAnalysisServiceError("Flamingo invocation failed", "FLAMINGO_INVOKE_FAILED", {
            provider: "flamingo",
            details: { error },
            cause: error,
          }),
        );
      }
      if (!data.success) {
        return err(
          new AudioAnalysisServiceError(data.error || "Flamingo analysis failed", "FLAMINGO_FAILED", {
            provider: "flamingo",
            details: { data },
          }),
        );
      }

      return ok(normalizeFlamingoResult(data.parsed));
    } catch (error) {
      log.error("Flamingo analysis threw", { error });
      return err(
        new AudioAnalysisServiceError(
          error instanceof Error ? error.message : "Flamingo analysis threw",
          "FLAMINGO_THREW",
          { provider: "flamingo", cause: error },
        ),
      );
    }
  }

  /**
   * Throwing wrapper for {@link analyzeWithFlamingo}.
   */
  async tryAnalyzeWithFlamingo(
    audioUrl: string,
    options: {
      trackId?: string;
      referenceId?: string;
      customPrompt?: string;
    } = {},
  ): Promise<UnifiedAnalysisResult> {
    const r = await this.analyzeWithFlamingo(audioUrl, options);
    if (r.kind === "err") throw r.error;
    return r.value;
  }

  /**
   * Analyze with Lovable AI (emotion/engagement) — Result variant.
   */
  async analyzeWithLovableAI(
    audioUrl: string,
    options: {
      trackId?: string;
      analysisTypes?: string[];
    } = {},
  ): Promise<Result<UnifiedAnalysisResult, AudioAnalysisServiceError>> {
    log.info("Calling Lovable AI analysis", { audioUrl: audioUrl.slice(0, 50) });

    try {
      const { data, error } = await supabase.functions.invoke("replicate-music-analysis", {
        body: {
          trackId: options.trackId,
          audioUrl,
          analysisTypes: options.analysisTypes || ["bpm", "emotion", "approachability"],
        },
      });

      if (error) {
        return err(
          new AudioAnalysisServiceError("Lovable AI invocation failed", "LOVABLE_AI_INVOKE_FAILED", {
            provider: "lovable-ai",
            details: { error },
            cause: error,
          }),
        );
      }
      if (!data.success) {
        return err(
          new AudioAnalysisServiceError(data.error || "Lovable AI analysis failed", "LOVABLE_AI_FAILED", {
            provider: "lovable-ai",
            details: { data },
          }),
        );
      }

      return ok(normalizeLovableAIResult(data.results));
    } catch (error) {
      log.error("Lovable AI analysis threw", { error });
      return err(
        new AudioAnalysisServiceError(
          error instanceof Error ? error.message : "Lovable AI analysis threw",
          "LOVABLE_AI_THREW",
          { provider: "lovable-ai", cause: error },
        ),
      );
    }
  }

  /**
   * Throwing wrapper for {@link analyzeWithLovableAI}.
   */
  async tryAnalyzeWithLovableAI(
    audioUrl: string,
    options: {
      trackId?: string;
      analysisTypes?: string[];
    } = {},
  ): Promise<UnifiedAnalysisResult> {
    const r = await this.analyzeWithLovableAI(audioUrl, options);
    if (r.kind === "err") throw r.error;
    return r.value;
  }

  /**
   * Analyze with Klangio (transcription/beats/chords) — Result variant.
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
  ): Promise<Result<UnifiedAnalysisResult, AudioAnalysisServiceError>> {
    log.info("Calling Klangio analysis", { mode: options.mode });

    try {
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

      if (error) {
        return err(
          new AudioAnalysisServiceError("Klangio invocation failed", "KLANGIO_INVOKE_FAILED", {
            provider: "klangio",
            mode: options.mode,
            details: { error },
            cause: error,
          }),
        );
      }
      if (!data.success) {
        return err(
          new AudioAnalysisServiceError(data.error || "Klangio analysis failed", "KLANGIO_FAILED", {
            provider: "klangio",
            mode: options.mode,
            details: { data },
          }),
        );
      }

      return ok(normalizeKlangioResult(data, options.mode));
    } catch (error) {
      log.error("Klangio analysis threw", { error });
      return err(
        new AudioAnalysisServiceError(
          error instanceof Error ? error.message : "Klangio analysis threw",
          "KLANGIO_THREW",
          { provider: "klangio", mode: options.mode, cause: error },
        ),
      );
    }
  }

  /**
   * Throwing wrapper for {@link analyzeWithKlangio}.
   */
  async tryAnalyzeWithKlangio(
    audioUrl: string,
    options: Parameters<AudioAnalysisService["analyzeWithKlangio"]>[1],
  ): Promise<UnifiedAnalysisResult> {
    const r = await this.analyzeWithKlangio(audioUrl, options);
    if (r.kind === "err") throw r.error;
    return r.value;
  }

  /**
   * Quick BPM detection (local browser-based).
   *
   * Returns `Ok<number | null>` — `null` means "couldn't detect, but no hard
   * failure". A thrown `Error` is captured into `Err<AudioAnalysisServiceError>`.
   */
  async detectBPMLocal(audioUrl: string): Promise<Result<number | null, AudioAnalysisServiceError>> {
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
      return ok(Math.round(detectedBpm));
    } catch (error) {
      log.warn("Local BPM detection failed", { error: String(error) });
      // "Soft" failure: caller treats null as "no result", not as an error.
      return ok(null);
    }
  }

  /**
   * Save analysis results to database. Handles both insert and update.
   */
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
  // Private Helpers
  // ==========================================

  /**
   * Now Result-returning; any I/O error is captured as Err instead of thrown.
   */
  private async resolveAudioUrl(request: AnalysisRequest): Promise<Result<string | null, AudioAnalysisServiceError>> {
    try {
      if (request.audioUrl) return ok(request.audioUrl);

      if (request.audioFile) {
        // Upload file to storage
        const fileName = `analysis/${Date.now()}-${request.audioFile.name}`;
        const { error } = await supabase.storage.from("project-assets").upload(fileName, request.audioFile);

        if (error) {
          return err(
            new AudioAnalysisServiceError("Audio file upload failed", "AUDIO_UPLOAD_FAILED", {
              details: { error },
              cause: error,
            }),
          );
        }

        const { data } = supabase.storage.from("project-assets").getPublicUrl(fileName);

        return ok(data.publicUrl);
      }

      if (request.trackId) {
        const { data, error } = await supabase.from("tracks").select("audio_url").eq("id", request.trackId).single();

        if (error) {
          return err(
            new AudioAnalysisServiceError("Track lookup failed", "TRACK_LOOKUP_FAILED", {
              details: { error, trackId: request.trackId },
              cause: error,
            }),
          );
        }

        return ok(data?.audio_url || null);
      }

      if (request.referenceId) {
        const { data, error } = await supabase
          .from("reference_audio")
          .select("file_url")
          .eq("id", request.referenceId)
          .single();

        if (error) {
          return err(
            new AudioAnalysisServiceError("Reference lookup failed", "REFERENCE_LOOKUP_FAILED", {
              details: { error, referenceId: request.referenceId },
              cause: error,
            }),
          );
        }

        return ok(data?.file_url || null);
      }

      return ok(null);
    } catch (error) {
      return err(
        new AudioAnalysisServiceError(
          error instanceof Error ? error.message : "resolveAudioUrl threw",
          "RESOLVE_AUDIO_URL_THREW",
          { cause: error },
        ),
      );
    }
  }

  /**
   * Provider routing. Wraps each provider call in try/catch (the providers
   * themselves may throw as well as return Err). Logs provider failures as
   * warnings and returns whatever succeeded.
   */
  private async routeToProviders(
    audioUrl: string,
    request: AnalysisRequest,
  ): Promise<Result<UnifiedAnalysisResult[], AudioAnalysisServiceError>> {
    try {
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
        const targetProvider = provider || getDefaultProvider(type);
        providerTasks[targetProvider].push(type);
      }

      // Execute in parallel
      const promises: Promise<UnifiedAnalysisResult>[] = [];

      if (providerTasks["flamingo"].length > 0) {
        promises.push(
          this.tryAnalyzeWithFlamingo(audioUrl, {
            trackId: request.trackId,
            referenceId: request.referenceId,
            customPrompt: request.customPrompt,
          }),
        );
      }

      if (providerTasks["lovable-ai"].length > 0) {
        promises.push(
          this.tryAnalyzeWithLovableAI(audioUrl, {
            trackId: request.trackId,
            analysisTypes: providerTasks["lovable-ai"].map((t) => mapTypeToLovableAI(t)),
          }),
        );
      }

      if (providerTasks["klangio"].length > 0) {
        // Klangio needs separate calls for each mode
        for (const type of providerTasks["klangio"]) {
          const mode = mapTypeToKlangioMode(type);
          if (mode) {
            promises.push(
              this.tryAnalyzeWithKlangio(audioUrl, {
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
        if (localBpm.kind === "ok" && localBpm.value) {
          results.push({ bpm: localBpm.value, provider: "local" });
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

      return ok(results);
    } catch (error) {
      return err(
        new AudioAnalysisServiceError(
          error instanceof Error ? error.message : "routeToProviders threw",
          "ROUTE_PROVIDERS_THREW",
          { cause: error },
        ),
      );
    }
  }
}

// ==========================================
// Export Singleton
// ==========================================

export const audioAnalysisService = AudioAnalysisService.getInstance();
export default audioAnalysisService;
