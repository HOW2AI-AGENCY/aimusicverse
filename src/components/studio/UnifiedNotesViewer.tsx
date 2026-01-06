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

import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { 
  Music, Piano, ListMusic, FileText, Download, 
  Music2, Play, Pause, Volume2, VolumeX, Loader2,
  Guitar, FileCode2, ExternalLink, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InteractivePianoRoll } from '@/components/analysis/InteractivePianoRoll';
import { StaffNotation } from '@/components/analysis/StaffNotation';
import { MusicXMLViewer } from '@/components/guitar/MusicXMLViewer';
import { useMidiFileParser, type ParsedMidiNote } from '@/hooks/useMidiFileParser';
import { useMusicXmlParser } from '@/hooks/useMusicXmlParser';
import { useMidiSynth } from '@/hooks/useMidiSynth';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ViewMode = 'piano' | 'notation' | 'list';

interface NoteInput {
  pitch?: number;
  midi?: number;
  time?: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
  velocity?: number;
  noteName?: string;
}

interface TranscriptionFiles {
  midiUrl?: string | null;
  midiQuantUrl?: string | null;
  pdfUrl?: string | null;
  gp5Url?: string | null;
  musicXmlUrl?: string | null;
}

interface UnifiedNotesViewerProps {
  // Notes data (can be from MIDI or MusicXML parsing)
  notes?: NoteInput[];
  duration?: number;
  
  // Metadata
  bpm?: number;
  timeSignature?: { numerator: number; denominator: number } | string;
  keySignature?: string;
  notesCount?: number;
  model?: string;
  
  // File URLs for downloads and visualization
  files?: TranscriptionFiles;
  
  // Or pass MIDI URL directly for auto-parsing
  midiUrl?: string | null;
  musicXmlUrl?: string | null;
  
  // Layout
  className?: string;
  compact?: boolean; // For inline usage in cards
  height?: number;
  
  // Playback
  enablePlayback?: boolean;
  currentTime?: number;
  isPlaying?: boolean;
  
  // Track info for sharing
  trackTitle?: string;
  
  // Callbacks
  onNoteClick?: (note: NoteInput, index: number) => void;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_RU = ['До', 'До#', 'Ре', 'Ре#', 'Ми', 'Фа', 'Фа#', 'Соль', 'Соль#', 'Ля', 'Ля#', 'Си'];

function parseTimeSignature(ts: { numerator: number; denominator: number } | string | undefined): { numerator: number; denominator: number } {
  if (!ts) return { numerator: 4, denominator: 4 };
  if (typeof ts === 'object') return ts;
  const parts = ts.split('/');
  if (parts.length === 2) {
    return { numerator: parseInt(parts[0], 10) || 4, denominator: parseInt(parts[1], 10) || 4 };
  }
  return { numerator: 4, denominator: 4 };
}

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
  
  // Validate/normalize URL helper (поддерживаем относительные ссылки из backend)
  const normalizeUrl = (url: unknown): string | null => {
    if (typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed || trimmed === '0') return null;

    // absolute
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

    // relative (e.g. /storage/v1/...) — превращаем в absolute
    if (trimmed.startsWith('/')) {
      try {
        return new URL(trimmed, window.location.origin).toString();
      } catch {
        return null;
      }
    }

    return null;
  };

  // Determine effective URLs (with normalization)
  const effectiveMidiUrl = normalizeUrl(midiUrl) ?? normalizeUrl(files?.midiUrl);
  const effectiveMusicXmlUrl = normalizeUrl(musicXmlUrl) ?? normalizeUrl(files?.musicXmlUrl);
  
  // По умолчанию Piano Roll - более надёжный вариант
  // notation только если пользователь явно выберет
  const [viewMode, setViewMode] = useState<ViewMode>('piano');
  const [musicXmlFailed, setMusicXmlFailed] = useState(false);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  
  // MIDI parsing
  const { 
    parseMidiFromUrl, 
    parsedMidi,
    error: midiError,
    isLoading: isParsing 
  } = useMidiFileParser();

