import { useState, useRef, useCallback, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileAudio, Mic, X, Play, Pause, Sparkles, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from '@/hooks/studio/useStudioAudio';
import { cn } from '@/lib/utils';

const refLogger = logger.child({ module: 'AudioReferenceUpload' });

interface ReferenceAnalysisResult {
  bpm?: number;
  key?: string;
  genre?: string;
  mood?: string;
  energy?: string;
  instruments?: string[];
  style_description?: string;
  vocal_style?: string;
  suggested_tags?: string[];
}

interface AudioReferenceUploadProps {
  audioFile: File | null;
  onAudioChange: (file: File | null) => void;
  onAnalysisComplete?: (styleDescription: string, analysis?: ReferenceAnalysisResult) => void;
  onMelodyAnalysis?: (data: {
    tags: string[];
    key: string;
    bpm: number;
    chords: string[];
  }) => void;
}

export function AudioReferenceUpload({ 
  audioFile, 
  onAudioChange, 
  onAnalysisComplete,
  onMelodyAnalysis 
}: AudioReferenceUploadProps) {
  const sourceId = useId();
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Register for studio audio coordination
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      registerStudioAudio(sourceId, () => {
        audio.pause();
        setIsPlaying(false);
      });
    }
    return () => unregisterStudioAudio(sourceId);
  }, [sourceId]);

  // Pause if global player starts
  useEffect(() => {
    if (globalIsPlaying && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [globalIsPlaying, isPlaying]);

  // Simulate analyze progress
  useEffect(() => {
    if (isAnalyzing) {
      setAnalyzeProgress(0);
      const interval = setInterval(() => {
        setAnalyzeProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setAnalyzeProgress(0);
    }
  }, [isAnalyzing]);

  // Check for cached analysis by file URL
  const checkCachedAnalysis = useCallback(async (fileUrl: string): Promise<ReferenceAnalysisResult | null> => {
    try {
      const { data, error } = await supabase
        .from('reference_audio')
        .select('style_description, genre, mood, bpm, tempo, energy, instruments, vocal_style')
        .eq('file_url', fileUrl)
        .eq('analysis_status', 'completed')
        .maybeSingle();
      
      if (error || !data) return null;
      
      refLogger.info('Found cached analysis', { fileUrl });
      return {
        style_description: data.style_description || undefined,
        genre: data.genre || undefined,
        mood: data.mood || undefined,
        bpm: data.bpm || undefined,
        energy: data.energy || undefined,
        instruments: data.instruments || undefined,
        vocal_style: data.vocal_style || undefined,
      };
    } catch (err) {
      refLogger.warn('Error checking cached analysis', { error: err });
      return null;
    }
  }, []);

  // Save analysis to reference_audio table
  const saveAnalysisToDb = useCallback(async (
    fileUrl: string, 
    fileName: string,
    fileSize: number,
    analysis: ReferenceAnalysisResult
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('reference_audio')
        .upsert({
          user_id: user.id,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          source: 'upload',
          analysis_status: 'completed',
          analyzed_at: new Date().toISOString(),
          style_description: analysis.style_description,
          genre: analysis.genre,
          mood: analysis.mood,
          bpm: analysis.bpm,
          energy: analysis.energy,
          instruments: analysis.instruments,
          vocal_style: analysis.vocal_style,
        }, { 
          onConflict: 'file_url',
          ignoreDuplicates: false 
        });

      if (error) {
        refLogger.warn('Failed to save analysis to DB', { error });
      } else {
        refLogger.info('Analysis saved to reference_audio', { fileUrl });
      }
    } catch (err) {
      refLogger.error('Error saving analysis', { error: err });
    }
  }, []);

  const analyzeAudio = async (file: File, fileUrl?: string) => {
    setIsAnalyzing(true);
    try {
      refLogger.debug('Starting reference audio analysis', { fileName: file.name });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      let publicUrl = fileUrl;
      let fileName = file.name;
      
      // Upload audio to storage if not already uploaded
      if (!publicUrl) {
        setUploadProgress(10);
        fileName = `reference-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('project-assets')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        setUploadProgress(100);

        const { data: urlData } = supabase.storage
          .from('project-assets')
          .getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }

      // Check for cached analysis first
      const cachedAnalysis = await checkCachedAnalysis(publicUrl);
      if (cachedAnalysis?.style_description) {
        refLogger.info('Using cached analysis', { fileUrl: publicUrl });
        toast.success('Анализ загружен из кэша!');
        onAnalysisComplete?.(cachedAnalysis.style_description, cachedAnalysis);
        return;
      }

      refLogger.debug('Analyzing reference audio via API');
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

      // Extract analysis result
      const analysisResult: ReferenceAnalysisResult = {
        style_description: analysisData.parsed?.style_description,
        genre: analysisData.parsed?.genre,
        mood: analysisData.parsed?.mood,
        bpm: analysisData.parsed?.bpm,
        energy: analysisData.parsed?.energy,
        instruments: analysisData.parsed?.instruments,
        vocal_style: analysisData.parsed?.vocal_style,
        suggested_tags: analysisData.parsed?.suggested_tags,
      };

      // Save analysis to database for future use
      if (analysisResult.style_description) {
        await saveAnalysisToDb(publicUrl, fileName, file.size, analysisResult);
        refLogger.info('Audio analysis completed and saved', { 
          style: analysisResult.style_description,
          bpm: analysisResult.bpm,
          genre: analysisResult.genre 
        });
        toast.success('Анализ завершен!');
        onAnalysisComplete?.(analysisResult.style_description, analysisResult);
      }

      // Clean up temporary track
      await supabase.from('tracks').delete().eq('id', tempTrack.id);

    } catch (error) {
      refLogger.error('Audio analysis error', error);
      toast.error('Ошибка анализа аудио');
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
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
      pauseTrack();
      pauseAllStudioAudio(sourceId);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMelodyComplete = (data: {
    audioFile: File;
    audioUrl: string;
    analysis: {
      notes: any[];
      chords: { chord: string }[];
      bpm: number;
      key: string;
      generatedTags: string[];
    };
    generatedTags: string[];
  }) => {
    setAudioUrl(data.audioUrl);
    onAudioChange(data.audioFile);
    
    onMelodyAnalysis?.({
      tags: data.generatedTags,
      key: data.analysis.key,
      bpm: data.analysis.bpm,
      chords: [...new Set(data.analysis.chords.map(c => c.chord))],
    });
    
    const styleDescription = data.generatedTags.join(', ');
    onAnalysisComplete?.(styleDescription);
    
    toast.success('Мелодия добавлена как референс');
  };

  return (
    <Card className="p-4 space-y-3 relative">
      {/* Analyzing overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg p-4">
          <Sparkles className="w-8 h-8 animate-pulse text-primary mb-3" />
          <p className="text-sm font-medium mb-2">Анализируем аудио...</p>
          <Progress value={analyzeProgress} className="w-full max-w-[200px] h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Определяем стиль, темп и настроение
          </p>
        </div>
      )}
      
      <Label className="text-base flex items-center gap-2">
        <FileAudio className="w-4 h-4 text-primary" />
        Референс аудио
        <span className="text-xs text-muted-foreground font-normal">(опционально)</span>
      </Label>

      {!audioFile ? (
        <div className="space-y-2">
          {/* Upload button - touch-friendly */}
          <button
            type="button"
            onClick={() => document.getElementById('audio-file-input')?.click()}
            className={cn(
              'w-full min-h-[56px] p-3 rounded-xl border-2 border-dashed',
              'flex items-center gap-3 text-left',
              'bg-muted/30 hover:bg-muted/50 hover:border-primary/30',
              'transition-all active:scale-[0.99]'
            )}
          >
            <div className="w-10 h-10 min-w-[40px] rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Загрузить файл</p>
              <p className="text-xs text-muted-foreground">MP3, WAV, M4A до 20 МБ</p>
            </div>
          </button>
          <input
            id="audio-file-input"
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
              'w-full min-h-[56px] p-3 rounded-xl border',
              'flex items-center gap-3 text-left',
              'transition-all active:scale-[0.99]',
              isRecording 
                ? 'bg-destructive/10 border-destructive/30' 
                : 'bg-card hover:bg-muted/50 hover:border-primary/30'
            )}
          >
            <div className={cn(
              'w-10 h-10 min-w-[40px] rounded-lg flex items-center justify-center',
              isRecording ? 'bg-destructive/20' : 'bg-primary/10'
            )}>
              <Mic className={cn(
                'w-5 h-5',
                isRecording ? 'text-destructive animate-pulse' : 'text-primary'
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {isRecording ? 'Остановить запись' : 'Записать аудио'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRecording ? 'Нажмите для остановки' : 'Используйте микрофон'}
              </p>
            </div>
            {isRecording && (
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Audio preview - larger touch targets */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={togglePlayback}
              className="h-10 w-10 min-h-[40px] min-w-[40px] rounded-full bg-primary/10 hover:bg-primary/20"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
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
              className="h-10 w-10 min-h-[40px] min-w-[40px] text-muted-foreground hover:text-destructive"
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
        💡 AI автоматически анализирует стиль, темп и настроение референса
      </p>
    </Card>
  );
}
