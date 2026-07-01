/**
 * usePromptEffects — внутренний хук PromptDJ.
 *
 * Owns the live Tone.js pipeline:
 * - AnalyserNode lifecycle (init on mount, dispose on unmount)
 * - PolySynth + Filter + Reverb + FeedbackDelay chain (previewWithSynth)
 * - Real-time parameter ramps: BPM, brightness osc, filter freq, reverb wet
 * - Scale notes + pattern regeneration derived from deck state changes
 * - Transport start/stop for preview mode
 *
 * Wires onto deck state (channels + globalSettings) via the `decks` argument.
 *
 * Извлечено из src/hooks/usePromptDJEnhanced.ts в Sprint 042 / Task B2
 * (god-hook декомпозиция 879 → <500 LOC).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { computeScaleNotes } from "./promptBuilder";
import type { PromptChannel, GlobalSettings } from "./types";

// Tone.js types - loaded dynamically to prevent "Cannot access 't' before initialization" error
type ToneType = typeof import("tone");
type PlayerType = import("tone").Player;
type PolySynthType = import("tone").PolySynth;
type SequenceType = import("tone").Sequence;
type AnalyserType = import("tone").Analyser;
type ReverbType = import("tone").Reverb;
type FilterType = import("tone").Filter;
type FeedbackDelayType = import("tone").FeedbackDelay;

/**
 * Module-level Tone cache. Imported once on first use, then reused.
 * Survives hook unmount so subsequent mounts skip the dynamic import.
 */
let ToneModule: ToneType | null = null;

export interface UsePromptEffectsParams {
  channels: PromptChannel[];
  globalSettings: GlobalSettings;
}

export interface UsePromptEffectsResult {
  /** Initialised FFT analyser node (live while mounted; null before init). */
  analyzerNode: AnalyserType | null;
  /** True while the synth preview is actively playing. */
  isPreviewPlaying: boolean;
  /** Start the PolySynth+Filter+Reverb+Delay preview chain. */
  previewWithSynth: () => Promise<void>;
  /** Stop the preview, dispose the chain, stop the Transport. */
  stopPreview: () => void;
}

