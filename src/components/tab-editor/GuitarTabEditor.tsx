/**
 * GuitarTabEditor - Interactive guitar tablature editor
 * Supports drawing, editing, playback, and export
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Play,
  Pause,
  Square,
  Undo2,
  Redo2,
  Copy,
  Clipboard,
  Trash2,
  MousePointer2,
  Pencil,
  Eraser,
  Download,
  Settings,
  Music,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTabEditor, type TabNote, type TabTool } from '@/hooks/useTabEditor';
import { useMidiSynth } from '@/hooks/useMidiSynth';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface GuitarTabEditorProps {
  initialNotes?: TabNote[];
  onExport?: (format: 'midi' | 'gp5' | 'pdf', notes: TabNote[]) => void;
  onSave?: (notes: TabNote[]) => void;
  className?: string;
}

const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];
const STRING_MIDI_NOTES = [64, 59, 55, 50, 45, 40]; // Standard tuning

const TOOL_ICONS: Record<TabTool, React.ReactNode> = {
  select: <MousePointer2 className="h-4 w-4" />,
  draw: <Pencil className="h-4 w-4" />,
  erase: <Eraser className="h-4 w-4" />,
  'hammer-on': <span className="text-xs font-bold">H</span>,
  slide: <span className="text-xs font-bold">/</span>,
  bend: <span className="text-xs font-bold">b</span>,
};

const TECHNIQUE_SYMBOLS: Record<string, string> = {
  'hammer-on': 'h',
  'pull-off': 'p',
  slide: '/',
  bend: 'b',
  vibrato: '~',
  'palm-mute': 'x',
};

// Measures to display
const MEASURES_PER_PAGE = 4;
const BEATS_PER_MEASURE = 4;
const POSITIONS_PER_PAGE = MEASURES_PER_PAGE * BEATS_PER_MEASURE;

export const GuitarTabEditor = memo(function GuitarTabEditor({
  initialNotes,
  onExport,
  onSave,
  className,
}: GuitarTabEditorProps) {
  const haptic = useHapticFeedback();
  const synth = useMidiSynth();
  const playIntervalRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(0);
  const [inputDialogOpen, setInputDialogOpen] = useState(false);
  const [inputPosition, setInputPosition] = useState<{ string: number; position: number } | null>(null);
  const [inputValue, setInputValue] = useState('');

  const editor = useTabEditor({
    initialNotes,
    onNotesChange: onSave,
  });

  // Initialize synth on mount
  useEffect(() => {
    synth.initialize();
  }, [synth]);

  // Calculate visible positions
  const startPosition = page * POSITIONS_PER_PAGE;
  const endPosition = startPosition + POSITIONS_PER_PAGE;

  // Get visible notes
  const visibleNotes = editor.notes.filter(
    n => n.position >= startPosition && n.position < endPosition
  );

  // Group notes by position for rendering
  const notesByPosition = new Map<string, TabNote[]>();
  visibleNotes.forEach(note => {
    const key = `${note.string}-${note.position}`;
    const existing = notesByPosition.get(key) || [];
    notesByPosition.set(key, [...existing, note]);
  });

  /**
   * Handle cell click
   */
  const handleCellClick = useCallback((string: number, position: number) => {
    const absolutePosition = startPosition + position;
    const key = `${string}-${absolutePosition}`;
    const existingNotes = editor.notes.filter(
      n => n.string === string && n.position === absolutePosition
    );

    switch (editor.currentTool) {
      case 'select':
        if (existingNotes.length > 0) {
          editor.toggleNoteSelection(existingNotes[0].id);
        }
        break;

      case 'draw':
        if (existingNotes.length === 0) {
          setInputPosition({ string, position: absolutePosition });
          setInputValue('');
          setInputDialogOpen(true);
        } else {
          // Edit existing
          setInputPosition({ string, position: absolutePosition });
          setInputValue(existingNotes[0].fret.toString());
          setInputDialogOpen(true);
        }
        break;

      case 'erase':
        existingNotes.forEach(n => editor.deleteNote(n.id));
        break;

      case 'hammer-on':
      case 'slide':
      case 'bend':
        if (existingNotes.length > 0) {
          const technique = editor.currentTool as 'hammer-on' | 'slide' | 'bend';
          existingNotes.forEach(n => 
            editor.updateNote(n.id, { technique })
          );
        }
        break;
    }

    haptic.tap();
  }, [editor, startPosition, haptic]);

  /**
   * Handle fret input
   */
  const handleFretInput = useCallback(() => {
    if (!inputPosition) return;

    const fret = parseInt(inputValue);
    if (isNaN(fret) || fret < 0 || fret > 24) {
      setInputDialogOpen(false);
      return;
    }

    // Check if note exists at position
    const existing = editor.notes.find(
      n => n.string === inputPosition.string && n.position === inputPosition.position
    );

    if (existing) {
      editor.updateNote(existing.id, { fret });
    } else {
      const note = editor.addNote(inputPosition.string, fret, inputPosition.position);
      // Play preview
      const midiNote = STRING_MIDI_NOTES[inputPosition.string] + fret;
      synth.playNote(midiNote, 0.3, 0.8);
    }

    setInputDialogOpen(false);
    setInputPosition(null);
  }, [inputPosition, inputValue, editor, synth]);

  /**
   * Playback
   */
  const handlePlay = useCallback(() => {
    if (editor.isPlaying) {
      // Stop
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      synth.stopAll();
      editor.setIsPlaying(false);
      return;
    }

    editor.setIsPlaying(true);
    const startPos = editor.currentPosition;
    const tempo = editor.bpm;
    const beatDuration = 60 / tempo; // seconds per beat

    let currentPos = startPos;

    playIntervalRef.current = window.setInterval(() => {
      // Get notes at current position
      const notesAtPos = editor.notes.filter(n => n.position === currentPos);
      
      notesAtPos.forEach(note => {
        const midiNote = STRING_MIDI_NOTES[note.string] + note.fret;
        synth.playNote(midiNote, note.duration * beatDuration, 0.8);
      });

      editor.setCurrentPosition(currentPos);
      currentPos++;

      // Check if we've reached the end
      const maxPos = Math.max(...editor.notes.map(n => n.position + n.duration), 0);
      if (currentPos > maxPos + 4) {
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
          playIntervalRef.current = null;
        }
        editor.setIsPlaying(false);
        editor.setCurrentPosition(0);
      }
    }, beatDuration * 1000);
  }, [editor, synth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Tool buttons */}
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          {(['select', 'draw', 'erase'] as TabTool[]).map(tool => (
            <Button
              key={tool}
              variant={editor.currentTool === tool ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                editor.setCurrentTool(tool);
                haptic.tap();
              }}
            >
              {TOOL_ICONS[tool]}
            </Button>
          ))}
        </div>

        {/* Technique buttons */}
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          {(['hammer-on', 'slide', 'bend'] as TabTool[]).map(tool => (
            <Button
              key={tool}
              variant={editor.currentTool === tool ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                editor.setCurrentTool(tool);
                haptic.tap();
              }}
            >
              {TOOL_ICONS[tool]}
            </Button>
          ))}
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={editor.undo}
            disabled={!editor.canUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={editor.redo}
            disabled={!editor.canRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Copy/Paste */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={editor.copySelected}
            disabled={editor.selectedNotes.size === 0}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.paste()}
            disabled={!editor.hasClipboard}
          >
            <Clipboard className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={editor.deleteSelected}
            disabled={editor.selectedNotes.size === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1" />

        {/* Settings */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Настройки</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div>
                <Label>BPM: {editor.bpm}</Label>
                <Slider
                  value={[editor.bpm]}
                  onValueChange={([v]) => editor.setBpm(v)}
                  min={40}
                  max={240}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Название</Label>
                <Input
                  value={editor.title}
                  onChange={e => editor.setMetadata(e.target.value, editor.artist)}
                  placeholder="Название трека"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Исполнитель</Label>
                <Input
                  value={editor.artist}
                  onChange={e => editor.setMetadata(editor.title, e.target.value)}
                  placeholder="Имя артиста"
                  className="mt-2"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-4 px-2">
        <Button
          variant={editor.isPlaying ? 'destructive' : 'default'}
          size="sm"
          className="gap-2"
          onClick={handlePlay}
        >
          {editor.isPlaying ? (
            <>
              <Square className="h-4 w-4" />
              Стоп
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Воспроизвести
            </>
          )}
        </Button>

        <Badge variant="outline" className="text-xs">
          BPM: {editor.bpm}
        </Badge>

        <Badge variant="outline" className="text-xs">
          {editor.notes.length} нот
        </Badge>
      </div>

      {/* Tab canvas */}
      <Card ref={containerRef} className="overflow-hidden">
        <CardContent className="p-4">
          {/* Tab grid */}
          <div className="font-mono text-sm space-y-0">
            {STRING_LABELS.map((label, stringIndex) => (
              <div key={stringIndex} className="flex items-center">
                {/* String label */}
                <div className="w-6 text-muted-foreground font-bold">
                  {label}|
                </div>

                {/* Positions */}
                <div className="flex-1 flex border-b border-muted-foreground/30">
                  {Array.from({ length: POSITIONS_PER_PAGE }).map((_, posIndex) => {
                    const absolutePos = startPosition + posIndex;
                    const key = `${stringIndex}-${absolutePos}`;
                    const notes = editor.notes.filter(
                      n => n.string === stringIndex && n.position === absolutePos
                    );
                    const note = notes[0];
                    const isSelected = note && editor.selectedNotes.has(note.id);
                    const isCurrent = absolutePos === editor.currentPosition && editor.isPlaying;
                    const isMeasureStart = posIndex % BEATS_PER_MEASURE === 0;

                    return (
                      <button
                        key={posIndex}
                        className={cn(
                          'w-8 h-8 flex items-center justify-center relative',
                          'border-r border-muted-foreground/20',
                          isMeasureStart && 'border-r-2 border-r-muted-foreground/40',
                          isSelected && 'bg-primary/20',
                          isCurrent && 'bg-primary/30',
                          'hover:bg-muted/50 transition-colors'
                        )}
                        onClick={() => handleCellClick(stringIndex, posIndex)}
                      >
                        {note ? (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={cn(
                              'font-bold',
                              isSelected && 'text-primary',
                              note.technique && 'underline'
                            )}
                          >
                            {note.fret}
                            {note.technique && (
                              <span className="text-[10px] text-muted-foreground absolute -top-1 right-0">
                                {TECHNIQUE_SYMBOLS[note.technique]}
                              </span>
                            )}
                          </motion.span>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Measure numbers */}
          <div className="flex items-center mt-2 ml-6">
            {Array.from({ length: MEASURES_PER_PAGE }).map((_, i) => (
              <div
                key={i}
                className="w-32 text-center text-xs text-muted-foreground"
              >
                M{page * MEASURES_PER_PAGE + i + 1}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Page navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Такты {page * MEASURES_PER_PAGE + 1}-{(page + 1) * MEASURES_PER_PAGE}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => p + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onExport?.('midi', editor.notes)}
        >
          <Download className="h-4 w-4" />
          MIDI
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onExport?.('gp5', editor.notes)}
        >
          <Music className="h-4 w-4" />
          Guitar Pro
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onExport?.('pdf', editor.notes)}
        >
          <Download className="h-4 w-4" />
          PDF
        </Button>
      </div>

      {/* Fret input dialog */}
      <AnimatePresence>
        {inputDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setInputDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border rounded-xl p-6 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Введите лад</h3>
              <Input
                type="number"
                min={0}
                max={24}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                autoFocus
                className="text-center text-2xl font-bold"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleFretInput();
                  if (e.key === 'Escape') setInputDialogOpen(false);
                }}
              />
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setInputDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleFretInput}
                >
                  OK
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
