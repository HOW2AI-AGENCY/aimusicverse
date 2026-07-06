import { NOTE_NAMES, NOTE_NAMES_RU } from "../musicNotationUtils";
import type { NoteInput, ProcessedNote, NotesStats } from "./types";
import type { ParsedMidiNote } from "@/hooks/useMidiFileParser";

export function normalizeUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "0") return null;
  if (trimmed.startsWith("<")) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return trimmed;
  try {
    return new URL(trimmed, window.location.origin).toString();
  } catch {
    return null;
  }
}

export function convertXmlNotesToMidi(
  parsedXmlNotes: Array<{ midiPitch?: number; startTime?: number; duration?: number }>,
): ParsedMidiNote[] {
  if (!parsedXmlNotes?.length) return [];
  return parsedXmlNotes.map((n) => {
    const pitch = n.midiPitch ?? 60;
    const startTime = n.startTime ?? 0;
    const dur = Math.max(0.02, n.duration ?? 0.25);
    return {
      pitch,
      startTime,
      endTime: startTime + dur,
      duration: dur,
      velocity: 100,
      noteName: `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`,
      track: 0,
    };
  });
}

export function convertProvidedNotes(providedNotes: NoteInput[]): ParsedMidiNote[] {
  return providedNotes.map((n) => {
    const pitch = n.pitch ?? n.midi ?? 60;
    const startTime = n.startTime ?? n.time ?? 0;
    const dur = n.duration ?? 0.5;
    return {
      pitch,
      startTime,
      endTime: startTime + dur,
      duration: dur,
      velocity: n.velocity ?? 100,
      noteName: n.noteName ?? `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`,
      track: 0,
    };
  });
}

export function processNotesForDisplay(notes: ParsedMidiNote[]): ProcessedNote[] {
  return notes
    .map((n, index) => {
      const pitch = n.pitch ?? 60;
      const startTime = n.startTime ?? 0;
      const endTime = startTime + (n.duration ?? 0.5);
      const noteName = NOTE_NAMES[pitch % 12];
      const noteNameRu = NOTE_NAMES_RU[pitch % 12];
      const octave = Math.floor(pitch / 12) - 1;
      return {
        index,
        pitch,
        startTime,
        endTime,
        duration: n.duration ?? 0.5,
        velocity: n.velocity ?? 100,
        noteName: `${noteName}${octave}`,
        noteNameRu: `${noteNameRu}${octave}`,
      };
    })
    .sort((a, b) => a.startTime - b.startTime);
}

export function computeNotesDuration(notes: ParsedMidiNote[]): number {
  if (!notes.length) return 0;
  let maxEnd = 0;
  for (const n of notes) {
    const start = n.startTime ?? 0;
    const dur = n.duration ?? 0;
    const end = n.endTime ?? start + dur;
    if (Number.isFinite(end)) maxEnd = Math.max(maxEnd, end);
  }
  return maxEnd;
}

export function computeStats(processedNotes: ProcessedNote[], notesCount?: number): NotesStats | null {
  if (processedNotes.length === 0) return null;
  const pitches = processedNotes.map((n) => n.pitch);
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);
  return {
    total: notesCount ?? processedNotes.length,
    minNote: `${NOTE_NAMES[minPitch % 12]}${Math.floor(minPitch / 12) - 1}`,
    maxNote: `${NOTE_NAMES[maxPitch % 12]}${Math.floor(maxPitch / 12) - 1}`,
    range: maxPitch - minPitch,
  };
}
