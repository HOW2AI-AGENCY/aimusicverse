import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Project } from '@/hooks/useProjects';
import { useProjectTracks, ProjectTrack } from '@/hooks/useProjectTracks';
import { Plus, Music, GripVertical, Trash2, Edit, Sparkles, Play } from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';

interface ProjectTracklistTabProps {
  project: Project;
  tracks: ProjectTrack[];
  isLoading: boolean;
}

export const ProjectTracklistTab = ({ project, tracks, isLoading }: ProjectTracklistTabProps) => {
  const { addTrack, updateTrack, deleteTrack, reorderTracks, generateTracklist, isGenerating } =
    useProjectTracks(project.id);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<ProjectTrack | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    style_prompt: '',
    notes: '',
    duration_target: 120,
  });

  const handleAddTrack = () => {
    if (!formData.title.trim()) {
      toast.error('Введите название трека');
      return;
    }

    addTrack({
      title: formData.title,
      position: tracks.length + 1,
      project_id: project.id,
      style_prompt: formData.style_prompt || null,
      notes: formData.notes || null,
      duration_target: formData.duration_target || null,
      status: 'draft',
    });

    setFormData({ title: '', style_prompt: '', notes: '', duration_target: 120 });
    setIsAddDialogOpen(false);
  };

  const handleUpdateTrack = () => {
    if (!editingTrack) return;

    updateTrack({
      id: editingTrack.id,
      updates: {
        title: formData.title,
        style_prompt: formData.style_prompt || null,
        notes: formData.notes || null,
        duration_target: formData.duration_target || null,
      },
    });

    setEditingTrack(null);
    setFormData({ title: '', style_prompt: '', notes: '', duration_target: 120 });
  };

  const handleDeleteTrack = (trackId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот трек?')) {
      deleteTrack(trackId);
    }
  };

  const startEditTrack = (track: ProjectTrack) => {
    setEditingTrack(track);
    setFormData({
      title: track.title,
      style_prompt: track.style_prompt || '',
      notes: track.notes || '',
      duration_target: track.duration_target || 120,
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(tracks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updates = items.map((track, index) => ({
      id: track.id,
      position: index + 1,
    }));

    reorderTracks(updates);
  };

  const handleGenerateTracklist = () => {
    generateTracklist({
      projectType: project.project_type || 'album',
      genre: project.genre || undefined,
      mood: project.mood || undefined,
      theme: project.concept || undefined,
      trackCount: 10,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Треклист</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateTracklist}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI Треклист
                </>
              )}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Добавить трек
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить трек</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Название трека"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="style_prompt">Стиль / Теги</Label>
                    <Textarea
                      id="style_prompt"
                      value={formData.style_prompt}
                      onChange={(e) =>
                        setFormData({ ...formData, style_prompt: e.target.value })
                      }
                      placeholder="Например: энергичный рок, гитарные соло..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Заметки</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Дополнительные заметки..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Длительность (секунды)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_target}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_target: parseInt(e.target.value) || 120,
                        })
                      }
                    />
                  </div>
                  <Button onClick={handleAddTrack} className="w-full">
                    Добавить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Tracks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : tracks.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tracks">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {tracks.map((track, index) => (
                  <Draggable key={track.id} draggableId={track.id} index={index}>
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="glass-card border-primary/20"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                            </div>
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {track.position}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{track.title}</h4>
                              {track.style_prompt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {track.style_prompt}
                                </p>
                              )}
                              {track.recommended_tags && track.recommended_tags.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {track.recommended_tags.map((tag, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {track.track_id && (
                                <Button size="sm" variant="ghost">
                                  <Play className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditTrack(track)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTrack(track.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <Card className="glass-card border-primary/20 p-12 text-center">
          <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Треклист пуст</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Добавьте треки вручную или сгенерируйте с помощью AI
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleGenerateTracklist} disabled={isGenerating} className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Треклист
            </Button>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить вручную
            </Button>
          </div>
        </Card>
      )}

      {/* Edit Track Dialog */}
      <Dialog open={!!editingTrack} onOpenChange={() => setEditingTrack(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать трек</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Название *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-style">Стиль / Теги</Label>
              <Textarea
                id="edit-style"
                value={formData.style_prompt}
                onChange={(e) => setFormData({ ...formData, style_prompt: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Заметки</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Длительность (секунды)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={formData.duration_target}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_target: parseInt(e.target.value) || 120,
                  })
                }
              />
            </div>
            <Button onClick={handleUpdateTrack} className="w-full">
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
