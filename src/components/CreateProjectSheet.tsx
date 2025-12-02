import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Wand2, HelpCircle, Upload, Music, User, Plus, Image as ImageIcon, Lock, Globe } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useArtists } from '@/hooks/useArtists';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

interface CreateProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROJECT_TYPES = [
  { value: 'single', label: 'Сингл', description: 'Один трек или 2-3 версии' },
  { value: 'ep', label: 'EP', description: '3-6 треков, мини-альбом' },
  { value: 'album', label: 'Альбом', description: '7+ треков, полноценный релиз' },
  { value: 'ost', label: 'OST', description: 'Саундтрек к фильму/игре' },
  { value: 'background_music', label: 'Фоновая музыка', description: 'Для видео, подкастов, стримов' },
  { value: 'jingle', label: 'Рекламный джингл', description: 'Короткая запоминающаяся мелодия' },
  { value: 'compilation', label: 'Компиляция', description: 'Сборник треков' },
  { value: 'mixtape', label: 'Микстейп', description: 'Неформальный релиз' },
];

const GENRES = [
  'Hip-Hop', 'Pop', 'Rock', 'Electronic', 'R&B', 'Jazz', 'Classical',
  'Country', 'Metal', 'Folk', 'Reggae', 'Blues', 'Soul', 'Funk',
  'Trap', 'House', 'Techno', 'Ambient', 'Drum & Bass', 'Dubstep'
];

const MOODS = [
  'Энергичное', 'Спокойное', 'Меланхоличное', 'Радостное', 'Агрессивное',
  'Романтичное', 'Мотивирующее', 'Расслабляющее', 'Мрачное', 'Эйфоричное',
  'Грустное', 'Веселое', 'Напряженное', 'Мечтательное', 'Ностальгическое'
];

