/**
 * useExportMidi - Mutation hook that calls the export-midi edge function
 * to convert an array of piano-roll notes into a downloadable MIDI file.
 *
 * Used by StemMidiDrawer when exporting edited notes from the Piano Roll view.
 */

import { useMutation } from "@tanstack/react-query";
import { exportMidi, type ExportMidiParams, type ExportMidiResult } from "@/services/studio.service";

export function useExportMidi() {
  return useMutation<ExportMidiResult, Error, ExportMidiParams>({
    mutationFn: (input) => exportMidi(input),
  });
}
