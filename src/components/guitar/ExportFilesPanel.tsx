import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, FileMusic, FileText, File, Check, 
  ExternalLink, Loader2, Music2, FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { TranscriptionFiles } from '@/hooks/useGuitarAnalysis';

interface ExportFile {
  key: keyof TranscriptionFiles | 'midiUrl';
  label: string;
  format: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const EXPORT_FILES: ExportFile[] = [
  {
    key: 'midiUrl',
    label: 'MIDI',
    format: '.mid',
    icon: <FileMusic className="w-5 h-5" />,
    description: 'Стандартный MIDI для DAW',
    color: 'text-blue-400',
  },
  {
    key: 'midiQuantUrl',
    label: 'MIDI (Quantized)',
    format: '.mid',
    icon: <FileMusic className="w-5 h-5" />,
    description: 'Выровненный по сетке',
    color: 'text-cyan-400',
  },
  {
    key: 'gp5Url',
    label: 'Guitar Pro',
    format: '.gp5',
    icon: <Music2 className="w-5 h-5" />,
    description: 'Табулатура для Guitar Pro',
    color: 'text-orange-400',
  },
  {
    key: 'musicXmlUrl',
    label: 'MusicXML',
    format: '.xml',
    icon: <FileCode className="w-5 h-5" />,
    description: 'Универсальный нотный формат',
    color: 'text-purple-400',
  },
  {
    key: 'pdfUrl',
    label: 'PDF Ноты',
    format: '.pdf',
    icon: <FileText className="w-5 h-5" />,
    description: 'Печатная партитура',
    color: 'text-red-400',
  },
];

interface ExportFilesPanelProps {
  transcriptionFiles: TranscriptionFiles;
  midiUrl?: string;
  className?: string;
}

export function ExportFilesPanel({
  transcriptionFiles,
  midiUrl,
  className,
}: ExportFilesPanelProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  const getFileUrl = (key: string): string | undefined => {
    if (key === 'midiUrl') {
      return midiUrl || transcriptionFiles.midiUrl;
    }
    return transcriptionFiles[key as keyof TranscriptionFiles];
  };

  const handleDownload = async (file: ExportFile) => {
    const url = getFileUrl(file.key);
    if (!url) {
      toast.error(`${file.label} недоступен`);
      return;
    }

    setDownloading(file.key);
    
    try {
      // Open in new tab for download
      window.open(url, '_blank');
      
      setDownloaded(prev => new Set(prev).add(file.key));
      toast.success(`${file.label} загружается...`);
    } catch (error) {
      toast.error(`Ошибка загрузки ${file.label}`);
    } finally {
      setDownloading(null);
    }
  };

  const availableCount = EXPORT_FILES.filter(f => getFileUrl(f.key)).length;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          Экспорт файлов
        </h3>
        <Badge variant="outline" className="text-xs">
          {availableCount} / {EXPORT_FILES.length} доступно
        </Badge>
      </div>

      <div className="grid gap-2">
        <AnimatePresence mode="popLayout">
          {EXPORT_FILES.map((file, index) => {
            const url = getFileUrl(file.key);
            const isAvailable = !!url;
            const isDownloading = downloading === file.key;
            const isDownloaded = downloaded.has(file.key);

            return (
              <motion.div
                key={file.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="outline"
                  onClick={() => handleDownload(file)}
                  disabled={!isAvailable || isDownloading}
                  className={cn(
                    "w-full h-auto p-3 justify-start gap-3",
                    "transition-all duration-200",
                    isAvailable && "hover:border-primary/50 hover:bg-primary/5",
                    !isAvailable && "opacity-40 cursor-not-allowed",
                    isDownloaded && "border-green-500/50 bg-green-500/5"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    isAvailable ? "bg-primary/10" : "bg-muted",
                    file.color
                  )}>
                    {isDownloading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isDownloaded ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      file.icon
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{file.label}</span>
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] px-1.5 py-0 h-4 font-mono"
                      >
                        {file.format}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {file.description}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    {isAvailable ? (
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        Недоступно
                      </span>
                    )}
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {availableCount === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Файлы экспорта недоступны</p>
          <p className="text-xs mt-1">Попробуйте повторить анализ</p>
        </div>
      )}

      {availableCount > 0 && (
        <>
          <Separator />
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => {
              EXPORT_FILES.forEach(file => {
                const url = getFileUrl(file.key);
                if (url) {
                  window.open(url, '_blank');
                  setDownloaded(prev => new Set(prev).add(file.key));
                }
              });
              toast.success('Все файлы загружаются...');
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Скачать все ({availableCount})
          </Button>
        </>
      )}
    </div>
  );
}
