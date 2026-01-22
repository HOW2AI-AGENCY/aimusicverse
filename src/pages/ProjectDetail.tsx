import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Music, Plus, Settings, Image, Rocket, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { AIActionsDialog } from '@/components/project/AIActionsDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { MinimalProjectTrackItem } from '@/components/project/MinimalProjectTrackItem';
import { ProjectSettingsSheet } from '@/components/project/ProjectSettingsSheet';
import { AddTrackDialog } from '@/components/project/AddTrackDialog';
import { ProjectDetailsCard } from '@/components/project/ProjectDetailsCard';
import { LyricsPreviewSheet } from '@/components/project/LyricsPreviewSheet';
import { LyricsChatAssistant } from '@/components/generate-form/LyricsChatAssistant';
import { ProjectMediaGenerator } from '@/components/project/ProjectMediaGenerator';
import { ProjectReadinessIndicator } from '@/components/project/ProjectReadinessIndicator';
import { PublishProjectDialog } from '@/components/project/PublishProjectDialog';
import { UnlinkedTracksSection } from '@/components/project/UnlinkedTracksSection';
import { ShareProjectCard } from '@/components/project/ShareProjectCard';
import { ProjectLyricsTab } from '@/components/project/ProjectLyricsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTelegramMainButton } from '@/hooks/telegram/useTelegramMainButton';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { 
  useProjectDetailData, 
  useProjectDetailDialogs, 
  useProjectDetailHandlers 
} from '@/hooks/project';

