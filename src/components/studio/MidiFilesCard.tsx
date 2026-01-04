/**
 * MidiFilesCard - Shows all available transcription file formats
 */
import { motion } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, FileMusic, FileText, FileCode, 
  Music2, ExternalLink, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TranscriptionFiles } from '@/hooks/useReplicateMidiTranscription';

interface FileFormat {
  key: keyof TranscriptionFiles;
  label: string;
  description: string;
  icon: React.ReactNode;
  extension: string;
  color: string;
}

const FILE_FORMATS: FileFormat[] = [
  {
    key: 'midi',
    label: 'MIDI',
    description: 'Стандартный MIDI для DAW',
    icon: <FileMusic className="w-4 h-4" />,
    extension: '.mid',
    color: 'text-blue-400',
  },
  {
    key: 'midi_quant',
    label: 'MIDI (Quantized)',
    description: 'Выровненный по сетке',
    icon: <FileMusic className="w-4 h-4" />,
    extension: '.mid',
    color: 'text-cyan-400',
  },
  {
    key: 'gp5',
    label: 'Guitar Pro',
    description: 'Табулатура для Guitar Pro',
    icon: <Music2 className="w-4 h-4" />,
    extension: '.gp5',
    color: 'text-orange-400',
  },
  {
    key: 'mxml',
    label: 'MusicXML',
    description: 'Универсальный нотный формат',
    icon: <FileCode className="w-4 h-4" />,
    extension: '.xml',
    color: 'text-purple-400',
  },
  {
    key: 'pdf',
    label: 'PDF Ноты',
    description: 'Печатная партитура',
    icon: <FileText className="w-4 h-4" />,
    extension: '.pdf',
    color: 'text-red-400',
  },
];

interface MidiFilesCardProps {
  files: TranscriptionFiles;
  className?: string;
  title?: string;
}

export function MidiFilesCard({ files, className, title }: MidiFilesCardProps) {
  const availableFormats = FILE_FORMATS.filter(f => files[f.key]);
  
  if (availableFormats.length === 0) {
    return null;
  }

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpen = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{title}</span>
            <Badge variant="secondary" className="text-xs">
              {availableFormats.length} файлов
            </Badge>
          </div>
        </div>
      )}
      
      <div className="p-3 space-y-2">
        {availableFormats.map((format, index) => {
          const url = files[format.key];
          if (!url) return null;
          
          return (
            <motion.div
              key={format.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-background", format.color)}>
                  {format.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{format.label}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {format.extension}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{format.description}</p>
                </div>
              </div>
              
              <div className="flex gap-1">
                {format.key === 'pdf' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpen(url)}
                    title="Открыть"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(url, `transcription${format.extension}`)}
                  title="Скачать"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
