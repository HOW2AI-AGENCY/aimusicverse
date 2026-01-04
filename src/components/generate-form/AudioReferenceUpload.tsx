import { useState, useRef, useCallback, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { FileAudio, Mic, X, Play, Pause, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from '@/hooks/studio/useStudioAudio';

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
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      let publicUrl = fileUrl;
      let fileName = file.name;
      
      // Upload audio to storage if not already uploaded
      if (!publicUrl) {
        fileName = `reference-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('project-assets')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

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
    // Set the audio file
    setAudioUrl(data.audioUrl);
    onAudioChange(data.audioFile);
    
    // Pass melody analysis data to parent
    onMelodyAnalysis?.({
      tags: data.generatedTags,
      key: data.analysis.key,
      bpm: data.analysis.bpm,
      chords: [...new Set(data.analysis.chords.map(c => c.chord))],
    });
    
    // Also set style description from tags
    const styleDescription = data.generatedTags.join(', ');
    onAnalysisComplete?.(styleDescription);
    
    toast.success('Мелодия добавлена как референс');
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

          {/* RecordMelodyDialog removed - use Guitar quick action from homepage */}
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
        Загрузите файл или запишите аудио для автоматического анализа стиля
      </p>
    </Card>
  );
}
