/**
 * StudioTranscriptionPanel
 * MIDI/Notes transcription panel with Basic Pitch and Klangio support
 */

import { memo, useState, useCallback } from 'react';
import { 
  Music2, FileMusic, FileText, Loader2,
  Zap, Settings2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';

interface StudioTranscriptionPanelProps {
  track: StudioTrack;
  audioUrl: string;
  trackId?: string;
  stemId?: string;
  stemType?: string;
  onComplete?: () => void;
  onClose?: () => void;
}

type TranscriptionEngine = 'basic-pitch' | 'klangio';
type KlangioModel = 'guitar' | 'piano' | 'bass' | 'drums' | 'universal';

interface TranscriptionResult {
  midi_url?: string;
  midi_quant_url?: string;
  musicxml_url?: string;
  pdf_url?: string;
  gp5_url?: string;
  bpm?: number;
  key?: string;
  notes_count?: number;
}

export const StudioTranscriptionPanel = memo(function StudioTranscriptionPanel({
  track,
  audioUrl,
  trackId,
  stemId,
  stemType,
  onComplete,
  onClose,
}: StudioTranscriptionPanelProps) {
  const queryClient = useQueryClient();
  
  const [engine, setEngine] = useState<TranscriptionEngine>('basic-pitch');
  const [klangioModel, setKlangioModel] = useState<KlangioModel>('universal');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TranscriptionResult | null>(null);

  // Fetch existing transcription from stem_transcriptions (preferred)
  // - if stemId is provided: get latest for this stem
  // - else if trackId + stemType is provided: lookup stem first, then get transcription
  // - else if trackId only: get latest for this track
  const { data: existingTranscription, isLoading: loadingExisting } = useQuery({
    queryKey: ['transcription', stemId || trackId, stemType || null],
    queryFn: async () => {
      if (!stemId && !trackId) return null;

      // If we have stemId directly, use it
      if (stemId) {
        const { data, error } = await supabase
          .from('stem_transcriptions')
          .select('*')
          .eq('stem_id', stemId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        return data;
      }

      // If we have trackId + stemType, first find the stem, then get transcription
      if (trackId && stemType) {
        const { data: stem } = await supabase
          .from('track_stems')
          .select('id')
          .eq('track_id', trackId)
          .eq('stem_type', stemType)
          .maybeSingle();

        if (stem) {
          const { data, error } = await supabase
            .from('stem_transcriptions')
            .select('*')
            .eq('stem_id', stem.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (error) throw error;
          return data;
        }
      }

      // Fallback: get any transcription for this track
      const { data, error } = await supabase
        .from('stem_transcriptions')
        .select('*')
        .eq('track_id', trackId as string)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!(stemId || trackId),
  });

  // Basic Pitch transcription (Replicate)
  const runBasicPitch = useCallback(async () => {
    if (!audioUrl) return;

    setIsTranscribing(true);
    setProgress(10);

    try {
      const progressInterval = window.setInterval(() => {
        setProgress((p) => Math.min(85, p + 5));
      }, 2500);

      const { data, error } = await supabase.functions.invoke('replicate-midi-transcription', {
        body: {
          audioUrl,
          trackId,
          stemId,
          model: 'basic-pitch',
        },
      });

      window.clearInterval(progressInterval);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Transcription failed');

      setProgress(100);
      setResult({
        midi_url: data?.files?.midi || data?.midiUrl,
        notes_count: data?.notes_count || (Array.isArray(data?.notes) ? data.notes.length : undefined),
      });

      toast.success('Транскрипция завершена');
      queryClient.invalidateQueries({ queryKey: ['transcription'] });
      if (stemId) queryClient.invalidateQueries({ queryKey: ['stem-transcriptions', stemId] });
      if (trackId) {
        queryClient.invalidateQueries({ queryKey: ['track-transcriptions', trackId] });
        queryClient.invalidateQueries({ queryKey: ['track-midi-status', trackId] });
      }
      queryClient.invalidateQueries({ queryKey: ['tracks-midi-status'] });
      onComplete?.();
    } catch (err) {
      console.error('Basic Pitch error:', err);
      toast.error(err instanceof Error ? err.message : 'Ошибка транскрипции');
    } finally {
      setIsTranscribing(false);
    }
  }, [audioUrl, stemId, trackId, queryClient, onComplete]);

  // Klangio transcription (klangio-analyze, server-side polling)
  const runKlangio = useCallback(async () => {
    if (!audioUrl) return;

    setIsTranscribing(true);
    setProgress(10);

    try {
      const progressInterval = window.setInterval(() => {
        setProgress((p) => Math.min(90, p + 7));
      }, 3000);

      const { data, error } = await supabase.functions.invoke('klangio-analyze', {
        body: {
          audio_url: audioUrl,
          mode: 'transcription',
          model: klangioModel,
          outputs: ['midi', 'midi_quant', 'gp5', 'pdf', 'mxml'],
          title: track.name,
          stem_type: stemType || track.type,
          user_id: (track as any).user_id,
        },
      });

      window.clearInterval(progressInterval);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Transcription failed');

      setProgress(100);

      // klangio-analyze returns files in multiple shapes; normalize to our UI shape
      setResult({
        midi_url: data?.files?.midi || data?.files?.midi_url || data?.midi_url,
        midi_quant_url: data?.files?.midi_quant || data?.files?.midi_quant_url || data?.midi_quant_url,
        musicxml_url: data?.files?.mxml || data?.files?.musicxml || data?.files?.musicxml_url || data?.musicxml_url,
        pdf_url: data?.files?.pdf || data?.files?.pdf_url || data?.pdf_url,
        gp5_url: data?.files?.gp5 || data?.files?.gp5_url || data?.gp5_url,
        bpm: data?.bpm,
        key: data?.key_detected || data?.key,
        notes_count: data?.notes_count,
      });

      toast.success('Транскрипция завершена');
      queryClient.invalidateQueries({ queryKey: ['transcription'] });
      if (stemId) queryClient.invalidateQueries({ queryKey: ['stem-transcriptions', stemId] });
      if (trackId) {
        queryClient.invalidateQueries({ queryKey: ['track-transcriptions', trackId] });
        queryClient.invalidateQueries({ queryKey: ['track-midi-status', trackId] });
      }
      queryClient.invalidateQueries({ queryKey: ['tracks-midi-status'] });
      onComplete?.();
    } catch (err) {
      console.error('Klangio error:', err);
      toast.error(err instanceof Error ? err.message : 'Ошибка транскрипции');
    } finally {
      setIsTranscribing(false);
    }
  }, [audioUrl, klangioModel, stemId, trackId, stemType, track.name, track.type, queryClient, onComplete]);

  // Start transcription
  const startTranscription = useCallback(() => {
    if (engine === 'basic-pitch') {
      runBasicPitch();
    } else {
      runKlangio();
    }
  }, [engine, runBasicPitch, runKlangio]);

  // Download file
  const downloadFile = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success('Файл скачан');
    } catch (err) {
      toast.error('Ошибка скачивания');
    }
  }, []);

  // Merge existing transcription with new result
  const displayResult = result || (existingTranscription ? {
    midi_url: existingTranscription.midi_url,
    midi_quant_url: existingTranscription.midi_quant_url,
    musicxml_url: existingTranscription.mxml_url,
    pdf_url: existingTranscription.pdf_url,
    gp5_url: existingTranscription.gp5_url,
    bpm: existingTranscription.bpm,
    key: existingTranscription.key_detected,
    notes_count: existingTranscription.notes_count ?? (Array.isArray(existingTranscription.notes) ? existingTranscription.notes.length : undefined),
  } : null);

  const hasFiles = displayResult && (
    displayResult.midi_url || 
    displayResult.pdf_url || 
    displayResult.gp5_url || 
    displayResult.musicxml_url
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Music2 className="w-5 h-5 text-primary" />
          MIDI / Ноты
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Транскрипция "{track.name}"
        </p>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          {/* Engine selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Движок транскрипции</Label>
            <Tabs value={engine} onValueChange={(v) => setEngine(v as TranscriptionEngine)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="basic-pitch" className="text-xs">
                  <Zap className="w-3 h-3 mr-1.5" />
                  Basic Pitch
                </TabsTrigger>
                <TabsTrigger value="klangio" className="text-xs">
                  <Settings2 className="w-3 h-3 mr-1.5" />
                  Klangio Pro
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic-pitch" className="mt-3">
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium mb-1">Быстрая транскрипция</p>
                  <p className="text-muted-foreground text-xs">
                    ML-модель для быстрого извлечения MIDI. 
                    Лучше для мелодий и одиночных инструментов.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="klangio" className="mt-3 space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium mb-1">Профессиональная транскрипция</p>
                  <p className="text-muted-foreground text-xs">
                    Высокоточная модель с экспортом в GP5, PDF, MusicXML.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Модель инструмента</Label>
                  <Select value={klangioModel} onValueChange={(v) => setKlangioModel(v as KlangioModel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="universal">Универсальная</SelectItem>
                      <SelectItem value="guitar">Гитара</SelectItem>
                      <SelectItem value="piano">Пианино</SelectItem>
                      <SelectItem value="bass">Бас</SelectItem>
                      <SelectItem value="drums">Ударные</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Separator />

          {/* Progress */}
          {isTranscribing && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Транскрипция...
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results */}
          {hasFiles && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Готовые файлы
              </Label>

              <div className="grid grid-cols-2 gap-2">
                {displayResult.midi_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => downloadFile(displayResult.midi_url!, `${track.name}.mid`)}
                  >
                    <FileMusic className="w-4 h-4 mr-2 text-blue-500" />
                    MIDI
                  </Button>
                )}

                {displayResult.pdf_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => downloadFile(displayResult.pdf_url!, `${track.name}.pdf`)}
                  >
                    <FileText className="w-4 h-4 mr-2 text-red-500" />
                    PDF
                  </Button>
                )}

                {displayResult.gp5_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => downloadFile(displayResult.gp5_url!, `${track.name}.gp5`)}
                  >
                    <FileMusic className="w-4 h-4 mr-2 text-orange-500" />
                    Guitar Pro
                  </Button>
                )}

                {displayResult.musicxml_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => downloadFile(displayResult.musicxml_url!, `${track.name}.xml`)}
                  >
                    <FileText className="w-4 h-4 mr-2 text-purple-500" />
                    MusicXML
                  </Button>
                )}
              </div>

              {/* Metadata */}
              {(displayResult.bpm || displayResult.key || displayResult.notes_count) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {displayResult.bpm && (
                    <Badge variant="secondary">
                      {displayResult.bpm} BPM
                    </Badge>
                  )}
                  {displayResult.key && (
                    <Badge variant="secondary">
                      {displayResult.key}
                    </Badge>
                  )}
                  {displayResult.notes_count && (
                    <Badge variant="secondary">
                      {displayResult.notes_count} нот
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No files yet */}
          {!hasFiles && !isTranscribing && (
            <div className="text-center py-6 text-muted-foreground">
              <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Транскрипция ещё не выполнена</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action button */}
      <div className="p-4 border-t border-border/50">
        <Button
          className="w-full"
          onClick={startTranscription}
          disabled={isTranscribing || !audioUrl}
        >
          {isTranscribing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Music2 className="w-4 h-4 mr-2" />
          )}
          {hasFiles ? 'Повторить транскрипцию' : 'Начать транскрипцию'}
        </Button>
      </div>
    </div>
  );
});
