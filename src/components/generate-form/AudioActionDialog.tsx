import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileAudio, Mic, X, Play, Pause, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AudioActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAudioSelected: (file: File) => void;
  onAnalysisComplete?: (styleDescription: string) => void;
}

export function AudioActionDialog({
  open,
  onOpenChange,
  onAudioSelected,
  onAnalysisComplete,
}: AudioActionDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const analyzeAudio = async (file: File) => {
    setIsAnalyzing(true);
    try {
      logger.info('Uploading reference audio for analysis');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован. Войдите в систему для загрузки аудио.');
      
      const fileName = `reference-${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      logger.info('Analyzing reference audio', { url: publicUrl });
      toast.info('Анализируем референс...', { icon: <Sparkles className="w-4 h-4" /> });

      const { data: tempTrack, error: trackError } = await supabase
        .from('tracks')
        .insert({
          user_id: user.id,
          prompt: 'Reference audio analysis',
          audio_url: publicUrl,
          status: 'completed',
          generation_mode: 'reference',
        })
        .select()
        .single();

      if (trackError) throw trackError;

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-audio-flamingo',
        {
          body: {
            track_id: tempTrack.id,
            audio_url: publicUrl,
            analysis_type: 'reference',
          },
        }
      );

      if (analysisError) throw analysisError;

      if (analysisData.success && analysisData.parsed.style_description) {
        toast.success('Анализ завершен!');
        onAnalysisComplete?.(analysisData.parsed.style_description);
      }

      await supabase.from('tracks').delete().eq('id', tempTrack.id);

    } catch (error) {
      logger.error('Audio analysis error', { error });
      toast.error('Ошибка анализа аудио');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        setAudioUrl(url);
        setAudioFile(file);
        toast.success('Запись завершена');
        
        stream.getTracks().forEach(track => track.stop());
        
        await analyzeAudio(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Запись началась');
    } catch (error) {
      logger.error('Recording error', { error });
      toast.error('Не удалось начать запись');
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
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Файл слишком большой (максимум 20 МБ)');
        return;
      }
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioFile(file);
      toast.success('Аудио загружено');
      
      await analyzeAudio(file);
    }
  };

  const handleRemove = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioFile(null);
    setIsPlaying(false);
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
      // Reset state
      handleRemove();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="audio-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5" />
            Аудио референс
          </DialogTitle>
          <DialogDescription id="audio-dialog-description">
            Загрузите или запишите аудио для использования в качестве референса
          </DialogDescription>
        </DialogHeader>

        {isAnalyzing && (
          <div className="py-8 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Sparkles className="w-8 h-8 animate-pulse text-primary mx-auto" />
              <p className="text-sm font-medium">Анализируем аудио...</p>
            </div>
          </div>
        )}

        {!isAnalyzing && !audioFile && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-16 gap-2 text-base"
              onClick={() => document.getElementById('audio-file-input-dialog')?.click()}
            >
              <FileAudio className="w-5 h-5" />
              Загрузить файл
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
              variant="outline"
              className="w-full h-16 gap-2 text-base"
              onClick={isRecording ? stopRecording : startRecording}
            >
              <Mic className={`w-5 h-5 ${isRecording ? 'text-destructive animate-pulse' : ''}`} />
              {isRecording ? 'Остановить запись' : 'Записать аудио'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Максимальный размер файла: 20 МБ
            </p>
          </div>
        )}

        {!isAnalyzing && audioFile && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={togglePlayback}
                className="h-10 w-10"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              <div className="flex-1 text-sm truncate">
                {audioFile.name}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleRemove}
                className="h-10 w-10"
              >
                <X className="w-5 h-5" />
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

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleRemove();
                }}
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
      </DialogContent>
    </Dialog>
  );
}
