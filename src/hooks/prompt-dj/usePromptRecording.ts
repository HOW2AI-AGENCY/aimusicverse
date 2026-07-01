/**
 * usePromptRecording — внутренний хук PromptDJ.
 *
 * Owns the "recording" state slice:
 * - isGenerating, generatedTracks (last-N session history)
 * - currentTrack, isPlaying (active playback)
 * - audioCache: prompt-string → audio URL map (cheap in-memory dedupe)
 * - generateMusic (calls musicgen-generate edge function)
 * - playTrack / stopPlayback (Tone.Player + buffer pool)
 * - removeTrack
 *
 * Tone integration: lazy-loads Tone on first playback, uses useAudioBufferPool
 * to skip network round-trips on repeated prompts.
 *
 * Извлечено из src/hooks/usePromptDJEnhanced.ts в Sprint 042 / Task B2
 * (god-hook декомпозиция 879 → <500 LOC).
 */

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { useAudioBufferPool } from "@/hooks/useAudioBufferPool";
import type { GeneratedTrack } from "./types";

// Tone.js types - loaded dynamically
type ToneType = typeof import("tone");
type PlayerType = import("tone").Player;
type AnalyserType = import("tone").Analyser;

let ToneModule: ToneType | null = null;

// Module-level URL cache for prompts (separate from buffer pool — URLs are
// cheap to keep around; buffers are evicted by LRU in useAudioBufferPool).
const globalAudioCache = new Map<string, string>();

export interface UsePromptRecordingParams {
  currentPrompt: string;
  duration: number;
  /** Analyser from usePromptEffects; used to wire player → visualizer. */
  analyzerNode: AnalyserType | null;
  /** Stop any active synth preview before playing a generated track. */
  onWillPlay?: () => void;
}

export interface UsePromptRecordingResult {
  isGenerating: boolean;
  generatedTracks: GeneratedTrack[];
  currentTrack: GeneratedTrack | null;
  isPlaying: boolean;
  audioCache: Map<string, string>;
  generateMusic: () => Promise<void>;
  playTrack: (track: GeneratedTrack) => Promise<void>;
  stopPlayback: () => void;
  removeTrack: (id: string) => void;
  /** Push a synthetic track record (used by live-mode crossfade/orchestrator). */
  pushTrack: (track: GeneratedTrack, opts?: { makeCurrent?: boolean; cap?: number }) => void;
}

export function usePromptRecording({
  currentPrompt,
  duration,
  analyzerNode,
  onWillPlay,
}: UsePromptRecordingParams): UsePromptRecordingResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null);

  const playerRef = useRef<PlayerType | null>(null);
  const audioCacheRef = useRef(globalAudioCache);

  const { getBuffer, setBuffer } = useAudioBufferPool();

  // Generate music with caching
  const generateMusic = useCallback(async () => {
    if (!currentPrompt.trim()) {
      toast.error("Настройте каналы для генерации");
      return;
    }

    // Check cache first
    const cachedUrl = audioCacheRef.current.get(currentPrompt);
    if (cachedUrl) {
      const cachedTrack: GeneratedTrack = {
        id: crypto.randomUUID(),
        prompt: currentPrompt,
        audioUrl: cachedUrl,
        createdAt: new Date(),
      };
      setGeneratedTracks((prev) => [cachedTrack, ...prev]);
      toast.success("Трек загружен из кэша!");
      void playTrackInternal(cachedTrack);
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("musicgen-generate", {
        body: {
          prompt: currentPrompt,
          duration,
          temperature: 1.0,
        },
      });

      if (error) throw error;

      if (data?.audio_url) {
        // Cache the result
        audioCacheRef.current.set(currentPrompt, data.audio_url);

        const newTrack: GeneratedTrack = {
          id: crypto.randomUUID(),
          prompt: currentPrompt,
          audioUrl: data.audio_url,
          createdAt: new Date(),
        };

        setGeneratedTracks((prev) => [newTrack, ...prev]);
        toast.success("Трек сгенерирован!");
        void playTrackInternal(newTrack);
      }
    } catch (error) {
      logger.error("Generation error", error instanceof Error ? error : new Error(String(error)));
      toast.error("Ошибка генерации");
    } finally {
      setIsGenerating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- playTrackInternal defined inline below
  }, [currentPrompt, duration]);

  // Internal play (avoids circular ref) — uses refs for player + analyser.
  const playTrackInternal = useCallback(
    async (track: GeneratedTrack) => {
      try {
        if (!ToneModule) {
          ToneModule = await import("tone");
        }
        const Tone = ToneModule;

        await Tone.start();
        onWillPlay?.();

        if (playerRef.current) {
          playerRef.current.stop();
          playerRef.current.dispose();
        }

        // Check buffer pool first
        const cachedBuffer = getBuffer(track.prompt);

        const player = new Tone.Player();

        if (analyzerNode) {
          player.connect(analyzerNode);
        }
        player.toDestination();

        if (cachedBuffer && cachedBuffer.loaded) {
          player.buffer = cachedBuffer;
          player.start();
        } else {
          await player.load(track.audioUrl);
          player.start();

          // Cache buffer for future use
          if (player.buffer) {
            setBuffer(track.prompt, player.buffer);
          }
        }

        playerRef.current = player;
        setCurrentTrack(track);
        setIsPlaying(true);

        player.onstop = () => {
          setIsPlaying(false);
        };
      } catch (error) {
        logger.error("Playback error", error instanceof Error ? error : new Error(String(error)));
        toast.error("Ошибка воспроизведения");
      }
    },
    [analyzerNode, getBuffer, setBuffer, onWillPlay],
  );

  // Public playTrack — wraps internal so callers can replay arbitrary tracks
  const playTrack = useCallback((track: GeneratedTrack) => playTrackInternal(track), [playTrackInternal]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    setIsPlaying(false);
  }, []);

  // Remove track from history; stop if it's the currently-playing one
  const removeTrack = useCallback((id: string) => {
    setGeneratedTracks((prev) => prev.filter((t) => t.id !== id));
    setCurrentTrack((current) => {
      if (current?.id === id) {
        if (playerRef.current) {
          playerRef.current.stop();
        }
        setIsPlaying(false);
        return null;
      }
      return current;
    });
  }, []);

  /**
   * Push a synthetic track record. Used by live-mode orchestrator when
   * starting a session or crossfading to a new segment. Optional `cap`
   * keeps the history bounded (live mode uses cap=10).
   */
  const pushTrack = useCallback((track: GeneratedTrack, opts?: { makeCurrent?: boolean; cap?: number }) => {
    setGeneratedTracks((prev) => {
      const next = [track, ...prev];
      return typeof opts?.cap === "number" ? next.slice(0, opts.cap) : next;
    });
    if (opts?.makeCurrent !== false) {
      setCurrentTrack(track);
    }
  }, []);

  return {
    isGenerating,
    generatedTracks,
    currentTrack,
    isPlaying,
    audioCache: audioCacheRef.current,
    generateMusic,
    playTrack,
    stopPlayback,
    removeTrack,
    pushTrack,
  };
}
