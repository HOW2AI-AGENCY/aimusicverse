import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Project } from '@/hooks/useProjects';
import { useProjectTracks, ProjectTrack } from '@/hooks/useProjectTracks';
import { Plus, Music, GripVertical, Trash2, Edit, Sparkles, Play, FileText, Zap, CheckCircle2, Clock, AlertCircle, FileEdit } from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlanTrackStore } from '@/stores/planTrackStore';
import { AILyricsWizard } from '@/components/generate-form/AILyricsWizard';
import { cn } from '@/lib/utils';

interface ProjectTracklistTabProps {
  project: Project;
  tracks: ProjectTrack[];
  isLoading: boolean;
}

const STATUS_CONFIG = {
  draft: { 
    icon: FileEdit, 
    label: 'Черновик', 
    shortLabel: '📝',
    className: 'border-muted-foreground/30 text-muted-foreground' 
  },
  in_progress: { 
    icon: Clock, 
    label: 'В работе', 
    shortLabel: '⏳',
    className: 'border-blue-500 text-blue-500 animate-pulse' 
  },
  completed: { 
    icon: CheckCircle2, 
    label: 'Готов', 
    shortLabel: '✓',
    className: 'border-green-500 text-green-500' 
  },
  error: { 
    icon: AlertCircle, 
    label: 'Ошибка', 
    shortLabel: '❌',
    className: 'border-destructive text-destructive' 
  },
};

