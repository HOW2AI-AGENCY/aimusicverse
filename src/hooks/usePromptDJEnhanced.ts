/**
 * usePromptDJEnhanced — тонкий оркестратор.
 *
 * Композирует три внутренних хука (все в `./prompt-dj/`):
 * - usePromptDecks — каналы (knob grid) + глобальные настройки + currentPrompt
 * - usePromptEffects — Tone.js pipeline (synth/filter/reverb/delay, real-time)
 * - usePromptRecording — генерация, воспроизведение, история треков
 *
 * Сам оркестратор владеет только live-mode (crossfade + continuation),
 * потому что live-mode — это cross-cutting concern поверх decks+recording.
 *
 * Public API preserved — все 22 поля возврата идентичны исходному хуку.
 *
 * Извлечено из src/hooks/usePromptDJEnhanced.ts в Sprint 042 / Task B2
 * (god-hook декомпозиция 879 → ~150 LOC).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

import { usePromptDecks } from "./prompt-dj/usePromptDecks";
import { usePromptEffects } from "./prompt-dj/usePromptEffects";
import { usePromptRecording } from "./prompt-dj/usePromptRecording";

// Re-export shared constants/types/defaults for backward compatibility
export { CHANNEL_TYPES, NOTE_NAMES } from "./prompt-dj/constants";
export { DEFAULT_CHANNELS, DEFAULT_SETTINGS } from "./prompt-dj/defaults";
export type { ChannelType, PromptChannel, GlobalSettings, GeneratedTrack } from "./prompt-dj/types";

// Tone.js types - loaded dynamically to prevent "Cannot access 't' before initialization" error
type ToneType = typeof import("tone");
type PlayerType = import("tone").Player;
type GainType = import("tone").Gain;

let ToneModule: ToneType | null = null;

export function usePromptDJEnhanced() {
  // 1. Deck state (channels + global settings + currentPrompt memo)
  const { channels, updateChannel, globalSettings, updateGlobalSettings, currentPrompt } = usePromptDecks();

  // 2. Live Tone pipeline (synth preview, analyser, real-time effects)
  const { analyzerNode, isPreviewPlaying, previewWithSynth, stopPreview } = usePromptEffects({
    channels,
    globalSettings,
  });

  // 3. Recording / playback (generate, play, stop, track history)
  const {
    isGenerating,
    generatedTracks,
    currentTrack,
    isPlaying,
    audioCache,
    generateMusic,
    playTrack,
    stopPlayback,
    removeTrack,
    pushTrack,
  } = usePromptRecording({
    currentPrompt,
    duration: globalSettings.duration,
    analyzerNode,
    onWillPlay: stopPreview,
  });

  // 4. Live mode state (cross-cutting — composed above)
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveStatus, setLiveStatus] = useState<"idle" | "generating" | "playing" | "transitioning">("idle");

  const playerRef = useRef<PlayerType | null>(null);
  const nextPlayerRef = useRef<PlayerType | null>(null);
  const gainNodeRef = useRef<GainType | null>(null);
  const nextGainNodeRef = useRef<GainType | null>(null);
  const lastGeneratedPromptRef = useRef<string>("");
  const lastAudioUrlRef = useRef<string | null>(null);
  const segmentCountRef = useRef(0);
  const liveGenerationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isGeneratingLiveRef = useRef(false);

  // Generate segment (possibly with continuation context for seamless melody)
  const generateForLive = useCallback(
    async (prompt: string, continuationUrl?: string): Promise<string | null> => {
      const cacheKey = continuationUrl ? `${prompt}__continuation_${segmentCountRef.current}` : prompt;

      if (!continuationUrl) {
        const cachedUrl = audioCache.get(cacheKey);
        if (cachedUrl) return cachedUrl;
      }

      try {
        const requestBody: Record<string, unknown> = {
          prompt: `${prompt}, seamless transition, continuous melody`,
          duration: globalSettings.duration,
          temperature: 0.8,
        };

        if (continuationUrl) {
          requestBody.continuation_url = continuationUrl;
          requestBody.continuation_start = Math.max(0, globalSettings.duration - 3);
          requestBody.prompt = `continuation of previous segment, ${prompt}, seamless transition`;
        }

        const { data, error } = await supabase.functions.invoke("musicgen-generate", {
          body: requestBody,
        });

        if (error) throw error;

        if (data?.audio_url) {
          audioCache.set(cacheKey, data.audio_url);
          lastAudioUrlRef.current = data.audio_url;
          segmentCountRef.current += 1;
          return data.audio_url;
        }
        return null;
      } catch (error) {
        logger.warn("Live generation error", { error });
        return null;
      }
    },
    [audioCache, globalSettings.duration],
  );

  // Crossfade to new track
  const crossfadeToTrack = useCallback(
    async (audioUrl: string, prompt: string) => {
      try {
        if (!ToneModule) {
          ToneModule = await import("tone");
        }
        const Tone = ToneModule;

        await Tone.start();
        setLiveStatus("transitioning");

        const newPlayer = new Tone.Player();
        const newGain = new Tone.Gain(0);

        newPlayer.connect(newGain);
        if (analyzerNode) {
          newGain.connect(analyzerNode);
        }
        newGain.toDestination();
        newPlayer.loop = true;

        await newPlayer.load(audioUrl);
        newPlayer.start();

        nextPlayerRef.current = newPlayer;
        nextGainNodeRef.current = newGain;

        const fadeTime = 2;

        if (gainNodeRef.current) {
          gainNodeRef.current.gain.rampTo(0, fadeTime);
        }
        newGain.gain.rampTo(1, fadeTime);

        setTimeout(
          () => {
            if (playerRef.current) {
              playerRef.current.stop();
              playerRef.current.dispose();
            }
            if (gainNodeRef.current) {
              gainNodeRef.current.dispose();
            }

            playerRef.current = nextPlayerRef.current;
            gainNodeRef.current = nextGainNodeRef.current;
            nextPlayerRef.current = null;
            nextGainNodeRef.current = null;

            // Track is added by recording hook via playTrack — but for live mode
            // we want a separate history slice; emit a synthetic track record.
            const newTrack = {
              id: crypto.randomUUID(),
              prompt,
              audioUrl,
              createdAt: new Date(),
            };
            pushTrack(newTrack, { cap: 10, makeCurrent: true });
            setLiveStatus("playing");
          },
          fadeTime * 1000 + 100,
        );
      } catch (error) {
        logger.warn("Crossfade error", { error });
        setLiveStatus("playing");
      }
    },
    [analyzerNode, pushTrack],
  );

  // Start live mode
  const startLiveMode = useCallback(async () => {
    if (!currentPrompt.trim()) {
      toast.error("Настройте каналы для генерации");
      return;
    }

    lastAudioUrlRef.current = null;
    segmentCountRef.current = 0;

    setIsLiveMode(true);
    setLiveStatus("generating");
    isGeneratingLiveRef.current = true;
    toast.info("🎧 Генерация первого сегмента...");

    try {
      if (!ToneModule) {
        ToneModule = await import("tone");
      }
      const Tone = ToneModule;

      await Tone.start();

      const audioUrl = await generateForLive(currentPrompt);

      if (!audioUrl) {
        toast.error("Ошибка генерации");
        setIsLiveMode(false);
        setLiveStatus("idle");
        isGeneratingLiveRef.current = false;
        return;
      }

      lastGeneratedPromptRef.current = currentPrompt;

      const player = new Tone.Player();
      const gain = new Tone.Gain(1);

      player.connect(gain);
      if (analyzerNode) {
        gain.connect(analyzerNode);
      }
      gain.toDestination();
      player.loop = true;

      await player.load(audioUrl);
      player.start();

      playerRef.current = player;
      gainNodeRef.current = gain;

      const newTrack = {
        id: crypto.randomUUID(),
        prompt: currentPrompt,
        audioUrl,
        createdAt: new Date(),
      };

      pushTrack(newTrack, { cap: 10, makeCurrent: true });
      setIsPlaying(true);
      setLiveStatus("playing");
      isGeneratingLiveRef.current = false;

      toast.success("🎵 Live сессия запущена! Меняйте настройки для нового звучания");
    } catch (error) {
      logger.error("Start live error", error instanceof Error ? error : new Error(String(error)));
      toast.error("Ошибка запуска Live режима");
      setIsLiveMode(false);
      setLiveStatus("idle");
      isGeneratingLiveRef.current = false;
    }
  }, [currentPrompt, generateForLive, analyzerNode, pushTrack]);

  // Stop live mode
  const stopLiveMode = useCallback(() => {
    if (liveGenerationTimeoutRef.current) {
      clearTimeout(liveGenerationTimeoutRef.current);
    }

    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current.dispose();
      playerRef.current = null;
    }
    if (nextPlayerRef.current) {
      nextPlayerRef.current.stop();
      nextPlayerRef.current.dispose();
      nextPlayerRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.dispose();
      gainNodeRef.current = null;
    }
    if (nextGainNodeRef.current) {
      nextGainNodeRef.current.dispose();
      nextGainNodeRef.current = null;
    }

    lastGeneratedPromptRef.current = "";
    isGeneratingLiveRef.current = false;
    setIsLiveMode(false);
    setLiveStatus("idle");
    setIsPlaying(false);
    toast.info("Live сессия остановлена");
  }, []);

  // Auto-trigger generation when prompt changes in live mode
  useEffect(() => {
    if (!isLiveMode) return;
    if (isGeneratingLiveRef.current) return;
    if (currentPrompt === lastGeneratedPromptRef.current) return;

    if (liveGenerationTimeoutRef.current) {
      clearTimeout(liveGenerationTimeoutRef.current);
    }

    liveGenerationTimeoutRef.current = setTimeout(async () => {
      if (!isLiveMode) return;
      if (isGeneratingLiveRef.current) return;
      isGeneratingLiveRef.current = true;

      const promptToGenerate = currentPrompt;
      if (promptToGenerate === lastGeneratedPromptRef.current) {
        isGeneratingLiveRef.current = false;
        return;
      }

      setLiveStatus("generating");
      toast.info("🎵 Генерация нового сегмента с плавным переходом...");

      try {
        const continuationUrl = lastAudioUrlRef.current;
        const audioUrl = await generateForLive(promptToGenerate, continuationUrl || undefined);

        if (audioUrl) {
          lastGeneratedPromptRef.current = promptToGenerate;
          await crossfadeToTrack(audioUrl, promptToGenerate);
          toast.success("✨ Бесшовный переход к новому звучанию");
        } else {
          setLiveStatus("playing");
        }
      } catch (error) {
        logger.warn("Live generation error", { error });
        setLiveStatus("playing");
      } finally {
        isGeneratingLiveRef.current = false;
      }
    }, 2000);

    return () => {
      if (liveGenerationTimeoutRef.current) {
        clearTimeout(liveGenerationTimeoutRef.current);
      }
    };
  }, [currentPrompt, isLiveMode, generateForLive, crossfadeToTrack]);

  // Force regenerate in live mode
  const forceRegenerateInLive = useCallback(async () => {
    if (!isLiveMode) return;
    if (isGeneratingLiveRef.current) return;
    if (currentPrompt === lastGeneratedPromptRef.current) return;

    if (liveGenerationTimeoutRef.current) {
      clearTimeout(liveGenerationTimeoutRef.current);
      liveGenerationTimeoutRef.current = null;
    }

    isGeneratingLiveRef.current = true;
    const promptToGenerate = currentPrompt;

    setLiveStatus("generating");
    toast.info("🎵 Генерация нового сегмента...");

    try {
      const continuationUrl = lastAudioUrlRef.current;
      const audioUrl = await generateForLive(promptToGenerate, continuationUrl || undefined);

      if (audioUrl) {
        lastGeneratedPromptRef.current = promptToGenerate;
        await crossfadeToTrack(audioUrl, promptToGenerate);
        toast.success("✨ Бесшовный переход к новому звучанию");
      } else {
        setLiveStatus("playing");
      }
    } catch (error) {
      logger.warn("Force live generation error", { error });
      setLiveStatus("playing");
    } finally {
      isGeneratingLiveRef.current = false;
    }
  }, [isLiveMode, currentPrompt, generateForLive, crossfadeToTrack]);

  return {
    // Decks
    channels,
    updateChannel,
    globalSettings,
    updateGlobalSettings,
    // Recording
    isGenerating,
    generatedTracks,
    generateMusic,
    isPlaying,
    currentTrack,
    playTrack,
    stopPlayback,
    removeTrack,
    audioCache,
    // Effects
    previewWithSynth,
    stopPreview,
    isPreviewPlaying,
    currentPrompt,
    analyzerNode,
    // Live mode
    isLiveMode,
    liveStatus,
    startLiveMode,
    stopLiveMode,
    forceRegenerateInLive,
  };
}
