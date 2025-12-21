import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2, Music, MicVocal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface AudioRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'uploading';

export const AudioRecordDialog = ({ open, onOpenChange }: AudioRecordDialogProps) => {
  const { user } = useAuth();
  const [state, setState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processingAction, setProcessingAction] = useState<'instrumental' | 'vocals' | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          sampleRate: 44100 
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus' 
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState('recorded');
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(100);
      setState('recording');
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      
    } catch (error) {
      logger.error('Failed to start recording', { error });
      toast.error('Не удалось получить доступ к микрофону');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [state]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioUrl]);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setState('idle');
    setDuration(0);
    setIsPlaying(false);
  }, [audioUrl]);

  const uploadAndProcess = async (action: 'instrumental' | 'vocals') => {
    if (!audioBlob || !user) {
      toast.error('Необходимо авторизоваться');
      return;
    }

    setProcessingAction(action);
    setState('uploading');

    try {
      // Upload audio to storage
      const fileName = `recordings/${user.id}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('audio').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const recordingTitle = `Запись ${new Date().toLocaleString('ru-RU')}`;

      // Call appropriate function
      const functionName = action === 'instrumental' 
        ? 'suno-add-instrumental' 
        : 'suno-add-vocals';

      const { error: functionError } = await supabase.functions.invoke(functionName, {
        body: {
          audioUrl: publicUrl,
          prompt: action === 'instrumental' 
            ? 'Добавить профессиональный инструментал к этому вокалу'
            : 'Добавить профессиональный вокал к этому инструменталу',
          customMode: false,
          style: action === 'instrumental' ? 'pop, instrumental' : 'pop, vocals',
          title: recordingTitle,
        },
      });

      if (functionError) throw functionError;

      toast.success(
        action === 'instrumental' 
          ? 'Добавление инструментала началось! 🎸' 
          : 'Добавление вокала началось! 🎤',
        { description: 'Результат появится в библиотеке через 1-3 минуты' }
      );

      onOpenChange(false);
      resetRecording();

    } catch (error) {
      logger.error('Failed to process recording', { error, action });
      toast.error('Ошибка обработки записи');
    } finally {
      setProcessingAction(null);
      setState('recorded');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Записать аудио
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recording visualization */}
          <div className="flex flex-col items-center gap-4">
            <motion.div
              className={cn(
                "relative w-32 h-32 rounded-full flex items-center justify-center",
                state === 'recording' && "bg-destructive/10",
                state === 'recorded' && "bg-primary/10",
                state === 'idle' && "bg-muted"
              )}
              animate={state === 'recording' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              {state === 'recording' && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-destructive/20"
                    animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-destructive/20"
                    animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                  />
                </>
              )}
              
              <Mic className={cn(
                "w-12 h-12",
                state === 'recording' && "text-destructive",
                state === 'recorded' && "text-primary",
                state === 'idle' && "text-muted-foreground"
              )} />
            </motion.div>

            <div className="text-2xl font-mono font-bold">
              {formatTime(duration)}
            </div>

            {state === 'recorded' && audioUrl && (
              <audio 
                ref={audioRef} 
                src={audioUrl} 
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            {state === 'idle' && (
              <Button 
                size="lg" 
                onClick={startRecording}
                className="gap-2"
              >
                <Mic className="w-5 h-5" />
                Начать запись
              </Button>
            )}

            {state === 'recording' && (
              <Button 
                size="lg" 
                variant="destructive"
                onClick={stopRecording}
                className="gap-2"
              >
                <Square className="w-5 h-5" />
                Остановить
              </Button>
            )}

            {state === 'recorded' && (
              <>
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={togglePlayback}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={resetRecording}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>

          {/* Action buttons */}
          <AnimatePresence>
            {state === 'recorded' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground text-center">
                  Выберите, что добавить к вашей записи:
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => uploadAndProcess('instrumental')}
                    disabled={processingAction !== null}
                  >
                    {processingAction === 'instrumental' ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Music className="w-6 h-6 text-primary" />
                    )}
                    <span className="text-sm font-medium">Добавить инструментал</span>
                    <span className="text-xs text-muted-foreground">К вашему вокалу</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => uploadAndProcess('vocals')}
                    disabled={processingAction !== null}
                  >
                    {processingAction === 'vocals' ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <MicVocal className="w-6 h-6 text-primary" />
                    )}
                    <span className="text-sm font-medium">Добавить вокал</span>
                    <span className="text-xs text-muted-foreground">К инструменталу</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {state === 'uploading' && (
            <div className="text-center text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Загрузка и обработка...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
