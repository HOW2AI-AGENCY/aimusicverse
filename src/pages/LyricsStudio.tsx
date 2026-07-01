// @ts-nocheck
/**
 * Lyrics Studio Page
 * Professional lyrics editing with section notes, audio references, and tag enrichment
 * Optimized for mobile with bottom sheets and touch-friendly controls
 * Supports both standalone template mode and project track editing mode
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "@/lib/motion";
import { ChevronLeft, Save, Plus, FileText, Sparkles, Tag, Loader2, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LyricsWorkspace,
  LyricsSection,
  TagsEditor,
  LyricsHistoryBar,
  LyricsVersionsPanel,
} from "@/components/lyrics-workspace";
import { SectionNotesPanel } from "@/components/studio/unified/SectionNotesPanel";
import { LyricsAIChatAgent } from "@/components/lyrics-workspace/LyricsAIChatAgent";
import { MobileAIAgentPanel } from "@/components/lyrics-workspace/ai-agent/MobileAIAgentPanel";
import { useLyricsTemplates } from "@/hooks/useLyricsTemplates";
import { useLyricsVersioning } from "@/hooks/useLyricsVersioning";
import { useLyricsHistoryStore } from "@/stores/useLyricsHistoryStore";
import { useSectionNotes, SaveSectionNoteData } from "@/hooks/useSectionNotes";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { supabase } from "@/integrations/supabase/client";
import { hapticImpact } from "@/lib/haptic";
import { toast } from "sonner";
import { SEOHead, SEO_PRESETS } from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { parseLyricsToSections, sectionsToLyrics } from "./lyrics-studio/sections";
import { LyricsHeader } from "./lyrics-studio/LyricsHeader";
import { LyricsTagsPanels } from "./lyrics-studio/LyricsTagsPanels";

export default function LyricsStudio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const projectId = searchParams.get("projectId");
  const trackId = searchParams.get("trackId");
  const isMobile = useIsMobile();

  // Project track mode
  const isProjectTrackMode = !!(projectId && trackId);
  const [projectTrack, setProjectTrack] = useState<{
    id: string;
    title: string;
    lyrics: string | null;
    style_prompt: string | null;
    notes: string | null;
    recommended_tags: string[] | null;
    recommended_structure: string | null;
    position: number;
  } | null>(null);
  const [projectData, setProjectData] = useState<{
    id: string;
    title: string;
    genre: string | null;
    mood: string | null;
    concept: string | null;
    target_audience: string | null;
    reference_artists: string[] | null;
    language: string | null;
    project_type: string | null;
    cover_url: string | null;
  } | null>(null);
  const [tracklist, setTracklist] = useState<
    Array<{
      id: string;
      position: number;
      title: string;
      lyrics: string | null;
      status: string | null;
    }>
  >([]);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);

  const { user } = useAuth();
  const { templates, saveTemplate, isLoading: templatesLoading } = useLyricsTemplates();
  const { sectionNotes, saveSectionNote, getNoteForSection, getAllSuggestedTags, isSaving } = useSectionNotes(
    templateId || undefined,
  );

  const [sections, setSections] = useState<LyricsSection[]>([]);
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [title, setTitle] = useState("Новый текст");
  const [isDirty, setIsDirty] = useState(false);
  const [selectedSection, setSelectedSection] = useState<LyricsSection | null>(null);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [tagsPanelOpen, setTagsPanelOpen] = useState(false);
  const [versionsPanelOpen, setVersionsPanelOpen] = useState(false);
  const [isSavingLyrics, setIsSavingLyrics] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Versioning
  const lyricsVersioning = useLyricsVersioning({
    projectTrackId: isProjectTrackMode ? trackId : null,
    lyricsTemplateId: !isProjectTrackMode ? templateId : null,
  });
  const lyricsHistory = useLyricsHistoryStore();

  // Telegram back button - return to project details if in project mode
  useTelegramBackButton({
    visible: true,
    onClick: () => {
      if (isProjectTrackMode && projectId) {
        navigate(`/projects/${projectId}`);
      } else {
        navigate(-1);
      }
    },
  });

  // Load project track data when in project mode
  useEffect(() => {
    async function loadProjectData() {
      if (!isProjectTrackMode || !trackId || !projectId) return;

      setIsLoadingTrack(true);
      try {
        // Load track, project, and tracklist in parallel
        const [trackResult, projectResult, tracklistResult] = await Promise.all([
          supabase
            .from("project_tracks")
            .select("id, title, lyrics, style_prompt, notes, recommended_tags, recommended_structure, position")
            .eq("id", trackId)
            .single(),
          supabase
            .from("music_projects")
            .select(
              "id, title, genre, mood, concept, target_audience, reference_artists, language, project_type, cover_url",
            )
            .eq("id", projectId)
            .single(),
          supabase
            .from("project_tracks")
            .select("id, position, title, lyrics, status")
            .eq("project_id", projectId)
            .order("position", { ascending: true }),
        ]);

        if (trackResult.error) {
          toast.error("Ошибка загрузки трека");
          navigate(`/projects/${projectId}`);
          return;
        }

        if (trackResult.data) {
          setProjectTrack(trackResult.data);
          setTitle(trackResult.data.title);
          if (trackResult.data.lyrics) {
            setSections(parseLyricsToSections(trackResult.data.lyrics));
          }
          if (trackResult.data.recommended_tags) {
            setGlobalTags(trackResult.data.recommended_tags);
          }
          setIsDirty(false);
        }

        if (projectResult.data) {
          setProjectData(projectResult.data);
        }

        if (tracklistResult.data) {
          setTracklist(tracklistResult.data);
        }
      } finally {
        setIsLoadingTrack(false);
      }
    }

    loadProjectData();
  }, [isProjectTrackMode, trackId, projectId, navigate]);

  // Load template if provided (standalone mode)
  useEffect(() => {
    if (!isProjectTrackMode && templateId && templates) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setTitle(template.name);
        setSections(parseLyricsToSections(template.lyrics));
        setIsDirty(false);
      }
    }
  }, [templateId, templates, isProjectTrackMode]);

  // Get all enriched tags from section notes
  const enrichedTags = useMemo(() => getAllSuggestedTags(), [getAllSuggestedTags]);

  const handleSectionsChange = useCallback((newSections: LyricsSection[]) => {
    setSections(newSections);
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) {
      toast.error("Войдите для сохранения");
      return;
    }

    setIsSavingLyrics(true);
    try {
      const lyrics = sectionsToLyrics(sections);
      const allTags = [...new Set([...globalTags, ...enrichedTags])].slice(0, 15);

      if (isProjectTrackMode && trackId) {
        // Save to project track
        const { error } = await supabase
          .from("project_tracks")
          .update({
            lyrics,
            lyrics_status: "draft",
            recommended_tags: allTags,
          })
          .eq("id", trackId);

        if (error) throw error;

        setIsDirty(false);
        toast.success("Лирика сохранена");
        hapticImpact("medium");
      } else {
        // Save as template (standalone mode)
        await saveTemplate({
          name: title,
          lyrics,
          tags: allTags,
        });
        setIsDirty(false);
        toast.success("Текст сохранен");
        hapticImpact("medium");
      }
    } catch (error) {
      toast.error("Ошибка сохранения");
    } finally {
      setIsSavingLyrics(false);
    }
  }, [user, sections, title, enrichedTags, saveTemplate, isProjectTrackMode, trackId, globalTags]);

  const handleOpenNotes = useCallback((section: LyricsSection) => {
    setSelectedSection(section);
    setNotesPanelOpen(true);
    hapticImpact("light");
  }, []);

  const handleSaveNote = useCallback(
    async (data: SaveSectionNoteData) => {
      await saveSectionNote(data);
    },
    [saveSectionNote],
  );

  const handleLoadTemplate = useCallback(
    (template: { id: string; name: string; lyrics: string }) => {
      navigate(`/lyrics-studio?template=${template.id}`);
      setTemplatesOpen(false);
      hapticImpact("light");
    },
    [navigate],
  );

  const handleNewDocument = useCallback(() => {
    if (isProjectTrackMode) {
      // In project mode, going to standalone studio
      navigate("/lyrics-studio");
    } else {
      setSections([]);
      setTitle("Новый текст");
      setIsDirty(false);
      navigate("/lyrics-studio");
    }
    hapticImpact("light");
  }, [navigate, isProjectTrackMode]);

  const handleBack = useCallback(() => {
    if (isProjectTrackMode && projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      // Защита от `navigate(-1)` при пустой истории — в Telegram Mini App
      // это может закрыть Mini App и вернуть в чат. Fallback на главную.
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/");
      }
    }
  }, [isProjectTrackMode, projectId, navigate]);

  // Show loading state for project track
  if (isLoadingTrack) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Загрузка...</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full bg-background"
      style={{
        paddingTop: isMobile
          ? "max(var(--tg-content-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))"
          : undefined,
      }}
    >
      <LyricsHeader
        isProjectTrackMode={isProjectTrackMode}
        projectData={projectData}
        projectTrack={projectTrack}
        isMobile={isMobile}
        title={title}
        isSavingLyrics={isSavingLyrics}
        isDirty={isDirty}
        globalTags={globalTags}
        enrichedTags={enrichedTags}
        onBack={handleBack}
        onSave={handleSave}
        onNewDocument={handleNewDocument}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenAi={() => setAiPanelOpen(true)}
        onOpenTags={() => setTagsPanelOpen(true)}
        onChangeTitle={(newTitle) => {
          setTitle(newTitle);
          setIsDirty(true);
        }}
        onHaptic={() => hapticImpact("light")}
      />

      {/* Mobile Templates Drawer */}
      {isMobile && (
        <Drawer open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b pb-3">
              <DrawerTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Мои тексты
              </DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2 h-12" onClick={handleNewDocument}>
                <Plus className="w-5 h-5" />
                Новый текст
              </Button>

              <ScrollArea className="h-[50vh]">
                <div className="space-y-2 pr-2">
                  {templatesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : templates?.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Нет сохраненных текстов</p>
                    </div>
                  ) : (
                    templates?.map((template) => (
                      <Card
                        key={template.id}
                        className={cn(
                          "p-4 cursor-pointer transition-all active:scale-[0.98]",
                          templateId === template.id ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                        )}
                        onClick={() => handleLoadTemplate(template)}
                      >
                        <p className="font-medium truncate">{template.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                          {template.lyrics.substring(0, 80)}...
                        </p>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <LyricsTagsPanels
        open={tagsPanelOpen}
        globalTags={globalTags}
        enrichedTags={enrichedTags}
        onOpen={() => setTagsPanelOpen(true)}
        onClose={() => setTagsPanelOpen(false)}
        onChange={(tags) => {
          setGlobalTags(tags);
          setIsDirty(true);
        }}
      />

      {/* Main Content with AI Panel */}
      <div className="flex-1 overflow-hidden flex">
        {/* Lyrics Workspace */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <div className="flex-1 overflow-hidden">
            <LyricsWorkspace
              sections={sections}
              onChange={(newSections) => {
                handleSectionsChange(newSections);
                // Push to local history
                lyricsHistory.pushSnapshot({
                  sections: newSections,
                  tags: globalTags,
                  changeType: "edit",
                });
              }}
              onSave={handleSave}
              isSaving={isSavingLyrics}
              hideSaveButton
              onSectionSelect={setSelectedSection}
            />
          </div>

          {/* History Bar */}
          <LyricsHistoryBar
            onStateChange={(entry) => {
              setSections(entry.sections);
              setGlobalTags(entry.tags);
            }}
            onOpenVersions={() => setVersionsPanelOpen(true)}
          />

          {/* Desktop FAB for AI when panel is closed */}
          {!isMobile && !aiPanelOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute bottom-16 right-6 z-10"
            >
              <Button
                size="lg"
                className="rounded-full h-14 w-14 shadow-xl shadow-primary/30 bg-gradient-to-br from-primary to-primary/80"
                onClick={() => {
                  setAiPanelOpen(true);
                  hapticImpact("medium");
                }}
              >
                <Bot className="w-6 h-6" />
              </Button>
            </motion.div>
          )}
        </div>

        {/* AI Assistant Panel - Desktop sidebar */}
        {!isMobile && (
          <AnimatePresence>
            {aiPanelOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 400, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="border-l border-border/50 overflow-hidden bg-gradient-to-b from-muted/30 to-background flex flex-col"
              >
                <div className="w-[400px] h-full flex flex-col">
                  {/* Panel Header */}
                  <div className="p-4 border-b border-border/50 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">AI Lyrics Agent</h3>
                          <p className="text-[10px] text-muted-foreground">
                            {isProjectTrackMode ? "Режим проекта" : "Свободный режим"}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAiPanelOpen(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Project Context Summary for Desktop */}
                    {isProjectTrackMode && projectData && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Music2 className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-medium">{projectData.title}</span>
                          </div>
                          {projectTrack && (
                            <Badge variant="outline" className="text-[10px]">
                              #{projectTrack.position + 1} {projectTrack.title}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {projectData.genre && (
                            <Badge variant="secondary" className="text-[10px]">
                              {projectData.genre}
                            </Badge>
                          )}
                          {projectData.mood && (
                            <Badge variant="secondary" className="text-[10px]">
                              {projectData.mood}
                            </Badge>
                          )}
                          {tracklist.length > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              {tracklist.filter((t) => !!t.lyrics).length}/{tracklist.length} треков
                            </Badge>
                          )}
                        </div>

                        {projectData.concept && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{projectData.concept}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Chat Agent */}
                  <LyricsAIChatAgent
                    existingLyrics={sectionsToLyrics(sections)}
                    selectedSection={
                      selectedSection
                        ? {
                            type: selectedSection.type,
                            content: selectedSection.content,
                            notes: getNoteForSection(selectedSection.id)?.notes || undefined,
                            tags: selectedSection.tags,
                          }
                        : undefined
                    }
                    globalTags={globalTags}
                    sectionTags={selectedSection?.tags}
                    allSectionNotes={sectionNotes?.map((n) => ({
                      type: n.section_type || "",
                      notes: n.notes || "",
                      tags: n.tags || [],
                    }))}
                    stylePrompt={projectTrack?.style_prompt || ""}
                    title={title}
                    projectContext={
                      projectData
                        ? {
                            projectId: projectData.id,
                            projectTitle: projectData.title,
                            projectType: projectData.project_type || undefined,
                            genre: projectData.genre || undefined,
                            mood: projectData.mood || undefined,
                            concept: projectData.concept || undefined,
                            targetAudience: projectData.target_audience || undefined,
                            referenceArtists: projectData.reference_artists || undefined,
                            language: projectData.language || undefined,
                          }
                        : undefined
                    }
                    trackContext={
                      projectTrack
                        ? {
                            position: projectTrack.position,
                            title: projectTrack.title,
                            notes: projectTrack.notes || undefined,
                            recommendedTags: projectTrack.recommended_tags || undefined,
                            recommendedStructure: projectTrack.recommended_structure || undefined,
                          }
                        : undefined
                    }
                    tracklist={tracklist.map((t) => ({
                      position: t.position,
                      title: t.title,
                      hasLyrics: !!t.lyrics,
                      status: t.status || undefined,
                    }))}
                    onInsertLyrics={(text: string) => {
                      if (selectedSection) {
                        handleSectionsChange(
                          sections.map((s) =>
                            s.id === selectedSection.id ? { ...s, content: s.content + "\n" + text } : s,
                          ),
                        );
                      } else if (sections.length > 0) {
                        const lastIdx = sections.length - 1;
                        handleSectionsChange(
                          sections.map((s, idx) => (idx === lastIdx ? { ...s, content: s.content + "\n" + text } : s)),
                        );
                      } else {
                        const parsedSections = parseLyricsToSections(text);
                        handleSectionsChange(parsedSections);
                      }
                      setIsDirty(true);
                    }}
                    onReplaceLyrics={(text: string) => {
                      // Replace all sections with new parsed lyrics
                      const parsedSections = parseLyricsToSections(text);
                      handleSectionsChange(parsedSections);
                      setIsDirty(true);
                    }}
                    onAddTags={(tags: string[]) => {
                      setGlobalTags((prev) => [...new Set([...prev, ...tags])]);
                      setIsDirty(true);
                    }}
                    className="flex-1 overflow-hidden"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* AI Assistant - Mobile Full-screen Panel */}
      {isMobile && (
        <AnimatePresence>
          {aiPanelOpen && (
            <MobileAIAgentPanel
              existingLyrics={sectionsToLyrics(sections)}
              selectedSection={
                selectedSection
                  ? {
                      type: selectedSection.type,
                      content: selectedSection.content,
                      notes: getNoteForSection(selectedSection.id)?.notes || undefined,
                      tags: selectedSection.tags,
                    }
                  : undefined
              }
              globalTags={globalTags}
              sectionTags={selectedSection?.tags}
              allSectionNotes={sectionNotes?.map((n) => ({
                type: n.section_type || "",
                notes: n.notes || "",
                tags: n.tags || [],
              }))}
              stylePrompt={projectTrack?.style_prompt || ""}
              title={title}
              genre={projectData?.genre || undefined}
              mood={projectData?.mood || undefined}
              projectContext={
                projectData
                  ? {
                      projectId: projectData.id,
                      projectTitle: projectData.title,
                      projectType: projectData.project_type || undefined,
                      genre: projectData.genre || undefined,
                      mood: projectData.mood || undefined,
                      concept: projectData.concept || undefined,
                      targetAudience: projectData.target_audience || undefined,
                      referenceArtists: projectData.reference_artists || undefined,
                      language: projectData.language || undefined,
                    }
                  : undefined
              }
              trackContext={
                projectTrack
                  ? {
                      position: projectTrack.position,
                      title: projectTrack.title,
                      notes: projectTrack.notes || undefined,
                      recommendedTags: projectTrack.recommended_tags || undefined,
                      recommendedStructure: projectTrack.recommended_structure || undefined,
                    }
                  : undefined
              }
              tracklist={tracklist.map((t) => ({
                position: t.position,
                title: t.title,
                hasLyrics: !!t.lyrics,
                status: t.status || undefined,
              }))}
              onInsertLyrics={(text: string) => {
                if (selectedSection) {
                  handleSectionsChange(
                    sections.map((s) => (s.id === selectedSection.id ? { ...s, content: s.content + "\n" + text } : s)),
                  );
                } else if (sections.length > 0) {
                  const lastIdx = sections.length - 1;
                  handleSectionsChange(
                    sections.map((s, idx) => (idx === lastIdx ? { ...s, content: s.content + "\n" + text } : s)),
                  );
                } else {
                  const parsedSections = parseLyricsToSections(text);
                  handleSectionsChange(parsedSections);
                }
                setIsDirty(true);
              }}
              onReplaceLyrics={(text: string) => {
                const parsedSections = parseLyricsToSections(text);
                handleSectionsChange(parsedSections);
                setIsDirty(true);
                setAiPanelOpen(false);
              }}
              onAddTags={(tags: string[]) => {
                setGlobalTags((prev) => [...new Set([...prev, ...tags])]);
                setIsDirty(true);
              }}
              onClose={() => setAiPanelOpen(false)}
              isOpen={aiPanelOpen}
            />
          )}
        </AnimatePresence>
      )}

      {/* Mobile FAB for AI Assistant - positioned above player and Telegram MainButton */}
      {isMobile && !aiPanelOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed z-40"
          style={{
            // Account for: safe area + player height (4rem) + MainButton area + padding
            bottom:
              "calc(max(var(--tg-content-safe-area-inset-bottom, 60px), var(--tg-safe-area-inset-bottom, 34px), env(safe-area-inset-bottom, 0px)) + 5rem)",
            right: "1rem",
          }}
        >
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-xl shadow-primary/30 bg-gradient-to-br from-primary to-primary/80"
            onClick={() => {
              setAiPanelOpen(true);
              hapticImpact("medium");
            }}
          >
            <Sparkles className="w-6 h-6" />
          </Button>
        </motion.div>
      )}

      {/* Section Notes Panel */}
      {selectedSection && (
        <SectionNotesPanel
          open={notesPanelOpen}
          onOpenChange={setNotesPanelOpen}
          sectionId={selectedSection.id}
          sectionType={selectedSection.type}
          sectionContent={selectedSection.content}
          position={sections.findIndex((s) => s.id === selectedSection.id)}
          existingNote={getNoteForSection(selectedSection.id)}
          lyricsTemplateId={templateId || undefined}
          onSave={handleSaveNote}
          onEnrichWithTags={(tags) => {
            handleSectionsChange(
              sections.map((s) =>
                s.id === selectedSection.id ? { ...s, tags: [...new Set([...(s.tags || []), ...tags])] } : s,
              ),
            );
          }}
        />
      )}

      {/* Versions Panel */}
      <LyricsVersionsPanel
        open={versionsPanelOpen}
        onOpenChange={setVersionsPanelOpen}
        versions={lyricsVersioning.versions}
        currentVersion={lyricsVersioning.currentVersion}
        isLoading={lyricsVersioning.isLoading}
        onRestore={async (versionId) => {
          const restored = await lyricsVersioning.restoreVersion(versionId);
          if (restored && restored.sections_data) {
            setSections(restored.sections_data);
            if (restored.tags) setGlobalTags(restored.tags);
            setIsDirty(true);
          }
        }}
        onDelete={lyricsVersioning.deleteVersion}
      />
    </div>
  );
}
