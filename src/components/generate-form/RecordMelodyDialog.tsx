import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Music2, Sparkles, Play, Pause, Trash2, ArrowRight, Piano, Guitar } from 'lucide-react';
import { useMelodyAnalysis, type MelodyAnalysisResult } from '@/hooks/useMelodyAnalysis';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface RecordMelodyDialogProps {
  onComplete: (data: {
    audioFile: File;
    audioUrl: string;
    analysis: MelodyAnalysisResult;
    generatedTags: string[];
  }) => void;
  trigger?: React.ReactNode;
}

export function RecordMelodyDialog({ onComplete, trigger }: RecordMelodyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useIsMobile();

  const {
    isAnalyzing,
    isRecording,
    analysisResult,
    recordedAudioUrl,
    recordedFile,
    startRecording,
    stopRecording,
    analyzeRecordedAudio,
    clearRecording,
  } = useMelodyAnalysis();

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      clearRecording();
      setIsPlaying(false);
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
    const result = await analyzeRecordedAudio();
    if (result && recordedFile && recordedAudioUrl) {
      // Analysis complete, user can now proceed
    }
  };

  const handleComplete = () => {
    if (analysisResult && recordedFile && recordedAudioUrl) {
      onComplete({
        audioFile: recordedFile,
        audioUrl: recordedAudioUrl,
        analysis: analysisResult,
        generatedTags: analysisResult.generatedTags,
      });
      setOpen(false);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Recording Section */}
      <Card className={cn(
        "p-6 flex flex-col items-center justify-center gap-4 transition-colors",
        isRecording && "bg-destructive/10 border-destructive"
      )}>
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center transition-all",
          isRecording 
            ? "bg-destructive animate-pulse" 
            : "bg-primary/10"
        )}>
          {isRecording ? (
            <MicOff className="w-10 h-10 text-destructive-foreground" />
          ) : (
            <Mic className="w-10 h-10 text-primary" />
          )}
        </div>

        <div className="text-center">
          <h3 className="font-semibold">
            {isRecording ? 'Запись...' : 'Запишите мелодию'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isRecording 
              ? 'Нажмите для остановки' 
              : 'Играйте на гитаре, пойте или используйте любой инструмент'
            }
          </p>
        </div>

        <Button
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          onClick={isRecording ? stopRecording : startRecording}
          className="gap-2"
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

      {/* Recorded Audio Preview */}
      {recordedAudioUrl && !isRecording && (
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
              <p className="text-sm font-medium">Записанная мелодия</p>
              <p className="text-xs text-muted-foreground">
                {recordedFile?.name}
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

          {!analysisResult && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full gap-2"
            >
              <Sparkles className={cn("w-4 h-4", isAnalyzing && "animate-spin")} />
              {isAnalyzing ? 'Анализируем...' : 'Анализировать мелодию'}
            </Button>
          )}
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Результат анализа</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Тональность</p>
              <p className="font-semibold">{analysisResult.key}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Темп</p>
              <p className="font-semibold">{analysisResult.bpm} BPM</p>
            </div>
          </div>

          {analysisResult.chords.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Аккорды</p>
              <div className="flex flex-wrap gap-1">
                {[...new Set(analysisResult.chords.map(c => c.chord))].map((chord, i) => (
                  <Badge key={i} variant="secondary">
                    {chord}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">Сгенерированные теги</p>
            <ScrollArea className="h-20">
              <div className="flex flex-wrap gap-1">
                {analysisResult.generatedTags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Button
            onClick={handleComplete}
            className="w-full gap-2"
            size="lg"
          >
            Создать трек по мелодии
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      )}

      {/* Tips */}
      {!recordedAudioUrl && (
        <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
          <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Guitar className="w-4 h-4 flex-shrink-0" />
            <span>Гитара</span>
          </div>
          <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Piano className="w-4 h-4 flex-shrink-0" />
            <span>Пианино</span>
          </div>
          <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Mic className="w-4 h-4 flex-shrink-0" />
            <span>Голос</span>
          </div>
        </div>
      )}
    </div>
  );

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Mic className="w-4 h-4" />
      Записать мелодию
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {trigger || defaultTrigger}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Music2 className="w-5 h-5" />
              Запись мелодии
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5" />
            Запись мелодии
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
