/**
 * NotesViewerDialog - Full-screen notes viewer with tabs
 * Shows Piano Roll, PDF Notes, Guitar Tab (GP5), and MusicXML with note visualization
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  Maximize2,
  FileCode2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { StemTranscription } from '@/hooks/useStemTranscription';
import { InteractivePianoRoll } from '@/components/analysis/InteractivePianoRoll';
import { useMidiFileParser, ParsedMidiNote } from '@/hooks/useMidiFileParser';
import { useMusicXmlParser } from '@/hooks/useMusicXmlParser';
import { useMidiSynth } from '@/hooks/useMidiSynth';

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
  const [localTime, setLocalTime] = useState(0);
  const [localPlaying, setLocalPlaying] = useState(false);

  const { parseMidiFromUrl, parsedMidi, isLoading: isParsing } = useMidiFileParser();
  const { parseMusicXmlFromUrl, parsedXml, isLoading: isParsingXml } = useMusicXmlParser();
  const { playNote, stopAll, isReady } = useMidiSynth();

  // Parse MIDI when dialog opens
  useEffect(() => {
    if (open && transcription?.midi_url) {
      parseMidiFromUrl(transcription.midi_url);
    }
  }, [open, transcription?.midi_url, parseMidiFromUrl]);

  // Parse MusicXML when tab is active or dialog opens with mxml
  useEffect(() => {
    if (open && transcription?.mxml_url && (activeTab === 'xml' || !transcription?.midi_url)) {
      parseMusicXmlFromUrl(transcription.mxml_url);
    }
  }, [open, transcription?.mxml_url, activeTab, parseMusicXmlFromUrl, transcription?.midi_url]);

  // Sync with external playhead
  useEffect(() => {
    if (isPlaying) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isPlaying]);

  // Notes for piano roll (MIDI tab)
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

  // Notes for MusicXML visualization
  const xmlNotes = useMemo(() => {
    if (parsedXml?.notes) {
      return parsedXml.notes;
    }
    return [];
  }, [parsedXml]);

  const duration = useMemo(() => {
    return parsedMidi?.duration || transcription?.duration_seconds || 60;
  }, [parsedMidi, transcription]);

  const xmlDuration = useMemo(() => {
    return parsedXml?.duration || transcription?.duration_seconds || 60;
  }, [parsedXml, transcription]);

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
      tabs.push({ id: 'xml', label: 'MusicXML', icon: FileCode2 });
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
          <div className="space-y-3">
            {/* Metadata badges */}
            <div className="flex items-center gap-2 flex-wrap">
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

            {/* Interactive Piano Roll */}
            {notes.length > 0 ? (
              <InteractivePianoRoll
                notes={notes}
                duration={duration}
                currentTime={localTime}
                height={isMobile ? 220 : 320}
              />
            ) : isParsing ? (
              <div 
                className="rounded-lg border bg-muted/20 flex items-center justify-center"
                style={{ height: isMobile ? 220 : 320 }}
              >
                <div className="animate-pulse text-muted-foreground flex items-center gap-2">
                  <Piano className="w-5 h-5" />
                  Загрузка MIDI...
                </div>
              </div>
            ) : (
              <div 
                className="rounded-lg border bg-muted/20 flex items-center justify-center"
                style={{ height: isMobile ? 220 : 320 }}
              >
                <p className="text-muted-foreground">Ноты не найдены</p>
              </div>
            )}

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

            {/* PDF Preview - Mobile uses direct link, Desktop uses iframe */}
            {transcription.pdf_url && (
              <>
                {isMobile ? (
                  // Mobile: Show preview card with direct open button (iframe doesn't work in Telegram)
                  <div className="rounded-lg overflow-hidden border bg-gradient-to-br from-muted/30 to-muted/10 p-6 flex flex-col items-center justify-center gap-4" style={{ minHeight: 280 }}>
                    <div className="w-20 h-28 rounded-lg bg-white/90 dark:bg-white/10 border-2 border-primary/20 flex items-center justify-center shadow-lg">
                      <FileText className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-medium">Нотный лист готов</p>
                      <p className="text-xs text-muted-foreground">
                        PDF откроется в полноэкранном режиме
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      <Button
                        size="lg"
                        className="w-full gap-2"
                        onClick={() => handleOpenExternal(transcription.pdf_url)}
                      >
                        <Maximize2 className="w-5 h-5" />
                        Открыть PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleDownload(transcription.pdf_url, `${stemType}_notes.pdf`)}
                      >
                        <Download className="w-4 h-4" />
                        Сохранить в файлы
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Desktop: Use iframe with fallback
                  <div className="rounded-lg overflow-hidden border bg-muted/20 relative" style={{ height: 400 }}>
                    <iframe
                      src={`${transcription.pdf_url}#toolbar=0&view=FitH`}
                      className="w-full h-full"
                      title="PDF Notes"
                      sandbox="allow-same-origin allow-scripts"
                      onError={() => {
                        // Fallback handled by external link button
                      }}
                    />
                  </div>
                )}
              </>
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
            {/* Metadata badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {parsedXml?.notes && (
                <Badge variant="outline">
                  {parsedXml.notes.length} нот
                </Badge>
              )}
              {parsedXml?.bpm && (
                <Badge variant="outline">
                  {Math.round(parsedXml.bpm)} BPM
                </Badge>
              )}
              {parsedXml?.keySignature && (
                <Badge variant="outline">
                  {parsedXml.keySignature}
                </Badge>
              )}
              {parsedXml?.timeSignature && (
                <Badge variant="outline">
                  {parsedXml.timeSignature.numerator}/{parsedXml.timeSignature.denominator}
                </Badge>
              )}
              {parsedXml?.partNames && parsedXml.partNames.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {parsedXml.partNames.join(', ')}
                </Badge>
              )}
            </div>

            {/* Interactive Piano Roll Visualization */}
            {xmlNotes.length > 0 ? (
              <InteractivePianoRoll
                notes={xmlNotes}
                duration={xmlDuration}
                currentTime={localTime}
                height={isMobile ? 220 : 320}
              />
            ) : isParsingXml ? (
              <div 
                className="rounded-lg border bg-muted/20 flex items-center justify-center"
                style={{ height: isMobile ? 220 : 320 }}
              >
                <div className="animate-pulse text-muted-foreground flex items-center gap-2">
                  <FileCode2 className="w-5 h-5" />
                  Парсинг MusicXML...
                </div>
              </div>
            ) : (
              <div 
                className="rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center"
                style={{ height: isMobile ? 220 : 320 }}
              >
                <div className="text-center">
                  <FileCode2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Нажмите для загрузки визуализации</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => transcription?.mxml_url && parseMusicXmlFromUrl(transcription.mxml_url)}
                  >
                    Загрузить ноты
                  </Button>
                </div>
              </div>
            )}

            {/* Download and External Links */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileCode2 className="w-4 h-4" />
                  MusicXML файл
                </p>
                <p className="text-xs text-muted-foreground">
                  Универсальный формат для нотных редакторов
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleDownload(transcription.mxml_url, `${stemType}_score.musicxml`)}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать MusicXML
              </Button>
            </div>

            {/* Editor suggestions */}
            <div className="p-4 rounded-lg border bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Рекомендуемые редакторы:</p>
              <div className="flex flex-wrap gap-2">
                <a 
                  href="https://musescore.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background border text-xs hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  MuseScore
                  <span className="text-muted-foreground">(бесплатно)</span>
                </a>
                <a 
                  href="https://flat.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background border text-xs hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Flat.io
                  <span className="text-muted-foreground">(онлайн)</span>
                </a>
                <a 
                  href="https://www.finalemusic.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background border text-xs hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Finale
                </a>
                <a 
                  href="https://www.avid.com/sibelius" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background border text-xs hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Sibelius
                </a>
              </div>
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
