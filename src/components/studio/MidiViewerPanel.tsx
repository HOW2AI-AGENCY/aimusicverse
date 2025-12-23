/**
 * MidiViewerPanel - Read-only MIDI/Notes viewer for stems
 * 
 * Opens when clicking the "view" (eye) icon on a stem.
 * Displays piano roll with full-width waveform alignment.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Piano, Music, X, ZoomIn, ZoomOut, Maximize2,
  Play, Pause, Volume2, VolumeX, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { parseMidiFromUrl } from '@/lib/midiParser';
import type { TrackStem } from '@/hooks/useTrackStems';
import type { StemTranscription } from '@/hooks/useStemTranscription';

interface MidiViewerPanelProps {
  open: boolean;
  onClose: () => void;
  stem: TrackStem;
  transcription: StemTranscription | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
}

interface Note {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3, 4];

export function MidiViewerPanel({
  open,
  onClose,
  stem,
  transcription,
  currentTime,
  duration,
  isPlaying,
  onSeek,
}: MidiViewerPanelProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Load MIDI data
  useEffect(() => {
    if (!open || !transcription?.midi_url) {
      setNotes([]);
      return;
    }
    
    let mounted = true;
    
    const loadMidi = async () => {
      setLoading(true);
      try {
        const parsed = await parseMidiFromUrl(transcription.midi_url!);
        if (mounted && parsed?.notes) {
          setNotes(parsed.notes);
        }
      } catch (error) {
        console.error('Failed to load MIDI:', error);
        // Fallback to transcription notes if available
        if (transcription.notes && Array.isArray(transcription.notes)) {
          setNotes(transcription.notes as Note[]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    loadMidi();
    return () => { mounted = false; };
  }, [open, transcription?.midi_url, transcription?.notes]);
  
  // Calculate note range
  const { minPitch, maxPitch, pitchRange } = useMemo(() => {
    if (!notes.length) return { minPitch: 48, maxPitch: 84, pitchRange: 36 };
    const pitches = notes.map(n => n.pitch);
    const min = Math.min(...pitches);
    const max = Math.max(...pitches);
    return {
      minPitch: Math.max(0, min - 2),
      maxPitch: Math.min(127, max + 2),
      pitchRange: max - min + 4,
    };
  }, [notes]);
  
  // Auto-scroll to playhead
  useEffect(() => {
    if (!autoScroll || !isPlaying || !scrollRef.current) return;
    
    const scrollContainer = scrollRef.current;
    const progress = duration > 0 ? currentTime / duration : 0;
    const contentWidth = scrollContainer.scrollWidth;
    const viewportWidth = scrollContainer.clientWidth;
    const targetScroll = (progress * contentWidth) - (viewportWidth / 2);
    
    scrollContainer.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth'
    });
  }, [currentTime, duration, isPlaying, autoScroll]);
  
  // Handle click to seek
  const handlePianoRollClick = useCallback((e: React.MouseEvent) => {
    if (!onSeek || !scrollRef.current || duration <= 0) return;
    
    const rect = scrollRef.current.getBoundingClientRect();
    const scrollLeft = scrollRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const contentWidth = scrollRef.current.scrollWidth;
    const progress = clickX / contentWidth;
    
    onSeek(Math.max(0, Math.min(duration, progress * duration)));
    setAutoScroll(false);
    setTimeout(() => setAutoScroll(true), 3000);
  }, [onSeek, duration]);
  
  // Zoom controls
  const handleZoomIn = () => {
    const idx = ZOOM_LEVELS.findIndex(z => z >= zoom);
    if (idx < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[idx + 1]);
  };
  
  const handleZoomOut = () => {
    const idx = ZOOM_LEVELS.findIndex(z => z >= zoom);
    if (idx > 0) setZoom(ZOOM_LEVELS[idx - 1]);
  };
  
  const handleFitToScreen = () => {
    if (!scrollRef.current || duration <= 0) return;
    const viewportWidth = scrollRef.current.clientWidth - 40; // minus piano keys
    const idealZoom = viewportWidth / (duration * 20);
    setZoom(Math.max(0.5, Math.min(4, idealZoom)));
  };
  
  // Calculate dimensions
  const contentWidth = duration * 20 * zoom; // 20px per second base
  const rowHeight = isMobile ? 6 : 8;
  const pianoKeyWidth = isMobile ? 32 : 40;
  const totalHeight = pitchRange * rowHeight;
  
  if (!open) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm",
          isMobile && "pb-safe"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Piano className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">{stem.stem_type}</h3>
              <p className="text-xs text-muted-foreground">
                {notes.length} нот • {transcription?.bpm ? `${Math.round(transcription.bpm)} BPM` : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleZoomOut}
                disabled={zoom <= ZOOM_LEVELS[0]}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-mono w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleZoomIn}
                disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleFitToScreen}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Stats badges */}
        <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
          <Badge variant="secondary" className="text-xs shrink-0">
            {notes.length} нот
          </Badge>
          {transcription?.key_detected && (
            <Badge variant="outline" className="text-xs shrink-0">
              {transcription.key_detected}
            </Badge>
          )}
          {transcription?.bpm && (
            <Badge variant="outline" className="text-xs shrink-0">
              {Math.round(transcription.bpm)} BPM
            </Badge>
          )}
          <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
            {NOTE_NAMES[minPitch % 12]}{Math.floor(minPitch / 12) - 1} – {NOTE_NAMES[maxPitch % 12]}{Math.floor(maxPitch / 12) - 1}
          </Badge>
        </div>
        
        {/* Piano Roll Container */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          style={{ height: `calc(100vh - ${isMobile ? 180 : 140}px)` }}
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex h-full">
              {/* Piano Keys */}
              <div 
                className="shrink-0 border-r border-border/30 bg-muted/30"
                style={{ width: pianoKeyWidth }}
              >
                <div 
                  className="relative"
                  style={{ height: totalHeight }}
                >
                  {Array.from({ length: pitchRange }, (_, i) => {
                    const pitch = maxPitch - i;
                    const noteName = NOTE_NAMES[pitch % 12];
                    const isBlack = noteName.includes('#');
                    const octave = Math.floor(pitch / 12) - 1;
                    
                    return (
                      <div
                        key={pitch}
                        className={cn(
                          "absolute w-full border-b border-border/20 flex items-center justify-end pr-1",
                          isBlack ? "bg-foreground/10" : "bg-background/50"
                        )}
                        style={{
                          top: i * rowHeight,
                          height: rowHeight,
                        }}
                      >
                        {noteName === 'C' && (
                          <span className="text-[8px] font-mono text-muted-foreground">
                            C{octave}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Notes Grid */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-auto touch-pan-x"
                onClick={handlePianoRollClick}
              >
                <div
                  className="relative"
                  style={{ 
                    width: contentWidth,
                    height: totalHeight,
                    minWidth: '100%'
                  }}
                >
                  {/* Grid lines */}
                  {Array.from({ length: Math.ceil(duration) }, (_, i) => (
                    <div
                      key={`grid-${i}`}
                      className="absolute top-0 bottom-0 border-l border-border/20"
                      style={{ left: i * 20 * zoom }}
                    >
                      <span className="absolute top-0 left-1 text-[8px] text-muted-foreground/50">
                        {Math.floor(i / 60)}:{String(i % 60).padStart(2, '0')}
                      </span>
                    </div>
                  ))}
                  
                  {/* Horizontal grid lines */}
                  {Array.from({ length: pitchRange }, (_, i) => {
                    const pitch = maxPitch - i;
                    const isBlack = NOTE_NAMES[pitch % 12].includes('#');
                    return (
                      <div
                        key={`hgrid-${i}`}
                        className={cn(
                          "absolute left-0 right-0 border-b border-border/10",
                          isBlack && "bg-foreground/5"
                        )}
                        style={{
                          top: i * rowHeight,
                          height: rowHeight,
                        }}
                      />
                    );
                  })}
                  
                  {/* Notes */}
                  {notes.map((note, i) => {
                    const noteTop = (maxPitch - note.pitch) * rowHeight;
                    const noteLeft = (note.startTime / duration) * contentWidth;
                    const noteWidth = Math.max(3, ((note.endTime - note.startTime) / duration) * contentWidth);
                    const isActive = note.startTime <= currentTime && note.endTime >= currentTime;
                    const isPast = note.endTime < currentTime;
                    const isBlack = NOTE_NAMES[note.pitch % 12].includes('#');
                    
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "absolute rounded-sm transition-all duration-75",
                          isBlack 
                            ? "bg-primary/70 hover:bg-primary/90" 
                            : "bg-primary hover:brightness-110",
                          isPast && "opacity-40",
                          isActive && "ring-1 ring-white shadow-lg shadow-primary/50 brightness-125 z-10"
                        )}
                        style={{
                          top: noteTop + 1,
                          left: noteLeft,
                          width: noteWidth,
                          height: rowHeight - 2,
                          opacity: isPast ? 0.4 : (0.5 + (note.velocity / 127) * 0.5),
                        }}
                      />
                    );
                  })}
                  
                  {/* Playhead */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20 pointer-events-none"
                    style={{
                      left: (currentTime / duration) * contentWidth,
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom waveform (aligned with piano roll) */}
        <div className="border-t border-border/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <div style={{ width: pianoKeyWidth }} className="shrink-0" />
            <div className="flex-1 h-12 bg-muted/30 rounded-lg relative overflow-hidden">
              {/* Simple progress indicator */}
              <div 
                className="absolute top-0 bottom-0 left-0 bg-primary/20"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default MidiViewerPanel;
