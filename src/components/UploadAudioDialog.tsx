import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Loader2, Music, Mic, FileAudio, AlertCircle, Disc, Plus, Library, Sparkles, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SUNO_MODELS, getAvailableModels } from '@/constants/sunoModels';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import { AudioWaveformPreview } from '@/components/AudioWaveformPreview';
import { AudioTrimSelector } from '@/components/generate-form/AudioTrimSelector';
import { LyricsChatAssistant } from '@/components/generate-form/LyricsChatAssistant';
import { logger } from '@/lib/logger';

interface PrefillData {
  title?: string | null;
  style?: string | null;
  lyrics?: string | null;
  isInstrumental?: boolean;
}

interface UploadAudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  defaultMode?: 'cover' | 'extend';
  prefillData?: PrefillData;
  initialAudioFile?: File;
}

export const UploadAudioDialog = ({
  open,
  onOpenChange,
  projectId,
  defaultMode = 'cover',
  prefillData,
  initialAudioFile
}: UploadAudioDialogProps) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'cover' | 'extend'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  
  // Provider selection (suno vs stability AI)
  const [provider, setProvider] = useState<'suno' | 'stability'>('suno');
  
  // Library selection
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [userTracks, setUserTracks] = useState<Tables<'tracks'>[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Tables<'tracks'> | null>(null);
  
  // Settings
  const [customMode, setCustomMode] = useState(true);
  const [instrumental, setInstrumental] = useState(prefillData?.isInstrumental ?? false);
  const [prompt, setPrompt] = useState(prefillData?.lyrics || '');
  const [style, setStyle] = useState(prefillData?.style || '');
  const [title, setTitle] = useState(prefillData?.title ? `${prefillData.title} (кавер)` : '');
  const [continueAt, setContinueAt] = useState<number>(0);
  const [model, setModel] = useState('V4_5ALL');
  
  // Stability AI specific settings
  const [stabilityStrength, setStabilityStrength] = useState([0.7]);
  
  // Audio analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  // Audio trimming for V5 model
  const [showTrimSelector, setShowTrimSelector] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  
  // Advanced
  const [negativeTags, setNegativeTags] = useState('');
  const [vocalGender, setVocalGender] = useState<'m' | 'f' | ''>('');
  const [styleWeight, setStyleWeight] = useState([0.65]);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState([0.65]);
  const [audioWeight, setAudioWeight] = useState([0.65]);
  const [lyricsAssistantOpen, setLyricsAssistantOpen] = useState(false);

  const loadUserTracks = useCallback(async () => {
    if (!user) return;
    setLoadingTracks(true);
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['completed', 'streaming_ready'])
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setUserTracks(data || []);
    } catch (error) {
      logger.error('Error loading tracks', { error });
    } finally {
      setLoadingTracks(false);
    }
  }, [user]);

  // Load user tracks when library panel opens
  useEffect(() => {
    if (libraryOpen && user && userTracks.length === 0) {
      loadUserTracks();
    }
  }, [libraryOpen, user, userTracks.length, loadUserTracks]);

  // Handle initial audio file from AudioUploadActionDialog
  useEffect(() => {
    if (open && initialAudioFile && !audioFile) {
      logger.info('Setting initial audio file from dialog', { fileName: initialAudioFile.name });
      handleFileSelect(initialAudioFile);
    }
  }, [open, initialAudioFile]);

  const handleTrackSelect = async (track: Tables<'tracks'>) => {
    setSelectedTrack(track);
    setLibraryOpen(false);
    
    // Pre-fill form with track data
    setTitle(track.title ? `${track.title} (${mode === 'cover' ? 'кавер' : 'расширение'})` : '');
    setStyle(track.style || '');
    setPrompt(track.lyrics || '');
    setInstrumental(track.is_instrumental ?? false);
    
    // Fetch audio file from track URL
    if (track.audio_url || track.local_audio_url) {
      const audioUrl = track.local_audio_url || track.audio_url;
      try {
        toast.loading('Загрузка аудио...', { id: 'audio-load' });
        const response = await fetch(audioUrl!);
        const blob = await response.blob();
        const file = new File([blob], `${track.title || 'track'}.mp3`, { type: 'audio/mpeg' });
        handleFileSelect(file);
        toast.success('Трек загружен', { id: 'audio-load' });
      } catch (error) {
        logger.error('Error fetching track audio', { error });
        toast.error('Не удалось загрузить аудио трека', { id: 'audio-load' });
      }
    }
  };

  const availableModels = getAvailableModels();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Пожалуйста, выберите аудиофайл');
      return;
    }

    setAudioFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    // Create preview URL for waveform
    const previewUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(previewUrl);

    // Get audio duration
    const audio = new Audio();
    audio.src = previewUrl;
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      setAudioDuration(duration);
      
      if (mode === 'extend') {
        setContinueAt(Math.floor(duration * 0.8));
      }
      
      // Auto-select appropriate model based on duration
      // For audio > 60 seconds, use V5, V4_5PLUS, or V4_5ALL (not V4_5ALL with 60s limit)
      if (duration > 60) {
        // Show trim selector for V5 model (allows selecting 1-minute portion)
        setShowTrimSelector(true);
        setTrimEnd(Math.min(60, duration));
        
        // Auto-select V5 for best quality with long audio
        if (model === 'V4_5ALL') {
          setModel('V5');
          toast.info('Автоматически выбрана модель V5 для длинного аудио', {
            description: 'Вы можете выбрать фрагмент длительностью 1 минута'
          });
        }
      } else {
        setShowTrimSelector(false);
      }
    };

    toast.success('Аудио загружено');
    
    // Trigger automatic analysis if not already done
    if (!analysisComplete) {
      analyzeAudioFile(file);
    }
  };

  // Analysis stage tracking
  const [analysisStage, setAnalysisStage] = useState<'idle' | 'uploading' | 'analyzing_style' | 'analyzing_lyrics' | 'done'>('idle');

  // Analyze audio file automatically with timeout
  const analyzeAudioFile = async (file: File) => {
    if (!user) {
      logger.warn('User not authenticated, skipping analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage('uploading');
    
    // Analysis timeout - 60 seconds max
    const timeoutId = setTimeout(() => {
      logger.warn('Analysis timeout reached');
      setIsAnalyzing(false);
      setAnalysisStage('done');
      toast.warning('Анализ занял слишком много времени', {
        description: 'Заполните поля вручную или попробуйте снова',
      });
    }, 60000);

    try {
      logger.info('Starting automatic audio analysis');
      
      // Upload file temporarily for analysis
      const tempFileName = `temp-analysis/${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(tempFileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(tempFileName);

      setAnalysisStage('analyzing_style');

      // Run both style analysis and lyrics transcription in parallel
      const [styleAnalysis, lyricsTranscription] = await Promise.allSettled([
        // Style analysis via audio-flamingo-3
        supabase.functions.invoke('analyze-audio-flamingo', {
          body: {
            audio_url: publicUrl,
            analysis_type: 'upload',
          },
        }),
        // Lyrics transcription
        supabase.functions.invoke('transcribe-lyrics', {
          body: {
            audio_url: publicUrl,
            analyze_style: false,
          },
        }),
      ]);

      setAnalysisStage('analyzing_lyrics');

      // Process style analysis results
      if (styleAnalysis.status === 'fulfilled' && styleAnalysis.value.data?.success) {
        const parsed = styleAnalysis.value.data.parsed;
        if (parsed.style_description && !style) {
          setStyle(parsed.style_description);
          toast.success('Стиль определен', {
            icon: <Sparkles className="w-4 h-4" />,
          });
        }
      } else if (styleAnalysis.status === 'rejected') {
        logger.warn('Style analysis failed', { error: styleAnalysis.reason });
      }

      // Process lyrics transcription results
      if (lyricsTranscription.status === 'fulfilled' && lyricsTranscription.value.data?.success) {
        const data = lyricsTranscription.value.data;
        if (data.has_vocals && data.lyrics && !prompt) {
          setPrompt(data.lyrics);
          setInstrumental(false);
          toast.success('Текст извлечен', {
            icon: <Mic className="w-4 h-4" />,
          });
        } else if (!data.has_vocals) {
          setInstrumental(true);
          toast.info('Инструментальный трек');
        }
      }

      // Clean up temporary file (don't wait)
      supabase.storage
        .from('project-assets')
        .remove([tempFileName])
        .catch(err => logger.warn('Failed to cleanup temp file', { err }));

      setAnalysisComplete(true);
      setAnalysisStage('done');
      logger.info('Audio analysis complete');
      
    } catch (error) {
      logger.error('Audio analysis error', { error });
      toast.error('Ошибка анализа', {
        description: 'Заполните поля вручную',
      });
      setAnalysisStage('done');
    } finally {
      clearTimeout(timeoutId);
      setIsAnalyzing(false);
    }
  };

  // Cleanup preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  const handleSubmit = async () => {
    if (!audioFile) {
      toast.error('Пожалуйста, загрузите аудиофайл');
      return;
    }

    // Stability AI validation
    if (provider === 'stability') {
      if (!style && !prompt) {
        toast.error('Укажите стиль или описание для Stability AI');
        return;
      }

      // Stability AI has 45 second limit
      if (audioDuration && audioDuration > 45) {
        toast.error('Stability AI поддерживает аудио до 45 секунд', {
          description: 'Используйте Suno для более длинных треков',
        });
        return;
      }

      return handleStabilitySubmit();
    }

    // Suno validation
    if (customMode && !style) {
      toast.error('Укажите стиль музыки');
      return;
    }

    if (!customMode && !prompt) {
      toast.error('Укажите описание');
      return;
    }

    if (customMode && !instrumental && !prompt) {
      toast.error('Укажите текст для вокальной композиции');
      return;
    }

    // Comprehensive duration validation for all models
    const maxDuration = getModelDurationLimit(model);
    if (audioDuration && audioDuration > maxDuration) {
      const modelName = SUNO_MODELS[model as keyof typeof SUNO_MODELS]?.name || model;
      const minutes = Math.floor(maxDuration / 60);
      const seconds = maxDuration % 60;
      const timeStr = seconds > 0 
        ? `${minutes} мин ${seconds} сек` 
        : `${minutes} мин`;
      
      // Suggest a compatible model
      const suggestedModel = suggestModelForDuration(audioDuration);
      const suggestedName = SUNO_MODELS[suggestedModel as keyof typeof SUNO_MODELS]?.name;
      
      const currentDurationStr = `${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, '0')}`;
      
      toast.error(`Ваше аудио (${currentDurationStr}) превышает лимит модели ${modelName} (${timeStr})`, {
        description: suggestedModel !== model && suggestedName
          ? `Рекомендуем модель ${suggestedName}`
          : 'Выберите модель с большим лимитом',
      });
      return;
    }

    setLoading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioFile);
      
      await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
      });

      const functionName = mode === 'cover' ? 'suno-upload-cover' : 'suno-upload-extend';
      
      const body: Record<string, unknown> = {
        audioFile: {
          name: audioFile.name,
          type: audioFile.type,
          data: reader.result,
        },
        audioDuration: audioDuration, // Add for server-side validation
        model,
        instrumental,
        negativeTags: negativeTags || undefined,
        vocalGender: vocalGender || undefined,
        styleWeight: styleWeight[0],
        weirdnessConstraint: weirdnessConstraint[0],
        audioWeight: audioWeight[0],
        projectId: projectId || undefined,
      };

      if (mode === 'cover') {
        body.customMode = customMode;
        body.prompt = customMode ? (instrumental ? undefined : prompt) : prompt;
        body.style = customMode ? style : undefined;
        body.title = customMode ? title : undefined;
      } else {
        // Fixed: Use customMode consistently for both cover and extend
        body.customMode = customMode;
        body.prompt = customMode && !instrumental ? prompt : undefined;
        body.style = customMode ? style : undefined;
        body.title = title || undefined;
        // CRITICAL: continueAt is REQUIRED for extend API - always include it
        // Default to 80% of audio duration if not set
        body.continueAt = continueAt || (audioDuration ? Math.floor(audioDuration * 0.8) : 0);
      }

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw error;

      const actionLabel = mode === 'cover' ? 'Создание кавера' : 'Расширение';
      toast.success(`${actionLabel} началось! 🎵`, {
        description: 'Трек появится в библиотеке через 1-3 минуты',
      });

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error) {
      logger.error('Submit error', { error });
      
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('429') || errorMessage.includes('кредитов')) {
        toast.error('Недостаточно кредитов', {
          description: 'Пополните баланс SunoAPI',
        });
      } else {
        toast.error('Ошибка', {
          description: errorMessage || 'Попробуйте еще раз',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Stability AI submit handler
  const handleStabilitySubmit = async () => {
    if (!audioFile) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioFile);
      
      await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
      });

      const body = {
        audioFile: {
          name: audioFile.name,
          type: audioFile.type,
          data: reader.result,
        },
        audioDuration,
        prompt: prompt || undefined,
        style: style || undefined,
        title: title || undefined,
        strength: 1 - stabilityStrength[0], // Invert: high UI value = more original audio preserved
        projectId: projectId || undefined,
      };

      const { data, error } = await supabase.functions.invoke('stability-audio-cover', { body });

      if (error) throw error;

      toast.success('Stability AI кавер начат! 🎵', {
        description: 'Трек появится в библиотеке через 1-2 минуты',
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      logger.error('Stability submit error', { error });
      toast.error('Ошибка Stability AI', {
        description: error instanceof Error ? error.message : 'Попробуйте еще раз',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioFile(null);
    setAudioDuration(null);
    setAudioPreviewUrl(null);
    setPrompt('');
    setStyle('');
    setTitle('');
    setContinueAt(0);
    setNegativeTags('');
    setVocalGender('');
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setAnalysisStage('idle');
  };

  // Model duration limits (in seconds) based on SunoAPI documentation
  // V5 has 240s limit for audio uploads per requirements
  const MODEL_DURATION_LIMITS: Record<string, number> = {
    'V5': 240,
    'V4_5PLUS': 480,
    'V4_5ALL': 60,
    'V4': 240,
    'V3_5': 180,
  };

  const getModelDurationLimit = (modelKey: string): number => {
    return MODEL_DURATION_LIMITS[modelKey] || 480;
  };

  const getMaxDuration = () => {
    return getModelDurationLimit(model);
  };

  // Suggest best model based on audio duration
  const suggestModelForDuration = (durationSeconds: number): string => {
    if (durationSeconds <= 60) return 'V4_5ALL';
    if (durationSeconds <= 240) return 'V4';
    if (durationSeconds <= 480) return 'V5';
    return 'V5'; // Default to best model
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5 text-primary" />
            Загрузить аудио
          </DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'cover' | 'extend')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cover" className="gap-2" disabled={provider === 'stability'}>
              <Disc className="w-4 h-4" />
              Кавер
            </TabsTrigger>
            <TabsTrigger value="extend" className="gap-2" disabled={provider === 'stability'}>
              <Plus className="w-4 h-4" />
              Расширить
            </TabsTrigger>
          </TabsList>

          {/* Provider Selector */}
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant={provider === 'suno' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setProvider('suno')}
              className="flex-1 gap-2"
            >
              <Music className="w-4 h-4" />
              Suno AI
            </Button>
            <Button
              type="button"
              variant={provider === 'stability' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setProvider('stability');
                setMode('cover'); // Stability only supports cover
              }}
              className="flex-1 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Stability AI
            </Button>
          </div>

          {provider === 'stability' && (
            <Alert className="mt-3">
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Stability AI создаёт AI-ремиксы до 45 секунд с высоким качеством
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                {mode === 'cover' ? '🎵' : '➕'}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {mode === 'cover' ? 'Создание кавера' : 'Расширение трека'}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {mode === 'cover' 
                    ? 'Новая версия песни с другим стилем, сохраняя мелодию'
                    : 'Добавьте новую часть к существующему треку'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Status Indicator - Enhanced */}
          {isAnalyzing && (
            <div className="mt-3 p-3 rounded-lg bg-accent/50 border border-accent">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {analysisStage === 'uploading' && 'Загрузка файла...'}
                    {analysisStage === 'analyzing_style' && 'Определение стиля...'}
                    {analysisStage === 'analyzing_lyrics' && 'Распознавание текста...'}
                    {analysisStage === 'idle' && 'Подготовка анализа...'}
                  </p>
                  <div className="flex gap-2 mt-1.5">
                    {['uploading', 'analyzing_style', 'analyzing_lyrics'].map((stage, i) => (
                      <div 
                        key={stage}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          ['uploading', 'analyzing_style', 'analyzing_lyrics'].indexOf(analysisStage) >= i
                            ? 'bg-primary'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAnalyzing(false);
                    setAnalysisStage('done');
                    toast.info('Анализ пропущен');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {analysisComplete && !isAnalyzing && (
            <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Sparkles className="w-4 h-4" />
                <p className="text-sm font-medium">Анализ завершён</p>
              </div>
            </div>
          )}

          <div className="space-y-4 mt-4">
            {/* File Upload */}
            <div>
              <Label>Аудиофайл</Label>
              <div className="mt-2 space-y-2">
                {audioFile ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg glass border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedTrack?.cover_url || selectedTrack?.local_cover_url ? (
                          <img 
                            src={selectedTrack.local_cover_url || selectedTrack.cover_url || ''} 
                            alt="" 
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <Music className="w-5 h-5 text-primary" />
                        )}
                        <div>
                          <p className="font-medium line-clamp-1 text-sm">{selectedTrack?.title || audioFile.name}</p>
                          {audioDuration && (
                            <p className="text-xs text-muted-foreground">
                              {Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (audioPreviewUrl) {
                            URL.revokeObjectURL(audioPreviewUrl);
                          }
                          setAudioFile(null);
                          setAudioDuration(null);
                          setAudioPreviewUrl(null);
                          setSelectedTrack(null);
                          setIsAnalyzing(false);
                          setAnalysisComplete(false);
                          setAnalysisStage('idle');
                        }}
                      >
                        Удалить
                      </Button>
                    </div>
                    
                    {/* Show AudioTrimSelector for audio > 60s (V5 model focus) */}
                    {showTrimSelector && audioPreviewUrl && audioDuration && audioDuration > 60 && (
                      <AudioTrimSelector
                        audioUrl={audioPreviewUrl}
                        maxDuration={60}
                        onRegionSelected={(start, end) => {
                          setTrimStart(start);
                          setTrimEnd(end);
                        }}
                      />
                    )}
                    
                    {/* Waveform Preview (for audio <= 60s or when trim selector not shown) */}
                    {!showTrimSelector && audioPreviewUrl && (
                      <AudioWaveformPreview audioUrl={audioPreviewUrl} />
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => document.getElementById('audio-upload-unified')?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      Загрузить файл
                    </Button>
                    {user && (
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => setLibraryOpen(!libraryOpen)}
                      >
                        <Library className="w-4 h-4" />
                        Из библиотеки
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Library Track Selection */}
                <Collapsible open={libraryOpen} onOpenChange={setLibraryOpen}>
                  <CollapsibleContent>
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      <ScrollArea className="h-[200px]">
                        {loadingTracks ? (
                          <div className="flex items-center justify-center h-full p-4">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : userTracks.length === 0 ? (
                          <div className="flex items-center justify-center h-full p-4 text-muted-foreground text-sm">
                            Нет треков в библиотеке
                          </div>
                        ) : (
                          <div className="divide-y divide-border/50">
                            {userTracks.map((track) => (
                              <button
                                key={track.id}
                                onClick={() => handleTrackSelect(track)}
                                className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                              >
                                <img
                                  src={track.local_cover_url || track.cover_url || '/placeholder.svg'}
                                  alt=""
                                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-1">{track.title || 'Без названия'}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{track.style || track.prompt}</p>
                                </div>
                                {track.duration_seconds && (
                                  <span className="text-xs text-muted-foreground">
                                    {Math.floor(track.duration_seconds / 60)}:{String(Math.floor(track.duration_seconds % 60)).padStart(2, '0')}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                <input
                  id="audio-upload-unified"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Макс. {Math.floor(getMaxDuration() / 60)} мин для выбранной модели
              </p>
            </div>

            {/* Model */}
            <div>
              <Label>Модель</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m.key} value={m.key}>
                      {m.label}
                      {m.status === 'latest' && ' ✨'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {model === 'V4_5ALL' && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Для V4.5 All аудио не должно превышать 1 минуту
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg glass border border-border/50">
              <div>
                <Label htmlFor="custom-mode">Продвинутый режим</Label>
                <p className="text-xs text-muted-foreground">
                  Настройка стиля, лирики и параметров
                </p>
              </div>
              <Switch
                id="custom-mode"
                checked={customMode}
                onCheckedChange={setCustomMode}
              />
            </div>

            {customMode && (
              <>
                {/* Style */}
                <div>
                  <Label htmlFor="style">Стиль музыки *</Label>
                  <Textarea
                    id="style"
                    placeholder="Опишите стиль: жанр, настроение, инструменты..."
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    rows={3}
                    className="mt-2"
                    maxLength={1000}
                  />
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">Название</Label>
                  <Input
                    id="title"
                    placeholder={mode === 'cover' ? 'Cover Track' : 'Extended Track'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2"
                    maxLength={100}
                  />
                </div>

                {/* Continue At - only for extend mode */}
                {mode === 'extend' && audioDuration && (
                  <div>
                    <Label>Начать расширение с (секунд)</Label>
                    <div className="mt-2 space-y-2">
                      <Slider
                        value={[continueAt]}
                        onValueChange={(v) => setContinueAt(v[0])}
                        min={0}
                        max={Math.floor(audioDuration)}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        {continueAt}s из {Math.floor(audioDuration)}s
                      </p>
                    </div>
                  </div>
                )}

                {/* Instrumental Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg glass border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Mic className="w-4 h-4 text-primary" />
                    </div>
                    <Label htmlFor="instrumental-toggle">С вокалом</Label>
                  </div>
                  <Switch
                    id="instrumental-toggle"
                    checked={!instrumental}
                    onCheckedChange={(checked) => setInstrumental(!checked)}
                  />
                </div>

                {!instrumental && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prompt">Лирика</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setLyricsAssistantOpen(true)}
                        className="h-7 gap-1.5 text-xs text-primary hover:text-primary"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI помощник
                      </Button>
                    </div>
                    <Textarea
                      id="prompt"
                      placeholder="[VERSE]&#10;Текст песни..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={6}
                      className="mt-2 font-mono text-sm"
                      maxLength={5000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {prompt.length}/5000 символов
                    </p>
                  </div>
                )}

                {/* Stability AI Settings */}
                {provider === 'stability' && (
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base">Настройки Stability AI</Label>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Сила трансформации</Label>
                        <span className="text-sm text-muted-foreground">{stabilityStrength[0].toFixed(2)}</span>
                      </div>
                      <Slider
                        value={stabilityStrength}
                        onValueChange={setStabilityStrength}
                        min={0.1}
                        max={0.9}
                        step={0.05}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Низкое значение = больше оригинала, высокое = больше AI изменений
                      </p>
                    </div>
                  </div>
                )}

                {/* Advanced Settings - Suno only */}
                {provider === 'suno' && (
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base">Расширенные настройки</Label>

                  <div>
                    <Label>Исключить стили</Label>
                    <Input
                      placeholder="Rock, Metal..."
                      value={negativeTags}
                      onChange={(e) => setNegativeTags(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  {!instrumental && (
                    <div>
                      <Label>Пол вокала</Label>
                      <Select 
                        value={vocalGender || "auto"} 
                        onValueChange={(v) => setVocalGender(v === "auto" ? '' : v as 'm' | 'f')}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Автоматически</SelectItem>
                          <SelectItem value="m">Мужской</SelectItem>
                          <SelectItem value="f">Женский</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Вес стиля</Label>
                      <span className="text-sm text-muted-foreground">{styleWeight[0].toFixed(2)}</span>
                    </div>
                    <Slider
                      value={styleWeight}
                      onValueChange={setStyleWeight}
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Креативность</Label>
                      <span className="text-sm text-muted-foreground">{weirdnessConstraint[0].toFixed(2)}</span>
                    </div>
                    <Slider
                      value={weirdnessConstraint}
                      onValueChange={setWeirdnessConstraint}
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Вес входного аудио</Label>
                      <span className="text-sm text-muted-foreground">{audioWeight[0].toFixed(2)}</span>
                    </div>
                    <Slider
                      value={audioWeight}
                      onValueChange={setAudioWeight}
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>
                </div>
                )}
              </>
            )}

            {/* Non-custom mode prompt */}
            {!customMode && (
              <div>
                <Label htmlFor="simple-prompt">Описание</Label>
                <Textarea
                  id="simple-prompt"
                  placeholder="Опишите желаемый результат..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="mt-2"
                  maxLength={500}
                />
              </div>
            )}

            {/* Action Button */}
            <div className="sticky bottom-0 pt-4 pb-2 bg-background/95 backdrop-blur">
              <Button
                onClick={handleSubmit}
                disabled={loading || !audioFile || isAnalyzing}
                className="w-full gap-2 h-12 text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {mode === 'cover' ? 'Создание кавера...' : 'Расширение...'}
                  </>
                ) : isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Анализ аудио...
                  </>
                ) : (
                  <>
                    {mode === 'cover' ? <Disc className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {mode === 'cover' ? 'Создать кавер' : 'Расширить аудио'}
                  </>
                )}
              </Button>
              {!audioFile && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Загрузите аудиофайл для начала
                </p>
              )}
            </div>
          </div>
        </Tabs>
      </DialogContent>

      <LyricsChatAssistant
        open={lyricsAssistantOpen}
        onOpenChange={setLyricsAssistantOpen}
        onLyricsGenerated={(lyrics) => {
          setPrompt(lyrics);
          setLyricsAssistantOpen(false);
        }}
        onStyleGenerated={(generatedStyle) => {
          if (!style) setStyle(generatedStyle);
        }}
      />
    </Dialog>
  );
};
