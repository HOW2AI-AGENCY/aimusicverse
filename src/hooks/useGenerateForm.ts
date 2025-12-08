import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePlanTrackStore } from '@/stores/planTrackStore';
import { useGenerateDraft } from '@/hooks/useGenerateDraft';
import { SUNO_MODELS, validateModel, DEFAULT_SUNO_MODEL } from '@/constants/sunoModels';
import { savePromptToHistory } from '@/components/generate-form/PromptHistory';
import { logger } from '@/lib/logger';

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

  // Form state
  const [mode, setMode] = useState<'simple' | 'custom'>('simple');
  const [loading, setLoading] = useState(false);
  const [audioReferenceLoading, setAudioReferenceLoading] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

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
  const [styleWeight, setStyleWeight] = useState([0.65]);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState([0.5]);
  const [audioWeight, setAudioWeight] = useState([0.65]);

  // Reference data
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(initialProjectId);
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>();
  const [selectedArtistId, setSelectedArtistId] = useState<string | undefined>();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [planTrackId, setPlanTrackId] = useState<string | undefined>();

  // Reset form
  const resetForm = useCallback(() => {
    setDescription('');
    setTitle('');
    setLyrics('');
    setStyle('');
    setNegativeTags('');
    setVocalGender('');
    setStyleWeight([0.65]);
    setWeirdnessConstraint([0.5]);
    setAudioWeight([0.65]);
    setSelectedProjectId(initialProjectId);
    setSelectedTrackId(undefined);
    setSelectedArtistId(undefined);
    setAudioFile(null);
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

      if (planTrackContext.notes) {
        setLyrics(planTrackContext.notes);
      }

      toast.success(`Загружены данные: ${planTrackContext.planTrackTitle}`, {
        description: 'Форма заполнена из плана проекта',
      });

      clearPlanTrackContext();
    }
  }, [open, planTrackContext, clearPlanTrackContext]);

  // Fetch credits
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data } = await supabase.functions.invoke('suno-credits');
        if (data?.credits !== undefined) {
          setCredits(data.credits);
        }
      } catch (error) {
        logger.error('Error fetching credits', { error });
      }
    };

    if (open) {
      fetchCredits();
    }
  }, [open]);

  // Check for stem audio reference from localStorage
  useEffect(() => {
    if (open) {
      const stemReferenceStr = localStorage.getItem('stem_audio_reference');
      if (stemReferenceStr) {
        try {
          const stemReference = JSON.parse(stemReferenceStr);
          if (Date.now() - stemReference.timestamp < 5 * 60 * 1000) {
            setMode('custom');

            if (stemReference.lyrics) {
              setLyrics(stemReference.lyrics);
            }

            const styleToUse = stemReference.style || stemReference.tags || stemReference.prompt || '';
            if (styleToUse) {
              setStyle(styleToUse);
            }

            if (stemReference.originalTitle) {
              setTitle(`${stemReference.originalTitle} (ремикс)`);
            }

            const loadedParts = [];
            if (stemReference.lyrics) loadedParts.push('текст');
            if (styleToUse) loadedParts.push('стиль');

            toast.success('Контекст загружен из студии', {
              description: loadedParts.length > 0 ? `Скопировано: ${loadedParts.join(', ')}` : 'Готово к генерации',
            });

            setAudioReferenceLoading(true);

            fetch(stemReference.url)
              .then(response => response.blob())
              .then(blob => {
                const file = new File([blob], `${stemReference.name}.mp3`, { type: 'audio/mpeg' });
                setAudioFile(file);
                toast.success('Аудио референс загружен!', {
                  description: stemReference.name,
                });
              })
              .catch(err => {
                logger.error('Failed to load stem reference', { error: err });
                toast.error('Не удалось загрузить аудио референс');
              })
              .finally(() => {
                setAudioReferenceLoading(false);
              });
          }
          localStorage.removeItem('stem_audio_reference');
        } catch (e) {
          logger.error('Failed to parse stem reference', { error: e });
        }
      }
    }
  }, [open]);

  // Check for template lyrics from sessionStorage
  useEffect(() => {
    if (open) {
      const templateLyrics = sessionStorage.getItem('templateLyrics');
      const templateName = sessionStorage.getItem('templateName');
      if (templateLyrics) {
        setMode('custom');
        setLyrics(templateLyrics);
        if (templateName) {
          setTitle(templateName.slice(0, 80));
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
    }, 1000);

    return () => clearTimeout(timer);
  }, [mode, description, title, lyrics, style, hasVocals, model, negativeTags, vocalGender, open, saveDraft]);

  // Boost style with AI
  const handleBoostStyle = useCallback(async () => {
    const content = mode === 'simple' ? description : style;

    if (!content) {
      toast.error('Пожалуйста, заполните описание стиля');
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
  }, [mode, description, style]);

  // Generate track
  const handleGenerate = useCallback(async () => {
    const instrumental = !hasVocals;
    const prompt = mode === 'simple' ? description : (instrumental ? '' : lyrics);

    if (mode === 'simple' && !description) {
      toast.error('Опишите музыку');
      return;
    }

    if (mode === 'simple' && description.length > 500) {
      toast.error(`Описание слишком длинное (${description.length}/500)`, {
        description: 'Сократите текст или переключитесь в Custom режим',
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
        const fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioFile);
        });

        const result = await supabase.functions.invoke('suno-upload-extend', {
          body: {
            audioFile: {
              name: audioFile.name,
              type: audioFile.type,
              data: fileData,
            },
            defaultParamFlag: mode === 'custom',
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

      toast.dismiss(toastId);
      toast.success('Генерация началась! 🎵', {
        description: 'Отслеживайте прогресс в библиотеке',
      });

      resetForm();
      onOpenChange(false);
      navigate('/library');

      supabase.functions.invoke('suno-credits').then(({ data: creditsData }) => {
        if (creditsData?.credits !== undefined) {
          setCredits(creditsData.credits);
        }
      });
    } catch (error) {
      logger.error('Generation error', { error });
      toast.dismiss(toastId);

      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('429') || errorMessage.includes('credits')) {
        toast.error('Недостаточно кредитов', {
          description: 'Пополните баланс SunoAPI для продолжения',
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Ошибка сети', {
          description: 'Проверьте подключение к интернету',
        });
      } else {
        toast.error('Ошибка генерации', {
          description: errorMessage || 'Попробуйте еще раз',
        });
      }
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
    audioReferenceLoading,
    boostLoading,
    credits,
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
    setAudioFile,
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