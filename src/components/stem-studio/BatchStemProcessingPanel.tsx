/**
 * BatchStemProcessingPanel - UI for batch stem operations
 * Allows selecting multiple stems and processing them together
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Layers, FileMusic, Scissors, CheckCircle, XCircle,
  Loader2, Play, X, RotateCcw, CheckSquare, Square,
  Zap, Music, Mic, Drum, Guitar, Piano
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useBatchStemProcessing, type BatchModel, type SeparationMode } from '@/hooks/useBatchStemProcessing';
import { useState } from 'react';

interface Stem {
  id: string;
  stem_type: string;
  audio_url: string;
  duration?: number;
}

interface BatchStemProcessingPanelProps {
  trackId: string;
  stems: Stem[];
  onClose?: () => void;
  className?: string;
}

const stemIcons: Record<string, React.ElementType> = {
  vocals: Mic,
  drums: Drum,
  bass: Music,
  guitar: Guitar,
  piano: Piano,
  other: Layers,
};

const stemColors: Record<string, string> = {
  vocals: 'text-pink-400 bg-pink-500/10',
  drums: 'text-amber-400 bg-amber-500/10',
  bass: 'text-purple-400 bg-purple-500/10',
  guitar: 'text-green-400 bg-green-500/10',
  piano: 'text-blue-400 bg-blue-500/10',
  other: 'text-muted-foreground bg-muted',
};

export const BatchStemProcessingPanel = memo(function BatchStemProcessingPanel({
  trackId,
  stems,
  onClose,
  className,
}: BatchStemProcessingPanelProps) {
  const [transcribeModel, setTranscribeModel] = useState<BatchModel>('basic');
  const [separateMode, setSeparateMode] = useState<SeparationMode>('simple');
  
  const {
    isProcessing,
    progress,
    status,
    results,
    error,
    selectedCount,
    toggleStemSelection,
    selectAllStems,
    clearSelection,
    isSelected,
    startBatchTranscribe,
    startBatchSeparate,
    cancel,
    retry,
    reset,
    isStarting,
    isCancelling,
  } = useBatchStemProcessing(trackId);

  const stemIds = useMemo(() => stems.map(s => s.id), [stems]);
  const allSelected = selectedCount === stems.length && stems.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < stems.length;

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAllStems(stemIds);
    }
  };

  const getResultStatus = (stemId: string) => {
    if (!results?.stems) return null;
    return results.stems.find(r => r.stemId === stemId);
  };

  return (
    <Card className={cn('border-2 border-primary/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Пакетная обработка</CardTitle>
              <p className="text-xs text-muted-foreground">
                Выберите стемы для обработки
              </p>
            </div>
          </div>
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <AnimatePresence mode="wait">
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-sm font-medium">
                    {status === 'queued' ? 'В очереди...' : 'Обработка...'}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {progress}%
                </Badge>
              </div>
              
              <Progress value={progress} className="h-2" />
              
              {results?.summary && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    {results.summary.success} готово
                  </span>
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {results.summary.processing} в процессе
                  </span>
                  {results.summary.failed > 0 && (
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-400" />
                      {results.summary.failed} ошибок
                    </span>
                  )}
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={cancel}
                disabled={isCancelling}
                className="w-full h-8"
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <X className="w-4 h-4 mr-1" />
                )}
                Отменить
              </Button>
            </motion.div>
          )}

          {/* Error/Completed State */}
          {!isProcessing && status === 'failed' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2"
            >
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ошибка обработки</span>
              </div>
              {error && (
                <p className="text-xs text-muted-foreground">{error}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={retry} className="h-7">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Повторить
                </Button>
                <Button size="sm" variant="ghost" onClick={reset} className="h-7">
                  Сбросить
                </Button>
              </div>
            </motion.div>
          )}

          {!isProcessing && status === 'completed' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Обработка завершена</span>
                </div>
                <Button size="sm" variant="ghost" onClick={reset} className="h-7">
                  Новая
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stem Selection */}
        {!isProcessing && status !== 'completed' && (
          <>
            {/* Select All Header */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 px-2"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4 mr-1 text-primary" />
                ) : someSelected ? (
                  <Square className="w-4 h-4 mr-1 text-primary/50" />
                ) : (
                  <Square className="w-4 h-4 mr-1" />
                )}
                {allSelected ? 'Снять всё' : 'Выбрать всё'}
              </Button>
              <Badge variant="outline" className="text-xs">
                {selectedCount} из {stems.length}
              </Badge>
            </div>

            {/* Stems List */}
            <ScrollArea className="h-[200px] pr-2">
              <div className="space-y-2">
                {stems.map((stem) => {
                  const Icon = stemIcons[stem.stem_type] || Layers;
                  const colorClass = stemColors[stem.stem_type] || stemColors.other;
                  const selected = isSelected(stem.id);
                  const result = getResultStatus(stem.id);

                  return (
                    <motion.div
                      key={stem.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg border-2 transition-all cursor-pointer',
                        selected
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border hover:border-primary/20',
                        result?.status === 'success' && 'border-green-500/40 bg-green-500/5',
                        result?.status === 'failed' && 'border-red-500/40 bg-red-500/5'
                      )}
                      onClick={() => toggleStemSelection(stem.id)}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleStemSelection(stem.id)}
                        className="pointer-events-none"
                      />
                      
                      <div className={cn('p-1.5 rounded-lg', colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize">
                          {stem.stem_type}
                        </p>
                        {stem.duration && (
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(stem.duration / 60)}:{String(Math.floor(stem.duration % 60)).padStart(2, '0')}
                          </p>
                        )}
                      </div>

                      {/* Result indicator */}
                      {result && (
                        <div className="shrink-0">
                          {result.status === 'success' && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          {result.status === 'processing' && (
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          )}
                          {result.status === 'failed' && (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Transcription */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    MIDI транскрипция
                  </span>
                  <Select
                    value={transcribeModel}
                    onValueChange={(v) => setTranscribeModel(v as BatchModel)}
                  >
                    <SelectTrigger className="w-[120px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="instrumental">Instrumental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => startBatchTranscribe(transcribeModel)}
                  disabled={selectedCount === 0 || isStarting}
                  className="w-full h-9"
                  variant="secondary"
                >
                  {isStarting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileMusic className="w-4 h-4 mr-2" />
                  )}
                  Транскрибировать ({selectedCount})
                </Button>
              </div>

              {/* Separation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Разделение стемов
                  </span>
                  <Select
                    value={separateMode}
                    onValueChange={(v) => setSeparateMode(v as SeparationMode)}
                  >
                    <SelectTrigger className="w-[120px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Простой (4)</SelectItem>
                      <SelectItem value="detailed">Детальный (6+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => startBatchSeparate(separateMode)}
                  disabled={selectedCount === 0 || isStarting}
                  className="w-full h-9"
                  variant="outline"
                >
                  {isStarting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Scissors className="w-4 h-4 mr-2" />
                  )}
                  Разделить ({selectedCount})
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
              <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground">
                Пакетная обработка позволяет обработать несколько стемов одновременно.
                Прогресс отображается в реальном времени.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default BatchStemProcessingPanel;
