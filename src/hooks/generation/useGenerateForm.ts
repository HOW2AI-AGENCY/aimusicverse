import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePlanTrackStore } from '@/stores/planTrackStore';
import { useGenerateDraft, useAudioReferenceLoader } from '@/hooks/generation';
import { useUserCredits } from '@/hooks/useUserCredits';
import { SUNO_MODELS, validateModel, DEFAULT_SUNO_MODEL } from '@/constants/sunoModels';
import { savePromptToHistory } from '@/components/generate-form/PromptHistory';
import { logger } from '@/lib/logger';
import { 
  SIMPLE_DESCRIPTION_MAX_LENGTH, 
  TITLE_MAX_LENGTH, 
  DRAFT_AUTO_SAVE_DELAY,
  FILE_READER_TIMEOUT,
  DEFAULT_STYLE_WEIGHT,
  DEFAULT_WEIRDNESS,
  DEFAULT_AUDIO_WEIGHT 
} from '@/constants/generationConstants';
import { showGenerationError, cleanupAudioReference } from '@/lib/errorHandling';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

export interface GenerateFormState {
  mode: 'simple' | 'custom';
  description: string;
  title: string;
  lyrics: string;
  style: string;
  hasVocals: boolean;
  model: string;
  negativeTags: string;
  vocalGender: '' | 'm' | 'f';
  styleWeight: number[];
  weirdnessConstraint: number[];
  audioWeight: number[];
  selectedProjectId?: string;
  selectedTrackId?: string;
  selectedArtistId?: string;
  audioFile: File | null;
  planTrackId?: string;
}

export interface UseGenerateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProjectId?: string;
  projects?: any[];
  artists?: any[];
  allTracks?: any[];
}

