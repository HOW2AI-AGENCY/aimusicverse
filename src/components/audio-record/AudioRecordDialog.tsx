import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Mic, Square, Play, Pause, Trash2, Music, MicVocal, Loader2, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { CloudAudioPicker } from './CloudAudioPicker';
import type { ReferenceAudio } from '@/hooks/useReferenceAudio';

interface AudioRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'uploading';
type SourceTab = 'record' | 'cloud';

export const AudioRecordDialog = ({ open, onOpenChange }: AudioRecordDialogProps) => {
  const { user } = useAuth();
  const [sourceTab, setSourceTab] = useState<SourceTab>('record');
  const [state, setState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processingAction, setProcessingAction] = useState<'instrumental' | 'vocals' | null>(null);
  const [selectedCloudAudio, setSelectedCloudAudio] = useState<ReferenceAudio | null>(null);
  
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
    setSelectedCloudAudio(null);
  }, [audioUrl]);

  const uploadAndProcess = async (action: 'instrumental' | 'vocals') => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return;
    }

    // If cloud audio selected, use its URL directly
    if (sourceTab === 'cloud' && selectedCloudAudio) {
      await processAudio(selectedCloudAudio.file_url, selectedCloudAudio.file_name, action);
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

      await processAudio(publicUrl, recordingTitle, action);
    } catch (error) {
      logger.error('Failed to upload recording', { error });
      toast.error('Ошибка загрузки записи');
      setProcessingAction(null);
      setState('recorded');
    }
  };

  const processAudio = async (audioUrl: string, title: string, action: 'instrumental' | 'vocals') => {
    setProcessingAction(action);
    setState('uploading');

    try {
      const functionName = action === 'instrumental' 
        ? 'suno-add-instrumental' 
        : 'suno-add-vocals';

      const { error: functionError } = await supabase.functions.invoke(functionName, {
        body: {
          audioUrl,
          prompt: action === 'instrumental' 
            ? 'Добавить профессиональный инструментал к этому вокалу'
            : 'Добавить профессиональный вокал к этому инструменталу',
          customMode: false,
          style: action === 'instrumental' ? 'pop, instrumental' : 'pop, vocals',
          title,
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
      logger.error('Failed to process audio', { error, action });
      toast.error('Ошибка обработки');
    } finally {
      setProcessingAction(null);
      setState(sourceTab === 'cloud' ? 'idle' : 'recorded');
    }
  };

  const handleCloudSelect = (audio: ReferenceAudio) => {
    setSelectedCloudAudio(audio);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canProcess = sourceTab === 'cloud' ? !!selectedCloudAudio : state === 'recorded';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Записать или выбрать аудио
          </DialogTitle>
        </DialogHeader>

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
              className="space-y-3 pt-2"
            >
              <p className="text-sm text-muted-foreground text-center">
                Выберите, что добавить к {sourceTab === 'cloud' ? 'выбранному файлу' : 'вашей записи'}:
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
      </DialogContent>
    </Dialog>
  );
};
