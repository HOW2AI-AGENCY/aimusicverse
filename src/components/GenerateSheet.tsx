import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Zap as ZapIcon, Sliders, Coins, Mic, FileAudio, FolderOpen, User, Music2, History, Plus, Trash2, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/useProjects';
import { useArtists } from '@/hooks/useArtists';
import { useTracks } from '@/hooks/useTracks';
import { UploadExtendDialog } from './UploadExtendDialog';
import { UploadCoverDialog } from './UploadCoverDialog';
import { AudioActionDialog } from './generate-form/AudioActionDialog';
import { ArtistSelector } from './generate-form/ArtistSelector';
import { ProjectTrackSelector } from './generate-form/ProjectTrackSelector';
import { AdvancedSettings } from './generate-form/AdvancedSettings';
import { LyricsVisualEditor } from './generate-form/LyricsVisualEditor';
import { PromptHistory, savePromptToHistory } from './generate-form/PromptHistory';
import { AILyricsWizard } from './generate-form/AILyricsWizard';
import { usePlanTrackStore } from '@/stores/planTrackStore';
import { SUNO_MODELS } from '@/constants/sunoModels';
import { useGenerateDraft } from '@/hooks/useGenerateDraft';

interface GenerateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export const GenerateSheet = ({ open, onOpenChange, projectId: initialProjectId }: GenerateSheetProps) => {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { artists } = useArtists();
  const { tracks: allTracks } = useTracks();
  const { planTrackContext, clearPlanTrackContext } = usePlanTrackStore();
  const { draft, hasDraft, saveDraft, clearDraft } = useGenerateDraft();
  const [mode, setMode] = useState<'simple' | 'custom'>('simple');
  const [loading, setLoading] = useState(false);
  const [audioReferenceLoading, setAudioReferenceLoading] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);
  const [uploadExtendOpen, setUploadExtendOpen] = useState(false);
  const [uploadCoverOpen, setUploadCoverOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  
  // Plan track reference
  const [planTrackId, setPlanTrackId] = useState<string | undefined>();
  
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

  // Dialogs
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);
  const [projectTrackStep, setProjectTrackStep] = useState<'project' | 'track'>('project');
  const [lyricsAssistantOpen, setLyricsAssistantOpen] = useState(false);

  // Apply plan track context when available
  useEffect(() => {
    if (open && planTrackContext) {
      setMode('custom');
      setTitle(planTrackContext.planTrackTitle);
      setPlanTrackId(planTrackContext.planTrackId);
      setSelectedProjectId(planTrackContext.projectId);
      
      // Build style from plan track data
      const styleComponents = [
        planTrackContext.stylePrompt,
        planTrackContext.projectGenre,
        planTrackContext.projectMood,
        planTrackContext.recommendedTags?.join(', '),
      ].filter(Boolean);
      
      if (styleComponents.length > 0) {
        setStyle(styleComponents.join('. '));
      }
      
      // Set lyrics from notes if available
      if (planTrackContext.notes) {
        setLyrics(planTrackContext.notes);
      }
      
      toast.success(`Загружены данные: ${planTrackContext.planTrackTitle}`, {
        description: 'Форма заполнена из плана проекта',
      });
      
      // Clear context after applying
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
        console.error('Error fetching credits:', error);
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
          // Only use if less than 5 minutes old
          if (Date.now() - stemReference.timestamp < 5 * 60 * 1000) {
            // Immediately switch to custom mode and set data BEFORE async fetch
            setMode('custom');
            
            // Pre-fill lyrics from original track
            if (stemReference.lyrics) {
              setLyrics(stemReference.lyrics);
            }
            
            // Pre-fill style - priority: style > tags (for simple mode) > prompt
            const styleToUse = stemReference.style || stemReference.tags || stemReference.prompt || '';
            if (styleToUse) {
              setStyle(styleToUse);
            }
            
            // Use original title as base for new track
            if (stemReference.originalTitle) {
              setTitle(`${stemReference.originalTitle} (ремикс)`);
            }
            
            // Build detailed message about what was loaded
            const loadedParts = [];
            if (stemReference.lyrics) loadedParts.push('текст');
            if (styleToUse) loadedParts.push('стиль');
            
            toast.success('Контекст загружен из студии', {
              description: loadedParts.length > 0 ? `Скопировано: ${loadedParts.join(', ')}` : 'Готово к генерации',
            });
            
            // Start loading audio reference in background
            setAudioReferenceLoading(true);
            
            // Fetch the audio and create a File object
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
                console.error('Failed to load stem reference:', err);
                toast.error('Не удалось загрузить аудио референс');
              })
              .finally(() => {
                setAudioReferenceLoading(false);
              });
          }
          // Clear the reference after use
          localStorage.removeItem('stem_audio_reference');
        } catch (e) {
          console.error('Failed to parse stem reference:', e);
        }
      }
    }
  }, [open]);

  // Restore draft when sheet opens (if no plan track context)
  useEffect(() => {
    if (open && hasDraft && draft && !planTrackContext) {
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
  }, [open]); // Only run when sheet opens

  // Auto-save draft when form values change
  useEffect(() => {
    if (!open) return;
    
    // Debounce auto-save
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
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timer);
  }, [mode, description, title, lyrics, style, hasVocals, model, negativeTags, vocalGender, open, saveDraft]);

  // Auto-fill from selected track
  const handleTrackSelect = (trackId: string) => {
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
    // Dialog closes automatically for track selection but stays open for project selection to allow sequential track picking
  };

  const handleBoostStyle = async () => {
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
      console.error('Boost error:', error);
      
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
  };

  const handleGenerate = async () => {
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

    // Save to history before generating
    savePromptToHistory({
      mode,
      description: mode === 'simple' ? description : undefined,
      title: mode === 'custom' ? title : undefined,
      style: mode === 'custom' ? style : undefined,
      lyrics: mode === 'custom' && hasVocals ? lyrics : undefined,
      model,
    });

    setLoading(true);
    
    // Show submitting toast
    const toastId = toast.loading('Отправка запроса...', {
      description: 'Подключаемся к серверу генерации',
    });
    
    try {
      // Get persona ID from selected artist
      const personaId = selectedArtistId 
        ? artists?.find(a => a.id === selectedArtistId)?.suno_persona_id 
        : undefined;

      const { data, error } = await supabase.functions.invoke('suno-music-generate', {
        body: {
          mode,
          prompt: mode === 'simple' ? description : prompt,
          title: mode === 'custom' ? title : undefined,
          style: mode === 'custom' ? style : undefined,
          instrumental,
          model,
          negativeTags: negativeTags || undefined,
          vocalGender: vocalGender || undefined,
          styleWeight: styleWeight[0],
          weirdnessConstraint: weirdnessConstraint[0],
          audioWeight: (audioFile || personaId) ? audioWeight[0] : undefined,
          personaId: personaId,
          artistId: selectedArtistId,
          projectId: selectedProjectId || initialProjectId,
          planTrackId: planTrackId, // Link to project plan track
        },
      });

      if (error) throw error;

      // Dismiss loading toast and show success
      toast.dismiss(toastId);
      toast.success('Генерация началась! 🎵', {
        description: 'Отслеживайте прогресс в библиотеке',
      });

      // Reset form and close
      resetForm();
      onOpenChange(false);
      
      // Navigate to library to show generation progress
      navigate('/library');
      
      // Refresh credits in background
      supabase.functions.invoke('suno-credits').then(({ data: creditsData }) => {
        if (creditsData?.credits !== undefined) {
          setCredits(creditsData.credits);
        }
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast.dismiss(toastId);
      
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('429') || errorMessage.includes('credits')) {
        toast.error('Недостаточно кредитов', {
          description: 'Пополните баланс SunoAPI для продолжения',
          action: {
            label: 'Повторить',
            onClick: handleGenerate,
          },
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Ошибка сети', {
          description: 'Проверьте подключение к интернету',
          action: {
            label: 'Повторить',
            onClick: handleGenerate,
          },
        });
      } else {
        toast.error('Ошибка генерации', {
          description: errorMessage || 'Попробуйте еще раз',
          action: {
            label: 'Повторить',
            onClick: handleGenerate,
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
    // Clear draft on form reset
    clearDraft();
    setPlanTrackId(undefined);
  };



  const projectTracks = selectedProjectId 
    ? allTracks?.filter(t => t.project_id === selectedProjectId) 
    : [];

  // Handle project selection - show tracks for that project
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    // If project has tracks, show track selection
    const tracks = allTracks?.filter(t => t.project_id === projectId);
    if (tracks && tracks.length > 0) {
      setProjectTrackStep('track');
    } else {
      setProjectDialogOpen(false);
      toast.info('Проект выбран', {
        description: 'В проекте пока нет треков',
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col bg-background/95 backdrop-blur-xl p-0">
        <SheetHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
          <SheetTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Создать треk
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-3">
            {/* Header with controls */}
            <div className="space-y-3">
              {/* Row 1: Credits, Mode Toggle, Settings */}
              <div className="flex items-center justify-between gap-2">
                {/* Left side: Credits and History */}
                <div className="flex items-center gap-2 flex-1">
                  {credits !== null && (
                    <Badge 
                      variant="secondary" 
                      className="gap-1.5 px-2.5 py-1"
                      aria-label={`Доступно кредитов: ${credits.toFixed(2)}`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span className="font-semibold text-xs">{credits.toFixed(2)}</span>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHistoryOpen(true)}
                    className="h-11 w-11 p-0 min-w-[44px] min-h-[44px] touch-manipulation"
                    title="История промптов"
                    aria-label="Открыть историю промптов"
                  >
                    <History className="w-5 h-5" />
                  </Button>
                </div>

                {/* Center: Mode Toggle - improved touch targets */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted">
                  <Button
                    variant={mode === 'simple' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('simple')}
                    className="h-9 px-4 text-sm min-w-[72px] touch-manipulation"
                  >
                    Simple
                  </Button>
                  <Button
                    variant={mode === 'custom' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('custom')}
                    className="h-9 px-4 text-sm min-w-[72px] touch-manipulation"
                  >
                    Custom
                  </Button>
                </div>

                {/* Right side: Advanced Settings + Clear Draft */}
                <div className="flex items-center gap-1 flex-1 justify-end">
                  {hasDraft && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearDraft();
                        resetForm();
                        toast.success('Черновик очищен');
                      }}
                      className="h-11 w-11 p-0 min-w-[44px] min-h-[44px] touch-manipulation text-muted-foreground hover:text-destructive"
                      title="Очистить черновик"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    className="h-11 w-11 p-0 min-w-[44px] min-h-[44px] touch-manipulation"
                  >
                    <Sliders className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Row 2: Model Selection */}
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground shrink-0">Модель:</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span>{SUNO_MODELS[model as keyof typeof SUNO_MODELS]?.emoji || '🎵'}</span>
                        <span className="text-sm">{SUNO_MODELS[model as keyof typeof SUNO_MODELS]?.name || model}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    {Object.entries(SUNO_MODELS).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{info.emoji}</span>
                          <div className="flex flex-col">
                            <span className="font-medium">{info.name}</span>
                            <span className="text-xs text-muted-foreground">{info.desc}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          {/* Compact Quick Action Buttons - improved touch targets */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] h-auto py-2 gap-1.5 flex-col touch-manipulation"
              onClick={() => setAudioDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs leading-none">Аудио</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] h-auto py-2 gap-1.5 flex-col touch-manipulation"
              onClick={() => setArtistDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs leading-none">Персона</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] h-auto py-2 gap-1.5 flex-col touch-manipulation"
              onClick={() => setProjectDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs leading-none">Проект</span>
            </Button>
          </div>

          {/* Selected References Indicators */}
          {(audioFile || audioReferenceLoading || selectedArtistId || selectedProjectId || planTrackId) && (
            <div className="space-y-2">
              {planTrackId && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Music2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs flex-1 truncate text-green-600 dark:text-green-400">
                    Из плана проекта: {title}
                  </span>
                </div>
              )}
              
              {audioReferenceLoading && !audioFile && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-pulse">
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  <span className="text-xs flex-1 text-amber-600 dark:text-amber-400">
                    Загрузка аудио референса...
                  </span>
                </div>
              )}
              
              {audioFile && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <FileAudio className="w-4 h-4 text-primary" />
                  <span className="text-xs flex-1 truncate">{audioFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setAudioFile(null)}
                  >
                    <span className="text-xs">✕</span>
                  </Button>
                </div>
              )}
              
              {selectedArtistId && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-xs flex-1 truncate">
                    {artists?.find(a => a.id === selectedArtistId)?.name || 'Персона'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setSelectedArtistId(undefined)}
                  >
                    <span className="text-xs">✕</span>
                  </Button>
                </div>
              )}

              {selectedProjectId && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <span className="text-xs flex-1 truncate">
                    {projects?.find(p => p.id === selectedProjectId)?.title || 'Проект'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setSelectedProjectId(undefined);
                      setSelectedTrackId(undefined);
                    }}
                  >
                    <span className="text-xs">✕</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Mode Content with Animation */}
          <AnimatePresence mode="wait">
            {mode === 'simple' && (
              <motion.div
                key="simple"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="space-y-3"
              >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="description" className="text-xs font-medium">
                    Описание музыки
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${description.length > 500 ? 'text-destructive font-medium' : description.length > 400 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      {description.length}/500
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleBoostStyle}
                      disabled={boostLoading || !description}
                      className="h-6 px-2 gap-1"
                    >
                      {boostLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span className="text-xs">AI</span>
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="description"
                  placeholder="Энергичный рок с мощными гитарами [Жанр: Рок] [Настроение: Драйв]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className={`resize-none text-sm ${description.length > 500 ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {description.length > 500 && (
                  <p className="text-xs text-destructive mt-1">
                    Сократите описание или переключитесь в Custom режим
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="simple-title" className="text-xs font-medium mb-1.5 block">
                  Название <span className="text-muted-foreground">(опционально)</span>
                </Label>
                <Input
                  id="simple-title"
                  placeholder="Автогенерация если пусто"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Vocals Toggle for Simple Mode */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  <Label htmlFor="simple-vocals-toggle" className="cursor-pointer text-sm font-medium">
                    С вокалом
                  </Label>
                </div>
                <Switch
                  id="simple-vocals-toggle"
                  checked={hasVocals}
                  onCheckedChange={(checked) => {
                    setHasVocals(checked);
                    // Clear lyrics when switching to instrumental in case user switches to Custom mode later
                    if (!checked) {
                      setLyrics('');
                    }
                  }}
                />
              </div>
              </motion.div>
            )}

            {mode === 'custom' && (
              <motion.div
                key="custom"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="space-y-3"
              >
              <div>
                <Label htmlFor="title" className="text-xs font-medium mb-1.5 block">
                  Название
                </Label>
                <Input
                  id="title"
                  placeholder="Автогенерация если пусто"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="style" className="text-xs font-medium">
                    Стиль
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBoostStyle}
                    disabled={boostLoading || !style}
                    className="h-6 px-2 gap-1"
                  >
                    {boostLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span className="text-xs">AI</span>
                  </Button>
                </div>
                <Textarea
                  id="style"
                  placeholder="Опишите стиль, жанр, настроение..."
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              {/* Vocals Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  <Label htmlFor="vocals-toggle" className="cursor-pointer text-sm font-medium">
                    С вокалом
                  </Label>
                </div>
                <Switch
                  id="vocals-toggle"
                  checked={hasVocals}
                  onCheckedChange={(checked) => {
                    setHasVocals(checked);
                    // Clear lyrics when switching to instrumental
                    if (!checked) {
                      setLyrics('');
                    }
                  }}
                />
              </div>

              {/* Lyrics Section - Only show when hasVocals is true */}
              {hasVocals && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-medium">Текст песни</Label>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2"
                        onClick={() => setShowVisualEditor(!showVisualEditor)}
                      >
                        <span className="text-xs">{showVisualEditor ? 'Текст' : 'Визуал'}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2"
                        onClick={() => setLyricsAssistantOpen(true)}
                      >
                        <Sparkles className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {showVisualEditor ? (
                    <LyricsVisualEditor
                      value={lyrics}
                      onChange={setLyrics}
                      onAIGenerate={() => setLyricsAssistantOpen(true)}
                    />
                  ) : (
                    <Textarea
                      placeholder="Введите текст или используйте AI..."
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      rows={5}
                      className="resize-none text-sm"
                    />
                  )}
                </div>
              )}

              {/* Advanced Settings Collapsible */}
              <AdvancedSettings
                open={advancedOpen}
                onOpenChange={setAdvancedOpen}
                negativeTags={negativeTags}
                onNegativeTagsChange={setNegativeTags}
                vocalGender={vocalGender}
                onVocalGenderChange={setVocalGender}
                styleWeight={styleWeight}
                onStyleWeightChange={setStyleWeight}
                weirdnessConstraint={weirdnessConstraint}
                onWeirdnessConstraintChange={setWeirdnessConstraint}
                audioWeight={audioWeight}
                onAudioWeightChange={setAudioWeight}
                hasReferenceAudio={!!audioFile}
                hasPersona={!!selectedArtistId}
                model={model}
                onModelChange={setModel}
              />
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </ScrollArea>
        <SheetFooter className="p-3 sm:p-4 bg-background/95 backdrop-blur-xl border-t">
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-12 text-sm gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Сгенерировать
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* Unified Project and Track Selector */}
      <ProjectTrackSelector
        type={projectTrackStep}
        open={projectDialogOpen}
        onOpenChange={(open) => {
          setProjectDialogOpen(open);
          if (!open) {
            setProjectTrackStep('project');
          }
        }}
        projects={projects}
        tracks={projectTrackStep === 'track' ? projectTracks : undefined}
        selectedId={projectTrackStep === 'project' ? selectedProjectId : selectedTrackId}
        onSelect={projectTrackStep === 'project' ? handleProjectSelect : handleTrackSelect}
      />

      {/* Artist Selector */}
      <ArtistSelector
        open={artistDialogOpen}
        onOpenChange={setArtistDialogOpen}
        artists={artists}
        selectedArtistId={selectedArtistId}
        onSelect={(artistId) => {
          setSelectedArtistId(artistId);
          // Auto-switch to custom mode when artist selected
          if (artistId) {
            setMode('custom');
            // Pre-populate style from artist
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
        }}
      />

      {/* Audio Action Dialog */}
      <AudioActionDialog
        open={audioDialogOpen}
        onOpenChange={setAudioDialogOpen}
        onAudioSelected={(file) => {
          setAudioFile(file);
          setMode('custom'); // Auto-switch to custom mode
          toast.success('Аудио добавлено');
        }}
        onAnalysisComplete={(styleDescription) => {
          if (mode === 'custom') {
            setStyle(prevStyle => {
              const newStyle = prevStyle 
                ? `${prevStyle}\n\nАнализ референса:\n${styleDescription}`
                : styleDescription;
              toast.success('Стиль обновлен с результатами анализа');
              return newStyle;
            });
          }
        }}
      />

      {/* AI Lyrics Wizard */}
      <AILyricsWizard
        open={lyricsAssistantOpen}
        onOpenChange={setLyricsAssistantOpen}
        onLyricsGenerated={(newLyrics: string) => {
          setLyrics(newLyrics);
          setShowVisualEditor(true); // Toggle to visual editor to show lyrics
        }}
        onStyleGenerated={(generatedStyle: string) => {
          if (!style || style.length < generatedStyle.length) {
            setStyle(generatedStyle);
          }
        }}
        initialArtistId={selectedArtistId}
        initialArtistName={artists?.find(a => a.id === selectedArtistId)?.name}
        initialGenre={projects?.find(p => p.id === selectedProjectId)?.genre || undefined}
      />
      
      <UploadExtendDialog 
        open={uploadExtendOpen}
        onOpenChange={setUploadExtendOpen}
        projectId={selectedProjectId || initialProjectId}
      />
      
      <UploadCoverDialog 
        open={uploadCoverOpen}
        onOpenChange={setUploadCoverOpen}
        projectId={selectedProjectId || initialProjectId}
      />

      {/* Prompt History */}
      <PromptHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onSelectPrompt={(prompt) => {
          setMode(prompt.mode);
          if (prompt.mode === 'simple') {
            setDescription(prompt.description || '');
          } else {
            setTitle(prompt.title || '');
            setStyle(prompt.style || '');
            setLyrics(prompt.lyrics || '');
          }
          if (prompt.model) setModel(prompt.model);
        }}
      />
    </Sheet>
  );
};
