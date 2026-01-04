/**
 * ScoreViewer - Component for viewing musical notation
 * Supports PDF scores, MusicXML, and Guitar Pro files
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Maximize2,
  Music,
  Guitar,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  FileMusic,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from '@/lib/motion';
import type { TranscriptionFiles } from '@/hooks/useGuitarAnalysis';
import { MusicXMLViewer } from './MusicXMLViewer';

interface ScoreViewerProps {
  transcriptionFiles: TranscriptionFiles;
  className?: string;
  defaultView?: 'pdf' | 'musicxml' | 'gp5' | 'midi';
}

export function ScoreViewer({
  transcriptionFiles,
  className,
  defaultView = 'pdf',
}: ScoreViewerProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultView);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);

  const { pdfUrl, musicXmlUrl, gp5Url, midiUrl, midiQuantUrl } = transcriptionFiles;

  const hasAnyScore = pdfUrl || musicXmlUrl || gp5Url;

  if (!hasAnyScore) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Music className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            Ноты недоступны. Попробуйте повторить анализ.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleDownload = (url: string | undefined, format: string) => {
    if (!url) {
      toast.error('Файл недоступен');
      return;
    }
    window.open(url, '_blank');
    toast.success(`Скачивание ${format.toUpperCase()}...`);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

  const availableFormats = [
    { key: 'pdf', label: 'PDF', icon: FileText, url: pdfUrl, description: 'Нотная запись и табулатура' },
    { key: 'musicxml', label: 'MusicXML', icon: Music, url: musicXmlUrl, description: 'Редактируемый формат нот' },
    { key: 'gp5', label: 'Guitar Pro', icon: Guitar, url: gp5Url, description: 'Guitar Pro 5 файл' },
    { key: 'midi', label: 'MIDI', icon: FileMusic, url: midiUrl, description: 'MIDI последовательность' },
  ].filter(f => f.url);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-0">
        {/* Header - compact on mobile */}
        <div className="p-2 sm:p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <h3 className="font-semibold text-sm sm:text-base truncate">Ноты</h3>
              <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                {availableFormats.length}
              </Badge>
            </div>

            {/* Zoom controls - show for PDF and MusicXML */}
            {(activeTab === 'pdf' || activeTab === 'musicxml') && (
              <div className="hidden sm:flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={handleZoomOut} disabled={zoom <= 50}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
                <Button size="sm" variant="ghost" onClick={handleZoomIn} disabled={zoom >= 200}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Format tabs - horizontal scroll on mobile */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex sm:grid sm:grid-cols-4 h-auto gap-1 bg-transparent p-0 min-w-max sm:min-w-0 sm:w-full">
                {availableFormats.map(format => {
                  const Icon = format.icon;
                  return (
                    <TabsTrigger
                      key={format.key}
                      value={format.key}
                      className="flex-row sm:flex-col gap-1.5 sm:gap-1 h-auto py-1.5 sm:py-2 px-3 sm:px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-[11px] sm:text-xs">{format.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {availableFormats.map(format => (
              <TabsContent key={format.key} value={format.key} className="mt-2 sm:mt-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-0 text-xs text-muted-foreground bg-muted/50 p-1.5 sm:p-2 rounded">
                  <span className="text-[11px] sm:text-xs">{format.description}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 sm:h-7 text-[11px] sm:text-xs px-2"
                      onClick={() => handleDownload(format.url, format.label)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Скачать
                    </Button>
                    {format.key === 'pdf' && (
                      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-6 sm:h-7 px-2">
                            <Maximize2 className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[100vw] w-[100vw] h-[100dvh] max-h-[100dvh] p-0 rounded-none sm:max-w-4xl sm:h-[90vh] sm:max-h-[90vh] sm:rounded-lg">
                          <DialogHeader className="px-3 sm:px-4 py-2 sm:py-3 border-b">
                            <DialogTitle className="text-sm sm:text-base">Просмотр нот - PDF</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-[calc(100dvh-50px)] sm:h-full">
                            <div className="p-2 sm:p-4">
                              <PDFViewer url={format.url!} zoom={zoom} />
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    )}
                    {format.url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 sm:h-7 px-2"
                        onClick={() => window.open(format.url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Content Area - smaller on mobile */}
        <ScrollArea className="h-[280px] sm:h-[400px] lg:h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-2 sm:p-4"
            >
              {activeTab === 'pdf' && pdfUrl && (
                <PDFViewer url={pdfUrl} zoom={zoom} onLoadComplete={() => setPdfLoading(false)} />
              )}

              {activeTab === 'musicxml' && musicXmlUrl && (
                <MusicXMLViewer
                  url={musicXmlUrl}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  onLoaded={() => toast.success('Ноты загружены')}
                  onError={(err) => toast.error(`Ошибка загрузки: ${err.message}`)}
                  className="min-h-[250px] sm:min-h-[400px]"
                />
              )}

              {activeTab === 'gp5' && gp5Url && (
                <div className="text-center py-8 sm:py-12">
                  <Guitar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                    Guitar Pro 5 файл
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">
                    Откройте в Guitar Pro или TuxGuitar
                  </p>
                  <Button size="sm" onClick={() => handleDownload(gp5Url, 'Guitar Pro')}>
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Скачать GP5
                  </Button>
                </div>
              )}

              {activeTab === 'midi' && (midiUrl || midiQuantUrl) && (
                <div className="text-center py-8 sm:py-12">
                  <FileMusic className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                    MIDI файлы для скачивания
                  </p>
                  <div className="flex flex-col gap-2 justify-center">
                    {midiUrl && (
                      <Button size="sm" onClick={() => handleDownload(midiUrl, 'MIDI')} variant="outline">
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        MIDI (оригинал)
                      </Button>
                    )}
                    {midiQuantUrl && (
                      <Button size="sm" onClick={() => handleDownload(midiQuantUrl, 'MIDI Quantized')}>
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        MIDI (квант.)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* Footer info - compact on mobile */}
        <Separator />
        <div className="p-2 sm:p-3 bg-muted/20 text-[10px] sm:text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">💡 Редактируйте в муз. редакторах</span>
            <Badge variant="outline" className="text-[9px] sm:text-[10px] flex-shrink-0">
              Klangio
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * PDF Viewer Component using iframe
 */
function PDFViewer({
  url,
  zoom,
  onLoadComplete
}: {
  url: string;
  zoom: number;
  onLoadComplete?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full min-h-[400px] bg-muted/20 rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Загрузка нот...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-2">Не удалось загрузить PDF</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Открыть в новой вкладке
            </Button>
          </div>
        </div>
      )}

      <iframe
        src={`${url}#zoom=${zoom}`}
        className={cn(
          'w-full h-[400px] lg:h-[500px] border-0',
          loading && 'opacity-0'
        )}
        title="PDF Score Viewer"
        onLoad={() => {
          setLoading(false);
          onLoadComplete?.();
        }}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}
