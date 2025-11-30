import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Loader2, Zap as ZapIcon, Sliders, Coins, ChevronDown, Upload, User, FolderOpen, Music, Mic, FileAudio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProjects } from '@/hooks/useProjects';
import { useArtists } from '@/hooks/useArtists';
import { useTracks } from '@/hooks/useTracks';
import { UploadExtendDialog } from './UploadExtendDialog';
import { UploadCoverDialog } from './UploadCoverDialog';

interface GenerateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export const GenerateSheet = ({ open, onOpenChange, projectId: initialProjectId }: GenerateSheetProps) => {
  const { projects } = useProjects();
  const { artists } = useArtists();
  const { tracks: allTracks } = useTracks();

  const [mode, setMode] = useState<'simple' | 'custom'>('simple');
  const [loading, setLoading] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);
  const [uploadExtendOpen, setUploadExtendOpen] = useState(false);
  const [uploadCoverOpen, setUploadCoverOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  // Simple mode state
  const [description, setDescription] = useState('');
  
  // Custom mode state
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  const [hasVocals, setHasVocals] = useState(true); // Изменено на "с вокалом"
  
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
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | undefined>();
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Dialogs
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [personaDialogOpen, setPersonaDialogOpen] = useState(false);
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);

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

  // Автозаполнение при выборе трека
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
    setTrackDialogOpen(false);
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
    } catch (error: any) {
      console.error('Boost error:', error);
      
      if (error.message?.includes('429') || error.message?.includes('кредитов')) {
        toast.error('Недостаточно кредитов', {
          description: 'Пополните баланс SunoAPI',
        });
      } else {
        toast.error('Ошибка улучшения', {
          description: error.message || 'Попробуйте еще раз',
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
      toast.error('Пожалуйста, опишите музыку');
      return;
    }

    if (mode === 'custom' && !style) {
      toast.error('Пожалуйста, укажите стиль музыки');
      return;
    }

    if (mode === 'custom' && hasVocals && !lyrics) {
      toast.error('Пожалуйста, добавьте лирику или отключите вокал');
      return;
    }

    setLoading(true);
    try {
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
          audioWeight: (audioFile || selectedPersonaId) ? audioWeight[0] : undefined,
          personaId: selectedPersonaId,
          projectId: selectedProjectId || initialProjectId,
        },
      });

      if (error) throw error;

      toast.success('Генерация началась! 🎵', {
        description: 'Ваш трек появится в библиотеке через 1-3 минуты',
      });

      // Reset form and close
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
      setSelectedPersonaId(undefined);
      setAudioFile(null);
      onOpenChange(false);
      
      // Refresh credits
      const { data: creditsData } = await supabase.functions.invoke('suno-credits');
      if (creditsData?.credits !== undefined) {
        setCredits(creditsData.credits);
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      
      if (error.message?.includes('429') || error.message?.includes('credits')) {
        toast.error('Недостаточно кредитов', {
          description: 'Пополните баланс SunoAPI для продолжения',
        });
      } else {
        toast.error('Ошибка генерации', {
          description: error.message || 'Попробуйте еще раз',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const modelInfo = {
    V5: { name: 'V5', desc: 'Новейшая модель, быстрая генерация', emoji: '🚀' },
    V4_5PLUS: { name: 'V4.5+', desc: 'Богатый звук, до 8 мин', emoji: '💎' },
    V4_5ALL: { name: 'V4.5 All', desc: 'Лучшая структура, до 8 мин', emoji: '🎯' },
    V4_5: { name: 'V4.5', desc: 'Быстро, качественно, до 8 мин', emoji: '⚡' },
    V4: { name: 'V4', desc: 'Классика, до 4 мин', emoji: '🎵' },
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                MusicVerse AI
              </SheetTitle>
              <p className="text-sm text-muted-foreground">Генератор музыки SunoAPI</p>
            </div>
            
            {credits !== null && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card border border-primary/20">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{credits}</span>
                <span className="text-xs text-muted-foreground">кредитов</span>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'simple' | 'custom')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simple" className="gap-2">
                <ZapIcon className="w-4 h-4" />
                Простой
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2">
                <Sliders className="w-4 h-4" />
                Продвинутый
              </TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground text-center py-2">
                Быстрая генерация одним нажатием
              </p>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="description" className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Опишите вашу музыку
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBoostStyle}
                    disabled={boostLoading || !description}
                    className="gap-2"
                  >
                    {boostLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Улучшение...
                      </>
                    ) : (
                      <>
                        <ZapIcon className="w-3 h-3" />
                        Улучшить
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="Энергичный электронный трек с мощным басом и синтезаторами"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Опишите стиль, настроение, инструменты или атмосферу, которую вы хотите
                </p>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              {/* Model & Reference Buttons */}
              <div className="space-y-3">
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(modelInfo).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        {info.emoji} {info.name} - {info.desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => document.getElementById('audio-upload')?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Аудио
                    {audioFile && <Badge variant="secondary" className="ml-1">1</Badge>}
                  </Button>
                  <input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAudioFile(file);
                        toast.success('Аудио загружено');
                      }
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setPersonaDialogOpen(true)}
                  >
                    <User className="w-4 h-4" />
                    Персона
                    {selectedPersonaId && <Badge variant="secondary" className="ml-1">1</Badge>}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setProjectDialogOpen(true)}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Проект
                    {selectedProjectId && <Badge variant="secondary" className="ml-1">1</Badge>}
                  </Button>
                </div>

                {selectedProjectId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setTrackDialogOpen(true)}
                  >
                    <Music className="w-4 h-4" />
                    Выбрать трек из проекта
                  </Button>
                )}
              </div>

              <div>
                <Label htmlFor="title">Название (опционально)</Label>
                <Input
                  id="title"
                  placeholder="Автоматически, если пусто"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                  maxLength={100}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="style" className="text-base flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    Описание стиля
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBoostStyle}
                    disabled={boostLoading || !style}
                    className="gap-2"
                  >
                    {boostLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Улучшение...
                      </>
                    ) : (
                      <>
                        <ZapIcon className="w-3 h-3" />
                        Улучшить
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="style"
                  placeholder="Опишите стиль, жанр, настроение... например, энергичная электроника с синт-лидами, 128 BPM"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  rows={3}
                  className="mt-2 resize-none"
                  maxLength={1000}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg glass border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Mic className="w-4 h-4 text-primary" />
                  </div>
                  <Label htmlFor="vocals-toggle" className="cursor-pointer font-medium">
                    С вокалом
                  </Label>
                </div>
                <Switch
                  id="vocals-toggle"
                  checked={hasVocals}
                  onCheckedChange={setHasVocals}
                />
              </div>

              {hasVocals && (
                <div>
                  <Label htmlFor="lyrics" className="text-base flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4" />
                    Лирика
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Используйте [VERSE], [CHORUS] и т.д. для структуры. Добавляйте (guitar), (emotion: sad) для тегов.
                  </p>
                  <Textarea
                    id="lyrics"
                    placeholder="[VERSE]&#10;Потерянный в ритме ночи&#10;Танцуя под неоновым светом (synth)&#10;(energy: high)&#10;&#10;[CHORUS]&#10;Мы живы, мы свободны (vocal: powerful)&#10;Это то место, где мы должны быть"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    rows={10}
                    className="mt-2 font-mono text-sm resize-none"
                    maxLength={5000}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Advanced Settings */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="border-t pt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-semibold hover:bg-transparent">
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Расширенные настройки
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">

            {/* Vocal Gender */}
            {hasVocals && (
              <div>
                <Label htmlFor="vocal-gender">Пол вокала (опционально)</Label>
                <Select value={vocalGender || "auto"} onValueChange={(v) => setVocalGender(v === "auto" ? '' : v as 'm' | 'f')}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Автоматически" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Автоматически</SelectItem>
                    <SelectItem value="m">Мужской</SelectItem>
                    <SelectItem value="f">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Style Weight */}
            <div>
              <div className="flex justify-between mb-2">
                <Label>Вес стиля</Label>
                <Badge variant="outline">{styleWeight[0].toFixed(2)}</Badge>
              </div>
              <Slider
                value={styleWeight}
                onValueChange={setStyleWeight}
                min={0}
                max={1}
                step={0.01}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Насколько точно следовать стилю
              </p>
            </div>

            {/* Creativity */}
            <div>
              <div className="flex justify-between mb-2">
                <Label>Креативность</Label>
                <Badge variant="outline">{weirdnessConstraint[0].toFixed(2)}</Badge>
              </div>
              <Slider
                value={weirdnessConstraint}
                onValueChange={setWeirdnessConstraint}
                min={0}
                max={1}
                step={0.01}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Уровень экспериментальности и уникальности
              </p>
            </div>

            {/* Audio Weight */}
            {(audioFile || selectedPersonaId) && (
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Сила воздействия референсного аудио</Label>
                  <Badge variant="outline">{audioWeight[0].toFixed(2)}</Badge>
                </div>
                <Slider
                  value={audioWeight}
                  onValueChange={setAudioWeight}
                  min={0}
                  max={1}
                  step={0.01}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Насколько сильно влияет загруженное аудио или персона
                </p>
              </div>
            )}

            {/* Negative Tags */}
            <div>
              <Label htmlFor="negative-tags">Исключить (negative tags)</Label>
              <Input
                id="negative-tags"
                placeholder="heavy metal, screaming, aggressive"
                value={negativeTags}
                onChange={(e) => setNegativeTags(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Стили и элементы, которые нужно избежать
              </p>
            </div>
            </CollapsibleContent>
          </Collapsible>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            size="lg"
            className="w-full h-14 text-base gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Создать трек
                <Badge variant="secondary" className="ml-2">1 кредит</Badge>
              </>
            )}
          </Button>

          <Button
            onClick={() => setUploadExtendOpen(true)}
            variant="outline"
            size="lg"
            className="w-full h-14 text-base gap-2"
          >
            <FileAudio className="w-5 h-5" />
            Загрузить и расширить аудио
          </Button>

          <Button
            onClick={() => setUploadCoverOpen(true)}
            variant="outline"
            size="lg"
            className="w-full h-14 text-base gap-2"
          >
            <Mic className="w-5 h-5" />
            Создать кавер аудио
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Генерация обычно занимает 1-3 минуты
          </p>
        </div>
      </SheetContent>

      {/* Project Selection Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выбрать проект</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {projects?.map((project) => (
              <Button
                key={project.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setProjectDialogOpen(false);
                  toast.success(`Проект "${project.title}" выбран`);
                }}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                {project.title}
              </Button>
            ))}
            {!projects?.length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет доступных проектов
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Persona Selection Dialog */}
      <Dialog open={personaDialogOpen} onOpenChange={setPersonaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выбрать персону</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {artists?.map((artist) => (
              <Button
                key={artist.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedPersonaId(artist.suno_persona_id || undefined);
                  setPersonaDialogOpen(false);
                  toast.success(`Персона "${artist.name}" выбрана`);
                }}
                disabled={!artist.suno_persona_id}
              >
                <User className="w-4 h-4 mr-2" />
                {artist.name}
                {!artist.suno_persona_id && (
                  <span className="text-xs text-muted-foreground ml-2">(нет persona ID)</span>
                )}
              </Button>
            ))}
            {!artists?.length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет доступных персон
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Track Selection Dialog */}
      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выбрать трек</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {allTracks?.filter(t => t.project_id === selectedProjectId).map((track) => (
              <Button
                key={track.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleTrackSelect(track.id)}
              >
                <Music className="w-4 h-4 mr-2" />
                {track.title || 'Без названия'}
              </Button>
            ))}
            {!allTracks?.filter(t => t.project_id === selectedProjectId).length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет треков в выбранном проекте
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
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
    </Sheet>
  );
};