/**
 * MidiExportPanelMobile - Mobile-optimized MIDI and format export interface
 * Supports all klang.io output formats: MIDI, GP5, MusicXML, PDF
 * Touch-friendly with preview and quick actions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  FileMusic,
  FileText,
  FileCode,
  Music2,
  Check,
  ExternalLink,
  Share2,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { TranscriptionFiles } from '@/hooks/useGuitarAnalysis';

interface FormatInfo {
  key: keyof TranscriptionFiles | 'midiUrl';
  name: string;
  extension: string;
  icon: React.ReactNode;
  description: string;
  colorClass: string;
  useCase: string;
}

const FORMATS: FormatInfo[] = [
  {
    key: 'midiUrl',
    name: 'MIDI Standard',
    extension: '.mid',
    icon: <FileMusic className="w-5 h-5" />,
    description: 'Стандартный MIDI файл',
    colorClass: 'from-blue-500/10 to-blue-600/10 border-blue-500/30',
    useCase: 'DAW, синтезаторы, аранжировка',
  },
  {
    key: 'midiQuantUrl',
    name: 'MIDI Quantized',
    extension: '.mid',
    icon: <FileMusic className="w-5 h-5" />,
    description: 'Выровненный по сетке MIDI',
    colorClass: 'from-cyan-500/10 to-cyan-600/10 border-cyan-500/30',
    useCase: 'Точная синхронизация, EDM',
  },
  {
    key: 'gp5Url',
    name: 'Guitar Pro 5',
    extension: '.gp5',
    icon: <Music2 className="w-5 h-5" />,
    description: 'Табулатура Guitar Pro',
    colorClass: 'from-orange-500/10 to-orange-600/10 border-orange-500/30',
    useCase: 'Обучение, табы, Guitar Pro',
  },
  {
    key: 'musicXmlUrl',
    name: 'MusicXML',
    extension: '.xml',
    icon: <FileCode className="w-5 h-5" />,
    description: 'Универсальный нотный формат',
    colorClass: 'from-purple-500/10 to-purple-600/10 border-purple-500/30',
    useCase: 'Finale, Sibelius, MuseScore',
  },
  {
    key: 'pdfUrl',
    name: 'PDF Ноты',
    extension: '.pdf',
    icon: <FileText className="w-5 h-5" />,
    description: 'Печатная партитура',
    colorClass: 'from-red-500/10 to-red-600/10 border-red-500/30',
    useCase: 'Печать, просмотр, архив',
  },
];

interface MidiExportPanelMobileProps {
  transcriptionFiles: TranscriptionFiles;
  midiUrl?: string;
  className?: string;
}

export function MidiExportPanelMobile({
  transcriptionFiles,
  midiUrl,
  className,
}: MidiExportPanelMobileProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [expandedFormat, setExpandedFormat] = useState<string | null>(null);

  const getFileUrl = (key: string): string | undefined => {
    if (key === 'midiUrl') {
      return midiUrl || transcriptionFiles.midiUrl;
    }
    return transcriptionFiles[key as keyof TranscriptionFiles];
  };

  const handleDownload = async (format: FormatInfo) => {
    const url = getFileUrl(format.key);
    if (!url) {
      toast.error(`${format.name} недоступен`);
      return;
    }

    setDownloading(format.key);

    try {
      // Open file in new tab
      window.open(url, '_blank');
      
      setDownloaded(prev => new Set(prev).add(format.key));
      toast.success(`${format.name} загружается...`);

      // Vibration feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      toast.error(`Ошибка загрузки ${format.name}`);
    } finally {
      setTimeout(() => setDownloading(null), 500);
    }
  };

  const handleShare = async (format: FormatInfo) => {
    const url = getFileUrl(format.key);
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${format.name} Export`,
          text: `Экспорт транскрипции в ${format.name}`,
          url: url,
        });
        toast.success('Поделились успешно!');
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована');
    }
  };

  const handleDownloadAll = () => {
    let count = 0;
    FORMATS.forEach(format => {
      const url = getFileUrl(format.key);
      if (url) {
        window.open(url, '_blank');
        setDownloaded(prev => new Set(prev).add(format.key));
        count++;
      }
    });

    if (count > 0) {
      toast.success(`Загружается ${count} файлов...`);
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    }
  };

  const availableFormats = FORMATS.filter(f => getFileUrl(f.key));
  const availableCount = availableFormats.length;

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Экспорт форматов
          </h3>
          <p className="text-xs text-muted-foreground">
            Все форматы от klang.io
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {availableCount} / {FORMATS.length}
        </Badge>
      </div>

      {/* Format Cards */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {FORMATS.map((format, index) => {
            const url = getFileUrl(format.key);
            const isAvailable = !!url;
            const isDownloading = downloading === format.key;
            const isDownloaded = downloaded.has(format.key);
            const isExpanded = expandedFormat === format.key;

            return (
              <motion.div
                key={format.key}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden transition-all",
                    isAvailable 
                      ? `bg-gradient-to-br ${format.colorClass}` 
                      : "bg-muted/20 opacity-50",
                    isDownloaded && "ring-1 ring-green-500/50"
                  )}
                >
                  <button
                    onClick={() => setExpandedFormat(isExpanded ? null : format.key)}
                    disabled={!isAvailable}
                    className="w-full p-3 text-left touch-manipulation"
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        isAvailable ? "bg-background/50" : "bg-muted"
                      )}>
                        {isDownloading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isDownloaded ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <span className="opacity-70">{format.icon}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm">{format.name}</span>
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 font-mono">
                            {format.extension}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format.description}
                        </p>
                      </div>

                      {/* Arrow */}
                      {isAvailable && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      )}
                    </div>
                  </button>

                  {/* Expanded Actions */}
                  <AnimatePresence>
                    {isExpanded && isAvailable && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <Separator />
                        <div className="p-3 space-y-2">
                          <p className="text-xs text-muted-foreground">
                            📱 {format.useCase}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDownload(format)}
                              disabled={isDownloading}
                              className="flex-1 touch-manipulation"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Скачать
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShare(format)}
                              className="touch-manipulation"
                            >
                              <Share2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Download All Button */}
      {availableCount > 1 && (
        <>
          <Separator />
          <Button
            size="lg"
            onClick={handleDownloadAll}
            className="w-full bg-gradient-to-r from-primary to-primary/80 touch-manipulation"
          >
            <Download className="w-4 h-4 mr-2" />
            Скачать все ({availableCount})
          </Button>
        </>
      )}

      {/* Empty State */}
      {availableCount === 0 && (
        <div className="text-center py-6 space-y-2">
          <FileMusic className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            Файлы экспорта пока недоступны
          </p>
          <p className="text-xs text-muted-foreground">
            Завершите транскрипцию для создания файлов
          </p>
        </div>
      )}
    </Card>
  );
}
