/**
 * TranscriptionExportPanel - Export MIDI/Notes from Stems using klang.io
 *
 * Features:
 * - Transcribe individual stems to MIDI using klang.io API
 * - Export to multiple formats: MIDI, GP5, PDF, MusicXML
 * - Mobile-first design with clear UX
 * - Progress tracking for transcription
 * - Educational tooltips for users
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Music, Download, Loader2, FileMusic, Check,
  AlertCircle, Info, Zap, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TranscriptionExportPanel' });

interface TranscriptionFiles {
  midiUrl?: string;
  midiQuantUrl?: string;
  pdfUrl?: string;
  gp5Url?: string;
  musicXmlUrl?: string;
}

interface TranscriptionExportPanelProps {
  stemId: string;
  stemType: string;
  stemLabel: string;
  audioUrl: string;
  className?: string;
}

type TranscriptionModel = 'guitar' | 'piano' | 'bass' | 'drums' | 'vocal' | 'universal';

const modelOptions: { value: TranscriptionModel; label: string; description: string }[] = [
  { value: 'universal', label: 'Universal', description: 'Подходит для любых инструментов' },
  { value: 'guitar', label: 'Guitar', description: 'Оптимизирован для гитары' },
  { value: 'piano', label: 'Piano', description: 'Оптимизирован для фортепиано' },
  { value: 'bass', label: 'Bass', description: 'Оптимизирован для баса' },
  { value: 'drums', label: 'Drums', description: 'Оптимизирован для ударных' },
  { value: 'vocal', label: 'Vocal', description: 'Оптимизирован для вокала' },
];

// Auto-select model based on stem type
function getDefaultModel(stemType: string): TranscriptionModel {
  const type = stemType.toLowerCase();
  if (type.includes('guitar')) return 'guitar';
  if (type.includes('piano') || type.includes('keys')) return 'piano';
  if (type.includes('bass')) return 'bass';
  if (type.includes('drum')) return 'drums';
  if (type.includes('vocal') || type.includes('voice')) return 'vocal';
  return 'universal';
}

export function TranscriptionExportPanel({
  stemId,
  stemType,
  stemLabel,
  audioUrl,
  className,
}: TranscriptionExportPanelProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [transcriptionFiles, setTranscriptionFiles] = useState<TranscriptionFiles | null>(null);
  const [selectedModel, setSelectedModel] = useState<TranscriptionModel>(getDefaultModel(stemType));
  const [error, setError] = useState<string | null>(null);

  const handleTranscribe = async () => {
    setIsTranscribing(true);
    setError(null);
    setProgress('Загрузка аудио...');
    setProgressPercent(10);

    try {
      log.info('Starting transcription', { stemId, stemType, model: selectedModel });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      setProgress('Отправка на анализ klang.io...');
      setProgressPercent(20);

      // Call klang.io transcription API
      const { data, error: transcriptionError } = await supabase.functions.invoke('klangio-analyze', {
        body: {
          audio_url: audioUrl,
          mode: 'transcription',
          model: selectedModel,
          outputs: ['midi', 'midi_quant', 'gp5', 'pdf', 'mxml'],
          user_id: user.id,
          title: `${stemLabel} Stem`,
        },
      });

      if (transcriptionError) throw transcriptionError;

      if (!data) {
        throw new Error('No response from klang.io API');
      }

      setProgress('Обработка результатов...');
      setProgressPercent(80);

      log.info('Transcription complete', { files: data.files });

      if (data.status === 'completed' && data.files) {
        setTranscriptionFiles({
          midiUrl: data.files.midi,
          midiQuantUrl: data.files.midi_quant,
          gp5Url: data.files.gp5,
          pdfUrl: data.files.pdf,
          musicXmlUrl: data.files.mxml,
        });

        setProgress('Готово!');
        setProgressPercent(100);

        toast.success('Транскрипция завершена!', {
          description: 'Файлы готовы к скачиванию',
        });
      } else {
        throw new Error(data.error || 'Транскрипция не завершена');
      }
    } catch (err: any) {
      log.error('Transcription error', err);
      const errorMessage = err.message || 'Ошибка транскрипции';
      setError(errorMessage);
      toast.error('Ошибка транскрипции', {
        description: errorMessage,
      });
    } finally {
      setIsTranscribing(false);
      setProgress('');
      setProgressPercent(0);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    window.open(url, '_blank');
    toast.success(`Скачивание ${filename}...`);
  };

  const hasFiles = transcriptionFiles && Object.values(transcriptionFiles).some(url => url);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-4 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10">
            <FileMusic className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Экспорт в MIDI/Ноты</h3>
            <p className="text-xs text-muted-foreground">
              Стем: {stemLabel}
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-200/80">
            <p className="font-medium mb-1">Как это работает?</p>
            <p>
              Используем klang.io AI для транскрипции аудио стема в ноты.
              Получите MIDI, табуляцию, ноты в PDF и Guitar Pro 5.
            </p>
          </div>
        </div>

        {/* Model Selection */}
        {!hasFiles && !isTranscribing && (
          <div className="mb-4">
            <Label className="text-xs mb-2 block">Модель транскрипции</Label>
            <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as TranscriptionModel)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Progress */}
        <AnimatePresence>
          {isTranscribing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{progress}</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200/80">{error}</p>
          </div>
        )}

        {/* Files Ready */}
        {hasFiles && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 mb-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-400" />
              <p className="text-xs font-medium text-green-400">Файлы готовы к скачиванию</p>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {transcriptionFiles?.midiUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(transcriptionFiles.midiUrl!, 'midi.mid')}
                  className="h-auto py-2 flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-1 w-full">
                    <Music className="w-3 h-3" />
                    <span className="text-xs font-medium">MIDI</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Стандартный</span>
                </Button>
              )}

              {transcriptionFiles?.midiQuantUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(transcriptionFiles.midiQuantUrl!, 'midi-quantized.mid')}
                  className="h-auto py-2 flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-1 w-full">
                    <Music className="w-3 h-3" />
                    <span className="text-xs font-medium">MIDI Quant</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Квантизованный</span>
                </Button>
              )}

              {transcriptionFiles?.gp5Url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(transcriptionFiles.gp5Url!, 'tabs.gp5')}
                  className="h-auto py-2 flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-1 w-full">
                    <FileMusic className="w-3 h-3" />
                    <span className="text-xs font-medium">Guitar Pro</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Табы + ноты</span>
                </Button>
              )}

              {transcriptionFiles?.pdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(transcriptionFiles.pdfUrl!, 'sheet-music.pdf')}
                  className="h-auto py-2 flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-1 w-full">
                    <FileText className="w-3 h-3" />
                    <span className="text-xs font-medium">PDF</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Ноты</span>
                </Button>
              )}

              {transcriptionFiles?.musicXmlUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(transcriptionFiles.musicXmlUrl!, 'sheet.musicxml')}
                  className="h-auto py-2 flex-col items-start gap-1 col-span-2"
                >
                  <div className="flex items-center gap-1 w-full">
                    <FileMusic className="w-3 h-3" />
                    <span className="text-xs font-medium">MusicXML</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Универсальный формат для DAW</span>
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        {!hasFiles && (
          <Button
            size="lg"
            onClick={handleTranscribe}
            disabled={isTranscribing}
            className="w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 text-white"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Транскрибирую...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Создать MIDI/Ноты
              </>
            )}
          </Button>
        )}

        {/* Transcribe Again Button */}
        {hasFiles && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTranscriptionFiles(null);
              setError(null);
            }}
            className="w-full"
          >
            Транскрибировать заново
          </Button>
        )}
      </div>
    </Card>
  );
}