export function useGenerateForm({
  open,
  onOpenChange,
  initialProjectId,
  projects,
  artists,
  allTracks,
}: UseGenerateFormProps) {
  const navigate = useNavigate();
  const { planTrackContext, clearPlanTrackContext } = usePlanTrackStore();
  const { draft, hasDraft, saveDraft, clearDraft } = useGenerateDraft();
  const { trackGeneration } = useAnalyticsTracking();
  
  // Audio reference loader hook (IMP001)
  const audioReference = useAudioReferenceLoader(open);

  // User credits hook for personal balance (admins use shared API balance)
  const { balance: userBalance, canGenerate, generationCost, invalidate: invalidateCredits, isAdmin, apiBalance } = useUserCredits();

  // Form state
  const [mode, setMode] = useState<'simple' | 'custom'>('simple');
  const [loading, setLoading] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);
  const [apiCredits, setApiCredits] = useState<number | null>(null);

  // Simple mode state
  const [description, setDescription] = useState('');

  // Custom mode state
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  const [hasVocals, setHasVocals] = useState(true);

  // Advanced settings
  const [model, setModel] = useState('V4_5ALL');
  const [negativeTags, setNegativeTags] = useState('');
  const [vocalGender, setVocalGender] = useState<'m' | 'f' | ''>('');
  const [styleWeight, setStyleWeight] = useState([DEFAULT_STYLE_WEIGHT]);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState([DEFAULT_WEIRDNESS]);
  const [audioWeight, setAudioWeight] = useState([DEFAULT_AUDIO_WEIGHT]);

  // Reference data
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(initialProjectId);
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>();
  const [selectedArtistId, setSelectedArtistId] = useState<string | undefined>();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [planTrackId, setPlanTrackId] = useState<string | undefined>();

  // Reset form
  const resetForm = useCallback(() => {
    setDescription('');
    setTitle('');
    setLyrics('');
    setStyle('');
    setNegativeTags('');
    setVocalGender('');
    setStyleWeight([DEFAULT_STYLE_WEIGHT]);
    setWeirdnessConstraint([DEFAULT_WEIRDNESS]);
    setAudioWeight([DEFAULT_AUDIO_WEIGHT]);
    setSelectedProjectId(initialProjectId);
    setSelectedTrackId(undefined);
    setSelectedArtistId(undefined);
    setAudioFile(null);
    setAudioDuration(null);
    clearDraft();
    setPlanTrackId(undefined);
  }, [initialProjectId, clearDraft]);

  // Apply plan track context when available
  useEffect(() => {
    if (open && planTrackContext) {
      setMode('custom');
      setTitle(planTrackContext.planTrackTitle);
      setPlanTrackId(planTrackContext.planTrackId);
      setSelectedProjectId(planTrackContext.projectId);

      const styleComponents = [
        planTrackContext.stylePrompt,
        planTrackContext.projectGenre,
        planTrackContext.projectMood,
        planTrackContext.recommendedTags?.join(', '),
      ].filter(Boolean);

      if (styleComponents.length > 0) {
        setStyle(styleComponents.join('. '));
      }

      // Use lyrics from plan track (priority) or notes as fallback
      if (planTrackContext.lyrics) {
        setLyrics(planTrackContext.lyrics);
      } else if (planTrackContext.notes) {
        setLyrics(planTrackContext.notes);
      }

      toast.success(`Загружены данные: ${planTrackContext.planTrackTitle}`, {
        description: 'Форма заполнена из плана проекта',
      });

      clearPlanTrackContext();
    }
  }, [open, planTrackContext, clearPlanTrackContext]);

  // Apply guitar analysis parameters from sessionStorage
  useEffect(() => {
    if (open) {
      try {
        const paramsStr = sessionStorage.getItem('generationParams');
        if (paramsStr) {
          const params = JSON.parse(paramsStr);
          
          // Set mode to custom to show all fields
          setMode('custom');
          
          // Apply prompt if provided
          if (params.prompt) {
            setDescription(params.prompt);
          }
          
          // Build style from analysis
          const styleComponents: string[] = [];
          
          if (params.key) {
            styleComponents.push(`Key: ${params.key}`);
          }
          
          if (params.bpm) {
            styleComponents.push(`${params.bpm} BPM`);
          }
          
          if (params.timeSignature) {
            styleComponents.push(`${params.timeSignature} time`);
          }
          
          if (params.chordProgression) {
            styleComponents.push(`Chords: ${params.chordProgression}`);
          }
          
          // Add style description
          if (params.style) {
            if (params.style.genre) styleComponents.push(params.style.genre);
            if (params.style.mood) styleComponents.push(params.style.mood);
            if (params.style.technique) styleComponents.push(params.style.technique);
          }
          
          // Add tags
          if (params.tags && Array.isArray(params.tags)) {
            styleComponents.push(params.tags.slice(0, 5).join(', '));
          }
          
          if (styleComponents.length > 0) {
            setStyle(styleComponents.join(' • '));
          }
          
          toast.success('Параметры из Guitar Studio загружены', {
            description: 'Форма заполнена данными анализа гитары',
          });
          
          // Clear from sessionStorage after applying
          sessionStorage.removeItem('generationParams');
        }
      } catch (error) {
        logger.error('Failed to load generation params from sessionStorage', error);
      }
    }
  }, [open]);

  // Apply preset parameters from Quick Create
  useEffect(() => {
    if (open) {
      try {
        const presetParamsStr = sessionStorage.getItem('presetParams');
        if (presetParamsStr) {
          const presetParams = JSON.parse(presetParamsStr);
          
          logger.info('Loading Quick Create preset params', { presetId: presetParams.presetId });
          
          // Set mode to simple if only basic params, custom if more detailed
          if (presetParams.style || presetParams.mood || presetParams.tempo) {
            setMode('custom');
          }
          
          // Build style description from preset
          const styleComponents: string[] = [];
          
          if (presetParams.style) {
            styleComponents.push(presetParams.style);
          }
          
          if (presetParams.mood) {
            styleComponents.push(presetParams.mood);
          }
          
          if (presetParams.tempo) {
            styleComponents.push(presetParams.tempo);
          }
          
          if (presetParams.instruments && Array.isArray(presetParams.instruments)) {
            styleComponents.push(presetParams.instruments.join(', '));
          }
          
          if (styleComponents.length > 0) {
            setStyle(styleComponents.join(' • '));
          }
          
          toast.success('Preset загружен', {
            description: 'Форма заполнена из Quick Create',
          });
          
          // Clear from sessionStorage after applying
          sessionStorage.removeItem('presetParams');
        }
      } catch (error) {
        logger.error('Failed to load preset params from sessionStorage', error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [open]);

  // Fetch API credits (for display purposes)
  useEffect(() => {
    const fetchApiCredits = async () => {
      try {
        const { data } = await supabase.functions.invoke('suno-credits');
        if (data?.credits !== undefined) {
          setApiCredits(data.credits);
        }
      } catch (error) {
        logger.error('Error fetching API credits', { error });
      }
    };

    if (open) {
      fetchApiCredits();
    }
  }, [open]);

  // Apply audio reference data when loaded (IMP001 - extracted to useAudioReferenceLoader)
  useEffect(() => {
    if (audioReference.file) {
      setMode('custom');
      setAudioFile(audioReference.file);
      // Set duration from reference loader
      if (audioReference.duration) {
        setAudioDuration(audioReference.duration);
      }
    }
    if (audioReference.lyrics) {
      setLyrics(audioReference.lyrics);
    }
    if (audioReference.style) {
      setStyle(audioReference.style);
    }
    if (audioReference.title) {
      setTitle(audioReference.title);
    }

    // Handle cloud audio mode (cover/extend from Cloud tab)
    if (audioReference.cloudMode) {
      // For extend mode, we might want to set specific audio weight
      if (audioReference.cloudMode === 'extend') {
        setAudioWeight([0.9]); // High weight for extending
        logger.info('Cloud audio: extend mode', { cloudMode: audioReference.cloudMode });
      } else {
        setAudioWeight([0.5]); // Moderate weight for cover
        logger.info('Cloud audio: cover mode', { cloudMode: audioReference.cloudMode });
      }
    }

    // Handle stem action to set appropriate generation settings
    if (audioReference.action) {
      switch (audioReference.action) {
        case 'add-vocals-to-instrumental':
          // Adding vocals to instrumental - enable vocals, high audio weight
          setHasVocals(true);
          setAudioWeight([0.8]);
          logger.info('Stem action: adding vocals to instrumental');
          break;

        case 'add-instrumental-to-vocals':
          // Adding instrumental to vocals - disable vocals (instrumental only), moderate audio weight
          setHasVocals(false);
          setAudioWeight([0.6]);
          logger.info('Stem action: adding instrumental to vocals');
          break;

        case 'create-instrumental':
          // Create instrumental from stem - disable vocals
          setHasVocals(false);
          setAudioWeight([0.7]);
          logger.info('Stem action: creating instrumental');
          break;

        case 'regenerate-from-stem':
          // Full regeneration - keep vocals, moderate weight
          setHasVocals(true);
          setAudioWeight([0.5]);
          logger.info('Stem action: regenerating from stem');
          break;

        default:
          logger.warn('Unknown stem action', { action: audioReference.action });
      }
    }
  }, [audioReference.file, audioReference.lyrics, audioReference.style, audioReference.title, audioReference.action, audioReference.cloudMode]);

  // Check for template lyrics from sessionStorage
  useEffect(() => {
    if (open) {
      const templateLyrics = sessionStorage.getItem('templateLyrics');
      const templateName = sessionStorage.getItem('templateName');
      if (templateLyrics) {
        setMode('custom');
        setLyrics(templateLyrics);
        if (templateName) {
          setTitle(templateName.slice(0, TITLE_MAX_LENGTH));
        }
        sessionStorage.removeItem('templateLyrics');
        sessionStorage.removeItem('templateName');
        toast.success('Шаблон загружен', {
          description: 'Текст добавлен в форму',
        });
      }
    }
  }, [open]);

  // Restore draft when sheet opens
  useEffect(() => {
    if (open && hasDraft && draft && !planTrackContext) {
      const hasTemplate = sessionStorage.getItem('templateLyrics');
      if (hasTemplate) return;

      setMode(draft.mode);
      setDescription(draft.description);
      setTitle(draft.title);
      setLyrics(draft.lyrics);
      setStyle(draft.style);
      setHasVocals(draft.hasVocals);
      setModel(draft.model);
      setNegativeTags(draft.negativeTags);
      setVocalGender(draft.vocalGender);

      toast.info('Черновик восстановлен', {
        description: 'Ваши данные сохранены',
        action: {
          label: 'Очистить',
          onClick: () => {
            clearDraft();
            resetForm();
            toast.success('Черновик очищен');
          },
        },
      });
    }
  }, [open]);

  // Auto-save draft
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      saveDraft({
        mode,
        description,
        title,
        lyrics,
        style,
        hasVocals,
        model,
        negativeTags,
        vocalGender,
      });
    }, DRAFT_AUTO_SAVE_DELAY);

    return () => clearTimeout(timer);
  }, [mode, description, title, lyrics, style, hasVocals, model, negativeTags, vocalGender, open, saveDraft]);

  // Boost style with AI
  const handleBoostStyle = useCallback(async () => {
    const content = mode === 'simple' ? description : style;

    if (!content) {
      toast.error('Пожалуйста, заполните описание стиля');
      return;
    }

    // Prevent double-click submissions (IMP005)
    if (boostLoading) {
      return;
    }

    setBoostLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-boost-style', {
        body: { content },
      });

      if (error) throw error;

      if (data?.boostedStyle) {
        if (mode === 'simple') {
          setDescription(data.boostedStyle);
        } else {
          setStyle(data.boostedStyle);
        }
        toast.success('Стиль улучшен! ✨', {
          description: 'Описание стиля было оптимизировано AI',
        });
      }
    } catch (error) {
      logger.error('Boost error', { error });

      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('429') || errorMessage.includes('кредитов')) {
        toast.error('Недостаточно кредитов', {
          description: 'Пополните баланс SunoAPI',
        });
      } else {
        toast.error('Ошибка улучшения', {
          description: errorMessage || 'Попробуйте еще раз',
        });
      }
    } finally {
      setBoostLoading(false);
    }
  }, [mode, description, style, boostLoading]);

  // Handle audio file selection with duration calculation
  const handleSetAudioFile = useCallback((file: File | null) => {
    setAudioFile(file);
    
    if (!file) {
      setAudioDuration(null);
      return;
    }
    
    // Calculate duration from file
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = url;
    audio.onloadedmetadata = () => {
      const dur = audio.duration;
      URL.revokeObjectURL(url);
      if (!isNaN(dur) && isFinite(dur)) {
        setAudioDuration(dur);
        logger.info('Audio duration calculated', { duration: dur, fileName: file.name });
      } else {
        setAudioDuration(null);
        logger.warn('Invalid audio duration', { fileName: file.name });
      }
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      setAudioDuration(null);
      logger.warn('Failed to calculate audio duration', { fileName: file.name });
    };
  }, []);

  // Generate track
  const handleGenerate = useCallback(async () => {
    // Prevent double-click submissions (IMP005)
    if (loading) {
      return;
    }

    const instrumental = !hasVocals;
    const prompt = mode === 'simple' ? description : (instrumental ? '' : lyrics);

    if (mode === 'simple' && !description) {
      toast.error('Опишите музыку');
      return;
    }

    if (mode === 'simple' && description.length > SIMPLE_DESCRIPTION_MAX_LENGTH) {
      toast.error(`Описание слишком длинное (${description.length}/${SIMPLE_DESCRIPTION_MAX_LENGTH})`, {
        description: 'Сократите текст или переключитесь в Custom режим',
      });
      return;
    }

    // Pre-generation credit validation - check user's personal balance
    if (!canGenerate) {
      toast.error('Недостаточно кредитов', {
        description: `Ваш баланс: ${userBalance}. Требуется: ${generationCost}`,
      });
      return;
    }

    if (mode === 'custom' && !style) {
      toast.error('Укажите стиль музыки');
      return;
    }

    if (mode === 'custom' && hasVocals && !lyrics) {
      toast.error('Добавьте лирику или отключите вокал');
      return;
    }

    const { validKey, wasChanged, originalKey } = validateModel(model);
    let finalModel = model;

    if (wasChanged) {
      const originalName = SUNO_MODELS[originalKey]?.name || originalKey;
      const newName = SUNO_MODELS[validKey]?.name || validKey;
      toast.warning(`Модель ${originalName} недоступна`, {
        description: `Используем ${newName} вместо неё`,
      });
      setModel(validKey);
      finalModel = validKey;
    }

    savePromptToHistory({
      mode,
      description: mode === 'simple' ? description : undefined,
      title: mode === 'custom' ? title : undefined,
      style: mode === 'custom' ? style : undefined,
      lyrics: mode === 'custom' && hasVocals ? lyrics : undefined,
      model: finalModel,
    });

    setLoading(true);

    const toastId = toast.loading('Отправка запроса...', {
      description: 'Подключаемся к серверу генерации',
    });

    try {
      const personaId = selectedArtistId
        ? artists?.find(a => a.id === selectedArtistId)?.suno_persona_id
        : undefined;

      let data, error;

      if (audioFile) {
        // Validate file size before processing (max 50MB)
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        if (audioFile.size > MAX_FILE_SIZE) {
          toast.error('Файл слишком большой', {
            description: `Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB. Ваш файл: ${(audioFile.size / 1024 / 1024).toFixed(1)}MB`,
          });
          return;
        }

        // Add timeout handling for FileReader operations (IMP007)
        const fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          const timeout = setTimeout(() => {
            reader.abort();
            reject(new Error('File reading timeout'));
          }, FILE_READER_TIMEOUT);
          
          reader.onload = () => {
            clearTimeout(timeout);
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            clearTimeout(timeout);
            reject(reader.error);
          };
          reader.readAsDataURL(audioFile);
        });

        const result = await supabase.functions.invoke('suno-upload-extend', {
          body: {
            audioFile: {
              name: audioFile.name,
              type: audioFile.type,
              data: fileData,
            },
            audioDuration: audioDuration || undefined,
            customMode: mode === 'custom', // Fixed: Use customMode instead of inverted defaultParamFlag
            prompt: mode === 'custom' && hasVocals ? lyrics : undefined,
            style: mode === 'custom' ? style : undefined,
            title: title || undefined,
            instrumental: !hasVocals,
            model: finalModel,
            personaId: personaId,
            negativeTags: negativeTags || undefined,
            vocalGender: vocalGender || undefined,
            styleWeight: styleWeight[0],
            weirdnessConstraint: weirdnessConstraint[0],
            audioWeight: audioWeight[0],
            projectId: selectedProjectId || initialProjectId,
          },
        });
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase.functions.invoke('suno-music-generate', {
          body: {
            mode,
            prompt: mode === 'simple' ? description : prompt,
            title: mode === 'custom' ? title : undefined,
            style: mode === 'custom' ? style : undefined,
            instrumental,
            model: finalModel,
            negativeTags: negativeTags || undefined,
            vocalGender: vocalGender || undefined,
            styleWeight: styleWeight[0],
            weirdnessConstraint: weirdnessConstraint[0],
            audioWeight: personaId ? audioWeight[0] : undefined,
            personaId: personaId,
            artistId: selectedArtistId,
            projectId: selectedProjectId || initialProjectId,
            planTrackId: planTrackId,
          },
        });
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Track generation started with analytics
      trackGeneration('started', {
        mode,
        hasVocals,
        model: finalModel,
        withAudioFile: !!audioFile,
        projectId: selectedProjectId || initialProjectId,
        artistId: selectedArtistId,
      });

      toast.dismiss(toastId);
      toast.success('Генерация началась! 🎵', {
        description: 'Отслеживайте прогресс в библиотеке',
      });

      // Check if generation came from Quick Create flow
      const fromQuickCreate = sessionStorage.getItem('fromQuickCreate');
      
      resetForm();
      onOpenChange(false);
      
      // Navigate based on source
      if (fromQuickCreate === 'true') {
        // Clear the flag
        sessionStorage.removeItem('fromQuickCreate');
        
        // Navigate to library with a hint to open Stem Studio when track is ready
        navigate('/library');
        
        toast.info('Трек готовится', {
          description: 'После генерации можно открыть Stem Studio для разделения',
          duration: 5000,
        });
        
        logger.info('Quick Create flow: Track generation started, will suggest Stem Studio');
      } else {
        navigate('/library');
      }

      // Refresh API credits and user credits after generation
      supabase.functions.invoke('suno-credits').then(({ data: creditsData }) => {
        if (creditsData?.credits !== undefined) {
          setApiCredits(creditsData.credits);
        }
      });
      invalidateCredits(); // Refresh user credits
    } catch (error) {
      toast.dismiss(toastId);
      showGenerationError(error);
      cleanupAudioReference(); // Cleanup on error (IMP002)
    } finally {
      setLoading(false);
    }
  }, [
    mode, description, title, lyrics, style, hasVocals, model,
    negativeTags, vocalGender, styleWeight, weirdnessConstraint, audioWeight,
    audioFile, selectedArtistId, selectedProjectId, initialProjectId, planTrackId,
    artists, navigate, onOpenChange, resetForm,
  ]);

  // Handle track selection
  const handleTrackSelect = useCallback((trackId: string) => {
    const track = allTracks?.find(t => t.id === trackId);
    if (track) {
      setTitle(track.title || '');
      setLyrics(track.lyrics || '');
      setStyle(track.style || '');
      setHasVocals(track.has_vocals ?? true);
      if (track.suno_model) setModel(track.suno_model);
      if (track.negative_tags) setNegativeTags(track.negative_tags);
      if (track.vocal_gender) setVocalGender(track.vocal_gender as 'm' | 'f');
      if (track.style_weight) setStyleWeight([track.style_weight]);
      toast.success('Данные трека загружены');
    }
    setSelectedTrackId(trackId);
  }, [allTracks]);

  // Handle artist selection
  const handleArtistSelect = useCallback((artistId: string) => {
    setSelectedArtistId(artistId);
    if (artistId) {
      setMode('custom');
      const artist = artists?.find(a => a.id === artistId);
      if (artist) {
        const artistStyle = [
          artist.style_description,
          artist.genre_tags?.join(', '),
          artist.mood_tags?.join(', '),
        ].filter(Boolean).join('. ');

        if (artistStyle && !style) {
          setStyle(artistStyle);
          toast.success('Стиль артиста добавлен');
        }
      }
    }
  }, [artists, style]);

  return {
    // State
    mode,
    setMode,
    loading,
    audioReferenceLoading: audioReference.isLoading,
    boostLoading,
    // User credits
    userBalance,
    canGenerate,
    generationCost,
    apiCredits,
    isAdmin,
    hasDraft,
    
    // Simple mode
    description,
    setDescription,
    
    // Custom mode
    title,
    setTitle,
    lyrics,
    setLyrics,
    style,
    setStyle,
    hasVocals,
    setHasVocals,
    
    // Advanced
    model,
    setModel,
    negativeTags,
    setNegativeTags,
    vocalGender,
    setVocalGender,
    styleWeight,
    setStyleWeight,
    weirdnessConstraint,
    setWeirdnessConstraint,
    audioWeight,
    setAudioWeight,
    
    // References
    selectedProjectId,
    setSelectedProjectId,
    selectedTrackId,
    setSelectedTrackId,
    selectedArtistId,
    setSelectedArtistId,
    audioFile,
    setAudioFile: handleSetAudioFile,
    planTrackId,
    
    // Actions
    handleGenerate,
    handleBoostStyle,
    handleTrackSelect,
    handleArtistSelect,
    resetForm,
    clearDraft,
  };
}