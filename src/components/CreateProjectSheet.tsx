import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Wand2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useNavigate } from 'react-router-dom';

interface CreateProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROJECT_TYPES = [
  { value: 'single', label: 'Сингл' },
  { value: 'ep', label: 'EP' },
  { value: 'album', label: 'Альбом' },
  { value: 'ost', label: 'OST' },
  { value: 'background_music', label: 'Фоновая музыка' },
  { value: 'jingle', label: 'Рекламный джингл' },
  { value: 'compilation', label: 'Компиляция' },
  { value: 'mixtape', label: 'Микстейп' },
];

export function CreateProjectSheet({ open, onOpenChange }: CreateProjectSheetProps) {
  const navigate = useNavigate();
  const { createProject, generateProjectConcept, isCreating, isGenerating } = useProjects();
  
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState('album');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [description, setDescription] = useState('');
  const [concept, setConcept] = useState('');
  const [theme, setTheme] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const handleManualCreate = () => {
    createProject(
      {
        title,
        project_type: projectType as any,
        genre: genre || null,
        mood: mood || null,
        description: description || null,
        concept: concept || null,
        target_audience: targetAudience || null,
        status: 'draft',
      },
      {
        onSuccess: (data) => {
          onOpenChange(false);
          navigate(`/projects/${data.id}`);
          resetForm();
        },
      }
    );
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
    setProjectType('album');
    setGenre('');
    setMood('');
    setDescription('');
    setConcept('');
    setTheme('');
    setTargetAudience('');
    setMode('manual');
  };

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
              <Label htmlFor="title">Название проекта *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите название..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Тип проекта</Label>
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
                <Label htmlFor="genre">Жанр</Label>
                <Input
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Hip-Hop, Pop..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood">Настроение</Label>
                <Input
                  id="mood"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="Энергичное, Меланхоличное..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept">Концепция</Label>
              <Textarea
                id="concept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Опишите концепцию проекта..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Дополнительное описание..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Целевая аудитория</Label>
              <Input
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Для кого этот проект..."
              />
            </div>

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
