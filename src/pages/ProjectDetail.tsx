import { useState, useMemo } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTracks, ProjectTrack } from '@/hooks/useProjectTracks';
import { useProjectGeneratedTracks } from '@/hooks/useProjectGeneratedTracks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Music, MoreVertical, Play, Plus, Settings, Image, Rocket, Share2 } from 'lucide-react';
import { AIActionsDialog } from '@/components/project/AIActionsDialog';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { MinimalProjectTrackItem } from '@/components/project/MinimalProjectTrackItem';
import { ProjectSettingsSheet } from '@/components/project/ProjectSettingsSheet';
import { AddTrackDialog } from '@/components/project/AddTrackDialog';
import { ProjectInfoCard } from '@/components/project/ProjectInfoCard';
import { LyricsPreviewSheet } from '@/components/project/LyricsPreviewSheet';
import { LyricsChatAssistant } from '@/components/generate-form/LyricsChatAssistant';
import { ProjectMediaGenerator } from '@/components/project/ProjectMediaGenerator';
import { ProjectReadinessIndicator } from '@/components/project/ProjectReadinessIndicator';
import { PublishProjectDialog } from '@/components/project/PublishProjectDialog';
import { UnlinkedTracksSection } from '@/components/project/UnlinkedTracksSection';
import { ShareProjectCard } from '@/components/project/ShareProjectCard';
import { cn } from '@/lib/utils';
import { usePlanTrackStore } from '@/stores/planTrackStore';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useTelegramMainButton } from '@/hooks/telegram/useTelegramMainButton';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { projects, isLoading } = useProjects();
  const { tracks, isLoading: tracksLoading, reorderTracks, generateTracklist, isGenerating } = useProjectTracks(id);
  const { tracks: generatedTracks } = useProjectGeneratedTracks(id);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addTrackOpen, setAddTrackOpen] = useState(false);
  const [lyricsSheetOpen, setLyricsSheetOpen] = useState(false);
  const [lyricsWizardOpen, setLyricsWizardOpen] = useState(false);
  const [mediaGeneratorOpen, setMediaGeneratorOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedTrackForLyrics, setSelectedTrackForLyrics] = useState<ProjectTrack | null>(null);
  const [selectedTrackForMedia, setSelectedTrackForMedia] = useState<ProjectTrack | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const isMobile = useIsMobile();
  const { setPlanTrackContext } = usePlanTrackStore();
  const { updateTrack } = useProjectTracks(id);

  // Find project
  const project = projects?.find((p) => p.id === id);
  
  // Compute values for MainButton logic (before early returns)
  const totalTracks = tracks?.length || 0;
  const tracksWithMaster = generatedTracks?.filter(t => t.is_master).length || 0;
  const isReadyToPublish = totalTracks > 0 && tracksWithMaster === totalTracks;
  const isPublished = project?.status === 'published';
  const draftCount = tracks?.filter(t => t.status === 'draft' && !t.track_id).length || 0;

  // Telegram BackButton - navigates to projects list
  const { shouldShowUIButton: showUIBackButton } = useTelegramBackButton({
    visible: !!project,
    fallbackPath: '/projects',
  });

  // Telegram MainButton - dynamic based on project state
  const mainButtonConfig = useMemo(() => {
    if (!project) return { text: '', visible: false };
    
    if (isReadyToPublish && !isPublished) {
      return { text: 'ОПУБЛИКОВАТЬ', action: 'publish' as const };
    }
    if (draftCount > 0) {
      return { text: 'СГЕНЕРИРОВАТЬ ТРЕК', action: 'generate' as const };
    }
    return { text: 'ДОБАВИТЬ ТРЕК', action: 'add' as const };
  }, [project, isReadyToPublish, isPublished, draftCount]);

  const handleMainButtonClick = () => {
    if (mainButtonConfig.action === 'publish') {
      setPublishDialogOpen(true);
    } else if (mainButtonConfig.action === 'generate' && tracks?.[0]) {
      // Generate for first draft track
      const firstDraft = tracks.find(t => t.status === 'draft' && !t.track_id);
      if (firstDraft) handleGenerateFromPlan(firstDraft);
    } else {
      setAddTrackOpen(true);
    }
  };

  const { shouldShowUIButton: showUIMainButton } = useTelegramMainButton({
    text: mainButtonConfig.text,
    onClick: handleMainButtonClick,
    visible: !!project && !aiDialogOpen && !settingsOpen && !addTrackOpen && !lyricsSheetOpen && !lyricsWizardOpen && !mediaGeneratorOpen && !publishDialogOpen,
    enabled: !!project,
  });

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

  // project already defined above for hooks

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

  const handleGenerateFromPlan = (track: ProjectTrack) => {
    if (!project) return;
    
    setPlanTrackContext({
      planTrackId: track.id,
      planTrackTitle: track.title,
      stylePrompt: track.style_prompt,
      notes: track.notes,
      lyrics: track.lyrics || undefined, // Pass lyrics to generation
      recommendedTags: track.recommended_tags,
      projectId: project.id,
      projectGenre: project.genre || undefined,
      projectMood: project.mood || undefined,
      projectLanguage: project.language || undefined,
      projectDescription: project.description || undefined,
      projectConcept: project.concept || undefined,
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

  const handleSaveLyrics = async (trackId: string, lyrics: string, lyricsStatus?: string) => {
    try {
      await supabase.from('project_tracks')
        .update({ lyrics, lyrics_status: lyricsStatus || 'draft' })
        .eq('id', trackId);
      queryClient.invalidateQueries({ queryKey: ['project-tracks', id] });
      toast.success('Лирика сохранена');
    } catch (error) {
      logger.error('Error saving lyrics', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleSaveNotes = async (trackId: string, notes: string) => {
    try {
      updateTrack({ id: trackId, updates: { notes } });
    } catch (error) {
      logger.error('Error saving notes', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleLyricsGenerated = async (lyrics: string) => {
    if (selectedTrackForLyrics) {
      try {
        await supabase.from('project_tracks')
          .update({ lyrics, lyrics_status: 'generated' })
          .eq('id', selectedTrackForLyrics.id);
        queryClient.invalidateQueries({ queryKey: ['project-tracks', id] });
        toast.success('Лирика сохранена');
      } catch (error) {
        logger.error('Error saving lyrics', error);
        toast.error('Ошибка сохранения');
      }
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
  // totalTracks, tracksWithMaster, isReadyToPublish, isPublished, draftCount computed above for hooks
  const draftTracks = tracks?.filter(t => t.status === 'draft' && !t.track_id) || [];

  return (
    <div className="pb-24">
      {/* Hero Section with Full-width Cover on Mobile */}
      <div className="relative">
        {/* Full-width cover for mobile */}
        {isMobile ? (
          <div className="relative">
            <div className="relative w-full aspect-square">
              {project.cover_url ? (
                <img
                  src={project.cover_url}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary to-muted flex items-center justify-center">
                  <Music className="w-24 h-24 text-muted-foreground/40" />
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              
              {/* Floating header */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 z-10">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  onClick={() => navigate('/projects')}
                  className="h-9 w-9 bg-background/60 backdrop-blur-md"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="secondary" 
                  size="icon"
                  onClick={() => setSettingsOpen(true)}
                  className="h-9 w-9 bg-background/60 backdrop-blur-md"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Media button overlay */}
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg bg-background/80 backdrop-blur-md"
                onClick={() => {
                  setSelectedTrackForMedia(null);
                  setMediaGeneratorOpen(true);
                }}
              >
                <Image className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop: Background blur */}
            <div 
              className="absolute inset-0 h-32 bg-gradient-to-b from-primary/10 to-background"
              style={{
                backgroundImage: project.cover_url ? `url(${project.cover_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(40px)',
                opacity: 0.4,
              }}
            />
            
            {/* Desktop: Header */}
            <div className="relative sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 py-3">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate('/projects')}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                
                <h1 className="font-semibold text-sm truncate flex-1 text-center mx-3">{project.title}</h1>

                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSettingsOpen(true)}
                  className="h-8 w-8"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Desktop: Cover and Info */}
            <div className="relative flex flex-col items-center gap-3 pt-3 pb-4 px-4">
              <div className="relative group">
                <div className="w-44 h-44 rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-secondary to-muted ring-1 ring-white/10 transition-transform group-hover:scale-[1.02]">
                  {project.cover_url ? (
                    <img
                      src={project.cover_url}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setSelectedTrackForMedia(null);
                    setMediaGeneratorOpen(true);
                  }}
                >
                  <Image className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Project Meta - shown for both mobile and desktop */}
        <div className={cn(
          "text-center space-y-1.5",
          isMobile ? "px-3 -mt-12 relative z-10" : "pt-2"
        )}>
          {isMobile && (
            <h1 className="text-xl font-bold text-foreground mb-2">{project.title}</h1>
          )}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {project.genre && (
              <Badge variant="secondary" className="gap-0.5 text-[10px] h-5 px-1.5">
                <Music className="w-2.5 h-2.5" />
                {project.genre}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              {completedTracks}/{totalTracks} треков
            </Badge>
            {isPublished && (
              <Badge variant="default" className="bg-green-500 gap-0.5 text-[10px] h-5 px-1.5">
                <Rocket className="w-2.5 h-2.5" />
                Опубликован
              </Badge>
            )}
          </div>
          
          {project.description && (
            <div 
              className="max-w-sm mx-auto cursor-pointer group"
              onClick={() => setDescriptionExpanded(!descriptionExpanded)}
            >
              <p className={cn(
                "text-xs text-muted-foreground transition-all",
                !descriptionExpanded && "line-clamp-2"
              )}>
                {project.description}
              </p>
              {project.description.length > 100 && (
                <span className="text-[10px] text-primary/70 group-hover:text-primary transition-colors">
                  {descriptionExpanded ? 'Свернуть' : 'Читать полностью'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Readiness Indicator */}
        {totalTracks > 0 && !isPublished && (
          <div className={cn("max-w-sm mx-auto mt-2", isMobile ? "px-3" : "")}>
            <ProjectReadinessIndicator 
              totalTracks={totalTracks}
              tracksWithMaster={tracksWithMaster}
            />
          </div>
        )}

        {/* Publish Button */}
        {isReadyToPublish && !isPublished && (
          <div className="flex justify-center mt-2">
            <Button 
              size="sm"
              onClick={() => setPublishDialogOpen(true)}
              className="gap-1.5 bg-green-500 hover:bg-green-600 h-8"
            >
              <Rocket className="w-3.5 h-3.5" />
              Опубликовать
            </Button>
          </div>
        )}
      </div>

      {/* Quick Actions Bar */}
      <div className={cn(
        "flex gap-1.5 overflow-x-auto scrollbar-hide",
        isMobile ? "px-3 pb-2" : "px-4 pb-3"
      )}>
        <Button 
          size="sm"
          onClick={() => setAddTrackOpen(true)}
          className="gap-1 shrink-0 h-7 px-2 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
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
          className="gap-1 shrink-0 h-7 px-2 text-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isGenerating ? 'Генерация...' : 'AI'}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setAiDialogOpen(true)}
          className="gap-1 shrink-0 h-7 px-2 text-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Действия
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setSelectedTrackForMedia(null);
            setMediaGeneratorOpen(true);
          }}
          className="gap-1 shrink-0 h-7 px-2 text-xs"
        >
          <Image className="w-3.5 h-3.5" />
          Медиа
        </Button>
        <ShareProjectCard 
          project={{
            id: project.id,
            title: project.title,
            cover_url: project.cover_url,
            genre: project.genre,
            total_tracks_count: totalTracks,
            approved_tracks_count: tracksWithMaster,
          }}
          variant="button"
          className="gap-1 shrink-0 h-7 px-2 text-xs"
        />
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
        
        {/* Unlinked Tracks Section */}
        {tracks && tracks.length > 0 && (
          <div className="mt-4">
            <UnlinkedTracksSection projectId={id!} projectTracks={tracks} />
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
        onSaveLyrics={handleSaveLyrics}
        onSaveNotes={handleSaveNotes}
        onOpenWizard={() => {
          setLyricsSheetOpen(false);
          setLyricsWizardOpen(true);
        }}
        projectContext={{
          projectId: project.id,
          projectTitle: project.title,
          genre: project.genre || undefined,
          mood: project.mood || undefined,
          language: project.language as 'ru' | 'en' | undefined,
          concept: project.concept || undefined,
        }}
      />

      {/* AI Lyrics Chat Assistant with full project context */}
      <LyricsChatAssistant
        open={lyricsWizardOpen}
        onOpenChange={setLyricsWizardOpen}
        onLyricsGenerated={handleLyricsGenerated}
        initialGenre={project.genre || undefined}
        initialMood={project.mood ? [project.mood] : undefined}
        initialLanguage={project.language as 'ru' | 'en' | undefined}
        projectContext={{
          projectId: project.id,
          projectTitle: project.title,
          genre: project.genre || undefined,
          mood: project.mood || undefined,
          language: project.language as 'ru' | 'en' | undefined,
          concept: project.concept || undefined,
          targetAudience: project.target_audience || undefined,
          existingTracks: tracks?.map(t => ({
            position: t.position,
            title: t.title,
            stylePrompt: t.style_prompt || undefined,
            draftLyrics: t.lyrics || undefined,
            generatedLyrics: t.linked_track?.lyrics || undefined,
            recommendedTags: t.recommended_tags || undefined,
            recommendedStructure: t.recommended_structure || undefined,
            notes: t.notes || undefined,
            lyrics: t.lyrics || undefined,
            lyricsStatus: t.lyrics_status as 'draft' | 'prompt' | 'generated' | 'approved' | undefined,
          })),
        }}
        trackContext={selectedTrackForLyrics ? {
          position: selectedTrackForLyrics.position,
          title: selectedTrackForLyrics.title,
          stylePrompt: selectedTrackForLyrics.style_prompt || undefined,
          draftLyrics: selectedTrackForLyrics.lyrics || undefined,
          generatedLyrics: selectedTrackForLyrics.linked_track?.lyrics || undefined,
          recommendedTags: selectedTrackForLyrics.recommended_tags || undefined,
          recommendedStructure: selectedTrackForLyrics.recommended_structure || undefined,
          notes: selectedTrackForLyrics.notes || undefined,
          lyrics: selectedTrackForLyrics.lyrics || undefined,
          lyricsStatus: selectedTrackForLyrics.lyrics_status as 'draft' | 'prompt' | 'generated' | 'approved' | undefined,
        } : undefined}
      />

      {/* Project Media Generator */}
      <ProjectMediaGenerator
        open={mediaGeneratorOpen}
        onOpenChange={setMediaGeneratorOpen}
        project={{
          id: project.id,
          title: project.title,
          genre: project.genre,
          mood: project.mood,
          concept: project.concept,
          cover_url: project.cover_url,
        }}
        track={selectedTrackForMedia ? {
          id: selectedTrackForMedia.id,
          title: selectedTrackForMedia.title,
          style_prompt: selectedTrackForMedia.style_prompt,
          notes: selectedTrackForMedia.notes,
        } : null}
        onCoverGenerated={(url) => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }}
      />

      {/* Publish Project Dialog */}
      <PublishProjectDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        project={project}
        tracks={tracks || []}
      />
    </div>
  );
}
