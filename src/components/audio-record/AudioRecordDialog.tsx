import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Mic, Square, Play, Pause, Trash2, Music, MicVocal, Loader2, Cloud, Disc, ArrowRight } from 'lucide-react';
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
import { useRecordingUpload } from '@/hooks/useRecordingUpload';
import { useUnifiedStudioStore } from '@/stores/useUnifiedStudioStore';
import { InstrumentalSettingsDialog, type InstrumentalSettings } from './InstrumentalSettingsDialog';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { 
  registerStudioAudio, 
  unregisterStudioAudio, 
  pauseAllStudioAudio 
} from '@/hooks/studio/useStudioAudio';

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
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();
  
  const [sourceTab, setSourceTab] = useState<SourceTab>('record');
  const [state, setState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processingAction, setProcessingAction] = useState<ProcessingAction>(null);
  const [selectedCloudAudio, setSelectedCloudAudio] = useState<ReferenceAudio | null>(null);
  const [continueAt, setContinueAt] = useState(0);
  const [autoSavedUrl, setAutoSavedUrl] = useState<string | null>(null);
  
  // Settings dialog state
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [pendingInstrumentalSettings, setPendingInstrumentalSettings] = useState<InstrumentalSettings | null>(null);

  // Auto-upload hook for cloud saving
  const { uploadRecordingQuietly, isUploading: isAutoSaving } = useRecordingUpload({
    bucket: 'reference-audio',
    folder: 'mic-recordings',
    onSuccess: (result) => {
      setAutoSavedUrl(result.url);
      logger.info('Recording auto-saved to cloud', { url: result.url, size: result.size });
    },
    onError: (error) => {
      logger.error('Failed to auto-save recording', error);
    }
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Register and coordinate with other audio sources
  useEffect(() => {
    if (audioRef.current) {
      registerStudioAudio('record-dialog-player', () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
    }
    return () => {
      unregisterStudioAudio('record-dialog-player');
    };
  }, [audioUrl]);

  // Pause when global player starts
  useEffect(() => {
    if (globalIsPlaying && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [globalIsPlaying, isPlaying]);

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
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState('recorded');
        stream.getTracks().forEach(track => track.stop());

        // Auto-save to cloud in background
        logger.info('Recording stopped, auto-saving to cloud', { size: blob.size });
        uploadRecordingQuietly(blob);
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
      // Pause global player and other studio audio
      pauseTrack();
      pauseAllStudioAudio('record-dialog-player');
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioUrl, pauseTrack]);

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
    setAutoSavedUrl(null);
  }, [audioUrl]);

  // Handler for opening instrumental settings
  const handleInstrumentalClick = () => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return;
    }
    setShowSettingsDialog(true);
  };

  // Handler for settings confirmation
  const handleSettingsConfirm = async (settings: InstrumentalSettings) => {
    setPendingInstrumentalSettings(settings);
    setShowSettingsDialog(false);
    await uploadAndProcess('instrumental', settings);
  };

  // Upload audio and process with selected action
  const uploadAndProcess = async (action: ProcessingAction, settings?: InstrumentalSettings) => {
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
        selectedCloudAudio.duration_seconds || duration,
        settings
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
      // Generate descriptive filename
      const dateStr = new Date().toISOString().slice(0, 10);
      const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
      const actionLabel = action === 'vocals' ? 'vocal' : action === 'instrumental' ? 'inst' : action;
      const fileName = `recordings/${user.id}/rec_${actionLabel}_${dateStr}_${timeStr}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('audio').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      const recordingTitle = `Запись ${action === 'vocals' ? 'вокала' : action === 'instrumental' ? 'инструментала' : ''} ${new Date().toLocaleDateString('ru-RU')}`;

      await processAudio(publicUrl, recordingTitle, action, duration, settings);
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
    audioDuration: number,
    settings?: InstrumentalSettings
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

      logger.info('Processing audio with action', { action, functionName, audioUrl, settings });

      // For instrumental action, prepare studio project first
      let studioProjectId: string | null = null;
      let pendingTrackId: string | null = null;

      // Build style string from settings
      let stylePrompt = 'professional instrumental backing track, full band arrangement';
      if (action === 'instrumental' && settings) {
        const styleParts: string[] = [];
        if (settings.genre) styleParts.push(settings.genre);
        if (settings.mood) styleParts.push(settings.mood);
        styleParts.push(`${settings.bpm} bpm`);
        if (settings.customStyle) styleParts.push(settings.customStyle);
        stylePrompt = styleParts.join(', ') + ', professional instrumental backing track';
      }

      if (action === 'instrumental') {
        const store = useUnifiedStudioStore.getState();
        
        // Create project with vocal track
        studioProjectId = await store.createProject({
          name: `Студия: ${title}`,
          sourceAudioUrl: audioUrl,
          duration: audioDuration,
          tracks: [{
            name: 'Вокал',
            type: 'vocal',
            audioUrl: audioUrl,
            volume: 0.85,
            pan: 0,
            muted: false,
            solo: false,
            color: 'hsl(340 82% 52%)',
          }],
        });

        if (studioProjectId) {
          // Add pending instrumental track with settings info
          const settingsLabel = settings?.genre || settings?.mood 
            ? ` (${[settings.genre, settings.mood].filter(Boolean).join(', ')})`
            : '';
          pendingTrackId = store.addPendingTrack({
            name: `Инструментал${settingsLabel} (генерация...)`,
            type: 'instrumental',
          });
        }
      }

      const { data, error: functionError } = await supabase.functions.invoke(functionName, {
        body: {
          audioUrl,
          prompt: action === 'instrumental' 
            ? '' // Not required for add-instrumental
            : 'Добавить профессиональный вокал к этому инструменталу',
          customMode: true,
          style: action === 'instrumental' ? stylePrompt : 'professional vocal performance, clear singing',
          negativeTags: action === 'instrumental'
            ? 'acapella, vocals only, karaoke, low quality'
            : 'instrumental only, low quality, distorted',
          title,
          // Instrumental settings
          genre: settings?.genre,
          mood: settings?.mood,
          bpm: settings?.bpm,
          customStyle: settings?.customStyle,
          // Critical weights for following the input audio
          audioWeight: 0.8,        // High to sync with input
          styleWeight: 0.55,       // Moderate style adherence
          weirdnessConstraint: 0.25, // Low for predictable result
          model: 'V4_5PLUS',
          // Studio project info
          studioProjectId,
          pendingTrackId,
        },
      });

      if (functionError) {
        logger.error('Edge function error', { error: functionError, action });
        throw functionError;
      }

      logger.info('Audio processing started', { action, response: data });

      // For instrumental action, update pending track with taskId and navigate to studio
      if (action === 'instrumental' && studioProjectId && pendingTrackId && data?.taskId) {
        const store = useUnifiedStudioStore.getState();
        
        logger.info('Updating pending track with taskId', { 
          studioProjectId, 
          pendingTrackId, 
          taskId: data.taskId 
        });
        
        // Update pending track with the taskId from the edge function (auto-saves to DB)
        await store.updatePendingTrackTaskId(pendingTrackId, data.taskId);

        toast.success('Добавление инструментала началось! 🎸', {
          description: 'Открываю студию для сведения...'
        });
        onOpenChange(false);
        resetRecording();
        navigate(`/studio-v2/project/${studioProjectId}`);
        return;
      }

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
        className="max-w-md h-[85vh] sm:h-[90vh] flex flex-col overflow-hidden"
        style={{
          paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 1rem), calc(env(safe-area-inset-top, 0px) + 1rem))'
        }}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Mic className="w-5 h-5 text-primary" />
            Запись вокала
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Запишите голос или выберите аудио из облака. AI добавит профессиональный инструментал или вокал к вашей записи.
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-1">

        {/* Source Tabs */}
        <Tabs value={sourceTab} onValueChange={(v) => setSourceTab(v as SourceTab)}>
          <TabsList className="w-full grid grid-cols-2 h-11 sm:h-10">
            <TabsTrigger value="record" className="gap-2 min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm">
              <Mic className="w-4 h-4" />
              Записать
            </TabsTrigger>
            <TabsTrigger value="cloud" className="gap-2 min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm">
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
                    "relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center",
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
                    "w-10 h-10 sm:w-12 sm:h-12",
                    state === 'recording' && "text-destructive",
                    state === 'recorded' && "text-primary",
                    state === 'idle' && "text-muted-foreground"
                  )} />
                </motion.div>

                <div className="text-xl sm:text-2xl font-mono font-bold">
                  {formatTime(duration)}
                </div>

                {/* Auto-save indicator */}
                {state === 'recorded' && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {isAutoSaving ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Сохранение в облако...</span>
                      </>
                    ) : autoSavedUrl ? (
                      <>
                        <Cloud className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600">Сохранено в облако</span>
                      </>
                    ) : null}
                  </div>
                )}

                {state === 'recorded' && audioUrl && (
                  <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                )}
              </div>

              {/* Controls - touch-friendly 48px+ targets */}
              <div className="flex justify-center gap-3">
                {state === 'idle' && (
                  <Button 
                    size="lg" 
                    onClick={startRecording}
                    className="gap-2 h-12 sm:h-11 px-6 text-sm sm:text-base"
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
                    className="gap-2 h-12 sm:h-11 px-6 text-sm sm:text-base"
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
                      className="w-12 h-12 sm:w-11 sm:h-11"
                      aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={resetRecording}
                      className="w-12 h-12 sm:w-11 sm:h-11"
                      aria-label="Удалить запись"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>

              {/* First-time hint */}
              {state === 'idle' && (
                <p className="text-center text-xs text-muted-foreground/80 px-4">
                  💡 Запишите вокал или мелодию, а AI создаст профессиональный аккомпанемент
                </p>
              )}
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

        {/* Action buttons - improved with descriptions */}
        <AnimatePresence>
          {canProcess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-3 pt-4 pb-2"
            >
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Выберите действие для {sourceTab === 'cloud' ? 'выбранного файла' : 'вашей записи'}:
              </p>
              
              {/* Main actions grid - touch-friendly cards */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl",
                    "border border-primary/30 bg-primary/5",
                    "hover:border-primary hover:bg-primary/10",
                    "transition-all duration-200 min-h-[80px] sm:min-h-[88px]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  onClick={handleInstrumentalClick}
                  disabled={processingAction !== null}
                >
                  {processingAction === 'instrumental' ? (
                    <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-primary" />
                  ) : (
                    <Music className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">+ Инструментал</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                    AI создаст аккомпанемент к вокалу
                  </span>
                </button>
                
                <button
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl",
                    "border border-border/50 bg-card",
                    "hover:border-primary/30 hover:bg-primary/5",
                    "transition-all duration-200 min-h-[80px] sm:min-h-[88px]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  onClick={() => uploadAndProcess('vocals')}
                  disabled={processingAction !== null}
                >
                  {processingAction === 'vocals' ? (
                    <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-primary" />
                  ) : (
                    <MicVocal className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">+ Вокал</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                    AI добавит вокал к инструменталу
                  </span>
                </button>

                <button
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl",
                    "border border-amber-500/30 bg-amber-500/5",
                    "hover:border-amber-500 hover:bg-amber-500/10",
                    "transition-all duration-200 min-h-[80px] sm:min-h-[88px]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  onClick={() => uploadAndProcess('cover')}
                  disabled={processingAction !== null}
                >
                  {processingAction === 'cover' ? (
                    <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-amber-500" />
                  ) : (
                    <Disc className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">Кавер</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                    Новая версия в другом стиле
                  </span>
                </button>

                <button
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl",
                    "border border-emerald-500/30 bg-emerald-500/5",
                    "hover:border-emerald-500 hover:bg-emerald-500/10",
                    "transition-all duration-200 min-h-[80px] sm:min-h-[88px]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  onClick={() => uploadAndProcess('extend')}
                  disabled={processingAction !== null}
                >
                  {processingAction === 'extend' ? (
                    <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-emerald-500" />
                  ) : (
                    <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">Расширение</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                    AI продолжит ваш трек
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {state === 'uploading' && (
          <div className="text-center text-xs sm:text-sm text-muted-foreground shrink-0 px-2 pb-3 pt-2">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Загрузка и обработка...
          </div>
        )}
      </DialogContent>

      {/* Instrumental Settings Dialog */}
      <InstrumentalSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        onConfirm={handleSettingsConfirm}
        isProcessing={processingAction === 'instrumental'}
      />
    </Dialog>
  );
};
