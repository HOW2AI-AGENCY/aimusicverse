import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Mic, MicOff, Guitar, Play, Pause, Trash2, Loader2, Music, 
  Waves, CheckCircle2, AlertCircle, Save, FolderOpen, FileMusic
} from 'lucide-react';
import { useGuitarAnalysis, type GuitarAnalysisResult } from '@/hooks/useGuitarAnalysis';
import { useGuitarRecordings } from '@/hooks/useGuitarRecordings';
import { GuitarAnalysisReport } from '@/components/guitar/GuitarAnalysisReport';
import { SavedRecordingsList } from '@/components/guitar/SavedRecordingsList';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from '@/lib/motion';
import { toast } from 'sonner';

interface GuitarRecordDialogProps {
  onComplete?: (data: {
    audioFile?: File;
    audioUrl: string;
    analysis: GuitarAnalysisResult;
    generatedTags: string[];
    styleDescription: string;
  }) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GuitarRecordDialog({ 
  onComplete, 
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: GuitarRecordDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'record' | 'saved'>('record');
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const isMobile = useIsMobile();

  const {
    isAnalyzing,
    isRecording,
    analysisResult,
    recordedAudioUrl,
    recordedFile,
    progress,
    progressPercent,
    startRecording,
    stopRecording,
    analyzeGuitarRecording,
    clearRecording,
  } = useGuitarAnalysis();

  const { saveRecording, toAnalysisResult } = useGuitarRecordings();

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      clearRecording();
      setIsPlaying(false);
      setRecordingDuration(0);
      setRecordingTitle('');
      setActiveTab('record');
    }
  }, [open, clearRecording]);

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

  const handleAnalyze = async () => {
    await analyzeGuitarRecording(recordedFile);
  };

  const handleSaveRecording = async () => {
    if (!analysisResult || !recordedAudioUrl) {
      toast.error('Сначала проанализируйте запись');
      return;
    }

    await saveRecording.mutateAsync({
      analysis: analysisResult,
      audioUrl: analysisResult.audioUrl || recordedAudioUrl,
      title: recordingTitle || undefined,
      durationSeconds: recordingDuration,
    });
  };

  const handleComplete = () => {
    if (analysisResult && recordedAudioUrl) {
      onComplete?.({
        audioFile: recordedFile || undefined,
        audioUrl: analysisResult.audioUrl || recordedAudioUrl,
        analysis: analysisResult,
        generatedTags: analysisResult.generatedTags,
        styleDescription: analysisResult.styleDescription,
      });
      setOpen(false);
    }
  };

  const handleSelectSavedRecording = (recording: any) => {
    const analysis = toAnalysisResult(recording);
    onComplete?.({
      audioUrl: recording.audio_url,
      analysis,
      generatedTags: analysis.generatedTags,
      styleDescription: analysis.styleDescription,
    });
    setOpen(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const content = (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="record" className="gap-2">
            <Mic className="w-4 h-4" />
            Записать
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Сохранённые
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="mt-4 space-y-4">
          {/* Recording Section */}
          {!analysisResult && (
            <AnimatePresence mode="wait">
              {!recordedAudioUrl ? (
                <motion.div
                  key="record"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className={cn(
                    "p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300",
                    isRecording && "bg-destructive/10 border-destructive shadow-lg shadow-destructive/20"
                  )}>
                    {/* Animated recording circle */}
                    <div className="relative">
                      <motion.div
                        className={cn(
                          "w-28 h-28 rounded-full flex items-center justify-center transition-colors",
                          isRecording 
                            ? "bg-destructive" 
                            : "bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30"
                        )}
                        animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {isRecording ? (
                          <MicOff className="w-12 h-12 text-destructive-foreground" />
                        ) : (
                          <Guitar className="w-12 h-12 text-primary" />
                        )}
                      </motion.div>
                      
                      {/* Recording pulse rings */}
                      {isRecording && (
                        <>
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-destructive"
                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-destructive"
                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                          />
                        </>
                      )}
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="font-semibold text-xl">
                        {isRecording ? (
                          <span className="text-destructive font-mono">
                            {formatDuration(recordingDuration)}
                          </span>
                        ) : (
                          'Запишите мелодию'
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        {isRecording 
                          ? 'Играйте на инструменте. Нажмите для остановки.' 
                          : 'Гитара, пианино, голос — AI распознает мелодию и аккорды'
                        }
                      </p>
                    </div>

                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopRecording : startRecording}
                      className="gap-2 min-w-44 h-12 text-base"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-5 h-5" />
                          Остановить запись
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5" />
                          Начать запись
                        </>
                      )}
                    </Button>

                    {/* Recording tips */}
                    {!isRecording && (
                      <div className="flex flex-wrap gap-2 justify-center mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <Music className="w-3 h-3 mr-1" />
                          Аккорды
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Waves className="w-3 h-3 mr-1" />
                          Мелодии
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <FileMusic className="w-3 h-3 mr-1" />
                          MIDI + Табы
                        </Badge>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Recorded Audio Preview */}
                  <Card className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <Button
                        size="icon"
                        variant={isPlaying ? "secondary" : "default"}
                        onClick={handleTogglePlayback}
                        className="h-12 w-12 rounded-full shrink-0"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </Button>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">Записанное аудио</p>
                        <p className="text-sm text-muted-foreground">
                          Длительность: {formatDuration(recordingDuration)}
                        </p>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={clearRecording}
                        className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <audio
                      ref={audioRef}
                      src={recordedAudioUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />

                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full gap-2 h-12"
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {progress || 'Анализируем...'}
                        </>
                      ) : (
                        <>
                          <Guitar className="w-5 h-5" />
                          Анализировать
                        </>
                      )}
                    </Button>

                    {isAnalyzing && (
                      <div className="space-y-2">
                        <Progress value={progressPercent} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{progress}</span>
                          <span>{progressPercent}%</span>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Analysis Results */}
          {analysisResult && recordedAudioUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Analysis Status Summary */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Анализ завершён</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={analysisResult.analysisComplete.beats ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {analysisResult.analysisComplete.beats ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    Ритм
                  </Badge>
                  <Badge 
                    variant={analysisResult.analysisComplete.chords ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {analysisResult.analysisComplete.chords ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    Аккорды
                  </Badge>
                  <Badge 
                    variant={analysisResult.analysisComplete.transcription ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {analysisResult.analysisComplete.transcription ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    Транскрипция
                  </Badge>
                </div>
              </Card>

              <GuitarAnalysisReport
                analysis={analysisResult}
                audioUrl={recordedAudioUrl}
                onCreateTrack={handleComplete}
                onSave={handleSaveRecording}
              />
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          <SavedRecordingsList onSelect={handleSelectSavedRecording} />
        </TabsContent>
      </Tabs>
    </div>
  );

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Guitar className="w-4 h-4" />
      Записать гитару
    </Button>
  );

  // If using controlled open without trigger, don't render trigger
  const isControlled = controlledOpen !== undefined;
  const triggerElement = isControlled ? null : (trigger || defaultTrigger);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        {triggerElement && (
          <DrawerTrigger asChild>
            {triggerElement}
          </DrawerTrigger>
        )}
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <Guitar className="w-5 h-5 text-primary" />
              Анализ гитарной записи
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerElement && (
        <DialogTrigger asChild>
          {triggerElement}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Guitar className="w-5 h-5 text-primary" />
            Анализ гитарной записи
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
