import { useState, useRef, useEffect, useCallback, TouchEvent } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Music, 
  ZoomIn, 
  ZoomOut, 
  Download,
  RefreshCw,
  ChevronDown,
  Volume2,
  VolumeX,
  Play,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMidiVisualization, MidiNote } from '@/hooks/useMidiVisualization';
import { useMidiSynth } from '@/hooks/useMidiSynth';
import { useStemMidi, MidiModelType } from '@/hooks/useStemMidi';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MidiVisualizationMobileProps {
  trackId: string;
  stems?: Array<{ id: string; stem_type: string; audio_url: string }>;
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  midiVersions?: Array<{ id: string; audio_url: string; version_label: string; version_type: string }>;
}

// Touch tracking for pinch-to-zoom
interface TouchPoint {
  x: number;
  y: number;
}

export const MidiVisualizationMobile = ({
  trackId,
  stems = [],
  currentTime = 0,
  isPlaying = false,
  onSeek,
  midiVersions = [],
}: MidiVisualizationMobileProps) => {
  const haptic = useHapticFeedback();
  const { transcribeToMidi, isTranscribing } = useStemMidi(trackId);
  const {
    notes,
    duration,
    tempo,
    isLoading,
    loadMidi,
    exportMidi,
  } = useMidiVisualization();

  // MIDI synth for playback
  const { playNote, playNotes, stopAll, initialize, isReady, isMuted, setMuted } = useMidiSynth();

  const [selectedStemId, setSelectedStemId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isPlayingMidi, setIsPlayingMidi] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Touch gesture state
  const lastTouchesRef = useRef<TouchPoint[]>([]);
  const initialZoomRef = useRef(zoom);
  const lastTapTimeRef = useRef(0);

  const pixelsPerSecond = 60 * zoom;
  const noteHeight = 8; // Larger for touch
  const minPitch = notes.length > 0 ? Math.min(...notes.map(n => n.pitch)) - 2 : 48;
  const maxPitch = notes.length > 0 ? Math.max(...notes.map(n => n.pitch)) + 2 : 72;
  const pitchRange = maxPitch - minPitch;
  const canvasHeight = pitchRange * noteHeight;

  // Initialize synth on mount
  useEffect(() => {
    if (!isReady) {
      initialize();
    }
  }, [isReady, initialize]);

  // Auto-scroll to playhead
  useEffect(() => {
    if (isPlaying && scrollRef.current) {
      const playheadX = currentTime * pixelsPerSecond;
      const containerWidth = scrollRef.current.clientWidth;
      const scrollLeft = playheadX - containerWidth / 2;
      scrollRef.current.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [currentTime, isPlaying, pixelsPerSecond]);

  // Load MIDI when version selected
  useEffect(() => {
    if (selectedVersionId) {
      const version = midiVersions.find(v => v.id === selectedVersionId);
      if (version?.audio_url) {
        loadMidi(version.audio_url);
      }
    }
  }, [selectedVersionId, midiVersions, loadMidi]);

  // Handle pinch-to-zoom
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    const touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
    lastTouchesRef.current = touches;
    initialZoomRef.current = zoom;
  }, [zoom]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    const touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
    
    if (touches.length === 2 && lastTouchesRef.current.length === 2) {
      // Pinch-to-zoom
      const prevDistance = Math.hypot(
        lastTouchesRef.current[1].x - lastTouchesRef.current[0].x,
        lastTouchesRef.current[1].y - lastTouchesRef.current[0].y
      );
      const currDistance = Math.hypot(
        touches[1].x - touches[0].x,
        touches[1].y - touches[0].y
      );
      
      const scale = currDistance / prevDistance;
      const newZoom = Math.max(0.25, Math.min(4, initialZoomRef.current * scale));
      
      if (Math.abs(newZoom - zoom) > 0.05) {
        setZoom(newZoom);
        haptic.tap();
      }
    }
    
    lastTouchesRef.current = touches;
  }, [zoom, haptic]);

  const handleTouchEnd = useCallback(() => {
    lastTouchesRef.current = [];
  }, []);

  // Find note at position
  const findNoteAtPosition = useCallback((clientX: number, clientY: number): MidiNote | null => {
    if (!scrollRef.current) return null;
    
    const rect = scrollRef.current.getBoundingClientRect();
    const x = clientX - rect.left + scrollRef.current.scrollLeft;
    const y = rect.bottom - clientY; // Invert Y since notes are bottom-up
    
    const time = x / pixelsPerSecond;
    const pitch = minPitch + Math.floor(y / noteHeight);
    
    // Find closest note within tolerance
    const tolerance = 0.1; // seconds
    return notes.find(note => 
      time >= note.time - tolerance && 
      time <= note.time + note.duration + tolerance &&
      note.pitch === pitch
    ) || null;
  }, [notes, pixelsPerSecond, noteHeight, minPitch]);

  // Handle tap on note or grid
  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!scrollRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0]?.clientX || e.changedTouches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || e.changedTouches[0]?.clientY : e.clientY;
    
    if (!clientX || !clientY) return;
    
    // Check for double-tap
    const now = Date.now();
    const isDoubleTap = now - lastTapTimeRef.current < 300;
    lastTapTimeRef.current = now;
    
    const note = findNoteAtPosition(clientX, clientY);
    
    if (note) {
      // Tap on note - play it
      haptic.impact('light');
      setActiveNoteId(note.id);
      playNote(note);
      
      setTimeout(() => setActiveNoteId(null), 200);
    } else if (isDoubleTap) {
      // Double-tap on empty area - seek to position
      const rect = scrollRef.current.getBoundingClientRect();
      const x = clientX - rect.left + scrollRef.current.scrollLeft;
      const time = x / pixelsPerSecond;
      
      if (time >= 0 && time <= duration && onSeek) {
        haptic.impact('medium');
        onSeek(time);
      }
    }
  }, [findNoteAtPosition, haptic, playNote, pixelsPerSecond, duration, onSeek]);

  const handleTranscribe = async () => {
    if (!selectedStemId) {
      toast.error('Выберите стем для транскрипции');
      return;
    }
    
    haptic.impact('medium');
    const stem = stems.find(s => s.id === selectedStemId);
    if (stem) {
      await transcribeToMidi(stem.audio_url, 'basic-pitch' as MidiModelType, stem.stem_type);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    haptic.tap();
    setZoom(prev => {
      if (direction === 'in') return Math.min(prev * 1.5, 4);
      return Math.max(prev / 1.5, 0.25);
    });
  };

  const handleDownload = () => {
    haptic.impact('medium');
    const blob = exportMidi();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `track_${trackId}_midi.mid`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('MIDI скачан');
  };

  const handlePlayMidi = () => {
    if (isPlayingMidi) {
      stopAll();
      setIsPlayingMidi(false);
      haptic.tap();
    } else {
      haptic.impact('medium');
      setIsPlayingMidi(true);
      playNotes(notes);
      
      // Auto-stop after duration
      const maxDuration = notes.reduce((max, n) => Math.max(max, n.time + n.duration), 0);
      setTimeout(() => {
        setIsPlayingMidi(false);
      }, maxDuration * 1000 + 500);
    }
  };

  const getNoteColor = (note: MidiNote, isActive: boolean) => {
    const hue = (note.pitch % 12) * 30;
    const lightness = isActive ? 70 : 50 + (note.velocity / 127) * 15;
    const saturation = isActive ? 90 : 70;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Collapsed view
  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card 
          className="p-3 cursor-pointer active:bg-muted/50 active:scale-[0.98] transition-transform"
          onClick={() => {
            haptic.tap();
            setIsExpanded(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              <span className="font-medium">MIDI Ноты</span>
              {notes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {notes.length} нот
                </Badge>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3"
    >
      <Card className="p-3">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer active:opacity-70"
          onClick={() => {
            haptic.tap();
            setIsExpanded(false);
          }}
        >
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <span className="font-medium">MIDI Ноты</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground rotate-180" />
        </div>

        {/* Selectors */}
        <div className="flex gap-2 mb-3">
          <Select value={selectedStemId || ''} onValueChange={setSelectedStemId}>
            <SelectTrigger className="flex-1 h-10">
              <SelectValue placeholder="Выбрать стем" />
            </SelectTrigger>
            <SelectContent>
              {stems.map(stem => (
                <SelectItem key={stem.id} value={stem.id}>
                  {stem.stem_type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {midiVersions.length > 0 && (
            <Select value={selectedVersionId || ''} onValueChange={setSelectedVersionId}>
              <SelectTrigger className="flex-1 h-10">
                <SelectValue placeholder="MIDI версия" />
              </SelectTrigger>
              <SelectContent>
                {midiVersions.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.version_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Action Buttons - Touch optimized */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-11 min-h-[44px] text-sm"
            onClick={handleTranscribe}
            disabled={!selectedStemId || isTranscribing}
          >
            {isTranscribing ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Music className="w-4 h-4 mr-1.5" />
            )}
            Создать MIDI
          </Button>
          
          {notes.length > 0 && (
            <>
              <Button
                variant={isPlayingMidi ? "default" : "outline"}
                size="icon"
                className="h-11 w-11 min-h-[44px] min-w-[44px]"
                onClick={handlePlayMidi}
              >
                {isPlayingMidi ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 min-h-[44px] min-w-[44px]"
                onClick={() => {
                  haptic.tap();
                  setMuted(!isMuted);
                }}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 min-h-[44px] min-w-[44px]"
              onClick={() => handleZoom('out')}
              disabled={zoom <= 0.25}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-muted-foreground w-14 text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 min-h-[44px] min-w-[44px]"
              onClick={() => handleZoom('in')}
              disabled={zoom >= 4}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {notes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-10 min-h-[44px]"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Скачать
            </Button>
          )}
        </div>

        {/* Touch hint */}
        {notes.length > 0 && (
          <p className="text-xs text-muted-foreground mb-2 text-center">
            Тапните на ноту для прослушивания • Pinch для масштаба • 2x тап для перемотки
          </p>
        )}

        {/* Piano Roll Visualization */}
        {isLoading ? (
          <div className="h-40 flex items-center justify-center rounded-lg bg-muted/30">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length > 0 ? (
          <div 
            ref={scrollRef}
            className="relative overflow-x-auto overflow-y-hidden rounded-lg bg-muted/30 touch-pan-x"
            style={{ height: Math.min(canvasHeight + 20, 180) }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleTap}
          >
            <div
              className="relative"
              style={{
                width: duration * pixelsPerSecond + 50,
                height: canvasHeight,
              }}
            >
              {/* Grid lines */}
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute top-0 bottom-0 border-l",
                    i % 4 === 0 ? "border-border/50" : "border-border/20"
                  )}
                  style={{ left: i * pixelsPerSecond }}
                >
                  {i % 4 === 0 && (
                    <span className="absolute -top-4 left-1 text-[10px] text-muted-foreground">
                      {Math.floor(i / 4) + 1}
                    </span>
                  )}
                </div>
              ))}

              {/* Horizontal pitch lines */}
              {Array.from({ length: pitchRange }).map((_, i) => (
                <div
                  key={`pitch-${i}`}
                  className={cn(
                    "absolute left-0 right-0 border-b",
                    i % 12 === 0 ? "border-border/40" : "border-border/10"
                  )}
                  style={{ bottom: i * noteHeight }}
                />
              ))}

              {/* Notes */}
              <AnimatePresence>
                {notes.map((note) => {
                  const isActive = note.id === activeNoteId || 
                    (currentTime >= note.time && currentTime <= note.time + note.duration);
                  
                  return (
                    <motion.div
                      key={note.id}
                      className={cn(
                        "absolute rounded-sm cursor-pointer touch-manipulation",
                        "transition-shadow duration-150"
                      )}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: isActive ? 1 : 0.75,
                        scale: isActive ? 1.1 : 1,
                      }}
                      whileTap={{ scale: 1.2 }}
                      style={{
                        left: note.time * pixelsPerSecond,
                        bottom: (note.pitch - minPitch) * noteHeight,
                        width: Math.max(note.duration * pixelsPerSecond, 6),
                        height: noteHeight - 1,
                        backgroundColor: getNoteColor(note, isActive),
                        boxShadow: isActive 
                          ? `0 0 12px ${getNoteColor(note, true)}, 0 0 4px ${getNoteColor(note, true)}`
                          : 'none',
                        zIndex: isActive ? 10 : 1,
                      }}
                    />
                  );
                })}
              </AnimatePresence>

              {/* Playhead */}
              <motion.div
                className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-20"
                style={{ left: currentTime * pixelsPerSecond }}
                animate={{ left: currentTime * pixelsPerSecond }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg" />
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-muted-foreground rounded-lg bg-muted/30 p-4">
            <Music className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium mb-3">Выберите стем и создайте MIDI</p>
            
            {/* Model hints */}
            <div className="text-xs space-y-1.5 text-left max-w-[280px]">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <strong>MT3</strong> — барабаны, бас, гитара
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <strong>Piano HD</strong> — высокоточное пианино
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <strong>Basic Pitch</strong> — вокал и мелодии
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        {notes.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Music className="w-3 h-3" />
              {notes.length} нот
            </span>
            <span>•</span>
            <span>{tempo.toFixed(0)} BPM</span>
            <span>•</span>
            <span>{Math.round(duration)}с</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
