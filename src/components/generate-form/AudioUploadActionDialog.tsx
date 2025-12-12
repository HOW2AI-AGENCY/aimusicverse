import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileAudio, Mic, X, Play, Pause, Sparkles, Disc, Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface AudioUploadActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionSelected: (file: File, action: 'cover' | 'extend') => void;
}

type Step = 'upload' | 'action';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="audio-upload-action-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5" />
            {step === 'upload' ? 'Загрузить аудио' : 'Выберите действие'}
          </DialogTitle>
          <DialogDescription id="audio-upload-action-dialog-description">
            {step === 'upload' 
              ? 'Загрузите или запишите аудио файл'
              : 'Что вы хотите сделать с этим аудио?'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-16 gap-2 text-base"
              onClick={() => document.getElementById('audio-file-input-action-dialog')?.click()}
            >
              <FileAudio className="w-5 h-5" />
              Загрузить файл
            </Button>
            <input
              id="audio-file-input-action-dialog"
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

        {step === 'action' && audioFile && (
          <div className="space-y-4">
            {/* Audio Preview */}
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

            {/* Action Selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Выберите действие:</p>
              
              <Card
                className={cn(
                  "p-4 cursor-pointer transition-all hover:border-primary/50",
                  selectedAction === 'cover' && "border-primary bg-primary/5"
                )}
                onClick={() => setSelectedAction('cover')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Disc className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold">Создать кавер</div>
                    <p className="text-sm text-muted-foreground">
                      Создайте новую версию с другим стилем, сохраняя мелодию
                    </p>
                    <div className="text-xs text-muted-foreground mt-2">
                      • Изменить музыкальный стиль<br/>
                      • Сохранить структуру и мелодию<br/>
                      • Добавить или убрать вокал
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className={cn(
                  "p-4 cursor-pointer transition-all hover:border-primary/50",
                  selectedAction === 'extend' && "border-primary bg-primary/5"
                )}
                onClick={() => setSelectedAction('extend')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold">Расширить трек</div>
                    <p className="text-sm text-muted-foreground">
                      Продолжите трек, добавив к нему новую часть
                    </p>
                    <div className="text-xs text-muted-foreground mt-2">
                      • Продолжить композицию<br/>
                      • Добавить новые части<br/>
                      • Увеличить длительность
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Назад
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedAction}
                className="flex-1 gap-2"
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
