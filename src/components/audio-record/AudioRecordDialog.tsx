import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Mic, Square, Play, Pause, Trash2, Music, MicVocal, Loader2, Cloud, Disc, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { CloudAudioPicker } from './CloudAudioPicker';
import { ReferenceManager } from '@/services/audio-reference/ReferenceManager';
import type { ReferenceAudio } from '@/hooks/useReferenceAudio';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';

interface AudioRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'uploading';
type SourceTab = 'record' | 'cloud';
type ProcessingAction = 'instrumental' | 'vocals' | 'cover' | 'extend' | null;

export const AudioRecordDialog = ({ open, onOpenChange }: AudioRecordDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sourceTab, setSourceTab] = useState<SourceTab>('record');
  const [state, setState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processingAction, setProcessingAction] = useState<ProcessingAction>(null);
  const [selectedCloudAudio, setSelectedCloudAudio] = useState<ReferenceAudio | null>(null);
  const [continueAt, setContinueAt] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Telegram back button integration
  const { shouldShowUIButton } = useTelegramBackButton({
    visible: open,
    onClick: () => onOpenChange(false),
  });

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
    setSelectedCloudAudio(null);
    setContinueAt(0);
  }, [audioUrl]);

  // Upload audio and process with selected action
  const uploadAndProcess = async (action: ProcessingAction) => {
    if (!user || !action) {
      toast.error('Необходимо авторизоваться');
      return;
    }

    // If cloud audio selected, use its URL directly
    if (sourceTab === 'cloud' && selectedCloudAudio) {
      await processAudio(
        selectedCloudAudio.file_url, 
        selectedCloudAudio.file_name, 
        action,
        selectedCloudAudio.duration_seconds || duration
      );
      return;
    }

    // Otherwise upload recording
    if (!audioBlob) {
      toast.error('Нет записи для обработки');
      return;
    }

    setProcessingAction(action);
    setState('uploading');

    try {
      const fileName = `recordings/${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('audio').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      const recordingTitle = `Запись ${new Date().toLocaleString('ru-RU')}`;

      await processAudio(publicUrl, recordingTitle, action, duration);
    } catch (error) {
      logger.error('Failed to upload recording', { error });
      toast.error('Ошибка загрузки записи');
      setProcessingAction(null);
      setState('recorded');
    }
  };

  // Process audio with the selected action
  const processAudio = async (
    audioUrl: string, 
    title: string, 
    action: ProcessingAction,
    audioDuration: number
  ) => {
    if (!action) return;
    
    setProcessingAction(action);
    setState('uploading');

    try {
      // For cover/extend, use ReferenceManager and navigate to generate form
      if (action === 'cover' || action === 'extend') {
        // Create reference from the uploaded audio URL
        ReferenceManager.createFromCloud({
          id: crypto.randomUUID(),
          fileUrl: audioUrl,
          fileName: title,
          durationSeconds: audioDuration,
        }, action);

        toast.success(
          action === 'cover' 
            ? 'Аудио добавлено для создания кавера!' 
            : 'Аудио добавлено для расширения!',
          { description: 'Открываем форму генерации...' }
        );

        onOpenChange(false);
        resetRecording();
        
        // Navigate to generate page
        navigate('/generate');
        return;
      }

      // For instrumental/vocals, call the appropriate edge function
      const functionName = action === 'instrumental' 
        ? 'suno-add-instrumental' 
        : 'suno-add-vocals';

      logger.info('Processing audio with action', { action, functionName, audioUrl });

      const { data, error: functionError } = await supabase.functions.invoke(functionName, {
        body: {
          audioUrl,
          prompt: action === 'instrumental' 
            ? 'Добавить профессиональный инструментал к этому вокалу'
            : 'Добавить профессиональный вокал к этому инструменталу',
          customMode: true,
          style: action === 'instrumental' 
            ? 'professional instrumental backing track, full band arrangement' 
            : 'professional vocal performance, clear singing',
          negativeTags: 'low quality, distorted, noise',
          title,
        },
      });

      if (functionError) {
        logger.error('Edge function error', { error: functionError, action });
        throw functionError;
      }

      logger.info('Audio processing started', { action, response: data });

      toast.success(
        action === 'instrumental' 
          ? 'Добавление инструментала началось! 🎸' 
          : 'Добавление вокала началось! 🎤',
        { description: 'Результат появится в библиотеке через 1-3 минуты' }
      );

      onOpenChange(false);
      resetRecording();

    } catch (error) {
      logger.error('Failed to process audio', { error, action });
      toast.error('Ошибка обработки', {
        description: error instanceof Error ? error.message : 'Попробуйте еще раз'
      });
    } finally {
      setProcessingAction(null);
      setState(sourceTab === 'cloud' ? 'idle' : 'recorded');
    }
  };

  const handleCloudSelect = (audio: ReferenceAudio) => {
    setSelectedCloudAudio(audio);
    // Set default continueAt for extend mode
    if (audio.duration_seconds) {
      setContinueAt(Math.floor(audio.duration_seconds * 0.8));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canProcess = sourceTab === 'cloud' ? !!selectedCloudAudio : state === 'recorded';
  const currentDuration = sourceTab === 'cloud' 
    ? (selectedCloudAudio?.duration_seconds || 0) 
    : duration;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md h-[90vh] flex flex-col overflow-hidden"
        style={{
          paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 1rem), calc(env(safe-area-inset-top, 0px) + 1rem))'
        }}
      >
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Записать или выбрать аудио
            </DialogTitle>
            {shouldShowUIButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">


        {/* Source Tabs */}
        <Tabs value={sourceTab} onValueChange={(v) => setSourceTab(v as SourceTab)}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="record" className="gap-2">
              <Mic className="w-4 h-4" />
              Записать
            </TabsTrigger>
            <TabsTrigger value="cloud" className="gap-2">
              <Cloud className="w-4 h-4" />
              Из облака
            </TabsTrigger>
          </TabsList>

          {/* Record Tab */}
          <TabsContent value="record" className="mt-4">
            <div className="space-y-6">
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
            </div>
          </TabsContent>

          {/* Cloud Tab */}
          <TabsContent value="cloud" className="mt-4">
            <CloudAudioPicker 
              onSelect={handleCloudSelect}
              selectedId={selectedCloudAudio?.id}
            />
          </TabsContent>
        </Tabs>

        {/* Action buttons */}
        <AnimatePresence>
          {canProcess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-4 pt-2"
            >
              <p className="text-sm text-muted-foreground text-center">
                Выберите действие для {sourceTab === 'cloud' ? 'выбранного файла' : 'вашей записи'}:
              </p>
              
              {/* Main actions grid */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1.5"
                  onClick={() => uploadAndProcess('instrumental')}
                  disabled={processingAction !== null}
                >
                  {processingAction === 'instrumental' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Music className="w-5 h-5 text-primary" />
                  )}
                  <span className="text-xs font-medium">+ Инструментал</span>
                  <span className="text-[10px] text-muted-foreground">К вашему вокалу</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1.5"
                  onClick={() => uploadAndProcess('vocals')}
                  disabled={processingAction !== null}
                >
                  {processingAction === 'vocals' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MicVocal className="w-5 h-5 text-primary" />
                  )}
                  <span className="text-xs font-medium">+ Вокал</span>
                  <span className="text-[10px] text-muted-foreground">К инструменталу</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1.5"
                  onClick={() => uploadAndProcess('cover')}
                  disabled={processingAction !== null}
                >
                  {processingAction === 'cover' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Disc className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="text-xs font-medium">Кавер</span>
                  <span className="text-[10px] text-muted-foreground">Новая версия</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1.5"
                  onClick={() => uploadAndProcess('extend')}
                  disabled={processingAction !== null}
                >
                  {processingAction === 'extend' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-emerald-500" />
                  )}
                  <span className="text-xs font-medium">Расширение</span>
                  <span className="text-[10px] text-muted-foreground">Продолжить трек</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {state === 'uploading' && (
          <div className="text-center text-sm text-muted-foreground shrink-0 px-2 pb-2">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Загрузка и обработка...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
