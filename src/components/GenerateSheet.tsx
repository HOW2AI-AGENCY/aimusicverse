import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Zap as ZapIcon, Sliders, Coins, Mic, FileAudio, FolderOpen, User, Music2, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/useProjects';
import { useArtists } from '@/hooks/useArtists';
import { useTracks } from '@/hooks/useTracks';
import { UploadExtendDialog } from './UploadExtendDialog';
import { UploadCoverDialog } from './UploadCoverDialog';
import { AudioReferenceUpload } from './generate-form/AudioReferenceUpload';
import { ArtistSelector } from './generate-form/ArtistSelector';
import { ProjectTrackSelector } from './generate-form/ProjectTrackSelector';
import { AdvancedSettings } from './generate-form/AdvancedSettings';
import { LyricsVisualEditor } from './generate-form/LyricsVisualEditor';
import { PromptHistory, savePromptToHistory } from './generate-form/PromptHistory';

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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  
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
          projectId: selectedProjectId || initialProjectId,
        },
      });

      if (error) throw error;

      toast.success('Генерация началась! 🎵', {
        description: 'Ваш трек появится в библиотеке через 1-3 минуты',
      });

      // Reset form and close
      resetForm();
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
  };

  const modelInfo = {
    V5: { name: 'V5', desc: 'Новейшая модель, быстрая генерация', emoji: '🚀' },
    V4_5PLUS: { name: 'V4.5+', desc: 'Богатый звук, до 8 мин', emoji: '💎' },
    V4_5ALL: { name: 'V4.5 All', desc: 'Лучшая структура, до 8 мин', emoji: '🎯' },
    V4_5: { name: 'V4.5', desc: 'Быстро, качественно, до 8 мин', emoji: '⚡' },
    V4: { name: 'V4', desc: 'Классика, до 4 мин', emoji: '🎵' },
  };

  const projectTracks = selectedProjectId 
    ? allTracks?.filter(t => t.project_id === selectedProjectId) 
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Создать трек
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {/* Header with credits, history and mode toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {credits !== null && (
                <Button variant="secondary" size="sm" className="rounded-full px-4 gap-2">
                  <Coins className="w-4 h-4" />
                  <span className="font-semibold">{credits.toFixed(2)}</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryOpen(true)}
                className="gap-2"
              >
                <History className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-secondary/50">
              <Button
                variant={mode === 'simple' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('simple')}
                className="rounded-md px-4"
              >
                Simple
              </Button>
              <Button
                variant={mode === 'custom' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('custom')}
                className="rounded-md px-4"
              >
                Custom
              </Button>
            </div>

            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(modelInfo).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 gap-2 border-2"
              onClick={() => setProjectDialogOpen(true)}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Проект</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 gap-2 border-2"
              onClick={() => setArtistDialogOpen(true)}
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Персона</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 gap-2 border-2"
              onClick={() => setTrackDialogOpen(true)}
            >
              <FileAudio className="w-4 h-4" />
              <span className="text-sm font-medium">Трек</span>
            </Button>
          </div>

          {/* Audio Reference Upload */}
          <AudioReferenceUpload
            audioFile={audioFile}
            onAudioChange={setAudioFile}
            onAnalysisComplete={(styleDescription) => {
              // Update style field with analysis results
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

          {/* Simple Mode */}
          {mode === 'simple' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="description" className="text-sm text-muted-foreground">
                    Описание музыки
                  </Label>
                </div>
                <Textarea
                  id="description"
                  placeholder="e.g., Спокойный лоу-фай бит с джазовым пианино..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="resize-none text-base"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">0/500</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBoostStyle}
                    disabled={boostLoading || !description}
                    className="gap-2"
                  >
                    {boostLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="simple-title" className="text-sm text-muted-foreground">
                  Название трека <span className="text-xs">(опционально)</span>
                </Label>
                <Input
                  id="simple-title"
                  placeholder="Оставьте пустым для автогенерации"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Custom Mode */}
          {mode === 'custom' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="title" className="text-sm text-muted-foreground">
                    Название
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs">AI</span>
                  </Button>
                </div>
                <Input
                  id="title"
                  placeholder="Авто-генерация если пусто"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base"
                />
              </div>

              <div>
                <Label htmlFor="style" className="text-sm text-muted-foreground border-l-2 border-primary pl-2">
                  Описание стиля
                </Label>
                <Textarea
                  id="style"
                  placeholder="Опишите стиль, жанр, настроение..."
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  rows={4}
                  className="mt-2 resize-none text-base"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">0/3000</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBoostStyle}
                    disabled={boostLoading || !style}
                    className="gap-2"
                  >
                    {boostLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Lyrics Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Lyrics</Label>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={() => setShowVisualEditor(!showVisualEditor)}
                    >
                      <span className="text-xs">{showVisualEditor ? 'Text' : 'Visual'}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <span className="text-xs">AI</span>
                    </Button>
                  </div>
                </div>
                
                {showVisualEditor ? (
                  <LyricsVisualEditor
                    value={lyrics}
                    onChange={setLyrics}
                  />
                ) : (
                  <Textarea
                    placeholder="Введите текст песни или используйте AI генерацию..."
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    rows={6}
                    className="resize-none text-base"
                  />
                )}
              </div>

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
              />

              <div className="flex items-center justify-between p-4 rounded-lg border border-border/30">
                <div className="flex items-center gap-3">
                  <Mic className="w-4 h-4" />
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
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            size="lg"
            className="w-full h-14 text-base gap-2 bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Создать музыку
              </>
            ) : (
              <>
                <Music2 className="w-5 h-5" />
                Создать
              </>
            )}
          </Button>
        </div>
      </SheetContent>

      {/* Project Selector */}
      <ProjectTrackSelector
        type="project"
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        projects={projects}
        selectedId={selectedProjectId}
        onSelect={setSelectedProjectId}
      />

      {/* Artist Selector */}
      <ArtistSelector
        open={artistDialogOpen}
        onOpenChange={setArtistDialogOpen}
        artists={artists}
        selectedArtistId={selectedArtistId}
        onSelect={setSelectedArtistId}
      />

      {/* Track Selector */}
      <ProjectTrackSelector
        type="track"
        open={trackDialogOpen}
        onOpenChange={setTrackDialogOpen}
        tracks={projectTracks}
        selectedId={selectedTrackId}
        onSelect={handleTrackSelect}
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