export function usePromptEffects({ channels, globalSettings }: UsePromptEffectsParams): UsePromptEffectsResult {
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [, setAnalyserState] = useState<0 | 1>(0); // tick used to re-render when analyser becomes available

  // Tone.js refs (kept alive across renders)
  const playerRef = useRef<PlayerType | null>(null);
  const synthRef = useRef<PolySynthType | null>(null);
  const sequenceRef = useRef<SequenceType | null>(null);
  const analyzerRef = useRef<AnalyserType | null>(null);
  const reverbRef = useRef<ReverbType | null>(null);
  const filterRef = useRef<FilterType | null>(null);
  const delayRef = useRef<FeedbackDelayType | null>(null);

  // Pattern state for real-time updates
  const patternRef = useRef<(string | null)[]>([]);
  const scaleNotesRef = useRef<string[]>([]);

  // Initialize analyzer with dynamic import
  useEffect(() => {
    let cancelled = false;
    const initAnalyzer = async () => {
      if (!ToneModule) {
        ToneModule = await import("tone");
      }
      if (cancelled) return;
      analyzerRef.current = new ToneModule.Analyser("fft", 64);
      // bump tick so consumers reading `analyzerNode` re-render
      setAnalyserState((t) => (t === 0 ? 1 : 0));
    };
    initAnalyzer();

    return () => {
      cancelled = true;
      analyzerRef.current?.dispose();
      playerRef.current?.dispose();
      synthRef.current?.dispose();
      sequenceRef.current?.dispose();
      reverbRef.current?.dispose();
      filterRef.current?.dispose();
      delayRef.current?.dispose();
      analyzerRef.current = null;
    };
  }, []);

  // REAL-TIME: Update BPM when it changes
  useEffect(() => {
    if (isPreviewPlaying && ToneModule) {
      ToneModule.getTransport().bpm.rampTo(globalSettings.bpm, 0.2);
    }
  }, [globalSettings.bpm, isPreviewPlaying]);

  // REAL-TIME: Update synth sound when brightness changes
  useEffect(() => {
    if (isPreviewPlaying && synthRef.current && ToneModule) {
      const oscType =
        globalSettings.brightness > 0.7 ? "sawtooth" : globalSettings.brightness > 0.4 ? "triangle" : "sine";

      synthRef.current.set({
        oscillator: { type: oscType as "sawtooth" | "triangle" | "sine" },
        envelope: {
          attack: 0.02 + (1 - globalSettings.brightness) * 0.1,
          release: 0.3 + (1 - globalSettings.brightness) * 0.4,
        },
      });
    }
  }, [globalSettings.brightness, isPreviewPlaying]);

  // REAL-TIME: Update filter based on brightness
  useEffect(() => {
    if (isPreviewPlaying && filterRef.current) {
      const freq = 200 + globalSettings.brightness * 4000;
      filterRef.current.frequency.rampTo(freq, 0.1);
    }
  }, [globalSettings.brightness, isPreviewPlaying]);

  // REAL-TIME: Update reverb based on mood/texture
  useEffect(() => {
    if (isPreviewPlaying && reverbRef.current) {
      const moodChannel = channels.find((c) => c.type === "mood");
      const textureChannel = channels.find((c) => c.type === "texture");

      const isDreamy =
        moodChannel?.value?.toLowerCase().includes("dreamy") ||
        textureChannel?.value?.toLowerCase().includes("airy") ||
        textureChannel?.value?.toLowerCase().includes("ambient");

      reverbRef.current.wet.rampTo(isDreamy ? 0.6 : 0.2, 0.3);
    }
  }, [channels, isPreviewPlaying]);

  // REAL-TIME: Update scale notes when key/scale changes
  useEffect(() => {
    scaleNotesRef.current = computeScaleNotes(globalSettings.key, globalSettings.scale);
  }, [globalSettings.key, globalSettings.scale]);

  // REAL-TIME: Regenerate pattern when density changes
  useEffect(() => {
    if (isPreviewPlaying && scaleNotesRef.current.length > 0) {
      const energyChannel = channels.find((c) => c.type === "energy");
      const isHighEnergy =
        energyChannel?.enabled &&
        (energyChannel?.weight > 0.6 ||
          energyChannel?.value?.toLowerCase().includes("high") ||
          energyChannel?.value?.toLowerCase().includes("intense"));

      const stepCount = isHighEnergy ? 16 : 8;
      const noteDensity = 0.2 + globalSettings.density * 0.6;

      const newPattern: (string | null)[] = [];
      for (let i = 0; i < stepCount; i++) {
        if (Math.random() < noteDensity) {
          newPattern.push(scaleNotesRef.current[Math.floor(Math.random() * scaleNotesRef.current.length)]);
        } else {
          newPattern.push(null);
        }
      }
      patternRef.current = newPattern;

      // Update sequence events
      if (sequenceRef.current) {
        sequenceRef.current.events = newPattern;
      }
    }
  }, [globalSettings.density, channels, isPreviewPlaying]);

  // Start real-time preview with synth
  const previewWithSynth = useCallback(async () => {
    try {
      if (!ToneModule) {
        ToneModule = await import("tone");
      }
      const Tone = ToneModule;

      await Tone.start();
      // Stop any running preview first
      if (sequenceRef.current) {
        sequenceRef.current.stop();
        sequenceRef.current.dispose();
        sequenceRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
      if (reverbRef.current) {
        reverbRef.current.dispose();
        reverbRef.current = null;
      }
      if (filterRef.current) {
        filterRef.current.dispose();
        filterRef.current = null;
      }
      if (delayRef.current) {
        delayRef.current.dispose();
        delayRef.current = null;
      }

      // Create filter for brightness control
      const filter = new Tone.Filter({
        frequency: 200 + globalSettings.brightness * 4000,
        type: "lowpass",
        rolloff: -12,
      });
      filterRef.current = filter;

      // Create reverb
      const reverb = new Tone.Reverb({
        decay: 2.5,
        wet: 0.2,
        preDelay: 0.01,
      });
      await reverb.generate();
      reverbRef.current = reverb;

      // Create delay for texture
      const delay = new Tone.FeedbackDelay({
        delayTime: "8n",
        feedback: 0.2,
        wet: 0.15,
      });
      delayRef.current = delay;

      // Create synth based on settings
      const oscType =
        globalSettings.brightness > 0.7 ? "sawtooth" : globalSettings.brightness > 0.4 ? "triangle" : "sine";

      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: oscType as "sawtooth" | "triangle" | "sine" },
        envelope: {
          attack: 0.02 + (1 - globalSettings.brightness) * 0.1,
          decay: 0.2,
          sustain: 0.4,
          release: 0.3 + (1 - globalSettings.brightness) * 0.4,
        },
      });

      // Connect chain: synth -> filter -> delay -> reverb -> analyzer -> destination
      synth.connect(filter);
      filter.connect(delay);
      delay.connect(reverb);

      if (analyzerRef.current) {
        reverb.connect(analyzerRef.current);
      }
      reverb.toDestination();

      synthRef.current = synth;

      // Generate initial scale notes
      scaleNotesRef.current = computeScaleNotes(globalSettings.key, globalSettings.scale);

      // Generate initial pattern
      const energyChannel = channels.find((c) => c.type === "energy");
      const isHighEnergy =
        energyChannel?.enabled &&
        (energyChannel?.weight > 0.6 ||
          energyChannel?.value?.toLowerCase().includes("high") ||
          energyChannel?.value?.toLowerCase().includes("intense"));

      const stepCount = isHighEnergy ? 16 : 8;
      const noteDensity = 0.2 + globalSettings.density * 0.6;

      const pattern: (string | null)[] = [];
      for (let i = 0; i < stepCount; i++) {
        if (Math.random() < noteDensity) {
          pattern.push(scaleNotesRef.current[Math.floor(Math.random() * scaleNotesRef.current.length)]);
        } else {
          pattern.push(null);
        }
      }
      patternRef.current = pattern;

      Tone.getTransport().bpm.value = globalSettings.bpm;

      const sequence = new Tone.Sequence(
        (time, note) => {
          if (note && synthRef.current) {
            const noteLength = isHighEnergy ? "16n" : "8n";
            synthRef.current.triggerAttackRelease(note, noteLength, time);
          }
        },
        pattern,
        isHighEnergy ? "16n" : "8n",
      );

      sequence.loop = true;
      sequence.start(0);
      sequenceRef.current = sequence;

      Tone.getTransport().start();
      setIsPreviewPlaying(true);
    } catch (error) {
      logger.error("Preview error", error instanceof Error ? error : new Error(String(error)));
      toast.error("Ошибка запуска превью");
    }
  }, [globalSettings, channels]);

  // Stop preview
  const stopPreview = useCallback(() => {
    if (!ToneModule) return;
    const Tone = ToneModule;

    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
    if (reverbRef.current) {
      reverbRef.current.dispose();
      reverbRef.current = null;
    }
    if (filterRef.current) {
      filterRef.current.dispose();
      filterRef.current = null;
    }
    if (delayRef.current) {
      delayRef.current.dispose();
      delayRef.current = null;
    }
    Tone.getTransport().stop();
    setIsPreviewPlaying(false);
  }, []);

  return {
    analyzerNode: analyzerRef.current,
    isPreviewPlaying,
    previewWithSynth,
    stopPreview,
  };
}
