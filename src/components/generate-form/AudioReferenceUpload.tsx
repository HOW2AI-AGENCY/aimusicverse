import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, Mic, X, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

interface AudioReferenceUploadProps {
  audioFile: File | null;
  onAudioChange: (file: File | null) => void;
}

export function AudioReferenceUpload({ audioFile, onAudioChange }: AudioReferenceUploadProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        setAudioUrl(url);
        onAudioChange(file);
        toast.success('Запись завершена');
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Запись началась');
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Не удалось начать запись');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Файл слишком большой (максимум 20 МБ)');
        return;
      }
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      onAudioChange(file);
      toast.success('Аудио загружено');
    }
  };

  const handleRemove = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    onAudioChange(null);
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

  return (
    <Card className="p-4 space-y-3">
      <Label className="text-base flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Референс аудио (опционально)
      </Label>

      {!audioFile ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => document.getElementById('audio-file-input')?.click()}
          >
            <Upload className="w-4 h-4" />
            Загрузить файл
          </Button>
          <input
            id="audio-file-input"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={isRecording ? stopRecording : startRecording}
          >
            <Mic className={`w-4 h-4 ${isRecording ? 'text-destructive animate-pulse' : ''}`} />
            {isRecording ? 'Остановить запись' : 'Записать аудио'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={togglePlayback}
              className="h-8 w-8"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
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
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
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
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Загрузите или запишите аудио для использования в качестве референса (до 20 МБ)
      </p>
    </Card>
  );
}
