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
}

export const UploadAudioDialog = ({ 
  open, 
  onOpenChange, 
  projectId,
  defaultMode = 'cover',
  prefillData
}: UploadAudioDialogProps) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'cover' | 'extend'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  
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
        body.continueAt = customMode ? continueAt : undefined;
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
  };

  // Model duration limits (in seconds) based on SunoAPI documentation
  const MODEL_DURATION_LIMITS: Record<string, number> = {
    'V5': 480,
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
            <TabsTrigger value="cover" className="gap-2">
              <Disc className="w-4 h-4" />
              Кавер
            </TabsTrigger>
            <TabsTrigger value="extend" className="gap-2">
              <Plus className="w-4 h-4" />
              Расширить
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            {mode === 'cover' 
              ? '🎵 Создайте новую версию песни с другим стилем, сохраняя мелодию'
              : '➕ Продолжите существующий трек, добавив к нему новую часть'
            }
          </div>

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

                {/* Advanced Settings */}
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
            <Button
              onClick={handleSubmit}
              disabled={loading || !audioFile}
              className="w-full gap-2"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'cover' ? 'Создание кавера...' : 'Расширение...'}
                </>
              ) : (
                <>
                  {mode === 'cover' ? <Disc className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {mode === 'cover' ? 'Создать кавер' : 'Расширить аудио'}
                </>
              )}
            </Button>
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
