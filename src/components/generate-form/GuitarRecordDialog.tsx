import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Guitar, Play, Pause, Trash2, Loader2 } from 'lucide-react';
import { useGuitarAnalysis, type GuitarAnalysisResult } from '@/hooks/useGuitarAnalysis';
import { GuitarAnalysisPanel } from '@/components/analysis/GuitarAnalysisPanel';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface GuitarRecordDialogProps {
  onComplete: (data: {
    audioFile: File;
    audioUrl: string;
    analysis: GuitarAnalysisResult;
    generatedTags: string[];
    styleDescription: string;
  }) => void;
  trigger?: React.ReactNode;
}

export function GuitarRecordDialog({ onComplete, trigger }: GuitarRecordDialogProps) {
  const [open, setOpen] = useState(false);
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
      onComplete({
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
        <Card className={cn(
          "p-6 flex flex-col items-center justify-center gap-4 transition-colors",
          isRecording && "bg-destructive/10 border-destructive"
        )}>
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center transition-all",
            isRecording 
              ? "bg-destructive animate-pulse" 
              : "bg-primary/10"
          )}>
            {isRecording ? (
              <MicOff className="w-12 h-12 text-destructive-foreground" />
            ) : (
              <Guitar className="w-12 h-12 text-primary" />
            )}
          </div>

          <div className="text-center">
            <h3 className="font-semibold text-lg">
              {isRecording ? formatDuration(recordingDuration) : 'Запишите гитару'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isRecording 
                ? 'Нажмите для остановки записи' 
                : 'Играйте на гитаре, пианино или пойте мелодию'
              }
            </p>
          </div>

          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopRecording : startRecording}
            className="gap-2 min-w-40"
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5" />
                Остановить
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Начать запись
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Recorded Audio Preview */}
      {recordedAudioUrl && !isRecording && !analysisResult && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleTogglePlayback}
              className="h-10 w-10"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            <div className="flex-1">
              <p className="text-sm font-medium">Записанное аудио</p>
              <p className="text-xs text-muted-foreground">
                {formatDuration(recordingDuration)}
              </p>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={clearRecording}
              className="h-8 w-8 text-destructive"
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
            className="w-full gap-2"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress || 'Анализируем...'}
              </>
            ) : (
              <>
                <Guitar className="w-4 h-4" />
                Анализировать запись
              </>
            )}
          </Button>

          {isAnalyzing && (
            <Progress value={33} className="h-2" />
          )}
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResult && recordedAudioUrl && (
        <GuitarAnalysisPanel
          analysis={analysisResult}
          audioUrl={recordedAudioUrl}
          onCreateTrack={handleComplete}
        />
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
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Guitar className="w-5 h-5" />
              Анализ гитарной партии
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
            <Guitar className="w-5 h-5" />
            Анализ гитарной партии
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
