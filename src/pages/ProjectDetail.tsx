import { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTracks, ProjectTrack } from '@/hooks/useProjectTracks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Music, MoreVertical, Play, Plus, Settings } from 'lucide-react';
import { AIActionsDialog } from '@/components/project/AIActionsDialog';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { MinimalProjectTrackItem } from '@/components/project/MinimalProjectTrackItem';
import { ProjectSettingsSheet } from '@/components/project/ProjectSettingsSheet';
import { AddTrackDialog } from '@/components/project/AddTrackDialog';
import { ProjectInfoCard } from '@/components/project/ProjectInfoCard';
import { LyricsPreviewSheet } from '@/components/project/LyricsPreviewSheet';
import { LyricsChatAssistant } from '@/components/generate-form/LyricsChatAssistant';
import { cn } from '@/lib/utils';
import { usePlanTrackStore } from '@/stores/planTrackStore';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { projects, isLoading } = useProjects();
  const { tracks, isLoading: tracksLoading, reorderTracks, generateTracklist, isGenerating } = useProjectTracks(id);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addTrackOpen, setAddTrackOpen] = useState(false);
  const [lyricsSheetOpen, setLyricsSheetOpen] = useState(false);
  const [lyricsWizardOpen, setLyricsWizardOpen] = useState(false);
  const [selectedTrackForLyrics, setSelectedTrackForLyrics] = useState<ProjectTrack | null>(null);
  const isMobile = useIsMobile();
  const { setPlanTrackContext } = usePlanTrackStore();
  const { updateTrack } = useProjectTracks(id);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const project = projects?.find((p) => p.id === id);

  const handleApplyUpdates = async (updates: Record<string, string | number | boolean | null>) => {
    if (!project) return;
    
    try {
      const { error } = await supabase
        .from('music_projects')
        .update(updates)
        .eq('id', project.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      logger.error('Error updating project', error);
      throw error;
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !tracks) return;

    const items = Array.from(tracks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updates = items.map((track, index) => ({
      id: track.id,
      position: index + 1,
    }));

    reorderTracks(updates);
  };

  const handleGenerateFromPlan = (track: any) => {
    if (!project) return;
    
    setPlanTrackContext({
      planTrackId: track.id,
      planTrackTitle: track.title,
      stylePrompt: track.style_prompt,
      notes: track.notes,
      recommendedTags: track.recommended_tags,
      projectId: project.id,
      projectGenre: project.genre || undefined,
      projectMood: project.mood || undefined,
      projectLanguage: project.language || undefined,
    });
    navigate('/generate');
  };

  const handleOpenLyrics = (track: ProjectTrack) => {
    setSelectedTrackForLyrics(track);
    setLyricsSheetOpen(true);
  };

  const handleOpenLyricsWizard = (track: ProjectTrack) => {
    setSelectedTrackForLyrics(track);
    setLyricsWizardOpen(true);
  };

  const handleSaveLyrics = async (trackId: string, lyrics: string) => {
    try {
      updateTrack({ id: trackId, updates: { notes: lyrics } });
    } catch (error) {
      logger.error('Error saving lyrics', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleLyricsGenerated = (lyrics: string) => {
    if (selectedTrackForLyrics) {
      handleSaveLyrics(selectedTrackForLyrics.id, lyrics);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Проект не найден</h3>
          <Button onClick={() => navigate('/projects')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            К проектам
          </Button>
        </div>
      </div>
    );
  }

  const completedTracks = tracks?.filter(t => t.status === 'completed').length || 0;
  const totalTracks = tracks?.length || 0;

  const draftTracks = tracks?.filter(t => t.status === 'draft' && !t.track_id) || [];
  const draftCount = draftTracks.length;

  return (
    <div className="pb-24">
      {/* Compact Header */}
      <div className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50",
        isMobile ? "px-3 py-3" : "px-4 py-4"
      )}>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/projects')}
            className="h-9 w-9 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {/* Cover + Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
              <img
                src={project.cover_url || `https://placehold.co/48x48/1a1a1a/ffffff?text=${project.title.charAt(0)}`}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-base truncate">{project.title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{project.genre || 'Без жанра'}</span>
                <span>•</span>
                <span>{completedTracks}/{totalTracks} треков</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="h-9 w-9"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Project Info Card */}
      <div className={cn(isMobile ? "px-3 py-2" : "px-4 py-2")}>
        <ProjectInfoCard 
          project={project} 
          onEdit={() => setSettingsOpen(true)}
        />
      </div>

      {/* Quick Actions Bar */}
      <div className={cn(
        "flex gap-2 overflow-x-auto scrollbar-hide",
        isMobile ? "px-3 pb-3" : "px-4 pb-4"
      )}>
        <Button 
          size="sm"
          onClick={() => setAddTrackOpen(true)}
          className="gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => generateTracklist({
            projectType: project.project_type || 'album',
            genre: project.genre || undefined,
            mood: project.mood || undefined,
            theme: project.concept || undefined,
            trackCount: 10,
          })}
          disabled={isGenerating}
          className="gap-1.5 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? 'Генерация...' : 'AI Треклист'}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setAiDialogOpen(true)}
          className="gap-1.5 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          AI Действия
        </Button>
      </div>

      {/* Tracklist */}
      <div className={cn(isMobile ? "px-3" : "px-4")}>
        {tracksLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : tracks && tracks.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="project-tracks">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {tracks.map((track, index) => (
                    <Draggable key={track.id} draggableId={track.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <MinimalProjectTrackItem
                            track={track}
                            dragHandleProps={provided.dragHandleProps}
                            isDragging={snapshot.isDragging}
                            onGenerate={() => handleGenerateFromPlan(track)}
                            onOpenLyrics={() => handleOpenLyrics(track)}
                            onOpenLyricsWizard={() => handleOpenLyricsWizard(track)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Треклист пуст</p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <Button onClick={() => setAddTrackOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Добавить трек
              </Button>
              <Button 
                variant="outline" 
                onClick={() => generateTracklist({
                  projectType: project.project_type || 'album',
                  genre: project.genre || undefined,
                  mood: project.mood || undefined,
                  theme: project.concept || undefined,
                  trackCount: 10,
                })}
                disabled={isGenerating}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Сгенерировать AI
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AIActionsDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        projectId={project.id}
        onApply={handleApplyUpdates}
      />
      
      <ProjectSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        project={project}
      />

      <AddTrackDialog
        open={addTrackOpen}
        onOpenChange={setAddTrackOpen}
        projectId={project.id}
        tracksCount={totalTracks}
      />

      {/* Lyrics Preview Sheet */}
      <LyricsPreviewSheet
        open={lyricsSheetOpen}
        onOpenChange={setLyricsSheetOpen}
        track={selectedTrackForLyrics}
        onSave={handleSaveLyrics}
        onOpenWizard={() => {
          setLyricsSheetOpen(false);
          setLyricsWizardOpen(true);
        }}
      />

      {/* AI Lyrics Chat Assistant with project context */}
      <LyricsChatAssistant
        open={lyricsWizardOpen}
        onOpenChange={setLyricsWizardOpen}
        onLyricsGenerated={handleLyricsGenerated}
        initialGenre={project.genre || undefined}
        initialMood={project.mood ? [project.mood] : undefined}
        initialLanguage={project.language as 'ru' | 'en' | undefined}
      />
    </div>
  );
}
