/**
 * NotesViewerDialog - Full-screen notes viewer with tabs
 * Shows Piano Roll, PDF Notes, Guitar Tab (GP5), and MusicXML
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Music2,
  Piano,
  Guitar,
  FileText,
  Download,
  ExternalLink,
  X,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { StemTranscription } from '@/hooks/useStemTranscription';
import { PianoRollPreview } from '@/components/analysis/PianoRollPreview';
import { useMidiFileParser, ParsedMidiNote } from '@/hooks/useMidiFileParser';
import { useMidiSynth } from '@/hooks/useMidiSynth';
import { useEffect } from 'react';

interface NotesViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcription: StemTranscription | null;
  stemType?: string;
  currentTime?: number;
  isPlaying?: boolean;
}

export function NotesViewerDialog({
  open,
  onOpenChange,
  transcription,
  stemType = 'Стем',
  currentTime = 0,
  isPlaying = false,
}: NotesViewerDialogProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'piano' | 'pdf' | 'guitar' | 'xml'>('piano');
  const [zoom, setZoom] = useState(1);
  const [localTime, setLocalTime] = useState(0);
  const [localPlaying, setLocalPlaying] = useState(false);

  const { parseMidiFromUrl, parsedMidi, isLoading: isParsing } = useMidiFileParser();
  const { playNote, stopAll, isReady } = useMidiSynth();

  // Parse MIDI when dialog opens
  useEffect(() => {
    if (open && transcription?.midi_url) {
      parseMidiFromUrl(transcription.midi_url);
    }
  }, [open, transcription?.midi_url, parseMidiFromUrl]);

  // Sync with external playhead
  useEffect(() => {
    if (isPlaying) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isPlaying]);

  // Notes for piano roll
  const notes = useMemo(() => {
    if (parsedMidi?.notes) {
      return parsedMidi.notes;
    }
    // Fallback to stored notes
    if (transcription?.notes && Array.isArray(transcription.notes)) {
      return transcription.notes as ParsedMidiNote[];
    }
    return [];
  }, [parsedMidi, transcription]);

  const duration = useMemo(() => {
    return parsedMidi?.duration || transcription?.duration_seconds || 60;
  }, [parsedMidi, transcription]);

  const handleDownload = useCallback((url: string | null, filename: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleOpenExternal = useCallback((url: string | null) => {
    if (url) {
      window.open(url, '_blank');
    }
  }, []);

  // Determine available tabs
  const availableTabs = useMemo(() => {
    const tabs: Array<{ id: 'piano' | 'pdf' | 'guitar' | 'xml'; label: string; icon: typeof Piano }> = [];
    
    if (transcription?.midi_url || notes.length > 0) {
      tabs.push({ id: 'piano', label: 'Piano Roll', icon: Piano });
    }
    if (transcription?.pdf_url) {
      tabs.push({ id: 'pdf', label: 'Ноты (PDF)', icon: FileText });
    }
    if (transcription?.gp5_url) {
      tabs.push({ id: 'guitar', label: 'Табы (GP5)', icon: Guitar });
    }
    if (transcription?.mxml_url) {
      tabs.push({ id: 'xml', label: 'MusicXML', icon: Music2 });
    }
    
    return tabs;
  }, [transcription, notes]);

  const renderContent = () => {
    if (!transcription) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Music2 className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Нет данных транскрипции</p>
        </div>
      );
    }

    return (
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        {availableTabs.length > 1 && (
          <TabsList className={cn("mb-4", isMobile ? "grid-cols-2" : `grid-cols-${availableTabs.length}`)}>
            {availableTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                  <Icon className="w-4 h-4" />
                  <span className={isMobile ? "text-xs" : ""}>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}

        {/* Piano Roll Tab */}
        <TabsContent value="piano" className="flex-1 m-0">
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {transcription.notes_count && (
                  <Badge variant="outline">
                    {transcription.notes_count} нот
                  </Badge>
                )}
                {transcription.bpm && (
                  <Badge variant="outline">
                    {Math.round(transcription.bpm)} BPM
                  </Badge>
                )}
                {transcription.key_detected && (
                  <Badge variant="outline">
                    {transcription.key_detected}
                  </Badge>
                )}
                {transcription.time_signature && (
                  <Badge variant="outline">
                    {transcription.time_signature}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  disabled={zoom >= 2}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Piano Roll */}
            <div 
              className="rounded-lg overflow-hidden border"
              style={{ height: isMobile ? 200 : 300 }}
            >
              {notes.length > 0 ? (
                <PianoRollPreview
                  notes={notes}
                  duration={duration}
                  currentTime={localTime}
                  height={isMobile ? 200 : 300}
                />
              ) : isParsing ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">
                    Загрузка MIDI...
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Ноты не найдены</p>
                </div>
              )}
            </div>

            {/* Download MIDI */}
            <div className="flex gap-2 flex-wrap">
              {transcription.midi_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(transcription.midi_url, `${stemType}_midi.mid`)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  MIDI
                </Button>
              )}
              {transcription.midi_quant_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(transcription.midi_quant_url, `${stemType}_midi_quant.mid`)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  MIDI (Квантизированный)
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        {/* PDF Tab */}
        <TabsContent value="pdf" className="flex-1 m-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-muted-foreground">
                Нотный лист в формате PDF
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenExternal(transcription.pdf_url)}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  {isMobile ? 'Открыть' : 'Открыть в новой вкладке'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(transcription.pdf_url, `${stemType}_notes.pdf`)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Скачать
                </Button>
              </div>
            </div>

            {/* PDF Preview iframe with fallback for Telegram */}
            {transcription.pdf_url && (
              <div className="rounded-lg overflow-hidden border bg-muted/20 relative" style={{ height: isMobile ? 300 : 400 }}>
                <iframe
                  src={`${transcription.pdf_url}#toolbar=0&view=FitH`}
                  className="w-full h-full"
                  title="PDF Notes"
                  sandbox="allow-same-origin allow-scripts"
                  onError={() => {
                    // Fallback: show button to open externally if iframe fails
                  }}
                />
                {/* Fallback overlay for Telegram Mini App where iframe may not work */}
                {isMobile && (
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none">
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenExternal(transcription.pdf_url)}
                        className="shadow-lg"
                      >
                        <Maximize2 className="w-4 h-4 mr-1" />
                        На весь экран
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Guitar Tab */}
        <TabsContent value="guitar" className="flex-1 m-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  Guitar Pro файл
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-600 border border-amber-500/30">
                    Табулатура + Ноты
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Содержит табулатуру и стандартную нотацию
                </p>
              </div>
              <Button
                onClick={() => handleDownload(transcription.gp5_url, `${stemType}_tabs.gp5`)}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать GP5
              </Button>
            </div>

            <div className="p-6 rounded-lg border bg-muted/20 space-y-4">
              <div className="text-center">
                <Guitar className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">Предпросмотр недоступен в браузере</p>
                <p className="text-xs text-muted-foreground">
                  Скачайте файл и откройте в одной из программ
                </p>
              </div>
              
              {/* Editor suggestions */}
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">Бесплатные редакторы:</p>
                <div className="flex flex-wrap gap-2">
                  <a 
                    href="https://tuxguitar.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background border text-xs hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    TuxGuitar
                    <span className="text-muted-foreground">(бесплатно)</span>
                  </a>
                  <a 
                    href="https://www.songsterr.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background border text-xs hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Songsterr
                    <span className="text-muted-foreground">(онлайн)</span>
                  </a>
                  <a 
                    href="https://www.guitar-pro.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background border text-xs hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Guitar Pro
                  </a>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* MusicXML Tab */}
        <TabsContent value="xml" className="flex-1 m-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">MusicXML файл</p>
                <p className="text-xs text-muted-foreground">
                  Универсальный формат для нотных редакторов
                </p>
              </div>
              <Button
                onClick={() => handleDownload(transcription.mxml_url, `${stemType}_score.musicxml`)}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать MusicXML
              </Button>
            </div>

            <div className="p-8 rounded-lg border bg-muted/20 text-center">
              <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Откройте в MuseScore, Finale, Sibelius или
                <br />
                другом нотном редакторе.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  // Use Sheet for mobile, Dialog for desktop
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl flex flex-col">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Music2 className="w-5 h-5 text-primary" />
              Ноты: {stemType}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            {renderContent()}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            Ноты: {stemType}
            {transcription?.model && (
              <Badge variant="secondary" className="ml-2">
                {transcription.model}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
