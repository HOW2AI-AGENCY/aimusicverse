import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Guitar, Play, Pause, Trash2, Loader2, Music, Waves, CheckCircle2, AlertCircle } from 'lucide-react';
import { useGuitarAnalysis, type GuitarAnalysisResult } from '@/hooks/useGuitarAnalysis';
import { GuitarAnalysisPanel } from '@/components/analysis/GuitarAnalysisPanel';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

interface GuitarRecordDialogProps {
  onComplete?: (data: {
    audioFile: File;
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

  const handleComplete = () => {
    if (analysisResult && recordedFile && recordedAudioUrl) {
      onComplete?.({
        audioFile: recordedFile,
        audioUrl: recordedAudioUrl,
        analysis: analysisResult,
        generatedTags: analysisResult.generatedTags,
        styleDescription: analysisResult.styleDescription,
      });
      setOpen(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const content = (
    <div className="space-y-4">
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
                      <Guitar className="w-3 h-3 mr-1" />
                      Табулатуры
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
                      Анализировать с Klang.io
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
        >
          {/* Analysis Status Summary */}
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-medium">Анализ завершён</span>
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
          
          <GuitarAnalysisPanel
            analysis={analysisResult}
            audioUrl={recordedAudioUrl}
            onCreateTrack={handleComplete}
          />
        </motion.div>
      )}
    </div>
  );

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Guitar className="w-4 h-4" />
      Записать гитару
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {trigger || defaultTrigger}
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <Guitar className="w-5 h-5 text-primary" />
              Анализ музыки с Klang.io
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
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Guitar className="w-5 h-5 text-primary" />
            Анализ музыки с Klang.io
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
