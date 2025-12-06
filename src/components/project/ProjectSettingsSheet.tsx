import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects, Project } from '@/hooks/useProjects';
import { Save, Image } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectCoverEditor } from './ProjectCoverEditor';
import { useQueryClient } from '@tanstack/react-query';

interface ProjectSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export const ProjectSettingsSheet = ({ open, onOpenChange, project }: ProjectSettingsSheetProps) => {
  const { updateProject, isUpdating } = useProjects();
  const queryClient = useQueryClient();
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Настройки проекта</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Cover */}
          <div className="space-y-2">
            <Label>Обложка</Label>
            <ProjectCoverEditor
              projectId={project.id}
              currentCoverUrl={project.cover_url}
              projectTitle={project.title}
              projectGenre={project.genre}
              projectMood={project.mood}
              onCoverUpdate={handleCoverUpdate}
            />
          </div>

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
        </div>
      </SheetContent>
    </Sheet>
  );
};
