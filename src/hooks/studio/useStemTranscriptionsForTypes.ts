/**
 * useStemTranscriptionsForTypes - Query hook that returns full transcription data
 * for all stems of a source track matching the given stem type list.
 *
 * Used by SortableTrackList to render per-stem transcription cards (MIDI/PDF/GP5/MusicXML
 * files plus notes data) without bypassing the service layer.
 */

import { useQuery } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
import {
  fetchStemsByTypes,
  fetchMainTrackTranscription,
  fetchTranscriptionsByStemIds,
  type StemTranscriptionRow,
} from "@/services/studio.service";
import { queryKeys } from "@/lib/queryKeys";

// Reuse the existing prop-facing type so callers (StudioTrackRow / props) are unaffected.
export interface StemTranscriptionData {
  stemType: string;
  stemId: string;
  midiUrl: string | null;
  pdfUrl: string | null;
  gp5Url: string | null;
  mxmlUrl: string | null;
  notes: Array<{ pitch: number; startTime: number; endTime: number; duration: number }> | null;
  notesCount: number | null;
  bpm: number | null;
  keyDetected: string | null;
  durationSeconds: number | null;
}

function normalizeNotes(notes: unknown): StemTranscriptionData["notes"] {
  if (!notes || !Array.isArray(notes)) return null;
  const out: NonNullable<StemTranscriptionData["notes"]> = [];
  for (const n of notes as Array<Record<string, unknown>>) {
    const pitch = typeof n?.pitch === "number" ? n.pitch : 60;
    const startTime =
      typeof n?.startTime === "number" ? n.startTime : typeof n?.start_time === "number" ? (n.start_time as number) : 0;
    const duration =
      typeof n?.duration === "number" ? n.duration : typeof n?.dur === "number" ? (n.dur as number) : 0.25;
    if (!Number.isFinite(pitch) || !Number.isFinite(startTime)) continue;
    out.push({ pitch, startTime, endTime: startTime + duration, duration });
  }
  return out;
}

function rowToResult(row: StemTranscriptionRow, stemType: string, stemId: string): StemTranscriptionData {
  const normalizedNotes = normalizeNotes(row.notes);
  return {
    stemType,
    stemId,
    midiUrl: row.midi_url ?? null,
    pdfUrl: row.pdf_url ?? null,
    gp5Url: row.gp5_url ?? null,
    mxmlUrl: row.mxml_url ?? null,
    notes: normalizedNotes,
    notesCount: row.notes_count ?? normalizedNotes?.length ?? null,
    bpm: row.bpm ? Number(row.bpm) : null,
    keyDetected: row.key_detected ?? null,
    durationSeconds: row.duration_seconds ? Number(row.duration_seconds) : null,
  };
}

export function useStemTranscriptionsForTypes(params: { sourceTrackId?: string | null; stemTypes: string[] }) {
  const sourceTrackId = params.sourceTrackId ?? undefined;
  const stemTypes = [...params.stemTypes].sort();

  return useQuery({
    queryKey: sourceTrackId
      ? queryKeys.studio.stemTranscriptions(sourceTrackId, stemTypes.join(","))
      : ["stem-transcriptions-full", "noop"],
    queryFn: async (): Promise<Record<string, StemTranscriptionData>> => {
      if (!sourceTrackId || stemTypes.length === 0) return {};

      const result: Record<string, StemTranscriptionData> = {};
      const stems = await fetchStemsByTypes(sourceTrackId, stemTypes);

      if (stems.length === 0) {
        logger.info("[useStemTranscriptionsForTypes] No stems found", { sourceTrackId, stemTypes });
        if (stemTypes.includes("main")) {
          const mainTrans = await fetchMainTrackTranscription(sourceTrackId);
          if (mainTrans?.stem_id) {
            result["main"] = rowToResult(mainTrans, "main", mainTrans.stem_id);
          }
        }
        return result;
      }

      const stemIds = stems.map((s) => s.id);
      const transcriptions = await fetchTranscriptionsByStemIds(stemIds);
      if (transcriptions.length === 0) {
        logger.info("[useStemTranscriptionsForTypes] No transcriptions for stemIds", { stemIds });
        return result;
      }

      logger.info("[useStemTranscriptionsForTypes] Found transcriptions", {
        count: transcriptions.length,
        stemTypes: stems.map((s) => s.stem_type),
      });

      for (const trans of transcriptions) {
        if (!trans.stem_id) continue;
        const stem = stems.find((s) => s.id === trans.stem_id);
        if (!stem) continue;
        result[stem.stem_type] = rowToResult(trans, stem.stem_type, stem.id);
        logger.info("[useStemTranscriptionsForTypes] Mapped transcription for", {
          stemType: stem.stem_type,
          hasNotes: !!result[stem.stem_type].notes?.length,
          hasMidi: !!trans.midi_url,
          hasPdf: !!trans.pdf_url,
        });
      }

      return result;
    },
    enabled: !!sourceTrackId && stemTypes.length > 0,
    staleTime: 60_000,
  });
}
