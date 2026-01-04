/**
 * NotationDrawer
 * Mobile bottom drawer for viewing notation, piano roll, and tabs
 * Phase 2 - Transcription Integration
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Music2, Piano, Guitar, X, Download, ChevronDown,
  Loader2, FileMusic, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { MusicXMLViewer } from '@/components/guitar/MusicXMLViewer';
import { PianoRoll } from './PianoRoll';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';
import type { MidiNote } from './PianoRoll';

interface NotationDrawerProps {
  open: boolean;
  onClose: () => void;
  track: StudioTrack | null;
  transcriptionData?: {
    midi_url?: string;
    mxml_url?: string;
    gp5_url?: string;
    pdf_url?: string;
    bpm?: number;
    key?: string;
    time_signature?: string;
    notes?: MidiNote[];
  };
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
}

type NotationTab = 'piano-roll' | 'sheet' | 'tabs';

export const NotationDrawer = memo(function NotationDrawer({
  open,
  onClose,
  track,
  transcriptionData,
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  onSeek,
}: NotationDrawerProps) {
  const haptic = useHapticFeedback();
  const [activeTab, setActiveTab] = useState<NotationTab>('piano-roll');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [pianoRollNotes, setPianoRollNotes] = useState<MidiNote[]>(
    transcriptionData?.notes || []
  );

  // Telegram safe area padding
  const safeAreaTop = `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.5rem, env(safe-area-inset-top, 0px) + 0.5rem))`;
  const safeAreaBottom = `calc(max(var(--tg-safe-area-inset-bottom, 0px) + 1rem, env(safe-area-inset-bottom, 0px) + 1rem))`;

  // Available download files
  const availableFiles = useMemo(() => {
    if (!transcriptionData) return [];
    return [
      { key: 'midi', url: transcriptionData.midi_url, label: 'MIDI', ext: '.mid', icon: FileMusic },
      { key: 'mxml', url: transcriptionData.mxml_url, label: 'MusicXML', ext: '.xml', icon: FileText },
      { key: 'gp5', url: transcriptionData.gp5_url, label: 'Guitar Pro', ext: '.gp5', icon: Guitar },
      { key: 'pdf', url: transcriptionData.pdf_url, label: 'PDF', ext: '.pdf', icon: FileText },
    ].filter(f => f.url);
  }, [transcriptionData]);

  // Download file
  const handleDownload = useCallback(async (url: string, filename: string) => {
    haptic.tap();
    setIsDownloading(filename);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success(`${filename} скачан`);
    } catch (err) {
      toast.error('Ошибка скачивания');
    } finally {
      setIsDownloading(null);
    }
  }, [haptic]);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    haptic.tap();
    setActiveTab(value as NotationTab);
  }, [haptic]);

  // Handle notes change from piano roll
  const handleNotesChange = useCallback((notes: MidiNote[]) => {
    setPianoRollNotes(notes);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    haptic.tap();
    onClose();
  }, [haptic, onClose]);

  if (!track) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-2xl p-0 flex flex-col"
        style={{ paddingBottom: safeAreaBottom }}
      >
        {/* Header */}
        <SheetHeader 
          className="flex-shrink-0 px-4 py-3 border-b border-border/50"
          style={{ paddingTop: safeAreaTop }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Music2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left text-base">
                  {track.name}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  {transcriptionData?.bpm && (
                    <Badge variant="secondary" className="text-xs h-5">
                      {transcriptionData.bpm} BPM
                    </Badge>
                  )}
                  {transcriptionData?.key && (
                    <Badge variant="outline" className="text-xs h-5">
                      {transcriptionData.key}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Download menu */}
              {availableFiles.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-3">
                      <Download className="w-4 h-4 mr-1.5" />
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {availableFiles.map(file => (
                      <DropdownMenuItem
                        key={file.key}
                        onClick={() => handleDownload(file.url!, `${track.name}${file.ext}`)}
                        disabled={isDownloading === `${track.name}${file.ext}`}
                      >
                        {isDownloading === `${track.name}${file.ext}` ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <file.icon className="w-4 h-4 mr-2" />
                        )}
                        {file.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="mx-4 mt-3 grid grid-cols-3 h-10">
            <TabsTrigger value="piano-roll" className="text-xs gap-1.5">
              <Piano className="w-3.5 h-3.5" />
              Piano Roll
            </TabsTrigger>
            <TabsTrigger value="sheet" className="text-xs gap-1.5">
              <Music2 className="w-3.5 h-3.5" />
              Ноты
            </TabsTrigger>
            <TabsTrigger value="tabs" className="text-xs gap-1.5">
              <Guitar className="w-3.5 h-3.5" />
              Табы
            </TabsTrigger>
          </TabsList>

          {/* Piano Roll */}
          <TabsContent value="piano-roll" className="flex-1 min-h-0 m-0 mt-3">
            <div className="h-full px-4 pb-4">
              {pianoRollNotes.length > 0 || transcriptionData?.notes?.length ? (
                <div className="h-full rounded-lg border border-border/50 overflow-hidden">
                  <PianoRoll
                    notes={pianoRollNotes.length > 0 ? pianoRollNotes : transcriptionData?.notes || []}
                    bpm={transcriptionData?.bpm || 120}
                    duration={duration}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onNotesChange={handleNotesChange}
                    onSeek={onSeek}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Piano className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">Нет MIDI данных</p>
                    <p className="text-xs mt-1">Выполните транскрипцию для отображения нот</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Sheet Music */}
          <TabsContent value="sheet" className="flex-1 min-h-0 m-0 mt-3">
            <div className="h-full px-4 pb-4">
              {transcriptionData?.mxml_url ? (
                <div className="h-full rounded-lg border border-border/50 overflow-hidden bg-card">
                  <MusicXMLViewer
                    url={transcriptionData.mxml_url}
                    className="h-full"
                    showControls
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">MusicXML недоступен</p>
                    <p className="text-xs mt-1">Используйте Klangio для получения нотной записи</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tabs (Guitar tablature) */}
          <TabsContent value="tabs" className="flex-1 min-h-0 m-0 mt-3">
            <div className="h-full px-4 pb-4">
              {transcriptionData?.gp5_url ? (
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-card border border-border/50">
                      <div className="flex items-center gap-3 mb-3">
                        <Guitar className="w-5 h-5 text-primary" />
                        <span className="font-medium">Guitar Pro файл</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Скачайте файл для просмотра в Guitar Pro или TuxGuitar
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleDownload(transcriptionData.gp5_url!, `${track.name}.gp5`)}
                        disabled={isDownloading === `${track.name}.gp5`}
                      >
                        {isDownloading === `${track.name}.gp5` ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Скачать Guitar Pro
                      </Button>
                    </div>

                    {transcriptionData?.pdf_url && (
                      <div className="p-4 rounded-lg bg-card border border-border/50">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <span className="font-medium">PDF ноты</span>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleDownload(transcriptionData.pdf_url!, `${track.name}.pdf`)}
                          disabled={isDownloading === `${track.name}.pdf`}
                        >
                          {isDownloading === `${track.name}.pdf` ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Скачать PDF
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Guitar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">Табы недоступны</p>
                    <p className="text-xs mt-1">Используйте Klangio с моделью "Гитара"</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
});

export type { NotationDrawerProps };
