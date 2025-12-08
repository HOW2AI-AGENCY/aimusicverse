import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { FileAudio, Mic, X, Play, Pause, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const refLogger = logger.child({ module: 'AudioReferenceUpload' });

interface AudioReferenceUploadProps {
  audioFile: File | null;
  onAudioChange: (file: File | null) => void;
  onAnalysisComplete?: (styleDescription: string) => void;
}

export function AudioReferenceUpload({ audioFile, onAudioChange, onAnalysisComplete }: AudioReferenceUploadProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const analyzeAudio = async (file: File) => {
    setIsAnalyzing(true);
    try {
      refLogger.debug('Uploading reference audio for analysis');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Upload audio to storage for analysis
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

      refLogger.debug('Analyzing reference audio');
      toast.info('Анализируем референс...', { icon: <Sparkles className="w-4 h-4" /> });

      // Create temporary track for analysis
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

      // Analyze audio
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

      // Clean up temporary track
      await supabase.from('tracks').delete().eq('id', tempTrack.id);

    } catch (error) {
      refLogger.error('Audio analysis error', error);
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
        onAudioChange(file);
        toast.success('Запись завершена');
        
        stream.getTracks().forEach(track => track.stop());
        
        // Auto-analyze recorded audio
        await analyzeAudio(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Запись началась');
    } catch (error) {
      refLogger.error('Recording error', error);
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
      onAudioChange(file);
      toast.success('Аудио загружено');
      
      // Auto-analyze uploaded audio
      await analyzeAudio(file);
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
    <Card className="p-4 space-y-3 relative">
      {isAnalyzing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="text-center space-y-2">
            <Sparkles className="w-8 h-8 animate-pulse text-primary mx-auto" />
            <p className="text-sm font-medium">Анализируем аудио...</p>
          </div>
        </div>
      )}
      
      <Label className="text-base flex items-center gap-2">
        <FileAudio className="w-4 h-4" />
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
            <FileAudio className="w-4 h-4" />
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
