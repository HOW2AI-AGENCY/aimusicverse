/**
 * UnifiedNotesViewer - Single responsive component for notes visualization
 *
 * Consolidates: MobileNotesViewer, NotesViewerDialog, MidiPlayerCard
 * Features:
 * - Responsive design (mobile/desktop)
 * - View modes: Piano Roll, Sheet Music (MusicXML), List
 * - Auto-display MusicXML if available
 * - MIDI playback
 * - Download buttons for all formats
 */

import { memo, useState, useMemo, useCallback, useEffect } from "react";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMidiFileParser } from "@/hooks/useMidiFileParser";
import { useMusicXmlParser } from "@/hooks/useMusicXmlParser";
import { useMidiSynth } from "@/hooks/useMidiSynth";
import { useTelegramDocumentShare } from "@/hooks/studio/useTelegramDocumentShare";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Music, Download, Send, FileText, Guitar, FileCode2, Piano, Music2, ListMusic } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { InteractivePianoRoll } from "@/components/analysis/InteractivePianoRoll";
import { MusicXMLViewer } from "@/components/guitar/MusicXMLViewer";
import { parseTimeSignature } from "../musicNotationUtils";
import type { ViewMode, UnifiedNotesViewerProps } from "./types";
import {
  normalizeUrl,
  convertXmlNotesToMidi,
  convertProvidedNotes,
  processNotesForDisplay,
  computeNotesDuration,
  computeStats,
} from "./helpers";
import { NotesList } from "./NotesList";
import { PlaybackControls } from "./PlaybackControls";