  // MusicXML parsing (custom parser that works reliably)
  const {
    parseMusicXmlFromUrl,
    parsedXml,
    isLoading: isParsingXml,
    error: musicXmlError,
  } = useMusicXmlParser();
  // MIDI synth for playback
  const {
    isReady: synthReady,
    isMuted,
    volume,
    playNote,
    stopAll,
    setVolume,
    setMuted,
    initialize,
  } = useMidiSynth();
  
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

  // Parse MusicXML when URL is available.
  // Нужно и для режима notation, и для fallback в piano roll, если MIDI отсутствует.
  useEffect(() => {
    const shouldParseXml =
      !!effectiveMusicXmlUrl &&
      !musicXmlFailed &&
      (
        viewMode === 'notation' ||
        // Fallback: если MIDI отсутствует ИЛИ MIDI упал, берём ноты из MusicXML
        (!providedNotes?.length && (!effectiveMidiUrl || !!midiError))
      );

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
  const xmlNotesAsMidi = useMemo((): ParsedMidiNote[] => {
    if (!parsedXml?.notes?.length) return [];
    return parsedXml.notes.map((n) => {
      const pitch = n.midiPitch ?? 60;
      const startTime = n.startTime ?? 0;
      // В useMusicXmlParser duration хранится в "тиках" (см. measureTime += duration / 256)
      const durTicks = n.duration ?? 128;
      const durSeconds = Math.max(0.02, durTicks / 256);
      return {
        pitch,
        startTime,
        endTime: startTime + durSeconds,
        duration: durSeconds,
        velocity: 100,
        noteName: `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`,
        track: 0,
      };
    });
  }, [parsedXml]);

  const notes = useMemo((): ParsedMidiNote[] => {
    if (providedNotes?.length) {
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

    const midiNotes = parsedMidi?.notes ?? [];
    if (midiNotes.length > 0) return midiNotes;

    return xmlNotesAsMidi;
  }, [providedNotes, parsedMidi, xmlNotesAsMidi]);
  
  const duration = providedDuration ?? parsedMidi?.duration ?? parsedXml?.duration ?? 60;
  const effectiveBpm = bpm ?? parsedMidi?.bpm ?? parsedXml?.bpm ?? 120;
  
  // Process notes for display
  const processedNotes = useMemo(() => {
    return notes.map((n, index) => {
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
    }).sort((a, b) => a.startTime - b.startTime);
  }, [notes]);
  
  // Stats
  const stats = useMemo(() => {
    if (processedNotes.length === 0) return null;
    
    const pitches = processedNotes.map(n => n.pitch);
    const minPitch = Math.min(...pitches);
    const maxPitch = Math.max(...pitches);
    
    return {
      total: notesCount ?? processedNotes.length,
      minNote: `${NOTE_NAMES[minPitch % 12]}${Math.floor(minPitch / 12) - 1}`,
      maxNote: `${NOTE_NAMES[maxPitch % 12]}${Math.floor(maxPitch / 12) - 1}`,
      range: maxPitch - minPitch,
    };
  }, [processedNotes, notesCount]);
  
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
          setPlayedNotes(prev => new Set(prev).add(index));
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
  
  const handleSeek = useCallback((time: number) => {
    setInternalTime(time);
    setPlayedNotes(new Set());
    stopAll();
  }, [stopAll]);
  
  const handleNoteClick = useCallback((note: NoteInput, index: number) => {
    setSelectedNoteIndex(index);
    onNoteClick?.(note, index);
  }, [onNoteClick]);
  
  const handleDownload = useCallback((url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Скачивание начато');
  }, []);

  // Send file to Telegram
  const handleSendToTelegram = useCallback(async (url: string, type: string, extension: string) => {
    setSendingFile(type);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('telegram_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.telegram_id) {
        toast.error('Telegram не подключен');
        return;
      }

      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          type: 'document_share',
          chat_id: profile.telegram_id,
          document_url: url,
          document_type: type,
          filename: `${trackTitle || 'transcription'}${extension}`,
          track_title: trackTitle,
        },
      });

      if (error) throw error;
      toast.success(`Файл отправлен в Telegram`);
    } catch (error: unknown) {
      console.error('Send to Telegram error:', error);
      const msg = error instanceof Error ? error.message : 'Ошибка отправки';
      toast.error(msg);
    } finally {
      setSendingFile(null);
    }
  }, [trackTitle]);
  
  // Увеличенная высота для мобильных устройств (mobile-first)
  const defaultHeight = compact ? (isMobile ? 280 : 260) : (isMobile ? 560 : 400);
  const visualHeight = height ?? defaultHeight;
  
  // Combined loading state (MIDI or MusicXML parsing)
  const isLoadingNotes = (isParsing || isParsingXml) && !notes.length;
  
  if (isLoadingNotes) {
    return (
      <div 
        className={cn(
          "rounded-xl border bg-muted/30 flex flex-col items-center justify-center gap-3",
          className
        )}
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
          <ToggleGroupItem 
            value="piano" 
            size="sm" 
            className="h-7 px-2 text-[10px] sm:text-xs gap-1"
          >
            <Piano className="w-3 h-3" />
            <span className="hidden xs:inline">Piano</span>
          </ToggleGroupItem>
          {effectiveMusicXmlUrl && (
            <ToggleGroupItem 
              value="notation" 
              size="sm" 
              className="h-7 px-2 text-[10px] sm:text-xs gap-1"
            >
              <Music2 className="w-3 h-3" />
              <span className="hidden xs:inline">Ноты</span>
            </ToggleGroupItem>
          )}
          <ToggleGroupItem 
            value="list" 
            size="sm" 
            className="h-7 px-2 text-[10px] sm:text-xs gap-1"
          >
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
        {viewMode === 'piano' && (
          notes.length > 0 ? (
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
            <div 
              className="flex flex-col items-center justify-center gap-3"
              style={{ height: visualHeight }}
            >
              <Music className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Ноты не обнаружены</p>
            </div>
          )
        )}

        {viewMode === 'notation' && effectiveMusicXmlUrl && !musicXmlFailed && (
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
                  // При ошибке помечаем и переключаемся на piano roll
                  setMusicXmlFailed(true);
                  if (notes.length > 0) {
                    setViewMode('piano');
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Fallback на PianoRoll когда MusicXML недоступен но выбран notation */}
        {viewMode === 'notation' && (!effectiveMusicXmlUrl || musicXmlFailed) && (
          notes.length > 0 ? (
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
            <div 
              className="flex flex-col items-center justify-center gap-3"
              style={{ height: visualHeight }}
            >
              <Music className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Ноты не обнаружены</p>
            </div>
          )
        )}


        {viewMode === 'list' && (
          <ScrollArea style={{ height: visualHeight }}>
            <div className="p-2 space-y-1">
              {/* Summary header */}
              <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded-lg mb-2">
                <div className="flex-1 grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div>
                    <p className="text-muted-foreground">Всего нот</p>
                    <p className="font-semibold text-foreground">{processedNotes.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Диапазон</p>
                    <p className="font-semibold text-foreground">
                      {stats?.minNote} - {stats?.maxNote}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Длительность</p>
                    <p className="font-semibold text-foreground">{formatTime(duration)}</p>
                  </div>
                </div>
              </div>
              
              {/* Notes list with velocity bars */}
              <div className="space-y-0.5">
                {processedNotes.slice(0, 150).map((note, i) => {
                  const velocityPercent = (note.velocity / 127) * 100;
                  const isLoud = note.velocity > 100;
                  const isSoft = note.velocity < 50;
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.01, 0.5) }}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-muted/50 active:bg-muted/70 cursor-pointer group",
                        selectedNoteIndex === note.index && "bg-primary/10 ring-1 ring-primary/30"
                      )}
                      onClick={() => setSelectedNoteIndex(note.index)}
                    >
                      {/* Note badge */}
                      <div className={cn(
                        "w-10 h-8 rounded-md flex items-center justify-center font-mono text-[11px] font-bold transition-colors",
                        isLoud && "bg-orange-500/20 text-orange-600",
                        isSoft && "bg-blue-500/20 text-blue-600",
                        !isLoud && !isSoft && "bg-primary/15 text-primary"
                      )}>
                        {note.noteName}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-xs">{note.noteNameRu}</span>
                          <span className="text-[9px] text-muted-foreground">октава {Math.floor(note.pitch / 12) - 1}</span>
                        </div>
                        
                        {/* Velocity bar */}
                        <div className="mt-0.5 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              isLoud && "bg-orange-500",
                              isSoft && "bg-blue-500",
                              !isLoud && !isSoft && "bg-primary"
                            )}
                            style={{ width: `${velocityPercent}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Time & duration */}
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-mono text-foreground">{formatTime(note.startTime)}</p>
                        <p className="text-[9px] text-muted-foreground">{(note.duration * 1000).toFixed(0)}ms</p>
                      </div>
                    </motion.div>
                  );
                })}
                
                {processedNotes.length > 150 && (
                  <div className="text-center py-2">
                    <Badge variant="secondary" className="text-[10px]">
                      +{processedNotes.length - 150} ещё нот
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Playback controls (if enabled and not in list mode) */}
      {enablePlayback && viewMode !== 'list' && notes.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant={internalPlaying ? "secondary" : "default"}
            onClick={handleTogglePlayback}
            className="h-8 w-8 rounded-full shrink-0"
          >
            {internalPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" />
            )}
          </Button>
          
          {/* Progress */}
          <div 
            className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              handleSeek(percent * duration);
            }}
          >
            <motion.div 
              className="h-full bg-primary"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          
          <span className="text-[10px] text-muted-foreground w-16 text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          
          {/* Volume - desktop only */}
          {!isMobile && (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </Button>
              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                min={-40}
                max={0}
                step={1}
                disabled={isMuted}
                className="w-16"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Download and share buttons */}
      {!compact && (
        <div className="flex flex-wrap gap-1.5">
          {effectiveMidiUrl && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(effectiveMidiUrl, 'notes.mid')}
                className="h-8 text-xs gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                MIDI
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSendToTelegram(effectiveMidiUrl, 'midi', '.mid')}
                disabled={sendingFile === 'midi'}
                className="h-8 text-xs gap-1"
                title="Отправить в Telegram"
              >
                {sendingFile === 'midi' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </Button>
            </>
          )}
          {files?.pdfUrl && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(files.pdfUrl!, 'notes.pdf')}
                className="h-8 text-xs gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSendToTelegram(files.pdfUrl!, 'pdf', '.pdf')}
                disabled={sendingFile === 'pdf'}
                className="h-8 text-xs gap-1"
                title="Отправить в Telegram"
              >
                {sendingFile === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </Button>
            </>
          )}
          {files?.gp5Url && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(files.gp5Url!, 'tabs.gp5')}
                className="h-8 text-xs gap-1 text-amber-600"
              >
                <Guitar className="w-3.5 h-3.5" />
                GP5
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSendToTelegram(files.gp5Url!, 'gp5', '.gp5')}
                disabled={sendingFile === 'gp5'}
                className="h-8 text-xs gap-1"
                title="Отправить в Telegram"
              >
                {sendingFile === 'gp5' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </Button>
            </>
          )}
          {effectiveMusicXmlUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(effectiveMusicXmlUrl, 'score.musicxml')}
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

export default UnifiedNotesViewer;
