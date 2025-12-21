/**
 * AudioReferenceRecorder - Record or upload audio for section references
 * Supports both voice notes and instrumental references with analysis
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { 
  Mic, 
  Square, 
  Upload, 
  Loader2, 
  Check, 
  X,
  Music2,
  AudioWaveform
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ReferenceAnalysis } from '@/hooks/useSectionNotes';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface AudioReferenceRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'note' | 'reference';
  onComplete: (url: string, analysis?: ReferenceAnalysis) => void;
}

export function AudioReferenceRecorder({ 
  open, 
  onOpenChange, 
  mode,
  onComplete 
}: AudioReferenceRecorderProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Reset when closing
  useEffect(() => {
    if (!open) {
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setIsRecording(false);
      setUploadProgress(0);
    }
  }, [open]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

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
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Выберите аудио-файл');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Файл слишком большой (макс. 10МБ)');
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
      // Generate unique filename
      const ext = audioBlob.type.includes('webm') ? 'webm' : 'mp3';
      const fileName = `${user.id}/${mode}_${Date.now()}.${ext}`;

      setUploadProgress(30);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-references')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-references')
        .getPublicUrl(fileName);

      // If reference mode, analyze the audio
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
                detectChords: true,
                detectBpm: true
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
      <SheetContent side="bottom" className="h-auto max-h-[70vh]">
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
          {/* Recording Visualization */}
          {isRecording && (
            <div className="flex flex-col items-center py-8">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-4"
              >
                <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center">
                  <AudioWaveform className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              <p className="text-2xl font-mono">{formatTime(recordingTime)}</p>
              <p className="text-sm text-muted-foreground mt-1">Запись...</p>
            </div>
          )}

          {/* Audio Preview */}
          {audioUrl && !isRecording && (
            <div className="p-4 bg-muted/30 rounded-xl">
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
                className="h-20 flex-col gap-2"
                onClick={startRecording}
              >
                <Mic className="w-6 h-6" />
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
