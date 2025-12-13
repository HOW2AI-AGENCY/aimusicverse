import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  FileAudio, Mic, X, Play, Pause, Sparkles, Upload, 
  Disc, ArrowRight, Music, Loader2, FileText, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type AudioMode = 'reference' | 'cover' | 'extend';

interface AudioActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAudioSelected: (file: File) => void;
  onAnalysisComplete?: (styleDescription: string) => void;
  onLyricsExtracted?: (lyrics: string) => void;
  initialMode?: AudioMode;
}

export function AudioActionDialog({
  open,
  onOpenChange,
  onAudioSelected,
  onAnalysisComplete,
  onLyricsExtracted,
  initialMode = 'reference',
}: AudioActionDialogProps) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<AudioMode>(initialMode);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    style?: string;
    genre?: string;
    mood?: string;
  } | null>(null);
  
  // Lyrics extraction state
  const [isExtractingLyrics, setIsExtractingLyrics] = useState(false);
  const [extractedLyrics, setExtractedLyrics] = useState<string | null>(null);
  const [hasVocals, setHasVocals] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      handleRemove();
      setMode(initialMode);
      setAnalysisResult(null);
      setExtractedLyrics(null);
      setHasVocals(null);
    }
  }, [open, initialMode]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const uploadAndGetUrl = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Не авторизован');
    
    const fileName = `reference-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('project-assets')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const analyzeAudio = async (file: File) => {
    setIsAnalyzing(true);
    try {
      logger.info('Uploading and analyzing audio');
      
      const publicUrl = await uploadAndGetUrl(file);
      toast.info('Анализируем стиль...', { icon: <Sparkles className="w-4 h-4" /> });

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-audio-flamingo',
        {
          body: {
            audio_url: publicUrl,
            analysis_type: 'reference',
          },
        }
      );

      if (analysisError) throw analysisError;

      if (analysisData.success && analysisData.parsed) {
        const result = {
          style: analysisData.parsed.style_description,
          genre: analysisData.parsed.genre,
          mood: analysisData.parsed.mood,
        };
        setAnalysisResult(result);
        
        if (result.style) {
          onAnalysisComplete?.(result.style);
          toast.success('Стиль определён!');
        }
      }
    } catch (error) {
      logger.error('Audio analysis error', { error });
      toast.error('Ошибка анализа');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractLyrics = async () => {
    if (!audioFile) return;
    
    setIsExtractingLyrics(true);
    try {
      const publicUrl = await uploadAndGetUrl(audioFile);
      toast.info('Извлекаем текст...', { icon: <FileText className="w-4 h-4" /> });

      const { data, error } = await supabase.functions.invoke('transcribe-lyrics', {
        body: { audio_url: publicUrl }
      });

      if (error) throw error;

      setHasVocals(data.has_vocals);
      
      if (data.has_vocals && data.lyrics) {
        setExtractedLyrics(data.lyrics);
        onLyricsExtracted?.(data.lyrics);
        toast.success('Текст извлечён!');
      } else {
        toast.info('Вокал не обнаружен - инструментальный трек');
      }
    } catch (error) {
      logger.error('Lyrics extraction error', { error });
      toast.error('Ошибка извлечения текста');
    } finally {
      setIsExtractingLyrics(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/mp4';
        
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Get duration
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          setAudioDuration(audio.duration);
        };
        
        setAudioUrl(url);
        setAudioFile(file);
        
        stream.getTracks().forEach(track => track.stop());
        
        // Auto-analyze
        await analyzeAudio(file);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      toast.success('Запись началась');
    } catch (error) {
      logger.error('Recording error', { error });
      toast.error('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Максимум 20 МБ');
      return;
    }
    
    const url = URL.createObjectURL(file);
    
    // Get duration
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };
    
    setAudioUrl(url);
    setAudioFile(file);
    
    // Auto-analyze
    await analyzeAudio(file);
  };

  const handleRemove = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioFile(null);
    setAudioDuration(null);
    setIsPlaying(false);
    setAnalysisResult(null);
    setExtractedLyrics(null);
    setHasVocals(null);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleConfirm = () => {
    if (audioFile) {
      onAudioSelected(audioFile);
      onOpenChange(false);
    }
  };

  const modeConfig = {
    reference: { icon: Music, label: 'Референс', desc: 'Стиль для новой генерации' },
    cover: { icon: Disc, label: 'Кавер', desc: 'Новая версия в другом стиле' },
    extend: { icon: ArrowRight, label: 'Расширение', desc: 'Продолжить композицию' },
  };

  const content = (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as AudioMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          {(['reference', 'cover', 'extend'] as const).map((m) => {
            const cfg = modeConfig[m];
            const Icon = cfg.icon;
            return (
              <TabsTrigger 
                key={m} 
                value={m}
                className="flex flex-col gap-0.5 py-2 px-1 data-[state=active]:bg-primary/10"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{cfg.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center">
        {modeConfig[mode].desc}
      </p>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="py-8 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Sparkles className="w-8 h-8 animate-pulse text-primary mx-auto" />
            <p className="text-sm font-medium">Анализируем аудио...</p>
          </div>
        </div>
      )}

      {/* Upload/Record */}
      {!isAnalyzing && !audioFile && (
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-16 gap-3"
            onClick={() => document.getElementById('audio-file-input-dialog')?.click()}
          >
            <Upload className="w-5 h-5" />
            <span>Загрузить файл</span>
          </Button>
          <input
            id="audio-file-input-dialog"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'outline'}
            className="w-full h-16 gap-3"
            onClick={isRecording ? stopRecording : startRecording}
          >
            <Mic className={cn("w-5 h-5", isRecording && "animate-pulse")} />
            <span>
              {isRecording ? `Запись ${formatTime(recordingTime)}` : 'Записать'}
            </span>
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            WAV, MP3, WebM • до 20 МБ
          </p>
        </div>
      )}

      {/* Audio Preview & Analysis */}
      {!isAnalyzing && audioFile && (
        <div className="space-y-4">
          {/* Audio Player */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={togglePlayback}
              className="h-10 w-10 shrink-0"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{audioFile.name}</p>
              {audioDuration && (
                <p className="text-xs text-muted-foreground">{formatTime(Math.floor(audioDuration))}</p>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleRemove}
              className="h-8 w-8 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}

          {/* Analysis Result */}
          {analysisResult && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Анализ завершён</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysisResult.genre && (
                  <Badge variant="secondary" className="text-xs">{analysisResult.genre}</Badge>
                )}
                {analysisResult.mood && (
                  <Badge variant="secondary" className="text-xs">{analysisResult.mood}</Badge>
                )}
              </div>
              {analysisResult.style && (
                <p className="text-xs text-muted-foreground line-clamp-2">{analysisResult.style}</p>
              )}
            </div>
          )}

          {/* Lyrics Extraction */}
          {mode !== 'extend' && (
            <div className="space-y-2">
              {!extractedLyrics && hasVocals !== false && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={extractLyrics}
                  disabled={isExtractingLyrics}
                >
                  {isExtractingLyrics ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Извлекаем текст...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Извлечь текст песни
                    </>
                  )}
                </Button>
              )}

              {hasVocals === false && (
                <p className="text-xs text-muted-foreground text-center">
                  Инструментальный трек (вокал не обнаружен)
                </p>
              )}

              {extractedLyrics && (
                <div className="p-3 rounded-lg bg-muted/50 border max-h-32 overflow-y-auto">
                  <p className="text-xs font-mono whitespace-pre-wrap">{extractedLyrics}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              className="flex-1"
            >
              Отменить
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="flex-1"
            >
              Применить
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <FileAudio className="w-5 h-5 text-primary" />
              Аудио
            </DrawerTitle>
            <DrawerDescription>
              Загрузите или запишите аудио
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-6">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="audio-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5 text-primary" />
            Аудио
          </DialogTitle>
          <DialogDescription id="audio-dialog-description">
            Загрузите или запишите аудио
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
