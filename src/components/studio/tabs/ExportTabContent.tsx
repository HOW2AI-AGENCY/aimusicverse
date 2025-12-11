import { useState } from 'react';
import { Download, FileAudio, FileMusic, Video, Archive, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStudioStore, selectTrack, selectMode } from '@/stores/useStudioStore';
import { toast } from 'sonner';

/**
 * ExportTabContent - Export options for Studio
 * Part of Sprint 015-A: Unified Studio Architecture
 */

interface ExportOption {
  id: string;
  label: string;
  description: string;
  format: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresStems?: boolean;
  isPremium?: boolean;
}

const exportOptions: ExportOption[] = [
  {
    id: 'mp3',
    label: 'MP3 Аудио',
    description: 'Стандартный аудиофайл',
    format: 'MP3 320kbps',
    icon: FileAudio,
  },
  {
    id: 'wav',
    label: 'WAV Без сжатия',
    description: 'Высокое качество',
    format: 'WAV 44.1kHz',
    icon: FileMusic,
    isPremium: true,
  },
  {
    id: 'stems-zip',
    label: 'Все стемы',
    description: 'Отдельные дорожки в архиве',
    format: 'ZIP',
    icon: Archive,
    requiresStems: true,
  },
  {
    id: 'video',
    label: 'Видео',
    description: 'Видеоклип с визуализацией',
    format: 'MP4 1080p',
    icon: Video,
    isPremium: true,
  },
];

interface ExportTabContentProps {
  onExport?: (format: string) => void;
  className?: string;
}

export function ExportTabContent({ onExport, className }: ExportTabContentProps) {
  const track = useStudioStore(selectTrack);
  const mode = useStudioStore(selectMode);
  const isExporting = useStudioStore((state) => state.isExporting);
  const setIsExporting = useStudioStore((state) => state.setIsExporting);
  
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const hasStems = mode === 'stem';

  const handleExport = async (option: ExportOption) => {
    if (option.requiresStems && !hasStems) {
      toast.error('Сначала разделите трек на стемы');
      return;
    }

    setSelectedFormat(option.id);
    setIsExporting(true);

    try {
      // Simulate export - in real implementation, call export function
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onExport?.(option.id);
      toast.success(`${option.label} готов к скачиванию`);
    } catch (error) {
      toast.error('Ошибка экспорта');
    } finally {
      setIsExporting(false);
      setSelectedFormat(null);
    }
  };

  return (
    <div className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Экспорт трека
        </h3>
        {track?.title && (
          <Badge variant="outline" className="text-xs">
            {track.title}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isDisabled = option.requiresStems && !hasStems;
          const isLoading = isExporting && selectedFormat === option.id;
          
          return (
            <Card 
              key={option.id}
              className={cn(
                "relative transition-all",
                "border-border/50",
                isDisabled 
                  ? "opacity-50" 
                  : "cursor-pointer hover:shadow-md hover:border-border"
              )}
              onClick={() => !isDisabled && !isExporting && handleExport(option)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {option.label}
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        {option.format}
                      </Badge>
                    </div>
                  </div>
                  
                  {option.isPremium && (
                    <Badge className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                      PRO
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs">
                  {option.description}
                </CardDescription>
                
                {isLoading && (
                  <div className="mt-3">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
                    </div>
                  </div>
                )}
              </CardContent>
              
              {/* Download button */}
              {!isDisabled && !isLoading && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 h-8 w-8 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(option);
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </Card>
          );
        })}
      </div>
      
      {/* Direct download link */}
      {track?.audioUrl && (
        <div className="pt-4 border-t border-border/50">
          <Button
            variant="outline"
            className="w-full gap-2"
            asChild
          >
            <a href={track.audioUrl} download={`${track.title || 'track'}.mp3`}>
              <Download className="w-4 h-4" />
              Скачать оригинал
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
