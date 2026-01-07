import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActionCard } from '@/components/ui/action-card';
import { StepIndicator } from '@/components/ui/step-indicator';
import { FileAudio, Mic, X, Play, Pause, Disc, Plus, ArrowRight, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useHintTracking } from '@/hooks/useHintTracking';

interface AudioUploadActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionSelected: (file: File, action: 'cover' | 'extend') => void;
}

type Step = 'upload' | 'action';

const STEPS = [
  { id: 'upload', label: 'Загрузка' },
  { id: 'action', label: 'Действие' },
];

export function AudioUploadActionDialog({
  open,
  onOpenChange,
  onActionSelected,
}: AudioUploadActionDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<'cover' | 'extend' | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // First time hint
  const { hasSeenHint, markAsSeen } = useHintTracking('cover-vs-extend');

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
        setStep('action');
        toast.success('Запись завершена');
        
        stream.getTracks().forEach(track => track.stop());
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
      setStep('action');
      toast.success('Аудио загружено');
    }
  };

  const handleRemove = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioFile(null);
    setIsPlaying(false);
    setStep('upload');
    setSelectedAction(null);
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
    if (audioFile && selectedAction) {
      markAsSeen();
      onActionSelected(audioFile, selectedAction);
      onOpenChange(false);
      // Reset state
      handleRemove();
    }
  };

  const handleBack = () => {
    setStep('upload');
    setSelectedAction(null);
  };

  const currentStepIndex = step === 'upload' ? 0 : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        aria-describedby="audio-upload-action-dialog-description"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileAudio className="w-5 h-5 text-primary" />
              {step === 'upload' ? 'Загрузить аудио' : 'Выберите действие'}
            </DialogTitle>
            <StepIndicator steps={STEPS} currentStep={currentStepIndex} variant="dots" size="sm" />
          </div>
          <DialogDescription id="audio-upload-action-dialog-description">
            {step === 'upload' 
              ? 'Загрузите или запишите аудио для обработки'
              : 'Что вы хотите сделать с этим аудио?'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-3 py-2">
            {/* Upload file - touch-friendly */}
            <button
              type="button"
              onClick={() => document.getElementById('audio-file-input-action-dialog')?.click()}
              className={cn(
                'w-full min-h-[72px] p-4 rounded-xl border-2 border-dashed',
                'flex items-center gap-4 text-left',
                'bg-muted/30 hover:bg-muted/50 hover:border-primary/30',
                'transition-all active:scale-[0.99]'
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">Загрузить файл</p>
                <p className="text-xs sm:text-sm text-muted-foreground">MP3, WAV, M4A до 20 МБ</p>
              </div>
            </button>
            <input
              id="audio-file-input-action-dialog"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Record button - touch-friendly */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                'w-full min-h-[72px] p-4 rounded-xl border',
                'flex items-center gap-4 text-left',
                'transition-all active:scale-[0.99]',
                isRecording 
                  ? 'bg-destructive/10 border-destructive/30' 
                  : 'bg-card hover:bg-muted/50 hover:border-primary/30'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                isRecording ? 'bg-destructive/20' : 'bg-primary/10'
              )}>
                <Mic className={cn(
                  'w-6 h-6',
                  isRecording ? 'text-destructive animate-pulse' : 'text-primary'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">
                  {isRecording ? 'Остановить запись' : 'Записать аудио'}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isRecording ? 'Нажмите для остановки' : 'Используйте микрофон устройства'}
                </p>
              </div>
              {isRecording && (
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Аудио будет проанализировано для создания кавера или расширения
            </p>
          </div>
        )}

        {step === 'action' && audioFile && (
          <div className="space-y-4 py-2">
            {/* Audio Preview - larger touch targets */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={togglePlayback}
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-primary/10 hover:bg-primary/20"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{audioFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(audioFile.size / 1024 / 1024).toFixed(1)} МБ
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleRemove}
                className="h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive"
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

            {/* First-time hint */}
            {!hasSeenHint && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                💡 <strong>Кавер</strong> создаёт новую версию в другом стиле. <strong>Расширение</strong> продолжает трек.
              </div>
            )}

            {/* Action Selection - touch-friendly cards */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Выберите действие:</p>
              
              <ActionCard
                icon={<Disc className="w-5 h-5 text-primary" />}
                title="Создать кавер"
                description="Новая версия с другим стилем, сохраняя мелодию"
                hint="Изменить жанр, добавить/убрать вокал"
                isActive={selectedAction === 'cover'}
                onClick={() => setSelectedAction('cover')}
              />

              <ActionCard
                icon={<Plus className="w-5 h-5 text-emerald-500" />}
                title="Расширить трек"
                description="Продолжите трек, добавив к нему новую часть"
                hint="Увеличить длительность, добавить секции"
                isActive={selectedAction === 'extend'}
                onClick={() => setSelectedAction('extend')}
              />
            </div>

            {/* Action Buttons - larger touch targets */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 min-h-[48px]"
              >
                Назад
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedAction}
                className="flex-1 h-12 min-h-[48px] gap-2"
              >
                Продолжить
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
