/**
 * TranscriptionPreview - Interactive preview of transcribed music
 * Shows sheet music, tablature, and MIDI visualization
 * Integrated with klang.io transcription results
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Music,
  FileMusic,
  Download,
  Eye,
  Maximize2,
  PlayCircle,
  PauseCircle,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TranscriptionFiles, NoteData } from '@/hooks/useGuitarAnalysis';

interface TranscriptionPreviewProps {
  transcriptionFiles: TranscriptionFiles;
  notes: NoteData[];
  audioUrl?: string;
  className?: string;
  onDownload?: (format: string) => void;
}

export function TranscriptionPreview({
  transcriptionFiles,
  notes,
  audioUrl,
  className,
  onDownload,
}: TranscriptionPreviewProps) {
  const [activeTab, setActiveTab] = useState<'sheet' | 'tab' | 'midi'>('sheet');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const hasSheetMusic = !!(transcriptionFiles.pdfUrl || transcriptionFiles.musicXmlUrl);
  const hasTablature = !!transcriptionFiles.gp5Url;
  const hasMidi = !!(transcriptionFiles.midiUrl || transcriptionFiles.midiQuantUrl);

  // Calculate total pages based on notes (rough estimation)
  const totalPages = Math.ceil(notes.length / 32); // ~32 notes per page

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleDownload = (format: string) => {
    onDownload?.(format);
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-4 border-b bg-gradient-to-r from-purple-500/5 to-pink-500/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <FileMusic className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Транскрипция</h3>
              <p className="text-xs text-muted-foreground">
                {notes.length} нот • {Math.floor(notes[notes.length - 1]?.endTime || 0)}с
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Music className="w-3 h-3 mr-1" />
              {notes.length} нот
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sheet" disabled={!hasSheetMusic}>
              <FileMusic className="w-4 h-4 mr-2" />
              Ноты
            </TabsTrigger>
            <TabsTrigger value="tab" disabled={!hasTablature}>
              <Music className="w-4 h-4 mr-2" />
              Табы
            </TabsTrigger>
            <TabsTrigger value="midi" disabled={!hasMidi}>
              <Volume2 className="w-4 h-4 mr-2" />
              MIDI
            </TabsTrigger>
          </TabsList>

          {/* Sheet Music Preview */}
          <TabsContent value="sheet" className="mt-4 space-y-3">
            {hasSheetMusic ? (
              <>
                <div className="relative bg-white rounded-lg border-2 border-border overflow-hidden">
                  {/* PDF/MusicXML Preview Placeholder */}
                  <div
                    className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
                    style={{
                      minHeight: '400px',
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <div className="text-center space-y-3">
                      <FileMusic className="w-16 h-16 mx-auto text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        Превью нот
                      </p>
                      <p className="text-xs text-gray-500">
                        Страница {currentPage} из {totalPages}
                      </p>
                      {transcriptionFiles.pdfUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(transcriptionFiles.pdfUrl, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Открыть PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground w-12 text-center">
                      {zoom}%
                    </span>
                    <Button size="sm" variant="outline" onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload('pdf')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload('musicxml')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      XML
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileMusic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Ноты недоступны</p>
              </div>
            )}
          </TabsContent>

          {/* Tablature Preview */}
          <TabsContent value="tab" className="mt-4 space-y-3">
            {hasTablature ? (
              <>
                <div className="relative bg-white rounded-lg border-2 border-border overflow-hidden">
                  {/* Guitar Pro Preview Placeholder */}
                  <div
                    className="flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50"
                    style={{
                      minHeight: '400px',
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <div className="text-center space-y-3">
                      <Music className="w-16 h-16 mx-auto text-orange-400" />
                      <p className="text-sm font-medium text-gray-600">
                        Превью табулатуры
                      </p>
                      <p className="text-xs text-gray-500">
                        Гитарные табы
                      </p>
                      {transcriptionFiles.gp5Url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(transcriptionFiles.gp5Url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Скачать GP5
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground w-12 text-center">
                      {zoom}%
                    </span>
                    <Button size="sm" variant="outline" onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleDownload('gp5')}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Скачать Guitar Pro
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Табулатура недоступна</p>
              </div>
            )}
          </TabsContent>

          {/* MIDI Preview */}
          <TabsContent value="midi" className="mt-4 space-y-3">
            {hasMidi ? (
              <>
                {/* Piano Roll Visualization */}
                <div className="relative bg-black rounded-lg border-2 border-border overflow-hidden">
                  <MidiPianoRoll notes={notes} currentTime={currentTime} zoom={zoom} />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground w-12 text-center">
                      {zoom}%
                    </span>
                    <Button size="sm" variant="outline" onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload('midi')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      MIDI
                    </Button>
                    {transcriptionFiles.midiQuantUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload('midi_quant')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        MIDI Quantized
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">MIDI недоступен</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Stats */}
      <div className="p-4 bg-muted/30 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">{notes.length}</p>
          <p className="text-xs text-muted-foreground">Нот</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-cyan-400">
            {Math.floor(notes[notes.length - 1]?.endTime || 0)}с
          </p>
          <p className="text-xs text-muted-foreground">Длительность</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-400">{totalPages}</p>
          <p className="text-xs text-muted-foreground">Страниц</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * MidiPianoRoll - Piano roll visualization for MIDI notes
 */
interface MidiPianoRollProps {
  notes: NoteData[];
  currentTime: number;
  zoom: number;
}

function MidiPianoRoll({ notes, currentTime, zoom }: MidiPianoRollProps) {
  const canvasRef = useState<HTMLCanvasElement | null>(null);
  
  // Find pitch range
  const minPitch = Math.min(...notes.map((n) => n.pitch));
  const maxPitch = Math.max(...notes.map((n) => n.pitch));
  const pitchRange = maxPitch - minPitch + 1;
  
  // Duration
  const duration = notes[notes.length - 1]?.endTime || 0;

  return (
    <div
      className="relative"
      style={{
        height: '400px',
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'top left',
        transition: 'transform 0.2s ease',
      }}
    >
      {/* Piano Roll Grid */}
      <svg width="100%" height="400" className="bg-gray-900">
        {/* Grid lines */}
        {Array.from({ length: pitchRange }).map((_, i) => {
          const y = (i / pitchRange) * 400;
          return (
            <line
              key={`grid-${i}`}
              x1="0"
              y1={y}
              x2="100%"
              y2={y}
              stroke="#333"
              strokeWidth="1"
            />
          );
        })}

        {/* Notes */}
        {notes.map((note, i) => {
          const x = (note.startTime / duration) * 100;
          const width = ((note.endTime - note.startTime) / duration) * 100;
          const y = ((maxPitch - note.pitch) / pitchRange) * 400;
          const height = 400 / pitchRange;
          
          // Color based on velocity
          const opacity = note.velocity / 127;
          const color = `rgba(147, 51, 234, ${opacity})`; // Purple

          return (
            <rect
              key={`note-${i}`}
              x={`${x}%`}
              y={y}
              width={`${width}%`}
              height={height}
              fill={color}
              stroke="#a855f7"
              strokeWidth="1"
              rx="2"
            />
          );
        })}

        {/* Playhead */}
        {currentTime > 0 && (
          <line
            x1={`${(currentTime / duration) * 100}%`}
            y1="0"
            x2={`${(currentTime / duration) * 100}%`}
            y2="400"
            stroke="#22d3ee"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Pitch labels */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-800 border-r border-gray-700">
        {Array.from({ length: Math.min(pitchRange, 12) }).map((_, i) => {
          const pitch = maxPitch - Math.floor((i / 12) * pitchRange);
          const y = (i / 12) * 400;
          return (
            <div
              key={`label-${i}`}
              className="absolute text-xs text-gray-400 right-2"
              style={{ top: `${y}px` }}
            >
              {pitch}
            </div>
          );
        })}
      </div>
    </div>
  );
}
