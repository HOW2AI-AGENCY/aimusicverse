import type { ParsedMidiNote } from "@/hooks/useMidiFileParser";

export type ViewMode = "piano" | "notation" | "list";

export interface NoteInput {
  pitch?: number;
  midi?: number;
  time?: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
  velocity?: number;
  noteName?: string;
}

export interface TranscriptionFiles {
  midiUrl?: string | null;
  midiQuantUrl?: string | null;
  pdfUrl?: string | null;
  gp5Url?: string | null;
  musicXmlUrl?: string | null;
}

export interface UnifiedNotesViewerProps {
  notes?: NoteInput[];
  duration?: number;
  bpm?: number;
  timeSignature?: { numerator: number; denominator: number } | string;
  keySignature?: string;
  notesCount?: number;
  model?: string;
  files?: TranscriptionFiles;
  midiUrl?: string | null;
  musicXmlUrl?: string | null;
  className?: string;
  compact?: boolean;
  height?: number;
  enablePlayback?: boolean;
  currentTime?: number;
  isPlaying?: boolean;
  trackTitle?: string;
  onNoteClick?: (note: NoteInput, index: number) => void;
}

export interface ProcessedNote {
  index: number;
  pitch: number;
  startTime: number;
  endTime: number;
  duration: number;
  velocity: number;
  noteName: string;
  noteNameRu: string;
}

export interface NotesStats {
  total: number;
  minNote: string;
  maxNote: string;
  range: number;
}
