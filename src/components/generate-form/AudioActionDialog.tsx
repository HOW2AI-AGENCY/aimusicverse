import { useState, useRef, useEffect, useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileAudio, Mic, X, Play, Pause, Sparkles, Upload, 
  Disc, ArrowRight, Loader2, FileText, Check,
  Rocket, Guitar
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReferenceAudio, ReferenceAudio } from '@/hooks/useReferenceAudio';
import { useAudioReference } from '@/hooks/useAudioReference';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { GuitarModeRecorder } from './GuitarModeRecorder';
import { CloudAudioSelector } from '@/components/audio-reference';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from '@/hooks/studio/useStudioAudio';

type AudioMode = 'cover' | 'extend';
type RecordingMode = 'standard' | 'guitar';

interface AudioActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAudioSelected: (file: File, mode: AudioMode) => void;
  onAnalysisComplete?: (styleDescription: string) => void;
  onLyricsExtracted?: (lyrics: string) => void;
  onChordsDetected?: (chords: string[], progression: string) => void;
  initialMode?: AudioMode;
  /** Callback to open UploadAudioDialog for direct cover/extend generation */
  onOpenCoverDialog?: (file: File, mode: AudioMode) => void;
}

const ANALYSIS_STEPS = [
  'Загружаем аудио...',
  'Анализируем стиль...',
  'Определяем жанр и настроение...',
  'Завершаем анализ...',
];

