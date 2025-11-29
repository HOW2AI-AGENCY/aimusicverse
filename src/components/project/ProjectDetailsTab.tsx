import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects, Project } from '@/hooks/useProjects';
import { Edit, Save, X, Calendar, Target, Music, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectDetailsTabProps {
  project: Project;
}

export const ProjectDetailsTab = ({ project }: ProjectDetailsTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { updateProject, isUpdating } = useProjects();
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || '',
    genre: project.genre || '',
    mood: project.mood || '',
    status: project.status || 'draft',
    target_audience: project.target_audience || '',
    release_date: project.release_date || '',
    concept: project.concept || '',
  });

  const handleSave = () => {
    updateProject({
      id: project.id,
      updates: formData,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      title: project.title,
      description: project.description || '',
      genre: project.genre || '',
      mood: project.mood || '',
      status: project.status || 'draft',
      target_audience: project.target_audience || '',
      release_date: project.release_date || '',
      concept: project.concept || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Информация о проекте</CardTitle>
          {!isEditing ? (
            <Button size="sm" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit className="w-4 h-4" />
              Редактировать
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isUpdating} className="gap-2">
                <Save className="w-4 h-4" />
                Сохранить
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            {isEditing ? (
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            ) : (
              <p className="text-sm text-foreground">{project.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {project.description || 'Описание не указано'}
              </p>
            )}
          </div>

          {/* Genre & Mood */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Жанр</Label>
              {isEditing ? (
                <Input
                  id="genre"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                />
              ) : (
                <p className="text-sm text-foreground">{project.genre || 'Не указан'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mood">Настроение</Label>
              {isEditing ? (
                <Input
                  id="mood"
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                />
              ) : (
                <p className="text-sm text-foreground">{project.mood || 'Не указано'}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            {isEditing ? (
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="in_progress">В работе</SelectItem>
                  <SelectItem value="review">На проверке</SelectItem>
                  <SelectItem value="completed">Завершен</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                {project.status === 'draft' ? 'Черновик' : 
                 project.status === 'in_progress' ? 'В работе' :
                 project.status === 'review' ? 'На проверке' : 'Завершен'}
              </Badge>
            )}
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="target_audience">
              <Target className="w-4 h-4 inline mr-1" />
              Целевая аудитория
            </Label>
            {isEditing ? (
              <Input
                id="target_audience"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {project.target_audience || 'Не указана'}
              </p>
            )}
          </div>

          {/* Release Date */}
          <div className="space-y-2">
            <Label htmlFor="release_date">
              <Calendar className="w-4 h-4 inline mr-1" />
              Дата релиза
            </Label>
            {isEditing ? (
              <Input
                id="release_date"
                type="date"
                value={formData.release_date}
                onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {project.release_date ? new Date(project.release_date).toLocaleDateString('ru-RU') : 'Не указана'}
              </p>
            )}
          </div>

          {/* Concept */}
          <div className="space-y-2">
            <Label htmlFor="concept">Концепция</Label>
            {isEditing ? (
              <Textarea
                id="concept"
                value={formData.concept}
                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {project.concept || 'Концепция не указана'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Метаданные</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Создан:</span>
            <span className="text-foreground">
              {new Date(project.created_at).toLocaleDateString('ru-RU')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Обновлен:</span>
            <span className="text-foreground">
              {new Date(project.updated_at).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
