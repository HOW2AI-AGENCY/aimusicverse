/**
 * ProjectDetail — страница проекта (музыкальный проект со списком треков).
 *
 * Sprint 042: декомпозиция god-page (851 → ~280 LOC).
 * Page-orchestrator импортирует 3 хука (@/hooks/project) и 6 sub-components
 * (./project-detail/*). Вся визуальная логика вынесена в sub-components.
 */

import { useMemo } from "react";
import { Navigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Music, Rocket, FileText } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ProjectReadinessIndicator } from "@/components/project/ProjectReadinessIndicator";
import { ProjectLyricsTab } from "@/components/project/ProjectLyricsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTelegramMainButton } from "@/hooks/telegram/useTelegramMainButton";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { SEOHead } from "@/components/SEOHead";
import { useProjectDetailData, useProjectDetailDialogs, useProjectDetailHandlers } from "@/hooks/project";
import { ProjectHeroSection } from "./project-detail/ProjectHeroSection";
import { ProjectMetaSection } from "./project-detail/ProjectMetaSection";
import { QuickActionsBar } from "./project-detail/QuickActionsBar";
import { TracksTabContent } from "./project-detail/TracksTabContent";
import { ProjectDialogs } from "./project-detail/ProjectDialogs";

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
    fallbackPath: "/projects",
  });

  // Telegram MainButton config
  const mainButtonConfig = useMemo(() => {
    if (!project) return { text: "", visible: false, action: "add" as const };

    if (isReadyToPublish && !isPublished) {
      return { text: "ОПУБЛИКОВАТЬ", action: "publish" as const };
    }
    if (draftCount > 0) {
      return { text: "СГЕНЕРИРОВАТЬ ТРЕК", action: "generate" as const };
    }
    return { text: "ДОБАВИТЬ ТРЕК", action: "add" as const };
  }, [project, isReadyToPublish, isPublished, draftCount]);

  const handleMainButtonClick = () => {
    if (mainButtonConfig.action === "publish") {
      dialogs.setPublishDialogOpen(true);
    } else if (mainButtonConfig.action === "generate" && tracks?.[0]) {
      const firstDraft = tracks.find((t) => t.status === "draft" && !t.track_id);
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
          <Button onClick={() => navigate("/projects")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />К проектам
          </Button>
        </div>
      </div>
    );
  }

  const projectUrl = `https://aimusicverse.lovable.app/projects/${project.id}`;
  const projectTitle = project.title || "Музыкальный проект";
  const projectDescription =
    project.concept ||
    `Музыкальный проект «${projectTitle}» — ${totalTracks} ${totalTracks === 1 ? "трек" : "треков"} на MusicVerse AI.`;

  const generateTracklistArgs = () =>
    generateTracklist({
      projectType: project.project_type || "album",
      genre: project.genre || undefined,
      mood: project.mood || undefined,
      theme: project.concept || undefined,
      trackCount: 10,
    });

  return (
    <div
      className="pb-24"
      style={{
        minHeight: "var(--tg-viewport-stable-height, 100vh)",
        paddingBottom:
          "calc(max(var(--tg-content-safe-area-inset-bottom, 60px), var(--tg-safe-area-inset-bottom, 34px)) + 4rem)",
      }}
    >
      <SEOHead
        title={projectTitle}
        description={projectDescription}
        canonical={projectUrl}
        ogType="music.album"
        ogImage={project.cover_url || undefined}
        noIndex={!isPublished}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MusicAlbum",
          name: projectTitle,
          description: projectDescription,
          url: projectUrl,
          image: project.cover_url || undefined,
          numTracks: totalTracks,
          genre: project.genre || undefined,
        }}
      />

      <ProjectHeroSection
        project={project}
        isMobile={isMobile}
        onNavigateBack={() => navigate("/projects")}
        onOpenSettings={() => dialogs.setSettingsOpen(true)}
        onOpenMediaGenerator={() => dialogs.openMediaGenerator(null)}
      />

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

      {totalTracks > 0 && !isPublished && (
        <div className={cn("max-w-sm mx-auto mt-2", isMobile ? "px-3" : "")}>
          <ProjectReadinessIndicator totalTracks={totalTracks} tracksWithMaster={tracksWithMaster} />
        </div>
      )}

      {isReadyToPublish && !isPublished && (
        <div className="flex justify-center mt-2">
          <Button
            size="sm"
            onClick={() => dialogs.setPublishDialogOpen(true)}
            className="gap-1.5 bg-green-500 hover:bg-green-600 h-10 min-h-touch"
          >
            <Rocket className="w-3.5 h-3.5" />
            Опубликовать
          </Button>
        </div>
      )}

      <QuickActionsBar
        project={project}
        isMobile={isMobile}
        isGenerating={isGenerating}
        totalTracks={totalTracks}
        tracksWithMaster={tracksWithMaster}
        onAddTrack={() => dialogs.setAddTrackOpen(true)}
        onGenerateTracklist={generateTracklistArgs}
        onOpenAI={() => dialogs.setAiDialogOpen(true)}
        onShare={handlers.handleShare}
      />

      <Tabs defaultValue="tracks" className="w-full">
        <div className={cn(isMobile ? "px-3 pt-2" : "px-4 pt-2")}>
          <TabsList className={cn("w-full grid grid-cols-2 bg-muted/50", isMobile ? "h-10" : "h-9")}>
            <TabsTrigger
              value="tracks"
              className={cn("gap-1.5 data-[state=active]:bg-background", isMobile && "text-sm")}
            >
              <Music className="w-4 h-4" />
              Треки
            </TabsTrigger>
            <TabsTrigger
              value="text"
              className={cn("gap-1.5 data-[state=active]:bg-background", isMobile && "text-sm")}
            >
              <FileText className="w-4 h-4" />
              Тексты
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tracks" className="mt-0 pt-3">
          <TracksTabContent
            projectId={projectId!}
            tracks={tracks}
            tracksLoading={tracksLoading}
            isGenerating={isGenerating}
            isMobile={isMobile}
            onDragEnd={handlers.handleDragEnd}
            onGenerate={handlers.handleGenerateFromPlan}
            onOpenLyrics={handlers.handleOpenLyrics}
            onOpenLyricsWizard={dialogs.openLyricsWizard}
            onAddTrack={() => dialogs.setAddTrackOpen(true)}
            onGenerateTracklist={generateTracklistArgs}
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