export const ProjectTracklistTab = ({ project, tracks, isLoading }: ProjectTracklistTabProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // Use the hook only for mutations, not for data fetching (data comes from props)
  const { addTrack, updateTrack, deleteTrack, reorderTracks, generateTracklist, isGenerating } =
    useProjectTracks(project.id);
  const { setPlanTrackContext } = usePlanTrackStore();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<ProjectTrack | null>(null);
  const [lyricsEditingTrack, setLyricsEditingTrack] = useState<ProjectTrack | null>(null);
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

  // Generate track from plan-track
  const handleGenerateFromPlan = (track: ProjectTrack) => {
    setPlanTrackContext({
      planTrackId: track.id,
      planTrackTitle: track.title,
      stylePrompt: track.style_prompt,
      notes: track.notes,
      recommendedTags: track.recommended_tags,
      projectId: project.id,
      projectGenre: project.genre,
      projectMood: project.mood,
      projectLanguage: project.language,
    });
    
    navigate('/generate');
  };

  const handleSaveLyrics = (trackId: string, newLyrics: string) => {
    updateTrack({
      id: trackId,
      updates: {
        notes: newLyrics,
      },
    });
    setLyricsEditingTrack(null);
    toast.success('Лирика сохранена');
  };

  const getStatusConfig = (status: string | null) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  };

  return (
    <div className={isMobile ? 'space-y-2' : 'space-y-4'}>
      {/* Header */}
      <Card className="glass-card border-primary/20">
        <CardHeader className={`flex flex-row items-center justify-between ${isMobile ? 'p-3 pb-2' : 'pb-2'}`}>
          <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>Треклист</CardTitle>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateTracklist}
              disabled={isGenerating}
              className={`gap-1.5 ${isMobile ? 'text-xs px-2 h-8' : ''}`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary"></div>
                  {!isMobile && 'Генерация...'}
                </>
              ) : (
                <>
                  <Sparkles className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                  {!isMobile && 'AI Треклист'}
                </>
              )}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className={`gap-1.5 ${isMobile ? 'text-xs px-2 h-8' : ''}`}>
                  <Plus className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                  {!isMobile && 'Добавить'}
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
                    <Label htmlFor="notes">Заметки / Лирика</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Тема песни, идеи для текста..."
                      rows={3}
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
                {tracks.map((track, index) => {
                  const statusConfig = getStatusConfig(track.status);
                  const StatusIcon = statusConfig.icon;
                  const hasLinkedTrack = !!track.track_id;
                  
                  return (
                    <Draggable key={track.id} draggableId={track.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            'glass-card transition-all',
                            snapshot.isDragging 
                              ? 'border-primary shadow-lg scale-[1.02]' 
                              : 'hover:border-primary/40',
                            track.status === 'completed' && 'border-green-500/30',
                            track.status === 'in_progress' && 'border-blue-500/30',
                            track.status === 'error' && 'border-destructive/30',
                            !track.status || track.status === 'draft' ? 'border-primary/20' : ''
                          )}
                        >
                          <CardContent className={isMobile ? 'p-2.5' : 'p-3'}>
                            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
                              {/* Drag Handle */}
                              <div {...provided.dragHandleProps} className="touch-manipulation">
                                <GripVertical className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-muted-foreground cursor-grab active:cursor-grabbing`} />
                              </div>

                              {/* Position Badge */}
                              <div className={`flex items-center justify-center ${isMobile ? 'w-6 h-6' : 'w-7 h-7'} rounded-lg bg-primary/10 text-primary font-bold ${isMobile ? 'text-xs' : 'text-sm'} flex-shrink-0`}>
                                {track.position}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className={`flex items-center gap-1.5 ${isMobile ? 'mb-0.5' : 'mb-1'}`}>
                                  <h4 className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'} text-foreground truncate`}>
                                    {track.title}
                                  </h4>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      isMobile ? 'text-[10px] h-4 px-1.5' : 'text-xs',
                                      statusConfig.className
                                    )}
                                  >
                                    {isMobile ? (
                                      statusConfig.shortLabel
                                    ) : (
                                      <>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {statusConfig.label}
                                      </>
                                    )}
                                  </Badge>
                                </div>

                                {track.style_prompt && (
                                  <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground truncate`}>
                                    {track.style_prompt}
                                  </p>
                                )}

                                {track.notes && !isMobile && (
                                  <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                                    {track.notes.slice(0, 60)}...
                                  </p>
                                )}

                                {track.recommended_tags && track.recommended_tags.length > 0 && (
                                  <div className={`flex gap-1 ${isMobile ? 'mt-1' : 'mt-1.5'} flex-wrap`}>
                                    {track.recommended_tags.slice(0, isMobile ? 2 : 3).map((tag, i) => (
                                      <Badge key={i} variant="secondary" className={isMobile ? 'text-[10px] h-4 px-1.5' : 'text-xs h-5'}>
                                        {tag}
                                      </Badge>
                                    ))}
                                    {track.recommended_tags.length > (isMobile ? 2 : 3) && (
                                      <Badge variant="secondary" className={isMobile ? 'text-[10px] h-4 px-1.5' : 'text-xs h-5'}>
                                        +{track.recommended_tags.length - (isMobile ? 2 : 3)}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className={`flex ${isMobile ? 'gap-0.5' : 'gap-1'} flex-shrink-0`}>
                                {/* Generate button - show for drafts */}
                                {!hasLinkedTrack && (
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    onClick={() => handleGenerateFromPlan(track)}
                                    title="Генерировать трек"
                                    className={cn(
                                      isMobile ? 'h-7 w-7' : 'h-9',
                                      'p-0 touch-manipulation bg-gradient-to-r from-primary to-primary/80',
                                      !isMobile && 'px-2 gap-1'
                                    )}
                                  >
                                    <Zap className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                                    {!isMobile && <span className="text-xs">Создать</span>}
                                  </Button>
                                )}
                                
                                {/* Play button - show for completed */}
                                {hasLinkedTrack && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    title="Воспроизвести"
                                    className={`${isMobile ? 'h-7 w-7' : 'h-9 w-9'} p-0 touch-manipulation`}
                                  >
                                    <Play className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                                  </Button>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setLyricsEditingTrack(track)}
                                  title="Редактировать лирику"
                                  className={`${isMobile ? 'h-7 w-7' : 'h-9 w-9'} p-0 touch-manipulation`}
                                >
                                  <FileText className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditTrack(track)}
                                  title="Редактировать"
                                  className={`${isMobile ? 'h-7 w-7' : 'h-9 w-9'} p-0 touch-manipulation`}
                                >
                                  <Edit className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTrack(track.id)}
                                  title="Удалить"
                                  className={`${isMobile ? 'h-7 w-7' : 'h-9 w-9'} p-0 touch-manipulation`}
                                >
                                  <Trash2 className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-destructive`} />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  );
                })}
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
              <Label htmlFor="edit-notes">Заметки / Лирика</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
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

      {/* AI Lyrics Wizard */}
      <AILyricsWizard
        open={!!lyricsEditingTrack}
        onOpenChange={(open) => !open && setLyricsEditingTrack(null)}
        onLyricsGenerated={(newLyrics) => {
          if (lyricsEditingTrack) {
            handleSaveLyrics(lyricsEditingTrack.id, newLyrics);
          }
        }}
        initialGenre={project.genre || undefined}
        initialMood={project.mood ? [project.mood] : undefined}
      />
    </div>
  );
};
