/**
 * LyricsStudioPage — orchestrator for the LyricsStudio screen.
 *
 * Owns: state, data loading, save/load handlers, Telegram back-button wiring.
 * Renders 5 sub-components (Header, Tags, Editor, AIPanel, Footer) plus the
 * mobile templates drawer.
 *
 * Decomposed from a 1092-LOC monolith during Sprint 042 god-page refactor.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { Loader2, Plus, FileText } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { LyricsSection } from "@/components/lyrics-workspace";
import { useLyricsTemplates } from "@/hooks/useLyricsTemplates";
import { useLyricsVersioning } from "@/hooks/useLyricsVersioning";
import { useLyricsHistoryStore } from "@/stores/useLyricsHistoryStore";
import { useSectionNotes } from "@/hooks/useSectionNotes";
// NOTE: saveSectionNote was removed from useSectionNotes — this type
// remains only as a placeholder signature for the dormant save path.
type SaveSectionNoteData = unknown;
void ({} as SaveSectionNoteData);
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { supabase } from "@/integrations/supabase/client";
import { hapticImpact } from "@/lib/haptic";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LyricsHeader,
  LyricsEditor,
  LyricsTagsPanels,
  LyricsAIPanel,
  LyricsFooter,
  parseLyricsToSections,
  sectionsToLyrics,
} from "./index";

export default function LyricsStudio() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const projectId = searchParams.get("projectId");
  const trackId = searchParams.get("trackId");
  const isMobile = useIsMobile();

  // Context handed over from the generate form / other entry points
  const navState = (location.state ?? null) as { initialLyrics?: string; initialTitle?: string } | null;


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
  // useSectionNotes returns { data, createNote, ... } — adapt it to the shape this page needs.
  const { data: rawSectionNotes } = useSectionNotes(templateId || undefined);
  const sectionNotes = useMemo(
    () =>
      (rawSectionNotes ?? []).map((n) => ({
        section_type: n.sectionType ?? undefined,
        notes: n.content ?? undefined,
        tags: n.tags ?? undefined,
      })),
    [rawSectionNotes],
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

  // Hydrate from navigation state (e.g. lyrics typed in the generate form)
  useEffect(() => {
    if (isProjectTrackMode || templateId) return;
    if (navState?.initialTitle) setTitle(navState.initialTitle);
    if (navState?.initialLyrics?.trim()) {
      setSections(parseLyricsToSections(navState.initialLyrics));
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navState?.initialLyrics, navState?.initialTitle, isProjectTrackMode, templateId]);


  const enrichedTags = useMemo(
    () => [...new Set(sectionNotes.flatMap((n) => n.tags ?? []))],
    [sectionNotes],
  );


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
      // Local-only note persistence: attach the note text to the selected section.
      const content = typeof data === "string" ? data : ((data as { content?: string } | null)?.content ?? "");
      setSections((prev) => prev.map((s) => (s.id === selectedSection?.id ? { ...s, notes: content } : s)));
      setIsDirty(true);
    },
    [selectedSection?.id],
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

  // AI panel handlers
  const handleInsertLyrics = useCallback(
    (text: string) => {
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
    },
    [selectedSection, sections, handleSectionsChange],
  );

  const handleReplaceLyrics = useCallback(
    (text: string) => {
      const parsedSections = parseLyricsToSections(text);
      handleSectionsChange(parsedSections);
      setIsDirty(true);
    },
    [handleSectionsChange],
  );

  const handleAddTags = useCallback((tags: string[]) => {
    setGlobalTags((prev) => [...new Set([...prev, ...tags])]);
    setIsDirty(true);
  }, []);

  const handleRestoreFromHistory = useCallback((entry: { sections: LyricsSection[]; tags: string[] }) => {
    setSections(entry.sections);
    setGlobalTags(entry.tags);
  }, []);

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
        <div className="flex-1 min-w-0 max-w-3xl xl:max-w-5xl 2xl:max-w-6xl mx-auto w-full">
          <LyricsEditor
            sections={sections}
            globalTags={globalTags}
            isSaving={isSavingLyrics}
            isMobile={isMobile}
            aiPanelOpen={aiPanelOpen}
            onSectionsChange={handleSectionsChange}
            onSelectSection={(section) => {
              setSelectedSection(section);
              if (section) handleOpenNotes(section);
            }}
            onSave={handleSave}
            onPushHistory={lyricsHistory.pushSnapshot}
            onRestoreFromHistory={handleRestoreFromHistory}
            onOpenVersions={() => setVersionsPanelOpen(true)}
            onOpenAi={() => setAiPanelOpen(true)}
            onHaptic={() => hapticImpact("light")}
          />

          <LyricsAIPanel
            open={aiPanelOpen}
            isMobile={isMobile}
            isSaving={isSavingLyrics}
            isProjectTrackMode={isProjectTrackMode}
            existingLyrics={sectionsToLyrics(sections)}
            selectedSectionForAgent={
              selectedSection
                ? {
                    type: selectedSection.type,
                    content: selectedSection.content,
                    // Pass actual section notes to AI agent (F7 fix)
                    notes: selectedSection.notes || "",
                    tags: selectedSection.tags,
                  }
                : null
            }
            globalTags={globalTags}
            allSectionNotesForAgent={
              sectionNotes?.map((n: { section_type?: string; notes?: string; tags?: string[] }) => ({
                type: n.section_type || "",
                notes: n.notes || "",
                tags: n.tags || [],
              })) ?? []
            }
            projectData={projectData}
            projectTrack={projectTrack}
            title={title}
            tracklist={tracklist.map((t) => ({
              position: t.position,
              title: t.title,
              hasLyrics: !!t.lyrics,
              status: t.status || undefined,
            }))}
            onClose={() => setAiPanelOpen(false)}
            onInsertLyrics={handleInsertLyrics}
            onReplaceLyrics={(text) => {
              handleReplaceLyrics(text);
              if (isMobile) setAiPanelOpen(false);
            }}
            onAddTags={handleAddTags}
            onOpen={() => setAiPanelOpen(true)}
            onHaptic={() => hapticImpact("medium")}
          />
        </div>
      </div>

      <LyricsFooter
        selectedSection={selectedSection}
        sections={sections}
        notesPanelOpen={notesPanelOpen}
        versionsPanelOpen={versionsPanelOpen}
        versions={lyricsVersioning.versions}
        currentVersion={lyricsVersioning.currentVersion}
        versionsLoading={lyricsVersioning.isLoading}
        existingNote={(() => {
          // Get existing note for selected section (F7 fix)
          if (!selectedSection?.id || !sectionNotes) return null;
          const sectionNote = sectionNotes.find((n) => n.section_type === selectedSection.id);
          return sectionNote?.notes || "";
        })()}
        lyricsTemplateId={templateId || undefined}
        onNotesOpenChange={setNotesPanelOpen}
        onVersionsOpenChange={setVersionsPanelOpen}
        onSaveNote={handleSaveNote}
        onEnrichWithTags={(tags) => {
          if (selectedSection) {
            handleSectionsChange(
              sections.map((s) =>
                s.id === selectedSection.id ? { ...s, tags: [...new Set([...(s.tags || []), ...tags])] } : s,
              ),
            );
          }
        }}
        onRestoreVersion={async (versionId) => {
          const restored = await lyricsVersioning.restoreVersion(versionId);
          if (restored && restored.sections_data) {
            setSections(restored.sections_data);
            if (restored.tags) setGlobalTags(restored.tags);
            setIsDirty(true);
          }
        }}
        onDeleteVersion={lyricsVersioning.deleteVersion}
      />
    </div>
  );
}
