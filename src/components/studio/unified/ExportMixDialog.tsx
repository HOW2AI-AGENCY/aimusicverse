import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Download, X, FileAudio, Loader2 } from 'lucide-react';
import { useMixExport, ExportFormat, ExportQuality } from '@/hooks/studio/useMixExport';
import { cn } from '@/lib/utils';

interface ExportMixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracks: Array<{
    url: string;
    volume: number;
    muted: boolean;
  }>;
  masterVolume: number;
  trackTitle?: string;
}

export function ExportMixDialog({
  open,
  onOpenChange,
  tracks,
  masterVolume,
  trackTitle = 'mix'
}: ExportMixDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('wav');
  const [quality, setQuality] = useState<ExportQuality>('high');
  
  const { isExporting, exportProgress, exportMix, cancelExport, downloadBlob } = useMixExport();

  const handleExport = async () => {
    const blob = await exportMix({
      format,
      quality,
      tracks,
      masterVolume
    });

    if (blob) {
      const extension = format === 'mp3' ? 'wav' : format; // MP3 falls back to WAV
      const filename = `${trackTitle.replace(/[^a-zA-Z0-9а-яА-Я]/g, '_')}_${Date.now()}.${extension}`;
      downloadBlob(blob, filename);
      onOpenChange(false);
    }
  };

  const qualityOptions = [
    { value: 'high', label: 'Высокое', description: '48 kHz, 16-bit' },
    { value: 'medium', label: 'Среднее', description: '44.1 kHz, 16-bit' },
    { value: 'low', label: 'Низкое', description: '22.05 kHz, 16-bit' }
  ] as const;

  const formatOptions = [
    { value: 'wav', label: 'WAV', description: 'Без сжатия, большой размер', disabled: false },
    { value: 'mp3', label: 'MP3', description: 'Сжатый, меньший размер', disabled: true }
  ] as const;

  const activeTracksCount = tracks.filter(t => !t.muted && t.url).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="h-5 w-5" />
            Экспорт микса
          </DialogTitle>
          <DialogDescription>
            {activeTracksCount} активных дорожек будут объединены в один файл
          </DialogDescription>
        </DialogHeader>

        {isExporting && exportProgress ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{exportProgress.message}</span>
              <span className="font-mono">{Math.round(exportProgress.progress)}%</span>
            </div>
            <Progress value={exportProgress.progress} className="h-2" />
            <Button
              variant="outline"
              onClick={cancelExport}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Отменить
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label>Формат</Label>
              <RadioGroup
                value={format}
                onValueChange={(v) => setFormat(v as ExportFormat)}
                className="grid grid-cols-2 gap-3"
              >
                {formatOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`format-${option.value}`}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-lg border cursor-pointer transition-colors",
                      format === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                      option.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value={option.value}
                        id={`format-${option.value}`}
                        disabled={option.disabled}
                      />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 ml-6">
                      {option.description}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Quality Selection */}
            <div className="space-y-3">
              <Label>Качество</Label>
              <RadioGroup
                value={quality}
                onValueChange={(v) => setQuality(v as ExportQuality)}
                className="space-y-2"
              >
                {qualityOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`quality-${option.value}`}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                      quality === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value={option.value}
                        id={`quality-${option.value}`}
                      />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={activeTracksCount === 0}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Экспортировать
            </Button>

            {activeTracksCount === 0 && (
              <p className="text-xs text-destructive text-center">
                Нет активных дорожек для экспорта
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
