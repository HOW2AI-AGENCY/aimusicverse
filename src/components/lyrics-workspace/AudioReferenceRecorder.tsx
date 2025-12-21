/**
 * AudioReferenceRecorder - Record or upload audio for section references
 * Supports vocal and guitar recording modes with different audio settings
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { 
  Mic, 
  Square, 
  Upload, 
  Loader2, 
  Check, 
  X,
  Music2,
  AudioWaveform,
  Guitar,
  Volume2
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ReferenceAnalysis } from '@/hooks/useSectionNotes';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

export type RecordingType = 'vocal' | 'guitar';

interface AudioReferenceRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'note' | 'reference';
  onComplete: (url: string, analysis?: ReferenceAnalysis) => void;
  defaultRecordingType?: RecordingType;
}

// Audio settings for different recording types
const AUDIO_SETTINGS: Record<RecordingType, MediaTrackConstraints> = {
  vocal: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  guitar: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sampleRate: 44100,
  },
};

export function AudioReferenceRecorder({ 
  open, 
  onOpenChange, 
  mode,
  onComplete,
  defaultRecordingType = 'vocal'
}: AudioReferenceRecorderProps) {
  const { user } = useAuth();
  const [recordingType, setRecordingType] = useState<RecordingType>(defaultRecordingType);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Reset when closing
  useEffect(() => {
    if (!open) {
      cleanup();
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setIsRecording(false);
      setUploadProgress(0);
      setAudioLevel(0);
    }
  }, [open]);

  // Reset recording type when defaultRecordingType changes
  useEffect(() => {
    setRecordingType(defaultRecordingType);
  }, [defaultRecordingType]);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255);
    
    animationRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: AUDIO_SETTINGS[recordingType] 
      });
      
      streamRef.current = stream;

      // Set up audio level monitoring
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      updateAudioLevel();

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

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setAudioLevel(0);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      if (navigator.vibrate) navigator.vibrate(50);
      toast.success(recordingType === 'vocal' ? 'Запись вокала началась' : 'Запись гитары началась');

    } catch (error) {
      logger.error('Failed to start recording', error);
      toast.error('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Выберите аудио-файл');
      return;
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      toast.error('Файл слишком большой (макс. 20МБ)');
      return;
    }

    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  const uploadAndAnalyze = async () => {
    if (!audioBlob || !user) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const ext = audioBlob.type.includes('webm') ? 'webm' : 'mp3';
      const prefix = recordingType === 'guitar' ? 'guitar' : 'vocal';
      const fileName = `${user.id}/${prefix}_${mode}_${Date.now()}.${ext}`;

      setUploadProgress(30);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-references')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      const { data: { publicUrl } } = supabase.storage
        .from('audio-references')
        .getPublicUrl(fileName);

      let analysis: ReferenceAnalysis | undefined;
      
      if (mode === 'reference') {
        setIsAnalyzing(true);
        setUploadProgress(80);

        try {
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
            'analyze-reference-audio',
            {
              body: {
                audioUrl: publicUrl,
                analyzeStyle: true,
                detectChords: recordingType === 'guitar',
                detectBpm: true,
                recordingType
              }
            }
          );

          if (!analysisError && analysisData) {
            analysis = {
              bpm: analysisData.bpm,
              key: analysisData.key,
              genre: analysisData.genre,
              mood: analysisData.mood,
              energy: analysisData.energy,
              instruments: analysisData.instruments,
              chords: analysisData.chords,
              style_description: analysisData.style_description,
              vocal_style: analysisData.vocal_style,
              suggested_tags: analysisData.suggested_tags
            };
          }
        } catch (analysisError) {
          logger.warn('Audio analysis failed, continuing without', { error: String(analysisError) });
        }
        
        setIsAnalyzing(false);
      }

      setUploadProgress(100);
      
      onComplete(publicUrl, analysis);
      toast.success(mode === 'note' ? 'Заметка записана' : 'Референс загружен');
      onOpenChange(false);

    } catch (error) {
      logger.error('Upload failed', error);
      toast.error('Ошибка загрузки');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {mode === 'note' ? (
              <>
                <Mic className="w-5 h-5 text-primary" />
                Голосовая заметка
              </>
            ) : (
              <>
                <Music2 className="w-5 h-5 text-primary" />
                Аудио-референс
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {mode === 'note' 
              ? 'Запишите голосовую заметку для секции'
              : 'Запишите или загрузите референс для анализа стиля'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Recording Type Selector */}
          {!isRecording && !audioUrl && (
            <Tabs 
              value={recordingType} 
              onValueChange={(v) => setRecordingType(v as RecordingType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="vocal" className="gap-2">
                  <Mic className="w-4 h-4" />
                  Вокал
                </TabsTrigger>
                <TabsTrigger value="guitar" className="gap-2">
                  <Guitar className="w-4 h-4" />
                  Гитара
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Recording Type Info */}
          {!isRecording && !audioUrl && (
            <div className="p-3 bg-muted/30 rounded-xl text-sm text-muted-foreground">
              {recordingType === 'vocal' ? (
                <p>🎤 Оптимизировано для голоса: шумоподавление, эхоподавление</p>
              ) : (
                <p>🎸 Оптимизировано для гитары: высокое качество, без обработки</p>
              )}
            </div>
          )}

          {/* Recording Visualization */}
          {isRecording && (
            <div className="flex flex-col items-center py-8">
              <motion.div
                animate={{ 
                  scale: [1, 1 + audioLevel * 0.3, 1],
                }}
                transition={{ duration: 0.1 }}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mb-4",
                  recordingType === 'vocal' 
                    ? "bg-destructive/20" 
                    : "bg-amber-500/20"
                )}
              >
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    recordingType === 'vocal' 
                      ? "bg-destructive" 
                      : "bg-amber-500"
                  )}
                >
                  {recordingType === 'vocal' ? (
                    <Mic className="w-6 h-6 text-white" />
                  ) : (
                    <Guitar className="w-6 h-6 text-white" />
                  )}
                </div>
              </motion.div>
              
              {/* Audio Level Bars */}
              <div className="flex items-end gap-1 h-8 mb-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      "w-2 rounded-full",
                      recordingType === 'vocal' ? "bg-destructive" : "bg-amber-500"
                    )}
                    animate={{
                      height: Math.random() * audioLevel * 32 + 4,
                    }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>
              
              <p className="text-2xl font-mono">{formatTime(recordingTime)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {recordingType === 'vocal' ? 'Запись вокала...' : 'Запись гитары...'}
              </p>
            </div>
          )}

          {/* Audio Preview */}
          {audioUrl && !isRecording && (
            <div className="p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                {recordingType === 'vocal' ? (
                  <Mic className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Guitar className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {recordingType === 'vocal' ? 'Вокальная запись' : 'Гитарная запись'}
                </span>
              </div>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isAnalyzing ? 'Анализ аудио...' : 'Загрузка...'}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Controls */}
          {!audioUrl && !isRecording && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className={cn(
                  "h-20 flex-col gap-2",
                  recordingType === 'guitar' && "bg-amber-500 hover:bg-amber-600"
                )}
                onClick={startRecording}
              >
                {recordingType === 'vocal' ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <Guitar className="w-6 h-6" />
                )}
                Записать
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6" />
                Загрузить
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {isRecording && (
            <Button
              size="lg"
              variant="destructive"
              className="w-full h-14 gap-2"
              onClick={stopRecording}
            >
              <Square className="w-5 h-5" />
              Остановить
            </Button>
          )}

          {audioUrl && !isRecording && !isUploading && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => {
                  setAudioBlob(null);
                  setAudioUrl(null);
                }}
              >
                <X className="w-5 h-5" />
                Отменить
              </Button>
              <Button
                size="lg"
                className="gap-2"
                onClick={uploadAndAnalyze}
              >
                <Check className="w-5 h-5" />
                {mode === 'reference' ? 'Анализировать' : 'Сохранить'}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