export const UnifiedNotesViewer = memo(function UnifiedNotesViewer({
  notes: providedNotes,
  duration: providedDuration,
  bpm = 120,
  timeSignature,
  keySignature,
  notesCount,
  model,
  files,
  midiUrl,
  musicXmlUrl,
  className,
  compact = false,
  height,
  enablePlayback = true,
  currentTime: externalTime = 0,
  isPlaying: externalPlaying = false,
  trackTitle,
  onNoteClick,
}: UnifiedNotesViewerProps) {
  const isMobile = useIsMobile();
  const telegramShare = useTelegramDocumentShare();

  // Determine effective URLs (with normalization)
  const effectiveMidiUrl = normalizeUrl(midiUrl) ?? normalizeUrl(files?.midiUrl);
  const effectiveMusicXmlUrl = normalizeUrl(musicXmlUrl) ?? normalizeUrl(files?.musicXmlUrl);

  const [viewMode, setViewMode] = useState<ViewMode>("piano");
  const [musicXmlFailed, setMusicXmlFailed] = useState(false);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);

  // MIDI parsing
  const { parseMidiFromUrl, parsedMidi, error: midiError, isLoading: isParsing } = useMidiFileParser();

  // MusicXML parsing
  const { parseMusicXmlFromUrl, parsedXml, isLoading: isParsingXml } = useMusicXmlParser();

  // MIDI synth for playback
  const { isReady: synthReady, isMuted, volume, playNote, stopAll, setVolume, setMuted, initialize } = useMidiSynth();

  // Internal playback state
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [internalTime, setInternalTime] = useState(0);
  const [playedNotes, setPlayedNotes] = useState<Set<number>>(new Set());
  const [sendingFile, setSendingFile] = useState<string | null>(null);

  const parsedTimeSignature = parseTimeSignature(timeSignature);

  // Parse MIDI on mount if URL provided and no notes given
  useEffect(() => {
    if (effectiveMidiUrl && !providedNotes?.length) {
      parseMidiFromUrl(effectiveMidiUrl);
    }
  }, [effectiveMidiUrl, providedNotes?.length, parseMidiFromUrl]);

  // Parse MusicXML when URL is available
  useEffect(() => {
    const shouldParseXml =
      !!effectiveMusicXmlUrl &&
      !musicXmlFailed &&
      (viewMode === "notation" || (!providedNotes?.length && (!effectiveMidiUrl || !!midiError)));

    if (shouldParseXml) {
      parseMusicXmlFromUrl(effectiveMusicXmlUrl);
    }
  }, [
    effectiveMusicXmlUrl,
    viewMode,
    effectiveMidiUrl,
    providedNotes?.length,
    midiError,
    musicXmlFailed,
    parseMusicXmlFromUrl,
  ]);

  // Convert MusicXML parsed notes to MIDI format
  const xmlNotesAsMidi = useMemo(() => {
    if (!parsedXml?.notes?.length) return [];
    const converted = convertXmlNotesToMidi(parsedXml.notes);

    if (converted.length > 0) {
      const minStart = Math.min(...converted.map((n) => n.startTime));
      const maxEnd = Math.max(...converted.map((n) => n.endTime));
      logger.debug("xmlNotesAsMidi converted", {
        count: converted.length,
        durationFromXml: parsedXml?.duration,
        minStart,
        maxEnd,
        bpm: parsedXml?.bpm,
      });
    }
    return converted;
  }, [parsedXml]);

  const notes = useMemo(() => {
    if (providedNotes?.length) return convertProvidedNotes(providedNotes);
    const midiNotes = parsedMidi?.notes ?? [];
    if (midiNotes.length > 0) return midiNotes;
    return xmlNotesAsMidi;
  }, [providedNotes, parsedMidi, xmlNotesAsMidi]);

  const computedNotesDuration = useMemo(() => computeNotesDuration(notes), [notes]);

  // Duration must cover all notes
  const duration = Math.max(
    1,
    providedDuration ?? 0,
    parsedMidi?.duration ?? 0,
    parsedXml?.duration ?? 0,
    computedNotesDuration,
  );

  const effectiveBpm = bpm ?? parsedMidi?.bpm ?? parsedXml?.bpm ?? 120;

  // Process notes for display
  const processedNotes = useMemo(() => processNotesForDisplay(notes), [notes]);

  // Stats
  const stats = useMemo(() => computeStats(processedNotes, notesCount), [processedNotes, notesCount]);

  // Current time (internal or external)
  const currentTime = externalPlaying ? externalTime : internalTime;
  const isPlaying = externalPlaying || internalPlaying;

  // Playback loop
  useEffect(() => {
    if (!internalPlaying || !notes.length) return;

    const startTime = Date.now() - internalTime * 1000;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;

      if (elapsed >= duration) {
        setInternalPlaying(false);
        setInternalTime(0);
        setPlayedNotes(new Set());
        stopAll();
        return;
      }

      setInternalTime(elapsed);

      // Play notes
      notes.forEach((note, index) => {
        const noteStart = note.startTime ?? 0;
        if (!playedNotes.has(index) && noteStart <= elapsed && noteStart > elapsed - 0.05) {
          playNote(note.pitch ?? 60, note.duration ?? 0.5, (note.velocity ?? 100) / 127);
          setPlayedNotes((prev) => new Set(prev).add(index));
        }
      });
    }, 16);

    return () => clearInterval(interval);
  }, [internalPlaying, notes, duration, internalTime, playNote, stopAll, playedNotes]);

  const handleTogglePlayback = useCallback(async () => {
    if (!synthReady) {
      await initialize();
    }

    if (internalPlaying) {
      setInternalPlaying(false);
      stopAll();
    } else {
      if (internalTime >= duration) {
        setInternalTime(0);
        setPlayedNotes(new Set());
      }
      setInternalPlaying(true);
    }
  }, [synthReady, internalPlaying, internalTime, duration, initialize, stopAll]);

  const handleSeek = useCallback(
    (time: number) => {
      setInternalTime(time);
      setPlayedNotes(new Set());
      stopAll();
    },
    [stopAll],
  );

  const handleNoteClick = useCallback(
    (note: { pitch?: number; startTime?: number; duration?: number; velocity?: number }, index: number) => {
      setSelectedNoteIndex(index);
      onNoteClick?.(note, index);
    },
    [onNoteClick],
  );

  const handleDownload = useCallback((url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Скачивание начато");
  }, []);

  // Send file to Telegram
  const handleSendToTelegram = useCallback(
    async (url: string, type: string, extension: string) => {
      setSendingFile(type);
      try {
        const { getOwnTelegramIds } = await import("@/lib/telegram/getOwnTelegramIds");
        const ids = await getOwnTelegramIds();

        if (!ids?.telegram_id) {
          toast.error("Telegram не подключен");
          return;
        }

        const { error } = await telegramShare.mutateAsync({
          chat_id: ids.telegram_id,
          document_url: url,
          document_type: type,
          filename: `${trackTitle || "transcription"}${extension}`,
          track_title: trackTitle,
        });

        if (error) throw error;
        toast.success(`Файл отправлен в Telegram`);
      } catch (error: unknown) {
        logger.error("Send to Telegram error", error as Error);
        const msg = error instanceof Error ? error.message : "Ошибка отправки";
        toast.error(msg);
      } finally {
        setSendingFile(null);
      }
    },
    [trackTitle, telegramShare],
  );

  // Height calculation
  const defaultHeight = compact ? (isMobile ? 280 : 260) : isMobile ? 560 : 400;
  const visualHeight = height ?? defaultHeight;

  // Combined loading state
  const isLoadingNotes = (isParsing || isParsingXml) && !notes.length;

  if (isLoadingNotes) {
    return (
      <div
        className={cn("rounded-xl border bg-muted/30 flex flex-col items-center justify-center gap-3", className)}
        style={{ height: visualHeight }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Загрузка нот...</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Header with toggle and stats */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View mode toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as ViewMode)}
          className="flex-shrink-0"
        >
          <ToggleGroupItem value="piano" size="sm" className="h-7 px-2 text-[10px] sm:text-xs gap-1">
            <Piano className="w-3 h-3" />
            <span className="hidden xs:inline">Piano</span>
          </ToggleGroupItem>
          {effectiveMusicXmlUrl && (
            <ToggleGroupItem value="notation" size="sm" className="h-7 px-2 text-[10px] sm:text-xs gap-1">
              <Music2 className="w-3 h-3" />
              <span className="hidden xs:inline">Ноты</span>
            </ToggleGroupItem>
          )}
          <ToggleGroupItem value="list" size="sm" className="h-7 px-2 text-[10px] sm:text-xs gap-1">
            <ListMusic className="w-3 h-3" />
            <span className="hidden xs:inline">Список</span>
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Stats badges - scrollable */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto pb-0.5">
          {stats && (
            <Badge variant="secondary" className="text-[10px] flex-shrink-0">
              {stats.total} нот
            </Badge>
          )}
          {effectiveBpm && (
            <Badge variant="outline" className="text-[10px] flex-shrink-0">
              {Math.round(effectiveBpm)} BPM
            </Badge>
          )}
          {keySignature && (
            <Badge variant="outline" className="text-[10px] flex-shrink-0">
              {keySignature}
            </Badge>
          )}
          {model && (
            <Badge variant="secondary" className="text-[10px] flex-shrink-0">
              {model}
            </Badge>
          )}
        </div>
      </div>

      {/* Visualization area */}
      <div className="rounded-xl border overflow-hidden bg-background shadow-sm">
        {viewMode === "piano" &&
          (notes.length > 0 ? (
            <InteractivePianoRoll
              notes={notes}
              duration={duration}
              currentTime={currentTime}
              height={visualHeight}
              onNoteClick={handleNoteClick}
              showKeys={!isMobile}
              showMiniMap={!compact}
              colorByVelocity={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3" style={{ height: visualHeight }}>
              <Music className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Ноты не обнаружены</p>
            </div>
          ))}

        {viewMode === "notation" && effectiveMusicXmlUrl && !musicXmlFailed && (
          <div className="p-1 sm:p-2">
            {isParsingXml ? (
              <div
                className="rounded-lg border bg-muted/20 flex items-center justify-center"
                style={{ height: visualHeight }}
              >
                <div className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Загрузка нот...
                </div>
              </div>
            ) : (
              <MusicXMLViewer
                url={effectiveMusicXmlUrl}
                minHeight={`${Math.max(280, visualHeight)}px`}
                className="w-full"
                onError={() => {
                  setMusicXmlFailed(true);
                  if (notes.length > 0) {
                    setViewMode("piano");
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Fallback на PianoRoll когда MusicXML недоступен но выбран notation */}
        {viewMode === "notation" &&
          (!effectiveMusicXmlUrl || musicXmlFailed) &&
          (notes.length > 0 ? (
            <InteractivePianoRoll
              notes={notes}
              duration={duration}
              currentTime={currentTime}
              height={visualHeight}
              onNoteClick={handleNoteClick}
              showKeys={!isMobile}
              showMiniMap={!compact}
              colorByVelocity={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3" style={{ height: visualHeight }}>
              <Music className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Ноты не обнаружены</p>
            </div>
          ))}

        {viewMode === "list" && (
          <NotesList
            processedNotes={processedNotes}
            stats={stats}
            duration={duration}
            selectedNoteIndex={selectedNoteIndex}
            onNoteSelect={setSelectedNoteIndex}
            height={visualHeight}
          />
        )}
      </div>

      {/* Playback controls (if enabled and not in list mode) */}
      {enablePlayback && viewMode !== "list" && notes.length > 0 && (
        <PlaybackControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          isMuted={isMuted}
          volume={volume}
          isMobile={isMobile}
          onTogglePlayback={handleTogglePlayback}
          onSeek={handleSeek}
          onToggleMute={() => setMuted(!isMuted)}
          onVolumeChange={setVolume}
        />
      )}

      {/* Download and share buttons */}
      {!compact && (
        <div className="flex flex-wrap gap-1.5">
          {effectiveMidiUrl && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(effectiveMidiUrl, "notes.mid")}
                className="h-8 text-xs gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                MIDI
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSendToTelegram(effectiveMidiUrl, "midi", ".mid")}
                disabled={sendingFile === "midi"}
                className="h-8 text-xs gap-1"
                title="Отправить в Telegram"
              >
                {sendingFile === "midi" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </Button>
            </>
          )}
          {files?.pdfUrl && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(files.pdfUrl!, "notes.pdf")}
                className="h-8 text-xs gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSendToTelegram(files.pdfUrl!, "pdf", ".pdf")}
                disabled={sendingFile === "pdf"}
                className="h-8 text-xs gap-1"
                title="Отправить в Telegram"
              >
                {sendingFile === "pdf" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </Button>
            </>
          )}
          {files?.gp5Url && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(files.gp5Url!, "tabs.gp5")}
                className="h-8 text-xs gap-1 text-amber-600"
              >
                <Guitar className="w-3.5 h-3.5" />
                GP5
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSendToTelegram(files.gp5Url!, "gp5", ".gp5")}
                disabled={sendingFile === "gp5"}
                className="h-8 text-xs gap-1"
                title="Отправить в Telegram"
              >
                {sendingFile === "gp5" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </Button>
            </>
          )}
          {effectiveMusicXmlUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(effectiveMusicXmlUrl, "score.musicxml")}
              className="h-8 text-xs gap-1"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              MusicXML
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
