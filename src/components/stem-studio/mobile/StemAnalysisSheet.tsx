/**
 * Comprehensive Stem Analysis Sheet for Mobile
 * MIDI transcription, audio analysis, and notation features
 */

import { useState } from 'react';
import {
  Music2,
  FileMusic,
  Waveform,
  BrainCircuit,
  Download,
  Loader2,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMidi } from '@/hooks/useMidi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface StemAnalysisSheetProps {
  trackId: string;
  trackTitle: string;
  audioUrl: string;
  trigger?: React.ReactNode;
}

type AnalysisTab = 'midi' | 'audio' | 'notation';

export const StemAnalysisSheet = ({
  trackId,
  trackTitle,
  audioUrl,
  trigger,
}: StemAnalysisSheetProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('midi');
  const [modelType, setModelType] = useState<'mt3' | 'basic-pitch'>('mt3');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const { 
    midiVersions, 
    isLoading, 
    isTranscribing, 
    transcribeToMidi, 
    downloadMidi,
    hasMidi,
  } = useMidi(trackId);

  const handleTranscribe = async () => {
    try {
      await transcribeToMidi(audioUrl, modelType);
      toast.success('MIDI файл создан успешно');
    } catch (error) {
      logger.error('Transcription error', error);
      toast.error('Ошибка создания MIDI');
    }
  };

  const handleAudioAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate progress for now
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // TODO: Call actual audio analysis edge function
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(interval);
      setAnalysisProgress(100);
      
      toast.success('Анализ аудио завершён');
    } catch (error) {
      logger.error('Audio analysis error', error);
      toast.error('Ошибка анализа аудио');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
  };

  const renderMidiTab = () => (
    <div className="space-y-4">
      {/* Create MIDI */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <FileMusic className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">MIDI Транскрипция</h3>
            <p className="text-xs text-muted-foreground">
              Преобразуйте аудио в MIDI формат для редактирования
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Модель:</span>
            <Select 
              value={modelType} 
              onValueChange={(v) => setModelType(v as any)}
              disabled={isTranscribing}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mt3">MT3 (точный)</SelectItem>
                <SelectItem value="basic-pitch">Basic Pitch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-2 rounded bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground">
              {modelType === 'mt3' 
                ? '✨ Высокая точность, рекомендуется для музыки'
                : '⚡ Быстрая обработка, подходит для простых мелодий'}
            </p>
          </div>

          <Button 
            onClick={handleTranscribe} 
            disabled={isTranscribing}
            className="w-full gap-2"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Создание MIDI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Создать MIDI файл
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Existing MIDI files */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : midiVersions && midiVersions.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Созданные файлы</span>
            <Badge variant="secondary">{midiVersions.length}</Badge>
          </div>
          
          <div className="space-y-2">
            {midiVersions.map((midi) => (
              <div 
                key={midi.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50 hover:border-border transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <FileMusic className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {trackTitle}.mid
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs">
                      {midi.metadata?.model_type?.toUpperCase() || 'MT3'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(midi.created_at), 'd MMM, HH:mm', { locale: ru })}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => downloadMidi(midi.audio_url, sanitizeFilename(trackTitle))}
                  className="h-9 w-9 shrink-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <FileMusic className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">MIDI файлы ещё не созданы</p>
          <p className="text-xs mt-1">Создайте первый MIDI файл выше</p>
        </div>
      )}
    </div>
  );

  const renderAudioTab = () => (
    <div className="space-y-4">
      {/* Audio Analysis */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Waveform className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Анализ аудио</h3>
            <p className="text-xs text-muted-foreground">
              AI-анализ музыкальных характеристик
            </p>
          </div>
        </div>

        {isAnalyzing && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Анализ...</span>
              <span>{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-1.5" />
          </div>
        )}

        <Button 
          onClick={handleAudioAnalysis} 
          disabled={isAnalyzing}
          className="w-full gap-2"
          variant="outline"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Анализ...
            </>
          ) : (
            <>
              <BrainCircuit className="w-4 h-4" />
              Анализировать аудио
            </>
          )}
        </Button>
      </div>

      {/* Analysis features placeholder */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Music2, label: 'Темп (BPM)', value: 'Скоро' },
          { icon: Music2, label: 'Тональность', value: 'Скоро' },
          { icon: Waveform, label: 'Динамика', value: 'Скоро' },
          { icon: Clock, label: 'Длительность', value: 'Скоро' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx}
              className="p-3 rounded-lg bg-muted/50 border border-border/50"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
          <span>
            Функция AI-анализа аудио находится в разработке. Скоро будут доступны
            определение темпа, тональности, динамики и других характеристик.
          </span>
        </p>
      </div>
    </div>
  );

  const renderNotationTab = () => (
    <div className="space-y-4">
      {/* Sheet Music Generation */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Нотная запись</h3>
            <p className="text-xs text-muted-foreground">
              Конвертация стема в нотную запись
            </p>
          </div>
        </div>

        <Button 
          disabled
          className="w-full gap-2"
          variant="outline"
        >
          <FileText className="w-4 h-4" />
          Создать ноты (скоро)
        </Button>
      </div>

      {/* Export options */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Форматы экспорта (скоро)</span>
        <div className="grid grid-cols-2 gap-2">
          {['MusicXML', 'PDF', 'Lilypond', 'ABC'].map((format) => (
            <div 
              key={format}
              className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center"
            >
              <FileText className="w-4 h-4 mx-auto mb-1 opacity-50" />
              <span className="text-xs text-muted-foreground">{format}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-blue-500" />
          <span>
            Функция преобразования в ноты находится в разработке. Будет поддерживать
            экспорт в популярные форматы нотной записи.
          </span>
        </p>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <BrainCircuit className="w-4 h-4" />
            Анализ
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5" />
            Анализ и транскрипция
          </SheetTitle>
          <SheetDescription>
            MIDI, анализ аудио и нотная запись
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnalysisTab)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="midi" className="text-xs gap-1.5">
              <FileMusic className="w-3 h-3" />
              MIDI
              {hasMidi && <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                {midiVersions?.length}
              </Badge>}
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-xs gap-1.5">
              <Waveform className="w-3 h-3" />
              Аудио
            </TabsTrigger>
            <TabsTrigger value="notation" className="text-xs gap-1.5">
              <FileText className="w-3 h-3" />
              Ноты
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="midi" className="m-0">
              {renderMidiTab()}
            </TabsContent>
            <TabsContent value="audio" className="m-0">
              {renderAudioTab()}
            </TabsContent>
            <TabsContent value="notation" className="m-0">
              {renderNotationTab()}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