export default function ProjectDetail() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Data hook
  const {
    projectId,
    project,
    tracks,
    isLoading,
    authLoading,
    tracksLoading,
    isAuthenticated,
    isGenerating,
    totalTracks,
    tracksWithMaster,
    completedTracks,
    draftCount,
    isReadyToPublish,
    isPublished,
    navigate,
    reorderTracks,
    generateTracklist,
    updateTrack,
  } = useProjectDetailData();

  // Dialogs hook
  const dialogs = useProjectDetailDialogs();

  // Handlers hook
  const handlers = useProjectDetailHandlers({
    projectId,
    project,
    tracks,
    reorderTracks,
    updateTrack,
  });

  // Telegram BackButton
  useTelegramBackButton({
    visible: !!project,
    fallbackPath: '/projects',
  });

  // Telegram MainButton config
  const mainButtonConfig = useMemo(() => {
    if (!project) return { text: '', visible: false, action: 'add' as const };
    
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
      dialogs.setPublishDialogOpen(true);
    } else if (mainButtonConfig.action === 'generate' && tracks?.[0]) {
      const firstDraft = tracks.find(t => t.status === 'draft' && !t.track_id);
      if (firstDraft) handlers.handleGenerateFromPlan(firstDraft);
    } else {
      dialogs.setAddTrackOpen(true);
    }
  };

  useTelegramMainButton({
    text: mainButtonConfig.text,
    onClick: handleMainButtonClick,
    visible: !!project && !dialogs.isAnyDialogOpen,
    enabled: !!project,
  });

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Auth redirect
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Not found state
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

  return (
    <div 
      className="pb-24"
      style={{
        minHeight: 'var(--tg-viewport-stable-height, 100vh)',
        paddingBottom: 'calc(max(var(--tg-content-safe-area-inset-bottom, 60px), var(--tg-safe-area-inset-bottom, 34px)) + 4rem)'
      }}
    >
      {/* Hero Section */}
      <ProjectHeroSection
        project={project}
        isMobile={isMobile}
        onNavigateBack={() => navigate('/projects')}
        onOpenSettings={() => dialogs.setSettingsOpen(true)}
        onOpenMediaGenerator={() => dialogs.openMediaGenerator(null)}
      />

      {/* Project Meta */}
      <ProjectMetaSection
        project={project}
        isMobile={isMobile}
        completedTracks={completedTracks}
        totalTracks={totalTracks}
        isPublished={isPublished}
        descriptionExpanded={dialogs.descriptionExpanded}
        projectInfoExpanded={dialogs.projectInfoExpanded}
        onToggleDescription={() => dialogs.setDescriptionExpanded(!dialogs.descriptionExpanded)}
        onToggleProjectInfo={() => dialogs.setProjectInfoExpanded(!dialogs.projectInfoExpanded)}
        onOpenSettings={() => dialogs.setSettingsOpen(true)}
      />

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
            onClick={() => dialogs.setPublishDialogOpen(true)}
            className="gap-1.5 bg-green-500 hover:bg-green-600 h-8"
          >
            <Rocket className="w-3.5 h-3.5" />
            Опубликовать
          </Button>
        </div>
      )}

      {/* Quick Actions Bar */}
      <QuickActionsBar
        project={project}
        isMobile={isMobile}
        isGenerating={isGenerating}
        totalTracks={totalTracks}
        tracksWithMaster={tracksWithMaster}
        onAddTrack={() => dialogs.setAddTrackOpen(true)}
        onGenerateTracklist={() => generateTracklist({
          projectType: project.project_type || 'album',
          genre: project.genre || undefined,
          mood: project.mood || undefined,
          theme: project.concept || undefined,
          trackCount: 10,
        })}
        onOpenAI={() => dialogs.setAiDialogOpen(true)}
      />

      {/* Tabs: Tracks and Lyrics */}
      <Tabs defaultValue="tracks" className="w-full">
        <div className={cn(isMobile ? "px-3 pt-2" : "px-4 pt-2")}>
          <TabsList className={cn(
            "w-full grid grid-cols-2 bg-muted/50",
            isMobile ? "h-10" : "h-9"
          )}>
            <TabsTrigger value="tracks" className={cn(
              "gap-1.5 data-[state=active]:bg-background",
              isMobile && "text-sm"
            )}>
              <Music className="w-4 h-4" />
              Треки
            </TabsTrigger>
            <TabsTrigger value="text" className={cn(
              "gap-1.5 data-[state=active]:bg-background",
              isMobile && "text-sm"
            )}>
              <FileText className="w-4 h-4" />
              Тексты
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tracks" className="mt-0 pt-3">
          <TracksTabContent
            projectId={projectId!}
            project={project}
            tracks={tracks}
            tracksLoading={tracksLoading}
            isGenerating={isGenerating}
            isMobile={isMobile}
            onDragEnd={handlers.handleDragEnd}
            onGenerate={handlers.handleGenerateFromPlan}
            onOpenLyrics={handlers.handleOpenLyrics}
            onOpenLyricsWizard={dialogs.openLyricsWizard}
            onAddTrack={() => dialogs.setAddTrackOpen(true)}
            onGenerateTracklist={() => generateTracklist({
              projectType: project.project_type || 'album',
              genre: project.genre || undefined,
              mood: project.mood || undefined,
              theme: project.concept || undefined,
              trackCount: 10,
            })}
          />
        </TabsContent>

        <TabsContent value="text" className="mt-0">
          <ProjectLyricsTab
            projectId={project.id}
            tracks={tracks || []}
            onOpenLyrics={handlers.handleOpenLyrics}
            onOpenLyricsWizard={dialogs.openLyricsWizard}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ProjectDialogs
        project={project}
        tracks={tracks}
        dialogs={dialogs}
        handlers={handlers}
        queryClient={queryClient}
      />
    </div>
  );
}

// ============ Sub-components ============

interface ProjectHeroSectionProps {
  project: NonNullable<ReturnType<typeof useProjectDetailData>['project']>;
  isMobile: boolean;
  onNavigateBack: () => void;
  onOpenSettings: () => void;
  onOpenMediaGenerator: () => void;
}

