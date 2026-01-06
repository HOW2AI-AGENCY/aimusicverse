import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects, Project } from '@/hooks/useProjects';
import { Save, Image, ImageIcon, Sparkles, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectCoverEditor } from './ProjectCoverEditor';
import { ProjectBannerEditor } from './ProjectBannerEditor';
import { VisualStyleEditor } from './VisualStyleEditor';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProjectSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export const ProjectSettingsSheet = ({ open, onOpenChange, project }: ProjectSettingsSheetProps) => {
  const { updateProject, isUpdating } = useProjects();
  const queryClient = useQueryClient();
  const [bannerEditorOpen, setBannerEditorOpen] = useState(false);
  const [isSavingStyle, setIsSavingStyle] = useState(false);
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || '',
    genre: project.genre || '',
    mood: project.mood || '',
    status: project.status || 'draft',
    language: project.language || 'ru',
    concept: project.concept || '',
  });

  const handleSave = () => {
    updateProject({
      id: project.id,
      updates: formData,
    });
    toast.success('Проект обновлен');
    onOpenChange(false);
  };

  const handleCoverUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const handleBannerUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    setBannerEditorOpen(false);
    toast.success('Баннер обновлен');
  };

  const handleVisualStyleSave = async (data: {
    visual_aesthetic?: string;
    color_palette?: { primary?: string; secondary?: string; accent?: string; background?: string; [key: string]: string | undefined };
    typography_style?: string;
    image_style?: string;
    visual_keywords?: string[];
  }) => {
    setIsSavingStyle(true);
    try {
      const { error } = await supabase
        .from('music_projects')
        .update(data)
        .eq('id', project.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Визуальный стиль сохранен');
    } catch (error) {
      console.error('Error saving visual style:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setIsSavingStyle(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader className="pb-4 shrink-0">
          <SheetTitle>Настройки проекта</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="general" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 mb-4 shrink-0">
            <TabsTrigger value="general" className="text-xs">Основные</TabsTrigger>
            <TabsTrigger value="style" className="text-xs gap-1">
              <Palette className="w-3 h-3" />
              Стиль
            </TabsTrigger>
            <TabsTrigger value="cover" className="text-xs">Обложка</TabsTrigger>
            <TabsTrigger value="banner" className="text-xs">Баннер</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            <TabsContent value="general" className="space-y-4 mt-0">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Описание проекта..."
                />
              </div>

              {/* Genre & Mood */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="genre">Жанр</Label>
                  <Input
                    id="genre"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="Pop, Rock..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mood">Настроение</Label>
                  <Input
                    id="mood"
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    placeholder="Энергичный..."
                  />
                </div>
              </div>

              {/* Language & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Язык</Label>
                  <Select 
                    value={formData.language} 
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Черновик</SelectItem>
                      <SelectItem value="in_progress">В работе</SelectItem>
                      <SelectItem value="completed">Завершен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Concept */}
              <div className="space-y-2">
                <Label htmlFor="concept">Концепция</Label>
                <Textarea
                  id="concept"
                  value={formData.concept}
                  onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                  rows={3}
                  placeholder="Опишите концепцию проекта..."
                />
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSave} 
                disabled={isUpdating}
                className="w-full gap-2"
              >
                <Save className="w-4 h-4" />
                Сохранить
              </Button>
            </TabsContent>

            {/* Visual Style Tab */}
            <TabsContent value="style" className="mt-0">
              <VisualStyleEditor
                visualAesthetic={(project as any).visual_aesthetic}
                colorPalette={(project as any).color_palette}
                typographyStyle={(project as any).typography_style}
                imageStyle={(project as any).image_style}
                visualKeywords={(project as any).visual_keywords}
                onSave={handleVisualStyleSave}
                isSaving={isSavingStyle}
              />
            </TabsContent>

            <TabsContent value="cover" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Обложка проекта
                </Label>
                <p className="text-sm text-muted-foreground">
                  Квадратная обложка (1:1) для отображения в списках и карточках
                </p>
              </div>
              <ProjectCoverEditor
                projectId={project.id}
                currentCoverUrl={project.cover_url}
                projectTitle={project.title}
                projectGenre={project.genre}
                projectMood={project.mood}
                onCoverUpdate={handleCoverUpdate}
              />
            </TabsContent>

            <TabsContent value="banner" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Баннер проекта
                </Label>
                <p className="text-sm text-muted-foreground">
                  Широкоформатный баннер (16:9) для главной страницы и промо-материалов
                </p>
              </div>
              
              {/* Preview current banner */}
              {project.banner_url ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={project.banner_url}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button onClick={() => setBannerEditorOpen(true)} variant="secondary" className="gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Изменить баннер
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setBannerEditorOpen(true)}
                >
                  <div className="p-3 rounded-full bg-muted">
                    <Sparkles className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Добавить баннер</p>
                    <p className="text-xs text-muted-foreground">Загрузите или сгенерируйте</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => setBannerEditorOpen(true)} 
                variant="outline" 
                className="w-full gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {project.banner_url ? 'Редактировать баннер' : 'Создать баннер'}
              </Button>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <ProjectBannerEditor
          open={bannerEditorOpen}
          onOpenChange={setBannerEditorOpen}
          project={project}
          onBannerUpdate={handleBannerUpdate}
        />
      </SheetContent>
    </Sheet>
  );
};

