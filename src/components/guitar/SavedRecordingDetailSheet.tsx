import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Play, Pause, RefreshCw, Loader2, Music, Download,
  Clock, Gauge, Key, FileMusic, FileText, Guitar, ArrowRight,
  CheckCircle2, AlertCircle, Wand2, Piano
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useGuitarAnalysis } from '@/hooks/useGuitarAnalysis';
import { useGuitarRecordings, type GuitarRecording } from '@/hooks/useGuitarRecordings';
import { GuitarTabVisualization } from '@/components/analysis/GuitarTabVisualization';
import { PianoRollWithMidiSync } from './PianoRollWithMidiSync';
import { ExportFilesPanel } from './ExportFilesPanel';

interface SavedRecordingDetailSheetProps {
  recording: GuitarRecording | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseForGeneration?: (recording: GuitarRecording) => void;
}

export function SavedRecordingDetailSheet({ 
  recording, 
  open, 
  onOpenChange,
  onUseForGeneration 
}: SavedRecordingDetailSheetProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalysisProgress, setReanalysisProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { analyzeGuitarRecording, progress, progressPercent } = useGuitarAnalysis();
  const { saveRecording, toAnalysisResult } = useGuitarRecordings();

  if (!recording) return null;

  const handleTogglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleReanalyze = async () => {
    if (!recording.audio_url) return;

    setIsReanalyzing(true);
    setReanalysisProgress(0);

    try {
      // Fetch audio file from URL
      const response = await fetch(recording.audio_url);
      const blob = await response.blob();
      const file = new File([blob], 'reanalysis.webm', { type: blob.type });

      // Run analysis
      const result = await analyzeGuitarRecording(file);
      
      if (result) {
        // Update the recording with new analysis
        await saveRecording.mutateAsync({
          analysis: result,
          audioUrl: recording.audio_url,
          title: recording.title || undefined,
          durationSeconds: recording.duration_seconds || undefined,
        });
      }
    } catch (error) {
      console.error('Reanalysis failed:', error);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const analysisResult = toAnalysisResult(recording);
  const hasAnalysis = recording.analysis_status?.beats || recording.analysis_status?.chords || recording.analysis_status?.transcription;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Guitar className="w-5 h-5 text-primary" />
            {recording.title || 'Запись гитары'}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-80px)]">
          <div className="px-4 pb-6 space-y-4">
            {/* Audio Player */}
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <Button
                  size="icon"
                  variant={isPlaying ? "secondary" : "default"}
                  onClick={handleTogglePlayback}
                  className="h-14 w-14 rounded-full shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </Button>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {recording.title || 'Без названия'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(recording.created_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
                  </p>
                  
                  {/* Metadata Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {recording.bpm && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Gauge className="w-3 h-3" />
                        {Math.round(recording.bpm)} BPM
                      </Badge>
                    )}
                    {recording.key && recording.key !== 'Unknown' && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Key className="w-3 h-3" />
                        {recording.key}
                      </Badge>
                    )}
                    {recording.duration_seconds && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(recording.duration_seconds)}
                      </Badge>
                    )}
                    {recording.time_signature && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Music className="w-3 h-3" />
                        {recording.time_signature}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <audio
                ref={audioRef}
                src={recording.audio_url}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </Card>

            {/* Analysis Status */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {hasAnalysis ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Анализ выполнен</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">Требуется анализ</span>
                    </>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReanalyze}
                  disabled={isReanalyzing}
                  className="gap-2"
                >
                  {isReanalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Анализ...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Повторить анализ
                    </>
                  )}
                </Button>
              </div>

              {isReanalyzing && (
                <div className="space-y-2">
                  <Progress value={progressPercent} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{progress}</span>
                    <span>{progressPercent}%</span>
                  </div>
                </div>
              )}

              {!isReanalyzing && (
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={recording.analysis_status?.beats ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {recording.analysis_status?.beats ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    Ритм и темп
                  </Badge>
                  <Badge 
                    variant={recording.analysis_status?.chords ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {recording.analysis_status?.chords ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    Аккорды
                  </Badge>
                  <Badge 
                    variant={recording.analysis_status?.transcription ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {recording.analysis_status?.transcription ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    Транскрипция
                  </Badge>
                </div>
              )}
            </Card>

            {/* Chords */}
            {recording.chords && recording.chords.length > 0 && (
              <Card className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4 text-primary" />
                  Аккорды
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(recording.chords.map((c: any) => c.chord || c))].map((chord, i) => (
                    <Badge key={i} variant="outline" className="text-sm px-3 py-1">
                      {String(chord)}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Generated Tags */}
            {recording.generated_tags && recording.generated_tags.length > 0 && (
              <Card className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-primary" />
                  Сгенерированные теги
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {recording.generated_tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Style Description */}
            {recording.style_description && (
              <Card className="p-4">
                <h3 className="font-medium mb-2">Описание стиля</h3>
                <p className="text-sm text-muted-foreground">
                  {recording.style_description}
                </p>
              </Card>
            )}

            {/* Visualizations */}
            {hasAnalysis && (
              <Tabs defaultValue="piano" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="piano" className="gap-2">
                    <Piano className="w-4 h-4" />
                    Piano Roll
                  </TabsTrigger>
                  <TabsTrigger value="tab" className="gap-2">
                    <Guitar className="w-4 h-4" />
                    Табулатура
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="piano" className="mt-4">
                  <PianoRollWithMidiSync
                    notes={recording.notes || []}
                    audioUrl={recording.audio_url}
                    duration={recording.duration_seconds || 30}
                  />
                </TabsContent>

                <TabsContent value="tab" className="mt-4">
                  <GuitarTabVisualization
                    notes={recording.notes || []}
                    bpm={recording.bpm || 120}
                  />
                </TabsContent>
              </Tabs>
            )}

            {/* Export Files */}
            <ExportFilesPanel
              transcriptionFiles={{
                midiUrl: recording.midi_url || undefined,
                midiQuantUrl: recording.midi_quant_url || undefined,
                pdfUrl: recording.pdf_url || undefined,
                gp5Url: recording.gp5_url || undefined,
                musicXmlUrl: recording.musicxml_url || undefined,
              }}
              midiUrl={recording.midi_url || undefined}
            />

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              {onUseForGeneration && (
                <Button
                  onClick={() => onUseForGeneration(recording)}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Wand2 className="w-5 h-5" />
                  Использовать для генерации
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}