function ProjectHeroSection({ 
  project, isMobile, onNavigateBack, onOpenSettings, onOpenMediaGenerator 
}: ProjectHeroSectionProps) {
  if (isMobile) {
    return (
      <div className="relative">
        <div className="relative w-full aspect-[3/2]">
          {project.cover_url ? (
            <img src={project.cover_url} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary to-muted flex items-center justify-center">
              <Music className="w-14 h-14 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          
          <div 
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 z-10"
            style={{ paddingTop: 'calc(var(--tg-safe-area-inset-top, 44px) + var(--tg-content-safe-area-inset-top, 0px) + 0.5rem)' }}
          >
            <Button variant="secondary" size="icon" onClick={onNavigateBack} className="h-9 w-9 bg-background/70 backdrop-blur-md border-0 shadow-lg">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="icon" onClick={onOpenMediaGenerator} className="h-9 w-9 bg-background/70 backdrop-blur-md border-0 shadow-lg">
                <Image className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="icon" onClick={onOpenSettings} className="h-9 w-9 bg-background/70 backdrop-blur-md border-0 shadow-lg">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
      
      <div 
        className="relative sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 pb-3"
        style={{ paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + 0.5rem), calc(env(safe-area-inset-top, 0px) + 0.5rem))' }}
      >
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onNavigateBack} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-semibold text-sm truncate flex-1 text-center mx-3">{project.title}</h1>
          <Button variant="ghost" size="icon" onClick={onOpenSettings} className="h-8 w-8">
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-3 pt-3 pb-4 px-4">
        <div className="relative group">
          <div className="w-44 h-44 rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-secondary to-muted ring-1 ring-white/10 transition-transform group-hover:scale-[1.02]">
            {project.cover_url ? (
              <img src={project.cover_url} alt={project.title} className="w-full h-full object-cover" />
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
            onClick={onOpenMediaGenerator}
          >
            <Image className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </>
  );
}

interface ProjectMetaSectionProps {
  project: NonNullable<ReturnType<typeof useProjectDetailData>['project']>;
  isMobile: boolean;
  completedTracks: number;
  totalTracks: number;
  isPublished: boolean;
  descriptionExpanded: boolean;
  projectInfoExpanded: boolean;
  onToggleDescription: () => void;
  onToggleProjectInfo: () => void;
  onOpenSettings: () => void;
}

function ProjectMetaSection({
  project, isMobile, completedTracks, totalTracks, isPublished,
  descriptionExpanded, projectInfoExpanded, onToggleDescription, onToggleProjectInfo, onOpenSettings
}: ProjectMetaSectionProps) {
  return (
    <div className={cn("text-center space-y-1.5", isMobile ? "px-4 -mt-6 relative z-10" : "pt-2")}>
      {isMobile && <h1 className="text-xl font-bold text-foreground mb-1">{project.title}</h1>}
      
      <div className={cn("flex items-center gap-1.5", isMobile ? "justify-center flex-wrap" : "justify-center")}>
        {project.genre && (
          <Badge variant="secondary" className="gap-0.5 text-[10px] h-5 px-2 shrink-0 bg-primary/10 text-primary border-0">
            <Music className="w-2.5 h-2.5" />
            {project.genre}
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px] h-5 px-2 shrink-0">
          {completedTracks}/{totalTracks} треков
        </Badge>
        {isPublished && (
          <Badge className="bg-emerald-500/20 text-emerald-500 border-0 h-5 px-2 gap-0.5 shrink-0">
            <Rocket className="w-2.5 h-2.5" />
            Опубликован
          </Badge>
        )}
      </div>
      
      {project.description && (
        <div className="max-w-sm mx-auto cursor-pointer group" onClick={onToggleDescription}>
          <p className={cn("text-xs text-muted-foreground transition-all", !descriptionExpanded && "line-clamp-2")}>
            {project.description}
          </p>
          {project.description.length > 100 && (
            <span className="text-[10px] text-primary/70 group-hover:text-primary transition-colors">
              {descriptionExpanded ? 'Свернуть' : 'Читать полностью'}
            </span>
          )}
        </div>
      )}

      {(project.genre || project.mood || project.concept || project.image_style || project.color_palette) && (
        <div className="max-w-sm mx-auto mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleProjectInfo}
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            {projectInfoExpanded ? <><ChevronUp className="w-3 h-3" />Скрыть детали</> : <><ChevronDown className="w-3 h-3" />Показать детали</>}
          </Button>
          
          {projectInfoExpanded && (
            <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
              <ProjectDetailsCard project={project} onEdit={onOpenSettings} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface QuickActionsBarProps {
  project: NonNullable<ReturnType<typeof useProjectDetailData>['project']>;
  isMobile: boolean;
  isGenerating: boolean;
  totalTracks: number;
  tracksWithMaster: number;
  onAddTrack: () => void;
  onGenerateTracklist: () => void;
  onOpenAI: () => void;
}

function QuickActionsBar({ project, isMobile, isGenerating, totalTracks, tracksWithMaster, onAddTrack, onGenerateTracklist, onOpenAI }: QuickActionsBarProps) {
  return (
    <div className={cn("sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50", isMobile ? "px-3 py-2" : "px-4 py-2")}>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <Button size="sm" onClick={onAddTrack} className={cn("gap-1.5 shrink-0 bg-primary", isMobile ? "h-8 px-3 text-xs" : "h-7 px-3 text-xs")}>
          <Plus className="w-3.5 h-3.5" />
          Трек
        </Button>
        <Button variant="outline" size="sm" onClick={onGenerateTracklist} disabled={isGenerating} className={cn("gap-1.5 shrink-0", isMobile ? "h-8 px-3 text-xs" : "h-7 px-3 text-xs")}>
          <Sparkles className="w-3.5 h-3.5" />
          AI треклист
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenAI} className={cn("gap-1.5 shrink-0", isMobile ? "h-8 px-3 text-xs" : "h-7 px-3 text-xs")}>
          <Sparkles className="w-3.5 h-3.5" />
          AI
        </Button>
        <ShareProjectCard 
          project={{ id: project.id, title: project.title, cover_url: project.cover_url, genre: project.genre, total_tracks_count: totalTracks, approved_tracks_count: tracksWithMaster }}
          variant="button"
          className={cn("gap-1.5 shrink-0", isMobile ? "h-8 px-3 text-xs" : "h-7 px-3 text-xs")}
        />
      </div>
    </div>
  );
}

interface TracksTabContentProps {
  projectId: string;
  project: NonNullable<ReturnType<typeof useProjectDetailData>['project']>;
  tracks: ReturnType<typeof useProjectDetailData>['tracks'];
  tracksLoading: boolean;
  isGenerating: boolean;
  isMobile: boolean;
  onDragEnd: (result: any) => void;
  onGenerate: (track: any) => void;
  onOpenLyrics: (track: any) => void;
  onOpenLyricsWizard: (track: any) => void;
  onAddTrack: () => void;
  onGenerateTracklist: () => void;
}

function TracksTabContent({ projectId, project, tracks, tracksLoading, isGenerating, isMobile, onDragEnd, onGenerate, onOpenLyrics, onOpenLyricsWizard, onAddTrack, onGenerateTracklist }: TracksTabContentProps) {
  return (
    <div className={cn(isMobile ? "px-3" : "px-4")}>
      {tracksLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : tracks && tracks.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="project-tracks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {tracks.map((track, index) => (
                  <Draggable key={track.id} draggableId={track.id} index={index}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps}>
                        <MinimalProjectTrackItem
                          track={track}
                          dragHandleProps={provided.dragHandleProps}
                          isDragging={snapshot.isDragging}
                          onGenerate={() => onGenerate(track)}
                          onOpenLyrics={() => onOpenLyrics(track)}
                          onOpenLyricsWizard={() => onOpenLyricsWizard(track)}
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
            <Button onClick={onAddTrack} className="gap-2"><Plus className="w-4 h-4" />Добавить трек</Button>
            <Button variant="outline" onClick={onGenerateTracklist} disabled={isGenerating} className="gap-2"><Sparkles className="w-4 h-4" />Сгенерировать AI</Button>
          </div>
        </div>
      )}
      
      {tracks && tracks.length > 0 && (
        <div className="mt-4">
          <UnlinkedTracksSection projectId={projectId} projectTracks={tracks} />
        </div>
      )}
    </div>
  );
}

interface ProjectDialogsProps {
  project: NonNullable<ReturnType<typeof useProjectDetailData>['project']>;
  tracks: ReturnType<typeof useProjectDetailData>['tracks'];
  dialogs: ReturnType<typeof useProjectDetailDialogs>;
  handlers: ReturnType<typeof useProjectDetailHandlers>;
  queryClient: ReturnType<typeof useQueryClient>;
}

function ProjectDialogs({ project, tracks, dialogs, handlers, queryClient }: ProjectDialogsProps) {
  return (
    <>
      <AIActionsDialog
        open={dialogs.aiDialogOpen}
        onOpenChange={dialogs.setAiDialogOpen}
        projectId={project.id}
        onApply={handlers.handleApplyUpdates}
      />
      
      <ProjectSettingsSheet
        open={dialogs.settingsOpen}
        onOpenChange={dialogs.setSettingsOpen}
        project={project}
      />

      <AddTrackDialog
        open={dialogs.addTrackOpen}
        onOpenChange={dialogs.setAddTrackOpen}
        projectId={project.id}
        tracksCount={tracks?.length || 0}
      />

      <LyricsPreviewSheet
        open={dialogs.lyricsSheetOpen}
        onOpenChange={dialogs.setLyricsSheetOpen}
        track={dialogs.selectedTrackForLyrics}
        onSaveLyrics={handlers.handleSaveLyrics}
        onSaveNotes={handlers.handleSaveNotes}
        onOpenWizard={dialogs.closeLyricsSheetAndOpenWizard}
        projectContext={{
          projectId: project.id,
          projectTitle: project.title,
          genre: project.genre || undefined,
          mood: project.mood || undefined,
          language: project.language as 'ru' | 'en' | undefined,
          concept: project.concept || undefined,
        }}
      />

      <LyricsChatAssistant
        open={dialogs.lyricsWizardOpen}
        onOpenChange={dialogs.setLyricsWizardOpen}
        onLyricsGenerated={(lyrics) => handlers.handleLyricsGenerated(lyrics, dialogs.selectedTrackForLyrics?.id)}
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
        trackContext={dialogs.selectedTrackForLyrics ? {
          position: dialogs.selectedTrackForLyrics.position,
          title: dialogs.selectedTrackForLyrics.title,
          stylePrompt: dialogs.selectedTrackForLyrics.style_prompt || undefined,
          draftLyrics: dialogs.selectedTrackForLyrics.lyrics || undefined,
          generatedLyrics: dialogs.selectedTrackForLyrics.linked_track?.lyrics || undefined,
          recommendedTags: dialogs.selectedTrackForLyrics.recommended_tags || undefined,
          recommendedStructure: dialogs.selectedTrackForLyrics.recommended_structure || undefined,
          notes: dialogs.selectedTrackForLyrics.notes || undefined,
          lyrics: dialogs.selectedTrackForLyrics.lyrics || undefined,
          lyricsStatus: dialogs.selectedTrackForLyrics.lyrics_status as 'draft' | 'prompt' | 'generated' | 'approved' | undefined,
        } : undefined}
      />

      <ProjectMediaGenerator
        open={dialogs.mediaGeneratorOpen}
        onOpenChange={dialogs.setMediaGeneratorOpen}
        project={{
          id: project.id,
          title: project.title,
          genre: project.genre,
          mood: project.mood,
          concept: project.concept,
          cover_url: project.cover_url,
        }}
        track={dialogs.selectedTrackForMedia ? {
          id: dialogs.selectedTrackForMedia.id,
          title: dialogs.selectedTrackForMedia.title,
          style_prompt: dialogs.selectedTrackForMedia.style_prompt,
          notes: dialogs.selectedTrackForMedia.notes,
        } : null}
        onCoverGenerated={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
      />

      <PublishProjectDialog
        open={dialogs.publishDialogOpen}
        onOpenChange={dialogs.setPublishDialogOpen}
        project={project}
        tracks={tracks || []}
      />
    </>
  );
}
