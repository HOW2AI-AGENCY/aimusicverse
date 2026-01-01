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
import { Switch } from '@/components/ui/switch';
import { Download, X, FileAudio, Loader2 } from 'lucide-react';
import { useMixExport, ExportFormat, ExportQuality, Mp3Bitrate } from '@/hooks/studio/useMixExport';
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
  const [mp3Bitrate, setMp3Bitrate] = useState<Mp3Bitrate>(320);
  const [normalize, setNormalize] = useState(true);
  const [limiter, setLimiter] = useState(true);
  
  const { isExporting, exportProgress, exportMix, cancelExport, downloadBlob } = useMixExport();

  const handleExport = async () => {
    const blob = await exportMix({
      format,
      quality,
      tracks,
      masterVolume,
      mp3Bitrate,
      mastering: {
        normalize,
        limiter,
        limiterThreshold: -1,
        dither: format === 'wav',
      }
    });

    if (blob) {
      const extension = format;
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
    { value: 'mp3', label: 'MP3', description: 'Сжатый, меньший размер', disabled: false }
  ] as const;

  const bitrateOptions = [
    { value: 320, label: '320 kbps', description: 'Максимальное качество' },
    { value: 192, label: '192 kbps', description: 'Хорошее качество' },
    { value: 128, label: '128 kbps', description: 'Компактный размер' }
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
          <div className="space-y-5 py-4">
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

            {/* MP3 Bitrate (only when MP3 selected) */}
            {format === 'mp3' && (
              <div className="space-y-3">
                <Label>Битрейт MP3</Label>
                <RadioGroup
                  value={String(mp3Bitrate)}
                  onValueChange={(v) => setMp3Bitrate(Number(v) as Mp3Bitrate)}
                  className="space-y-2"
                >
                  {bitrateOptions.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`bitrate-${option.value}`}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                        mp3Bitrate === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value={String(option.value)}
                          id={`bitrate-${option.value}`}
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
            )}

            {/* Quality Selection */}
            <div className="space-y-3">
              <Label>Качество сэмплирования</Label>
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

            {/* Mastering Options */}
            <div className="space-y-3">
              <Label>Мастеринг</Label>
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Нормализация</span>
                    <p className="text-xs text-muted-foreground">Выровнять громкость до -1 dB</p>
                  </div>
                  <Switch checked={normalize} onCheckedChange={setNormalize} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Лимитер</span>
                    <p className="text-xs text-muted-foreground">Предотвратить клиппинг</p>
                  </div>
                  <Switch checked={limiter} onCheckedChange={setLimiter} />
                </div>
              </div>
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
              Экспортировать {format.toUpperCase()}
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