export function CreateProjectSheet({ open, onOpenChange }: CreateProjectSheetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createProject, generateProjectConcept, isCreating, isGenerating } = useProjects();
  const { artists, createArtist, isCreating: isCreatingArtist } = useArtists();
  
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [title, setTitle] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [projectType, setProjectType] = useState('album');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [description, setDescription] = useState('');
  const [concept, setConcept] = useState('');
  const [theme, setTheme] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [primaryArtistId, setPrimaryArtistId] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [language, setLanguage] = useState('ru');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [newArtistName, setNewArtistName] = useState('');
  const [showNewArtist, setShowNewArtist] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is premium or admin on mount
  useEffect(() => {
    if (user) {
      supabase.rpc('is_premium_or_admin', { _user_id: user.id })
        .then(({ data }) => {
          setIsPremiumUser(!!data);
          // Premium users default to private projects
          setIsPublic(!data);
        });
    }
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${supabase.auth.getUser()}/covers/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(filePath);

      setCoverUrl(publicUrl);
      toast.success('Обложка загружена');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки обложки');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!title) {
      toast.error('Сначала введите название проекта');
      return;
    }
    
    try {
      setIsGeneratingCover(true);
      
      const prompt = `Create a professional music album cover for a ${projectType} project titled "${title}". 
        Genre: ${genre || 'various'}. Mood: ${mood || 'creative'}. 
        Style: modern, artistic, high quality, professional music cover art.
        ${concept ? `Concept: ${concept}` : ''}`;

      // Note: We'll upload cover during project creation
      // For now just generate the image URL
      const { data, error } = await supabase.functions.invoke('generate-cover-image', {
        body: { 
          projectId: crypto.randomUUID(), // Temporary ID
          prompt, 
          genre, 
          mood 
        },
      });

      if (error) throw error;
      
      if (data?.coverUrl) {
        setCoverUrl(data.coverUrl);
        toast.success('Обложка сгенерирована');
      }
    } catch (error) {
      console.error('Generate error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка генерации обложки';
      toast.error(errorMessage);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleCreateNewArtist = () => {
    if (!newArtistName.trim()) {
      toast.error('Введите имя артиста');
      return;
    }

    createArtist(
      { name: newArtistName },
      {
        onSuccess: (data) => {
          setPrimaryArtistId(data.id);
          setNewArtistName('');
          setShowNewArtist(false);
          toast.success('Артист создан');
        },
      }
    );
  };

  const handleManualCreate = async () => {
    try {
      // Auto-generate cover if not provided
      let finalCoverUrl = coverUrl;
      if (!finalCoverUrl && title) {
        setIsGeneratingCover(true);
        try {
          const prompt = `Create a professional music album cover for a ${projectType} project titled "${title}". 
            Genre: ${genre || 'various'}. Mood: ${mood || 'creative'}. 
            Style: modern, artistic, high quality, professional music cover art.
            ${concept ? `Concept: ${concept}` : ''}`;

          const tempProjectId = crypto.randomUUID();
          const { data: coverData, error: coverError } = await supabase.functions.invoke('generate-cover-image', {
            body: { 
              projectId: tempProjectId,
              prompt, 
              genre, 
              mood 
            },
          });

          if (!coverError && coverData?.coverUrl) {
            finalCoverUrl = coverData.coverUrl;
          }
        } catch (err) {
          console.error('Auto-generate cover error:', err);
          // Continue without cover
        } finally {
          setIsGeneratingCover(false);
        }
      }

      createProject(
        {
          title,
          project_type: projectType as any,
          genre: genre || null,
          mood: mood || null,
          description: description || null,
          concept: concept || null,
          target_audience: targetAudience || null,
          primary_artist_id: primaryArtistId || null,
          cover_url: finalCoverUrl || null,
          status: 'draft',
          ai_context: titleRu ? { title_ru: titleRu } : null,
          is_public: isPublic,
          language: language,
        },
        {
          onSuccess: (data) => {
            onOpenChange(false);
            navigate(`/projects/${data.id}`);
            resetForm();
          },
        }
      );
    } catch (error) {
      console.error('Create project error:', error);
      toast.error('Ошибка создания проекта');
    }
  };

  const handleAIGenerate = () => {
    generateProjectConcept(
      {
        projectType,
        genre: genre || undefined,
        mood: mood || undefined,
        theme: theme || undefined,
        targetAudience: targetAudience || undefined,
      },
      {
        onSuccess: (result) => {
          if (result.data) {
            // Apply AI-generated concept
            setTitle(result.data.titleSuggestions?.[0] || '');
            setConcept(result.data.concept || '');
            setDescription(result.data.visualAesthetic || '');
            setMode('manual');
          }
        },
      }
    );
  };

  const resetForm = () => {
    setTitle('');
    setTitleRu('');
    setProjectType('album');
    setGenre('');
    setMood('');
    setDescription('');
    setConcept('');
    setTheme('');
    setTargetAudience('');
    setPrimaryArtistId('');
    setCoverUrl('');
    setNewArtistName('');
    setShowNewArtist(false);
    setMode('manual');
    setLanguage('ru');
  };

  const FieldHelp = ({ text }: { text: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs text-sm" side={isMobile ? "bottom" : "top"} align="start">
        <p>{text}</p>
      </PopoverContent>
    </Popover>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Создать новый проект
          </SheetTitle>
          <SheetDescription>
            Создайте проект вручную или используйте ИИ для генерации концепции
          </SheetDescription>
        </SheetHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Вручную</TabsTrigger>
            <TabsTrigger value="ai">
              <Wand2 className="w-4 h-4 mr-2" />
              С ИИ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="title">Название проекта *</Label>
                <FieldHelp text="Основное название вашего проекта. Можно изменить позже." />
              </div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите название..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="title-ru">Русское название</Label>
                <FieldHelp text="Перевод названия на русский язык для локализации." />
              </div>
              <Input
                id="title-ru"
                value={titleRu}
                onChange={(e) => setTitleRu(e.target.value)}
                placeholder="Русский перевод названия..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="type">Тип проекта</Label>
                <FieldHelp text="Выберите формат релиза. Это влияет на рекомендации по количеству треков и структуре." />
              </div>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="language">Язык проекта</Label>
                <FieldHelp text="Выберите язык для AI-генерируемого контента проекта. Весь контент будет создаваться на выбранном языке." />
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="ru">
                    <div className="flex items-center gap-2">
                      <span>🇷🇺</span>
                      <span>Русский</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      <span>🇬🇧</span>
                      <span>English</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Обложка проекта</Label>
                <FieldHelp text="Загрузите готовую обложку или сгенерируйте с помощью ИИ на основе концепции проекта." />
              </div>
              <div className="flex gap-2">
                {coverUrl ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-primary/20">
                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCoverUrl('')}
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 hover:bg-background"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingCover ? 'Загрузка...' : 'Загрузить обложку'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateCover}
                    disabled={isGeneratingCover || !title}
                    className="gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    {isGeneratingCover ? 'Генерация...' : 'Сгенерировать с ИИ'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Главный артист</Label>
                <FieldHelp text="Выберите основного артиста проекта или создайте нового. Артист может быть реальным музыкантом или AI-персоной." />
              </div>
              {!showNewArtist ? (
                <>
                  <Select value={primaryArtistId} onValueChange={setPrimaryArtistId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Выберите артиста..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {artists?.map((artist) => (
                        <SelectItem key={artist.id} value={artist.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={artist.avatar_url || ''} />
                              <AvatarFallback>
                                <User className="w-3 h-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span>{artist.name}</span>
                            {artist.is_ai_generated && (
                              <span className="text-xs text-primary">AI</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewArtist(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Создать нового артиста
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newArtistName}
                    onChange={(e) => setNewArtistName(e.target.value)}
                    placeholder="Имя артиста..."
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateNewArtist()}
                  />
                  <Button
                    type="button"
                    onClick={handleCreateNewArtist}
                    disabled={isCreatingArtist || !newArtistName}
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowNewArtist(false);
                      setNewArtistName('');
                    }}
                    size="sm"
                  >
                    Отмена
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="genre">Жанр</Label>
                  <FieldHelp text="Основной музыкальный жанр проекта. Можно указать несколько через запятую." />
                </div>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Выберите жанр..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50 max-h-60">
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="mood">Настроение</Label>
                  <FieldHelp text="Общая эмоциональная атмосфера проекта." />
                </div>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Выберите настроение..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50 max-h-60">
                    {MOODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="concept">Концепция</Label>
                <FieldHelp text="Общая идея и направление проекта. Что вы хотите донести через музыку?" />
              </div>
              <Textarea
                id="concept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Опишите концепцию проекта..."
                rows={3}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="description">Описание</Label>
                <FieldHelp text="Дополнительная информация о проекте, визуальном стиле, истории создания." />
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Дополнительное описание..."
                rows={3}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="audience">Целевая аудитория</Label>
                <FieldHelp text="Для кого предназначен проект? Возраст, интересы, музыкальные предпочтения." />
              </div>
              <Input
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Для кого этот проект..."
                className="bg-background"
              />
            </div>

            {/* Public/Private Toggle - only for premium users */}
            {isPremiumUser && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {isPublic ? <Globe className="w-5 h-5 text-green-500" /> : <Lock className="w-5 h-5 text-orange-500" />}
                  <div>
                    <Label htmlFor="is-public" className="cursor-pointer">
                      {isPublic ? 'Публичный проект' : 'Приватный проект'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isPublic ? 'Виден всем пользователям' : 'Виден только вам'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            )}

            <Button
              onClick={handleManualCreate}
              disabled={!title || isCreating}
              className="w-full"
            >
              {isCreating ? 'Создание...' : 'Создать проект'}
            </Button>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ai-type">Тип проекта</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ai-genre">Жанр</Label>
                <Input
                  id="ai-genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Hip-Hop, Pop..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-mood">Настроение</Label>
                <Input
                  id="ai-mood"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="Энергичное..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-theme">Тема *</Label>
              <Input
                id="ai-theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="О чем проект..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-audience">Целевая аудитория</Label>
              <Input
                id="ai-audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Для кого..."
              />
            </div>

            <Button
              onClick={handleAIGenerate}
              disabled={!theme || isGenerating}
              className="w-full gap-2"
            >
              <Wand2 className="w-4 h-4" />
              {isGenerating ? 'Генерация концепции...' : 'Сгенерировать концепцию'}
            </Button>

            {concept && (
              <div className="p-4 glass-card border-primary/20 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground mb-2">ИИ создал концепцию:</p>
                <p className="text-sm">{concept}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
