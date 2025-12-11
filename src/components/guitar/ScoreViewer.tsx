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
        {/* Header */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Ноты и табулатура</h3>
              <Badge variant="secondary" className="text-xs">
                {availableFormats.length} форматов
              </Badge>
            </div>

            {/* Zoom controls */}
            {activeTab === 'pdf' && (
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

          {/* Format tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 bg-transparent p-0">
              {availableFormats.map(format => {
                const Icon = format.icon;
                return (
                  <TabsTrigger
                    key={format.key}
                    value={format.key}
                    className="flex-col gap-1 h-auto py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{format.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {availableFormats.map(format => (
              <TabsContent key={format.key} value={format.key} className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <span>{format.description}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleDownload(format.url, format.label)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Скачать
                    </Button>
                    {format.key === 'pdf' && (
                      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7">
                            <Maximize2 className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[90vh] p-0">
                          <DialogHeader className="px-4 py-3 border-b">
                            <DialogTitle>Просмотр нот - PDF</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-full">
                            <div className="p-4">
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
                        className="h-7"
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

        {/* Content Area */}
        <ScrollArea className="h-[400px] lg:h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              {activeTab === 'pdf' && pdfUrl && (
                <PDFViewer url={pdfUrl} zoom={zoom} onLoadComplete={() => setPdfLoading(false)} />
              )}

              {activeTab === 'musicxml' && musicXmlUrl && (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    MusicXML файл доступен для скачивания
                  </p>
                  <Button onClick={() => handleDownload(musicXmlUrl, 'MusicXML')}>
                    <Download className="w-4 h-4 mr-2" />
                    Скачать MusicXML
                  </Button>
                </div>
              )}

              {activeTab === 'gp5' && gp5Url && (
                <div className="text-center py-12">
                  <Guitar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Guitar Pro 5 файл доступен для скачивания
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Откройте в Guitar Pro или TuxGuitar
                  </p>
                  <Button onClick={() => handleDownload(gp5Url, 'Guitar Pro')}>
                    <Download className="w-4 h-4 mr-2" />
                    Скачать GP5
                  </Button>
                </div>
              )}

              {activeTab === 'midi' && (midiUrl || midiQuantUrl) && (
                <div className="text-center py-12">
                  <FileMusic className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    MIDI файлы доступны для скачивания
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    {midiUrl && (
                      <Button onClick={() => handleDownload(midiUrl, 'MIDI')} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        MIDI (оригинал)
                      </Button>
                    )}
                    {midiQuantUrl && (
                      <Button onClick={() => handleDownload(midiQuantUrl, 'MIDI Quantized')}>
                        <Download className="w-4 h-4 mr-2" />
                        MIDI (квантизированный)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* Footer info */}
        <Separator />
        <div className="p-3 bg-muted/20 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>💡 Используйте файлы для редактирования в музыкальных редакторах</span>
            <Badge variant="outline" className="text-[10px]">
              Powered by Klangio
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
