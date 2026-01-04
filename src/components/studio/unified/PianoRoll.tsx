/**
 * PianoRoll - Interactive MIDI note editor for studio
 * 
 * Features:
 * - Note display on horizontal timeline
 * - Add/delete/move notes
 * - Snap to grid (1/4, 1/8, 1/16)
 * - Velocity editing
 * - Audio sync playback
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  MousePointer2,
  Pencil,
  Grid3X3,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';

// MIDI note representation
export interface MidiNote {
  id: string;
  pitch: number; // 0-127
  startTime: number; // in seconds
  duration: number; // in seconds
  velocity: number; // 0-127
}

// Piano key names
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteNameWithOctave(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  const noteName = NOTE_NAMES[pitch % 12];
  return `${noteName}${octave}`;
}

function isBlackKey(pitch: number): boolean {
  const note = pitch % 12;
  return [1, 3, 6, 8, 10].includes(note);
}

type EditMode = 'select' | 'draw' | 'erase';
type SnapValue = '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/32' | 'off';

interface PianoRollProps {
  notes: MidiNote[];
  onNotesChange: (notes: MidiNote[]) => void;
  duration: number; // Total duration in seconds
  bpm?: number;
  timeSignature?: string;
  currentTime?: number;
  onSeek?: (time: number) => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onExport?: () => void;
  className?: string;
  readOnly?: boolean;
}

export function PianoRoll({
  notes,
  onNotesChange,
  duration,
  bpm = 120,
  timeSignature = '4/4',
  currentTime = 0,
  onSeek,
  isPlaying = false,
  onPlayPause,
  onExport,
  className,
  readOnly = false,
}: PianoRollProps) {
  // State
  const [editMode, setEditMode] = useState<EditMode>('select');
  const [snapValue, setSnapValue] = useState<SnapValue>('1/8');
  const [zoom, setZoom] = useState(100); // pixels per second
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<MidiNote[][]>([notes]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [velocityEdit, setVelocityEdit] = useState<number | null>(null);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragNote = useRef<MidiNote | null>(null);
  
  // Visible pitch range (C2 to C6 = 36-84)
  const minPitch = 36;
  const maxPitch = 84;
  const pitchRange = maxPitch - minPitch;
  const rowHeight = 16;
  
  // Calculate grid snap value in seconds
  const snapSeconds = useMemo(() => {
    if (snapValue === 'off') return 0;
    const beatsPerSecond = bpm / 60;
    const beatDuration = 1 / beatsPerSecond;
    
    switch (snapValue) {
      case '1/1': return beatDuration * 4;
      case '1/2': return beatDuration * 2;
      case '1/4': return beatDuration;
      case '1/8': return beatDuration / 2;
      case '1/16': return beatDuration / 4;
      case '1/32': return beatDuration / 8;
      default: return beatDuration / 2;
    }
  }, [bpm, snapValue]);
  
  // Snap time to grid
  const snapToGrid = useCallback((time: number): number => {
    if (snapValue === 'off' || snapSeconds === 0) return time;
    return Math.round(time / snapSeconds) * snapSeconds;
  }, [snapValue, snapSeconds]);
  
  // Save to history
  const saveHistory = useCallback((newNotes: MidiNote[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newNotes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);
  
  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onNotesChange(history[historyIndex - 1]);
    }
  }, [historyIndex, history, onNotesChange]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onNotesChange(history[historyIndex + 1]);
    }
  }, [historyIndex, history, onNotesChange]);
  
  // Add note
  const addNote = useCallback((pitch: number, startTime: number) => {
    if (readOnly) return;
    
    const newNote: MidiNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pitch,
      startTime: snapToGrid(startTime),
      duration: snapSeconds || 0.25,
      velocity: 100,
    };
    
    const newNotes = [...notes, newNote];
    onNotesChange(newNotes);
    saveHistory(newNotes);
  }, [notes, onNotesChange, snapToGrid, snapSeconds, saveHistory, readOnly]);
  
  // Delete note
  const deleteNote = useCallback((noteId: string) => {
    if (readOnly) return;
    
    const newNotes = notes.filter(n => n.id !== noteId);
    onNotesChange(newNotes);
    saveHistory(newNotes);
    setSelectedNotes(prev => {
      const next = new Set(prev);
      next.delete(noteId);
      return next;
    });
  }, [notes, onNotesChange, saveHistory, readOnly]);
  
  // Delete selected notes
  const deleteSelectedNotes = useCallback(() => {
    if (readOnly || selectedNotes.size === 0) return;
    
    const newNotes = notes.filter(n => !selectedNotes.has(n.id));
    onNotesChange(newNotes);
    saveHistory(newNotes);
    setSelectedNotes(new Set());
    toast.success(`Удалено ${selectedNotes.size} нот`);
  }, [notes, selectedNotes, onNotesChange, saveHistory, readOnly]);
  
  // Update note velocity
  const updateNoteVelocity = useCallback((noteId: string, velocity: number) => {
    if (readOnly) return;
    
    const newNotes = notes.map(n => 
      n.id === noteId ? { ...n, velocity } : n
    );
    onNotesChange(newNotes);
  }, [notes, onNotesChange, readOnly]);
  
  // Handle grid click
  const handleGridClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + gridRef.current.scrollLeft;
    const y = e.clientY - rect.top + gridRef.current.scrollTop;
    
    const time = x / zoom;
    const pitchFromTop = Math.floor(y / rowHeight);
    const pitch = maxPitch - pitchFromTop;
    
    if (pitch < minPitch || pitch > maxPitch) return;
    
    if (editMode === 'draw') {
      addNote(pitch, time);
    } else if (editMode === 'select') {
      setSelectedNotes(new Set());
    }
  }, [editMode, zoom, addNote, maxPitch, minPitch]);
  
  // Handle note click
  const handleNoteClick = useCallback((e: React.MouseEvent, note: MidiNote) => {
    e.stopPropagation();
    
    if (editMode === 'erase') {
      deleteNote(note.id);
    } else if (editMode === 'select') {
      if (e.shiftKey) {
        // Add to selection
        setSelectedNotes(prev => {
          const next = new Set(prev);
          if (next.has(note.id)) {
            next.delete(note.id);
          } else {
            next.add(note.id);
          }
          return next;
        });
      } else {
        // Single select
        setSelectedNotes(new Set([note.id]));
        setVelocityEdit(note.velocity);
      }
    }
  }, [editMode, deleteNote]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          deleteSelectedNotes();
          break;
        case 'z':
          if (e.metaKey || e.ctrlKey) {
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case ' ':
          e.preventDefault();
          onPlayPause?.();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelectedNotes, undo, redo, onPlayPause, readOnly]);
  
  // Draw beat grid lines
  const gridLines = useMemo(() => {
    const lines: { x: number; isMeasure: boolean }[] = [];
    const beatsPerSecond = bpm / 60;
    const beatDuration = 1 / beatsPerSecond;
    const [beatsPerMeasure] = timeSignature.split('/').map(Number);
    
    for (let beat = 0; beat * beatDuration <= duration; beat++) {
      const x = beat * beatDuration * zoom;
      const isMeasure = beat % beatsPerMeasure === 0;
      lines.push({ x, isMeasure });
    }
    return lines;
  }, [bpm, duration, zoom, timeSignature]);
  
  // Playhead position
  const playheadX = currentTime * zoom;
  
  // Grid width
  const gridWidth = Math.max(duration * zoom, 800);
  
  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-muted/30 flex-wrap">
        {/* Edit mode */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={editMode === 'select' ? 'default' : 'ghost'}
                className="h-7 w-7"
                onClick={() => setEditMode('select')}
              >
                <MousePointer2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Выбор (V)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={editMode === 'draw' ? 'default' : 'ghost'}
                className="h-7 w-7"
                onClick={() => setEditMode('draw')}
                disabled={readOnly}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Рисование (P)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={editMode === 'erase' ? 'default' : 'ghost'}
                className="h-7 w-7"
                onClick={() => setEditMode('erase')}
                disabled={readOnly}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Стирание (E)</TooltipContent>
          </Tooltip>
        </div>
        
        {/* Snap */}
        <div className="flex items-center gap-1">
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          <Select value={snapValue} onValueChange={(v) => setSnapValue(v as SnapValue)}>
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1/1">1/1</SelectItem>
              <SelectItem value="1/2">1/2</SelectItem>
              <SelectItem value="1/4">1/4</SelectItem>
              <SelectItem value="1/8">1/8</SelectItem>
              <SelectItem value="1/16">1/16</SelectItem>
              <SelectItem value="1/32">1/32</SelectItem>
              <SelectItem value="off">Выкл</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setZoom(z => Math.max(50, z - 25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-10 text-center">{zoom}%</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setZoom(z => Math.min(400, z + 25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="w-px h-6 bg-border" />
        
        {/* Undo/Redo */}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={undo}
          disabled={historyIndex <= 0 || readOnly}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={redo}
          disabled={historyIndex >= history.length - 1 || readOnly}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border" />
        
        {/* Playback */}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onPlayPause}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        {/* Info badges */}
        <div className="flex items-center gap-1 ml-auto">
          <Badge variant="outline" className="text-xs">
            {bpm} BPM
          </Badge>
          <Badge variant="outline" className="text-xs">
            {timeSignature}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {notes.length} нот
          </Badge>
        </div>
        
        {/* Export */}
        {onExport && (
          <Button size="sm" variant="outline" onClick={onExport} className="h-7">
            <Download className="h-4 w-4 mr-1" />
            MIDI
          </Button>
        )}
      </div>
      
      {/* Velocity editor for selected note */}
      {selectedNotes.size === 1 && velocityEdit !== null && !readOnly && (
        <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/20">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground w-16">Velocity:</span>
          <Slider
            value={[velocityEdit]}
            min={1}
            max={127}
            step={1}
            className="flex-1 max-w-48"
            onValueChange={([v]) => {
              setVelocityEdit(v);
              const noteId = Array.from(selectedNotes)[0];
              updateNoteVelocity(noteId, v);
            }}
          />
          <span className="text-xs font-mono w-8">{velocityEdit}</span>
        </div>
      )}
      
      {/* Main piano roll area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Piano keyboard */}
        <div className="w-12 flex-shrink-0 border-r bg-muted/20">
          <div className="h-full overflow-hidden">
            {Array.from({ length: pitchRange + 1 }, (_, i) => {
              const pitch = maxPitch - i;
              const isBlack = isBlackKey(pitch);
              const noteName = getNoteNameWithOctave(pitch);
              const isC = pitch % 12 === 0;
              
              return (
                <div
                  key={pitch}
                  className={cn(
                    'h-4 border-b border-border/30 flex items-center justify-end pr-1',
                    isBlack ? 'bg-muted-foreground/20' : 'bg-background',
                    isC && 'border-b-primary/30'
                  )}
                >
                  {isC && (
                    <span className="text-[9px] text-muted-foreground">
                      {noteName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Grid and notes */}
        <ScrollArea className="flex-1">
          <div
            ref={gridRef}
            className="relative cursor-crosshair"
            style={{
              width: gridWidth,
              height: (pitchRange + 1) * rowHeight,
            }}
            onClick={handleGridClick}
          >
            {/* Grid lines */}
            {gridLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'absolute top-0 bottom-0 w-px',
                  line.isMeasure ? 'bg-border' : 'bg-border/30'
                )}
                style={{ left: line.x }}
              />
            ))}
            
            {/* Pitch rows */}
            {Array.from({ length: pitchRange + 1 }, (_, i) => {
              const pitch = maxPitch - i;
              const isBlack = isBlackKey(pitch);
              
              return (
                <div
                  key={pitch}
                  className={cn(
                    'absolute left-0 right-0 border-b border-border/20',
                    isBlack ? 'bg-muted/30' : 'bg-background'
                  )}
                  style={{
                    top: i * rowHeight,
                    height: rowHeight,
                  }}
                />
              );
            })}
            
            {/* Notes */}
            <AnimatePresence>
              {notes.map((note) => {
                const top = (maxPitch - note.pitch) * rowHeight;
                const left = note.startTime * zoom;
                const width = Math.max(note.duration * zoom, 4);
                const isSelected = selectedNotes.has(note.id);
                const opacity = note.velocity / 127;
                
                if (note.pitch < minPitch || note.pitch > maxPitch) return null;
                
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      'absolute rounded-sm cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-primary ring-2 ring-primary ring-offset-1'
                        : 'bg-primary/80 hover:bg-primary',
                      editMode === 'erase' && 'hover:bg-destructive'
                    )}
                    style={{
                      top: top + 1,
                      left,
                      width,
                      height: rowHeight - 2,
                      opacity: 0.5 + opacity * 0.5,
                    }}
                    onClick={(e) => handleNoteClick(e, note)}
                  >
                    <span className="text-[8px] text-primary-foreground px-1 truncate block">
                      {getNoteNameWithOctave(note.pitch)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10 pointer-events-none"
              style={{ left: playheadX }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-destructive rounded-full" />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default PianoRoll;
