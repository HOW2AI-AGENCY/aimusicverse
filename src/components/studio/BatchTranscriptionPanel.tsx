/**
 * BatchTranscriptionPanel - Transcribe all stems to MIDI at once
 * Phase 5: MIDI batch transcription
 */

import { useState, useCallback } from 'react';
import { Music2, Loader2, CheckCircle2, AlertCircle, Play, FileMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { TrackStem } from '@/hooks/useTrackStems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { getStemLabel } from '@/lib/stemLabels';
import { cn } from '@/lib/utils';

interface BatchTranscriptionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stems: TrackStem[];
  trackId: string;
  onComplete?: () => void;
}

type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'error';

interface StemTranscriptionState {
  stemId: string;
  stemType: string;
  status: TranscriptionStatus;
  error?: string;
  taskId?: string;
}

export function BatchTranscriptionPanel({ 
  open, 
  onOpenChange, 
  stems, 
  trackId,
  onComplete 
}: BatchTranscriptionPanelProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [stemStates, setStemStates] = useState<Record<string, StemTranscriptionState>>({});
  
  const completedCount = Object.values(stemStates).filter(s => s.status === 'completed').length;
  const errorCount = Object.values(stemStates).filter(s => s.status === 'error').length;
  const processingCount = Object.values(stemStates).filter(s => s.status === 'processing').length;
  const progress = stems.length > 0 ? Math.round((completedCount / stems.length) * 100) : 0;

  const updateStemState = useCallback((stemId: string, update: Partial<StemTranscriptionState>) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: { ...prev[stemId], ...update }
    }));
  }, []);

  const transcribeStem = async (stem: TrackStem): Promise<boolean> => {
    try {
      updateStemState(stem.id, { status: 'processing' });

      const { data, error } = await supabase.functions.invoke('klangio-transcribe', {
        body: {
          audioUrl: stem.audio_url,
          trackId,
          stemId: stem.id,
          stemType: stem.stem_type,
          mode: 'batch',
          outputs: ['midi', 'midi_quant', 'gp5', 'pdf']
        }
      });

      if (error) throw error;

      updateStemState(stem.id, { 
        status: 'completed',
        taskId: data?.taskId 
      });
      return true;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Stem transcription failed', { stemId: stem.id, error });
      updateStemState(stem.id, { 
        status: 'error',
        error: message 
      });
      return false;
    }
  };

  const handleBatchTranscribe = useCallback(async () => {
    setIsTranscribing(true);
    
    // Initialize states
    const initialStates: Record<string, StemTranscriptionState> = {};
    stems.forEach(stem => {
      initialStates[stem.id] = {
        stemId: stem.id,
        stemType: stem.stem_type,
        status: 'pending'
      };
    });
    setStemStates(initialStates);

    // Process stems sequentially to avoid overwhelming the API
    let successCount = 0;
    for (const stem of stems) {
      const success = await transcribeStem(stem);
      if (success) successCount++;
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsTranscribing(false);

    if (successCount === stems.length) {
      toast.success('Все стемы транскрибированы!', {
        description: 'MIDI и ноты готовы к скачиванию'
      });
      onComplete?.();
    } else if (successCount > 0) {
      toast.warning(`Транскрибировано ${successCount} из ${stems.length} стемов`);
    } else {
      toast.error('Не удалось транскрибировать стемы');
    }
  }, [stems, onComplete]);

  const getStatusIcon = (status: TranscriptionStatus) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileMusic className="w-5 h-5 text-primary" />
            Batch MIDI транскрипция
          </SheetTitle>
          <SheetDescription>
            Конвертируй все стемы в MIDI, GuitarPro и ноты за раз
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4">
          {/* Progress Overview */}
          {isTranscribing && (
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Обработка: {processingCount > 0 ? `${completedCount + 1}/${stems.length}` : 'Завершено'}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Stems List */}
          <div className="space-y-2">
            {stems.map(stem => {
              const state = stemStates[stem.id];
              const status = state?.status || 'pending';
              
              return (
                <div 
                  key={stem.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    status === 'completed' && "border-green-500/30 bg-green-500/5",
                    status === 'processing' && "border-primary/30 bg-primary/5",
                    status === 'error' && "border-destructive/30 bg-destructive/5"
                  )}
                >
                  {getStatusIcon(status)}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Music2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {getStemLabel(stem.stem_type)}
                      </span>
                    </div>
                    {state?.error && (
                      <p className="text-xs text-destructive mt-1">{state.error}</p>
                    )}
                  </div>

                  <Badge 
                    variant={
                      status === 'completed' ? 'default' :
                      status === 'processing' ? 'secondary' :
                      status === 'error' ? 'destructive' : 'outline'
                    }
                    className="text-xs"
                  >
                    {status === 'pending' ? 'Ожидание' :
                     status === 'processing' ? 'Обработка' :
                     status === 'completed' ? 'Готово' : 'Ошибка'}
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Info about what will be generated */}
          {!isTranscribing && Object.keys(stemStates).length === 0 && (
            <div className="mt-6 p-4 bg-muted/30 rounded-xl">
              <h4 className="text-sm font-medium mb-2">Что будет создано:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• MIDI файлы для каждого стема</li>
                <li>• Квантизированные MIDI (выровненные по сетке)</li>
                <li>• GuitarPro табы (.gp5)</li>
                <li>• PDF ноты</li>
                <li>• MusicXML для DAW</li>
              </ul>
            </div>
          )}

          {/* Summary */}
          {!isTranscribing && completedCount > 0 && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">
                  Готово: {completedCount} из {stems.length} стемов
                </span>
              </div>
              {errorCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {errorCount} стемов с ошибками
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleBatchTranscribe}
            disabled={isTranscribing || stems.length === 0}
            className="w-full h-12 gap-2"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Транскрибирую... {progress}%
              </>
            ) : completedCount === stems.length && completedCount > 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Всё готово!
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Транскрибировать все стемы ({stems.length})
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