export function AudioActionDialog({
  open,
  onOpenChange,
  onAudioSelected,
  onAnalysisComplete,
  onLyricsExtracted,
  onChordsDetected,
  initialMode = 'cover',
  onOpenCoverDialog,
}: AudioActionDialogProps) {
  const isMobile = useIsMobile();
  const { saveAudio, updateAnalysis: updateDbAnalysis } = useReferenceAudio();
  const { setFromUpload, setFromCloud } = useAudioReference();
  const sourceId = useId();
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();
  
  const [mode, setMode] = useState<AudioMode>(initialMode);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('standard');
  const [showGuitarMode, setShowGuitarMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [savedAudioId, setSavedAudioId] = useState<string | null>(null);

  // Register for studio audio coordination
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      registerStudioAudio(sourceId, () => {
        audio.pause();
        setIsPlaying(false);
      });
    }
    return () => unregisterStudioAudio(sourceId);
  }, [sourceId]);

  // Pause if global player starts
  useEffect(() => {
    if (globalIsPlaying && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [globalIsPlaying, isPlaying]);
  
  
  // Analysis state with progress
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
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
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      handleRemove();
      setMode(initialMode);
      setRecordingMode('standard');
      setShowGuitarMode(false);
      setAnalysisResult(null);
      setExtractedLyrics(null);
      setHasVocals(null);
      setAnalysisStep(0);
      setAnalysisProgress(0);
    }
  }, [open, initialMode]);

  // Handle guitar mode recording complete
  const handleGuitarRecordingComplete = async (data: {
    audioFile: File;
    audioUrl: string;
    chordProgression: string[];
    styleDescription: string;
    useMode: 'style' | 'audio';
  }) => {
    setShowGuitarMode(false);
    
    // Notify parent about chords
    if (onChordsDetected && data.chordProgression.length > 0) {
      const progression = data.chordProgression.join(' → ');
      onChordsDetected(data.chordProgression, progression);
    }
    
    if (data.useMode === 'style') {
      // Use style description as prompt, close dialog
      if (data.styleDescription && onAnalysisComplete) {
        onAnalysisComplete(data.styleDescription);
      }
      toast.success('Описание стиля добавлено');
      onOpenChange(false);
    } else {
      // Use audio as reference - set the file and continue with normal flow
      setAudioFile(data.audioFile);
      setAudioUrl(data.audioUrl);
      
      // Also pass style description for additional context
      if (data.styleDescription && onAnalysisComplete) {
        onAnalysisComplete(data.styleDescription);
        setAnalysisResult({ style: data.styleDescription });
      }
      
      toast.success('Аудио референс готов');
    }
  };

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

  // Analysis progress animation
  useEffect(() => {
    if (isAnalyzing) {
      setAnalysisStep(0);
      setAnalysisProgress(0);
      
      analysisIntervalRef.current = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = prev + 2;
          // Update step based on progress
          if (newProgress >= 75) setAnalysisStep(3);
          else if (newProgress >= 50) setAnalysisStep(2);
          else if (newProgress >= 25) setAnalysisStep(1);
          
          return Math.min(newProgress, 95); // Cap at 95% until complete
        });
      }, 200);
    } else {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (analysisResult) {
        setAnalysisProgress(100);
      }
    }
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isAnalyzing, analysisResult]);

  const uploadAndGetUrl = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Не авторизован');
    
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${user.id}/reference-${Date.now()}-${sanitizedName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      logger.error('Storage upload error', { error: uploadError.message });
      throw new Error(`Ошибка загрузки: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('project-assets')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const analyzeAudio = async (file: File, existingUrl?: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    // Create timeout controller for 60 second limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
      logger.info('Uploading and analyzing audio');
      
      const publicUrl = existingUrl || await uploadAndGetUrl(file);

      // Save to reference_audio table
      let audioRecord: ReferenceAudio | null = null;
      if (!existingUrl) {
        audioRecord = await saveAudio({
          fileName: file.name,
          fileUrl: publicUrl,
          fileSize: file.size,
          mimeType: file.type,
          durationSeconds: audioDuration ?? undefined,
          source: 'upload',
          analysisStatus: 'analyzing',
        });
        setSavedAudioId(audioRecord.id);
      }

      // Make request with timeout
      const analysisPromise = supabase.functions.invoke(
        'analyze-audio-flamingo',
        {
          body: {
            audio_url: publicUrl,
            analysis_type: 'reference',
          },
        }
      );

      // Race between analysis and timeout
      const result = await Promise.race([
        analysisPromise,
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Превышено время ожидания анализа (60 сек)'));
          });
        })
      ]);

      clearTimeout(timeoutId);
      
      const { data: analysisData, error: analysisError } = result as { data: any; error: any };

      if (analysisError) throw new Error(analysisError.message || 'Network error');
      if (analysisData?.error) throw new Error(analysisData.error);

      if (analysisData?.success && analysisData.parsed) {
        const analysisResult = {
          style: analysisData.parsed.style_description,
          genre: analysisData.parsed.genre,
          mood: analysisData.parsed.mood,
        };
        setAnalysisResult(analysisResult);
        
        // Update database record
        if (audioRecord?.id || savedAudioId) {
          await updateDbAnalysis({
            id: audioRecord?.id || savedAudioId!,
            genre: analysisResult.genre,
            mood: analysisResult.mood,
            analysisStatus: 'completed',
          });
        }
        
        if (analysisResult.style) {
          onAnalysisComplete?.(analysisResult.style);
          toast.success('Стиль определён!');
        }
      } else {
        throw new Error('Не удалось проанализировать аудио');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      logger.error('Audio analysis error', { error: message });
      toast.error(`Ошибка анализа: ${message}`);
      
      // Reset progress on error
      setAnalysisProgress(0);
      setAnalysisStep(0);
      
      // Update database record with failed status if exists
      if (savedAudioId) {
        await updateDbAnalysis({
          id: savedAudioId,
          analysisStatus: 'failed',
        }).catch(() => {});
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractLyrics = async () => {
    if (!audioFile && !audioUrl) return;
    
    setIsExtractingLyrics(true);
    try {
      let publicUrl = audioUrl;
      if (audioFile && !audioUrl?.startsWith('http')) {
        publicUrl = await uploadAndGetUrl(audioFile);
      }
      
      const { data, error } = await supabase.functions.invoke('transcribe-lyrics', {
        body: { audio_url: publicUrl }
      });

      if (error) throw new Error(error.message || 'Network error');
      if (data?.error) throw new Error(data.error);

      setHasVocals(data?.has_vocals ?? false);
      
      // Update database record
      if (savedAudioId) {
        await updateDbAnalysis({
          id: savedAudioId,
          hasVocals: data?.has_vocals,
          transcription: data?.lyrics,
        });
      }
      
      if (data?.has_vocals && data?.lyrics) {
        setExtractedLyrics(data.lyrics);
        onLyricsExtracted?.(data.lyrics);
        toast.success('Текст извлечён!');
      } else {
        toast.info('Вокал не обнаружен - инструментальный трек');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      logger.error('Lyrics extraction error', { error: message });
      toast.error(`Ошибка извлечения: ${message}`);
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
        
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          setAudioDuration(audio.duration);
        };
        
        setAudioUrl(url);
        setAudioFile(file);
        
        stream.getTracks().forEach(track => track.stop());
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
    
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };
    
    setAudioUrl(url);
    setAudioFile(file);
    await analyzeAudio(file);
  };
  const handleRemove = () => {
    if (audioUrl && !audioUrl.startsWith('http')) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioFile(null);
    setAudioDuration(null);
    setIsPlaying(false);
    setAnalysisResult(null);
    setExtractedLyrics(null);
    setHasVocals(null);
    setSavedAudioId(null);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      pauseTrack();
      pauseAllStudioAudio(sourceId);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleConfirm = async () => {
    if (audioFile) {
      // Use unified reference system
      await setFromUpload(audioFile, mode);
      onAudioSelected(audioFile, mode);
      onOpenChange(false);
    }
  };

  // Handle cloud audio selection - integrates with unified reference
  const handleCloudSelect = (audio: ReferenceAudio) => {
    setFromCloud(audio, mode);
    onOpenChange(false);
  };

  const modeConfig = {
    cover: { icon: Disc, label: 'Кавер', desc: 'Новая версия в другом стиле' },
    extend: { icon: ArrowRight, label: 'Расширить', desc: 'Продолжить композицию' },
  };

  // Check if audio is ready for mode selection (analyzed)
  const isAudioReady = audioFile && analysisResult && !isAnalyzing;

  const content = (
    <div className="space-y-3">
      {/* Mode Tabs - Show ONLY after audio is analyzed */}
      {isAudioReady && (
        <>
          <div className="text-center text-xs text-muted-foreground mb-2">
            Выберите действие:
          </div>
          <Tabs value={mode} onValueChange={(v) => setMode(v as AudioMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10">
              {(['cover', 'extend'] as const).map((m) => {
                const cfg = modeConfig[m];
                const Icon = cfg.icon;
                return (
                  <TabsTrigger 
                    key={m} 
                    value={m}
                    className="flex items-center gap-2 text-sm data-[state=active]:bg-primary/10"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cfg.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground text-center">
            {modeConfig[mode].desc}
          </p>
        </>
      )}

      {/* Analysis Loading State - Animated */}
      {isAnalyzing && (
        <div className="py-6 space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-2 px-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{ANALYSIS_STEPS[analysisStep]}</span>
              <span className="text-primary font-medium">{Math.round(analysisProgress)}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Это может занять 10-30 секунд
          </p>
        </div>
      )}

      {/* Upload/Record/History */}
      {/* Guitar Mode */}
      {showGuitarMode && (
        <GuitarModeRecorder
          onRecordingComplete={handleGuitarRecordingComplete}
          onCancel={() => setShowGuitarMode(false)}
        />
      )}

      {/* Upload/Record/History */}
      {!isAnalyzing && !audioFile && !showGuitarMode && (
        <div className="space-y-2">
          {/* Cloud Audio Selector - integrated with unified reference system */}
          <CloudAudioSelector
            selectedMode={mode}
            onSelect={(audio) => handleCloudSelect(audio)}
            maxItems={5}
            compact
          />

          {/* Upload/Record Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-col gap-1"
              onClick={() => document.getElementById('audio-file-input-dialog')?.click()}
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs">Загрузить</span>
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
              className="h-14 flex-col gap-1"
              onClick={isRecording ? stopRecording : startRecording}
            >
              <Mic className={cn("w-5 h-5", isRecording && "animate-pulse")} />
              <span className="text-xs">
                {isRecording ? formatTime(recordingTime) : 'Записать'}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-14 flex-col gap-1 border-primary/30 hover:border-primary hover:bg-primary/5"
              onClick={() => setShowGuitarMode(true)}
            >
              <Guitar className="w-5 h-5 text-primary" />
              <span className="text-xs">Гитара</span>
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            WAV, MP3, WebM • до 20 МБ • Гитара: детектирование аккордов
          </p>
        </div>
      )}

      {/* Audio Preview & Analysis */}
      {!isAnalyzing && audioFile && (
        <div className="space-y-3">
          {/* Audio Player - Compact */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={togglePlayback}
              className="h-9 w-9 shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{audioFile.name}</p>
              {audioDuration && (
                <p className="text-[10px] text-muted-foreground">{formatTime(Math.floor(audioDuration))}</p>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleRemove}
              className="h-7 w-7 shrink-0"
            >
              <X className="w-3 h-3" />
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

          {/* Analysis Result - Compact */}
          {analysisResult && (
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium">Анализ завершён</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {analysisResult.genre && (
                  <Badge variant="secondary" className="text-[10px] h-5">{analysisResult.genre}</Badge>
                )}
                {analysisResult.mood && (
                  <Badge variant="secondary" className="text-[10px] h-5">{analysisResult.mood}</Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Waiting for analysis */}
          {!analysisResult && !isAnalyzing && (
            <div className="p-2 rounded-lg bg-muted/50 border space-y-1.5 text-center">
              <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Ожидание анализа...</span>
            </div>
          )}

          {/* Lyrics Extraction - Compact */}
          {mode !== 'extend' && (
            <div className="space-y-2">
              {!extractedLyrics && hasVocals !== false && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-9 gap-2 text-xs"
                  onClick={extractLyrics}
                  disabled={isExtractingLyrics}
                >
                  {isExtractingLyrics ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Извлекаем текст...
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3" />
                      Извлечь текст
                    </>
                  )}
                </Button>
              )}

              {hasVocals === false && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Инструментальный трек
                </p>
              )}

              {extractedLyrics && (
                <div className="p-2 rounded-lg bg-muted/50 border max-h-24 overflow-y-auto">
                  <p className="text-[10px] font-mono whitespace-pre-wrap line-clamp-6">{extractedLyrics}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions - Compact */}
          <div className="space-y-2 pt-1">
            {/* Direct generation button - primary action - only show after analysis */}
            {onOpenCoverDialog && analysisResult && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (audioFile) {
                    onOpenCoverDialog(audioFile, mode);
                    onOpenChange(false);
                  }
                }}
                className="w-full h-10 gap-2 bg-gradient-to-r from-primary to-primary/80"
              >
                <Rocket className="w-4 h-4" />
                {mode === 'cover' ? 'Создать кавер' : 'Расширить трек'}
              </Button>
            )}
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="flex-1 h-9"
              >
                Отменить
              </Button>
              {analysisResult && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleConfirm}
                  className="flex-1 h-9"
                >
                  В форму генерации
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="py-3 text-left">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <FileAudio className="w-4 h-4 text-primary" />
              Аудио
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Загрузите, запишите или выберите из истории
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-4">
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
            Загрузите, запишите или выберите из истории
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
