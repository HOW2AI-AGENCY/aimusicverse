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
  
  // Determine effective URLs
  const effectiveMidiUrl = midiUrl || files?.midiUrl;
  const effectiveMusicXmlUrl = musicXmlUrl || files?.musicXmlUrl;
  
  // Auto-select view mode: notation if MusicXML available, else piano
  const [viewMode, setViewMode] = useState<ViewMode>(
    effectiveMusicXmlUrl ? 'notation' : 'piano'
  );
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  
  // MIDI parsing
  const { 
    parseMidiFromUrl, 
    parsedMidi, 
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

  // Parse MusicXML when in notation mode and URL is available
  useEffect(() => {
    if (effectiveMusicXmlUrl && viewMode === 'notation') {
      parseMusicXmlFromUrl(effectiveMusicXmlUrl);
    }
  }, [effectiveMusicXmlUrl, viewMode, parseMusicXmlFromUrl]);
  const notes = useMemo((): ParsedMidiNote[] => {
    if (providedNotes?.length) {
      return providedNotes.map((n, idx) => {
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
    return parsedMidi?.notes ?? [];
  }, [providedNotes, parsedMidi]);
  
  // Convert MusicXML notes to NoteInput format for visualization components
  const xmlNotesConverted = useMemo((): NoteInput[] => {
    if (!parsedXml?.notes?.length) return [];
    return parsedXml.notes.map(n => ({
      pitch: n.midiPitch ?? 60,
      startTime: n.startTime,
      duration: n.duration,
      noteName: `${n.pitch}${n.octave}`,
      velocity: 100,
    }));
  }, [parsedXml]);
  
  const duration = providedDuration ?? parsedMidi?.duration ?? 60;
  const effectiveBpm = bpm ?? parsedMidi?.bpm ?? 120;
  
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
  
  const defaultHeight = compact ? (isMobile ? 140 : 180) : (isMobile ? 220 : 280);
  const visualHeight = height ?? defaultHeight;
  
  // Loading state
  if (isParsing && !notes.length) {
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
  
  // Empty state
  if (!notes.length && !effectiveMusicXmlUrl) {
    return (
      <div 
        className={cn(
          "rounded-xl border bg-muted/30 flex flex-col items-center justify-center gap-3 p-6",
          className
        )}
        style={{ minHeight: visualHeight }}
      >
        <Music className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground text-center">Ноты не найдены</p>
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
        <div 
          className="overflow-x-auto touch-pan-x" 
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {viewMode === 'piano' && notes.length > 0 && (
            <div className="min-w-[300px]">
              <InteractivePianoRoll
                notes={notes}
                duration={duration}
                currentTime={currentTime}
                height={visualHeight}
                onNoteClick={handleNoteClick}
              />
            </div>
          )}
          
          {viewMode === 'notation' && effectiveMusicXmlUrl && (
            <div className="min-w-[300px]">
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
              ) : musicXmlError ? (
                <div 
                  className="rounded-lg border bg-muted/20 flex flex-col items-center justify-center gap-2 p-4"
                  style={{ height: visualHeight }}
                >
                  <Music2 className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">Не удалось загрузить MusicXML</p>
                  <p className="text-xs text-muted-foreground/80 text-center">{musicXmlError}</p>
                </div>
              ) : xmlNotesConverted.length > 0 ? (
                <StaffNotation
                  notes={xmlNotesConverted}
                  duration={parsedXml?.duration ?? duration}
                  bpm={parsedXml?.bpm ?? effectiveBpm}
                  timeSignature={parsedXml?.timeSignature ?? parsedTimeSignature}
                  keySignature={parsedXml?.keySignature ?? keySignature}
                  height={visualHeight}
                />
              ) : notes.length > 0 ? (
                <StaffNotation
                  notes={notes}
                  duration={duration}
                  bpm={effectiveBpm}
                  timeSignature={parsedTimeSignature}
                  keySignature={keySignature}
                  height={visualHeight}
                />
              ) : (
                <div 
                  className="rounded-lg border bg-muted/20 flex flex-col items-center justify-center gap-2"
                  style={{ height: visualHeight }}
                >
                  <Music2 className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Нет нот для отображения</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {viewMode === 'list' && (
          <ScrollArea style={{ height: visualHeight }}>
            <div className="divide-y divide-border/50">
              {processedNotes.slice(0, 100).map((note, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 transition-colors active:bg-muted/50",
                    selectedNoteIndex === note.index && "bg-primary/5"
                  )}
                  onClick={() => setSelectedNoteIndex(note.index)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-mono text-xs font-semibold text-primary">
                      {note.noteName}
                    </div>
                    <div>
                      <p className="font-medium text-xs">{note.noteNameRu}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatTime(note.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground">
                      {(note.duration * 1000).toFixed(0)} мс
                    </span>
                  </div>
                </div>
              ))}
              {processedNotes.length > 100 && (
                <div className="px-3 py-2 text-[10px] text-muted-foreground text-center bg-muted/20">
                  +{processedNotes.length - 100} ещё...
                </div>
              )}
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
