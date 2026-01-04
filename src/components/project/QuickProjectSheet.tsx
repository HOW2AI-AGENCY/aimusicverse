import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sparkles, FolderPlus, Music, Disc3, Album, LayoutTemplate } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTelegramMainButton } from '@/hooks/telegram/useTelegramMainButton';
import { ProjectTemplateSelector, PROJECT_TEMPLATES, ProjectTemplate } from './ProjectTemplateSelector';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuickProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROJECT_TYPES = [
  { value: 'album', label: 'Альбом', icon: Album, description: '8-12 треков' },
  { value: 'ep', label: 'EP', icon: Disc3, description: '4-6 треков' },
  { value: 'single', label: 'Сингл', icon: Music, description: '1-3 трека' },
] as const;

const QUICK_GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'R&B', 'Indie'];

export function QuickProjectSheet({ open, onOpenChange }: QuickProjectSheetProps) {
  const navigate = useNavigate();
  const { createProject, isCreating } = useProjects();
  
  const [mode, setMode] = useState<'custom' | 'template'>('template');
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState<'album' | 'ep' | 'single'>('album');
  const [genre, setGenre] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  
  const isCustomValid = title.trim().length >= 2;
  const isTemplateValid = selectedTemplate !== null;
  const isValid = mode === 'custom' ? isCustomValid : isTemplateValid;
  
  const handleCreate = () => {
    if (!isValid || isCreating) return;
    
    if (mode === 'template' && selectedTemplate) {
      createProject({
        title: selectedTemplate.name,
        project_type: selectedTemplate.trackCount >= 7 ? 'album' : selectedTemplate.trackCount >= 4 ? 'ep' : 'single',
        genre: selectedTemplate.genre || undefined,
        mood: selectedTemplate.mood || undefined,
        concept: selectedTemplate.concept || undefined,
        status: 'draft',
      }, {
        onSuccess: (result) => {
          toast.success('Проект создан из шаблона!');
          onOpenChange(false);
          if (result?.id) {
            navigate(`/projects/${result.id}`);
          }
        },
      });
    } else {
      createProject({
        title: title.trim(),
        project_type: projectType,
        genre: genre || undefined,
        status: 'draft',
      }, {
        onSuccess: (result) => {
          toast.success('Проект создан!');
          onOpenChange(false);
          if (result?.id) {
            navigate(`/projects/${result.id}`);
          }
        },
      });
    }
  };
  
  // Telegram MainButton integration
  const { shouldShowUIButton } = useTelegramMainButton({
    text: isCreating ? 'Создание...' : 'СОЗДАТЬ ПРОЕКТ',
    onClick: handleCreate,
    enabled: isValid && !isCreating,
    visible: open,
  });
  
  const resetForm = () => {
    setTitle('');
    setProjectType('album');
    setGenre('');
    setSelectedTemplate(null);
    setMode('template');
  };
  
  return (
    <Sheet 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-3">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <FolderPlus className="w-5 h-5 text-primary" />
            Новый проект
          </SheetTitle>
        </SheetHeader>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'custom' | 'template')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9 mb-4">
            <TabsTrigger value="template" className="text-xs gap-1.5">
              <LayoutTemplate className="w-3.5 h-3.5" />
              Шаблоны
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Свой
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="template" className="mt-0 space-y-4">
            <ProjectTemplateSelector
              onSelect={setSelectedTemplate}
              selectedId={selectedTemplate?.id}
            />
            
            {selectedTemplate && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedTemplate.name}</span>
                  {' • '}{selectedTemplate.trackCount} треков{' • '}
                  {selectedTemplate.genre}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  {selectedTemplate.concept}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="custom" className="mt-0 space-y-4">
            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="project-title" className="text-sm font-medium">
                Название
              </Label>
              <Input
                id="project-title"
                placeholder="Мой новый альбом"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11"
                autoFocus={mode === 'custom'}
              />
            </div>
            
            {/* Project Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Тип проекта</Label>
              <RadioGroup
                value={projectType}
                onValueChange={(v) => setProjectType(v as typeof projectType)}
                className="grid grid-cols-3 gap-2"
              >
                {PROJECT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Label
                      key={type.value}
                      htmlFor={`type-${type.value}`}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all",
                        projectType === type.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem
                        value={type.value}
                        id={`type-${type.value}`}
                        className="sr-only"
                      />
                      <Icon className={cn(
                        "w-5 h-5",
                        projectType === type.value ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-xs font-medium">{type.label}</span>
                      <span className="text-[10px] text-muted-foreground">{type.description}</span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>
            
            {/* Quick Genre Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Жанр (опционально)</Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_GENRES.map((g) => (
                  <Button
                    key={g}
                    type="button"
                    variant={genre === g ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGenre(genre === g ? '' : g)}
                    className="h-7 px-2.5 text-xs rounded-full"
                  >
                    {g}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Hint */}
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-4">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          AI поможет сгенерировать концепцию и треклист
        </p>
        
        {/* UI Button fallback (for non-Telegram users) */}
        {shouldShowUIButton && (
          <Button
            onClick={handleCreate}
            disabled={!isValid || isCreating}
            className="w-full h-12 text-base font-semibold gap-2 mt-4"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                Создание...
              </>
            ) : (
              <>
                <FolderPlus className="w-5 h-5" />
                Создать проект
              </>
            )}
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
