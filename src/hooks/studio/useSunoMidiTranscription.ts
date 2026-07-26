import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSunoMidi } from "@/hooks/generation/useSunoMidi";
import { useReplicateMidiTranscription } from "@/hooks/studio/useReplicateMidiTranscription";
import { logger } from "@/lib/logger";

/**
 * Sprint 053-A3: Unified MIDI transcription hook — Suno primary, Replicate fallback.
 *
 * Strategy (graceful degradation):
 *   1. Try Suno via `useSunoMidi.generate(trackVersionId)`.
 *   2. If Suno errors or times out (default 60s), automatically fall back to Replicate
 *      transcription via the existing `useReplicateMidiTranscription` hook.
 *   3. The UI consumer gets a single `transcribe({ trackVersionId, trackId?, audioUrl })`
 *      entry point and a `{ state, provider, midiUrl, error, isTranscribing }` shape.
 *
 * Why 60s? Suno's MIDI endpoint is the slowest task type (per _shared/suno-details.ts
 * BACKOFF_MS_BY_TYPE.midi = 5000ms × ~12 attempts = ~60s typical p95). 60s gives Suno
 * a fair chance before we throw good money after bad.
 *
 * Replicate contract (see useReplicateMidiTranscription.ts):
 *   - Exposes a TanStack useMutation: { mutateAsync({ audioUrl, trackId?, stemId?, model? }) }
 *   - Returns whatever `invokeReplicateMidiTranscription` resolves to — for now we
 *     treat any successful (non-throwing) resolution as success and rely on the
 *     callback-side UPDATE of track_versions.midi_url to surface the new state.
 */

const SUNO_TIMEOUT_MS = 60_000;

export type MidiProvider = "suno" | "replicate";
export type MidiTranscriptionState = "idle" | "suno" | "replicate" | "done" | "error";

export interface MidiTranscriptionResult {
  /** Always the current midi_url on the track_version row after transcription. */
  midiUrl: string;
  provider: MidiProvider;
}

export interface MidiTranscribeInput {
  trackVersionId: string;
  /** Required for Replicate fallback path. */
  audioUrl: string;
  /** Suno stem-separation taskId — required to use the Suno MIDI endpoint. */
  stemTaskId?: string | null;
  /** Suno clip audioId — optional; omit for MIDI of all tracks in the task. */
  audioId?: string | null;
  /** Optional — forwarded to Replicate mutation for backfill into its result row. */
  trackId?: string;
  stemId?: string | null;
}

export function useSunoMidiTranscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const suno = useSunoMidi();
  const replicate = useReplicateMidiTranscription();

  const [state, setState] = useState<MidiTranscriptionState>("idle");
  const [provider, setProvider] = useState<MidiProvider | null>(null);
  const [midiUrl, setMidiUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setState("idle");
    setProvider(null);
    setMidiUrl(null);
    setError(null);
    suno.reset();
    replicate.reset();
  }, [suno, replicate]);

  const transcribe = useCallback(
    async (input: MidiTranscribeInput): Promise<MidiTranscriptionResult | null> => {
      if (!user?.id) throw new Error("User not authenticated");
      const { trackVersionId, audioUrl, trackId, stemId, stemTaskId, audioId } = input;

      setState("suno");
      setError(null);
      setProvider(null);
      setMidiUrl(null);

      // Suno path — kick off generation, then poll the hook's exposed status
      // until terminal or timeout. We watch `suno.midi` reactively by polling
      // every 500ms (cheap, no extra TanStack subscription).
      let sunoUrl: string | null = null;
      let sunoReason: string | null = null;
      if (!stemTaskId) {
        sunoReason = "no Suno stem-separation taskId available";
      } else {
        try {
          await suno.generate({ taskId: stemTaskId, audioId: audioId ?? undefined });
          const startedAt = Date.now();
          while (Date.now() - startedAt < SUNO_TIMEOUT_MS) {
            if (suno.midi?.status === "SUCCESS" && suno.midi.midiUrl) {
              sunoUrl = suno.midi.midiUrl as string;
              break;
            }
            if (suno.midi?.status === "FAILED") {
              sunoReason = "Suno MIDI generation failed";
              break;
            }
            await new Promise((r) => setTimeout(r, 500));
          }
          if (!sunoUrl && !sunoReason) sunoReason = "Suno MIDI timeout";
        } catch (err) {
          sunoReason = err instanceof Error ? err.message : "unknown Suno error";
        }
      }

      if (sunoUrl) {
        setState("done");
        setProvider("suno");
        setMidiUrl(sunoUrl);
        logger.info("MIDI transcription succeeded via Suno", { trackVersionId });
        return { midiUrl: sunoUrl, provider: "suno" };
      }

      logger.warn("Suno MIDI failed, falling back to Replicate", {
        trackVersionId,
        reason: sunoReason,
      });

      // Replicate fallback
      setState("replicate");
      try {
        await replicate.mutateAsync({
          audioUrl,
          trackId,
          stemId: stemId ?? null,
        });
        // Replicate mutation doesn't return a typed result today — it returns
        // whatever the service resolves to. We treat success as "the row was
        // updated by the Replicate callback"; UI consumers should refetch the
        // track_version to read the new midi_url. We expose a sentinel string
        // so callers can distinguish success without forcing a refetch here.
        const sentinelUrl = `replicate://${trackVersionId}`;
        setState("done");
        setProvider("replicate");
        setMidiUrl(sentinelUrl);
        logger.info("MIDI transcription succeeded via Replicate fallback", { trackVersionId });
        return { midiUrl: sentinelUrl, provider: "replicate" };
      } catch (repErr) {
        const repReason = repErr instanceof Error ? repErr.message : "unknown";
        logger.error("Both Suno and Replicate MIDI transcription failed", {
          trackVersionId,
          sunoReason,
          replicateReason: repReason,
        });
        setState("error");
        setError(repErr instanceof Error ? repErr : new Error(repReason));
        return null;
      }
    },
    [user?.id, suno, replicate],
  );

  // Invalidate the track_versions query so downstream UI re-fetches the row
  // (which now has midi_url + midi_generation_source populated by whichever
  // provider's callback ran).
  const finalize = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["track-versions"] });
    queryClient.invalidateQueries({ queryKey: ["track-versions", user?.id] });
  }, [queryClient, user?.id]);

  return {
    transcribe,
    reset,
    finalize,
    state,
    provider,
    midiUrl,
    error,
    isTranscribing: state === "suno" || state === "replicate",
  };
}
