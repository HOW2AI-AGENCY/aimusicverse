/**
 * StudioNotationPanel
 * Viewer for transcription outputs in studio-v2.
 * Uses the same reliable notes UX as the old studio (UnifiedNotesViewer):
 * - Piano roll
 * - Staff notation (via MusicXML parsing)
 * - Notes list
 */

import { memo, useCallback, useMemo, useState } from "react";
import { AlertCircle, ChevronDown, Download, FileText, Loader2, Music2, RefreshCw } from "@/lib/icons";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranscriptionForStudio } from "@/hooks/studio/useTranscriptionForStudio";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { StudioTrack } from "@/stores/useUnifiedStudioStore";
import { UnifiedNotesViewer, type NoteInput } from "@/components/studio/UnifiedNotesViewer";
import type { MidiNote } from "./PianoRoll";

interface StudioNotationPanelProps {
  track: StudioTrack;
  trackId?: string;
  stemType?: string;
  versionId?: string;
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  onClose?: () => void;
  className?: string;
}

interface TranscriptionData {
  id: string;
  midi_url?: string;
  mxml_url?: string;
  gp5_url?: string;
  pdf_url?: string;
  bpm?: number;
  key_detected?: string;
  time_signature?: string;
  notes_count?: number;
  stem_type?: string;
  notes?: MidiNote[];
}

export const StudioNotationPanel = memo(function StudioNotationPanel({
  track,
  trackId,
  stemType,
  versionId,
  currentTime = 0,
  isPlaying = false,
  onSeek,
  className,
}: StudioNotationPanelProps) {
  const isMobile = useIsMobile();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const durationSeconds = track.duration ?? track.clips?.[0]?.duration ?? 60;

  const {
    data: rawTranscription,
    isLoading,
    error,
    refetch,
  } = useTranscriptionForStudio({
    versionId,
    trackId,
    stemType,
    fallbackStemId: track.id,
  });

  const transcription = useMemo<TranscriptionData | null>(() => {
    if (!rawTranscription) return null;
    const item = rawTranscription as Record<string, unknown>;
    let notes: MidiNote[] | undefined;
    if (Array.isArray(item.notes)) {
      notes = (item.notes as Array<Record<string, unknown>>)
        .map((n, i) => {
          const pitch = typeof n?.pitch === "number" ? n.pitch : 60;
          const startTime =
            typeof n?.startTime === "number"
              ? n.startTime
              : typeof n?.start_time === "number"
                ? (n.start_time as number)
                : 0;
          const duration =
            typeof n?.duration === "number" ? n.duration : typeof n?.dur === "number" ? (n.dur as number) : 0.25;
          const velocity = typeof n?.velocity === "number" ? n.velocity : 100;
          return {
            id: String(n?.id ?? `note-${i}`),
            pitch,
            startTime,
            duration,
            velocity,
          } satisfies MidiNote;
        })
        .filter(
          (n) =>
            Number.isFinite(n.pitch) && Number.isFinite(n.startTime) && Number.isFinite(n.duration) && n.duration > 0,
        );
    }
    return {
      id: String(item.id ?? ""),
      midi_url: (item.midi_url as string | undefined) ?? undefined,
      mxml_url: (item.mxml_url as string | undefined) ?? undefined,
      gp5_url: (item.gp5_url as string | undefined) ?? undefined,
      pdf_url: (item.pdf_url as string | undefined) ?? undefined,
      bpm: typeof item.bpm === "number" ? item.bpm : item.bpm ? Number(item.bpm) : undefined,
      key_detected: (item.key_detected as string | undefined) ?? undefined,
      time_signature: (item.time_signature as string | undefined) ?? undefined,
      notes_count: typeof item.notes_count === "number" ? item.notes_count : notes ? notes.length : undefined,
      notes,
    };
  }, [rawTranscription]);

  const downloadFile = useCallback(async (url: string, filename: string) => {
    setIsDownloading(filename);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success(`${filename} скачан`);
    } catch (err) {
      toast.error("Ошибка скачивания");
    } finally {
      setIsDownloading(null);
    }
  }, []);

  const availableFiles = useMemo(() => {
    if (!transcription) return [];
    return [
      { key: "midi", url: transcription.midi_url, label: "MIDI", ext: ".mid" },
      { key: "mxml", url: transcription.mxml_url, label: "MusicXML", ext: ".xml" },
      { key: "gp5", url: transcription.gp5_url, label: "Guitar Pro", ext: ".gp5" },
      { key: "pdf", url: transcription.pdf_url, label: "PDF", ext: ".pdf" },
    ].filter((f) => !!f.url);
  }, [transcription]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !transcription) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
        <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-2 text-center">
          {error ? "Ошибка загрузки" : "Нет транскрипции"}
        </p>
        <p className="text-xs text-muted-foreground mb-4 text-center max-w-xs">
          {error ? "Не удалось загрузить данные нот" : "Выполните транскрипцию трека для просмотра нот"}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0">
          <Music2 className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-sm truncate">{track.name}</span>
          {transcription.bpm && (
            <Badge variant="secondary" className="text-xs">
              {Math.round(transcription.bpm)} BPM
            </Badge>
          )}
          {transcription.key_detected && (
            <Badge variant="outline" className="text-xs">
              {transcription.key_detected}
            </Badge>
          )}
          {typeof transcription.notes_count === "number" && transcription.notes_count > 0 && (
            <Badge variant="outline" className="text-xs">
              {transcription.notes_count} нот
            </Badge>
          )}
        </div>

        {/* Download menu */}
        {availableFiles.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1.5" />
                Скачать
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableFiles.map((file) => (
                <DropdownMenuItem
                  key={file.key}
                  onClick={() => downloadFile(file.url!, `${track.name}${file.ext}`)}
                  disabled={isDownloading === `${track.name}${file.ext}`}
                >
                  {isDownloading === `${track.name}${file.ext}` ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  {file.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Old-studio viewer (notation + piano roll + notes list) */}
      <div className="flex-1 min-h-0 p-3">
        <UnifiedNotesViewer
          notes={transcription.notes as unknown as NoteInput[] | undefined}
          duration={durationSeconds}
          bpm={transcription.bpm ?? 120}
          timeSignature={transcription.time_signature}
          keySignature={transcription.key_detected}
          notesCount={transcription.notes_count}
          files={{
            midiUrl: transcription.midi_url,
            pdfUrl: transcription.pdf_url,
            gp5Url: transcription.gp5_url,
            musicXmlUrl: transcription.mxml_url,
          }}
          midiUrl={transcription.midi_url}
          musicXmlUrl={transcription.mxml_url}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onNoteClick={() => {
            // no-op; selection is handled inside viewer
          }}
          enablePlayback={false}
          trackTitle={track.name}
          height={isMobile ? 640 : 480}
          className="h-full"
        />
      </div>
    </div>
  );
});
