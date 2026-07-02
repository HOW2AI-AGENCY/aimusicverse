/**
 * LyricsAIPanel — AI-ассистент для LyricsStudio в двух режимах:
 * - desktop: боковая панель (slide-in 400px)
 * - mobile: full-screen поверх
 *
 * Также включает mobile FAB (Sparkles), который открывает панель.
 *
 * Извлечено из pages/LyricsStudio.tsx в Sprint 042 (god-page декомпозиция).
 */

import { AnimatePresence, motion } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Music2, Sparkles, X } from "@/lib/icons";
import { LyricsAIChatAgent } from "@/components/lyrics-workspace/LyricsAIChatAgent";
import { MobileAIAgentPanel } from "@/components/lyrics-workspace/ai-agent/MobileAIAgentPanel";

/** Lyrics AI slide-in width (px) — single source, used by motion + inner wrapper. */
const LYRICS_AI_PANEL_WIDTH = 400;

export interface ProjectDataForAI {
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
}

export interface ProjectTrackForAI {
  position: number;
  title: string;
  notes: string | null;
  recommended_tags: string[] | null;
  recommended_structure: string | null;
  style_prompt: string | null;
}

export interface TracklistItemForAI {
  position: number;
  title: string;
  hasLyrics: boolean;
  status: string | undefined;
}

interface LyricsAIPanelProps {
  /** Whether the AI panel is currently open. */
  open: boolean;
  /** Whether we are on mobile (controls which variant to render). */
  isMobile: boolean;
  /** Whether the document is saving (used for FAB disable state if needed). */
  isSaving: boolean;
  /** Whether the project track mode is active. */
  isProjectTrackMode: boolean;
  /** The full document lyrics as text. */
  existingLyrics: string;
  /** Currently selected section (transformed to agent shape). */
  selectedSectionForAgent: {
    type: string;
    content: string;
    notes: string | undefined;
    tags: string[] | undefined;
  } | null;
  /** Global tags. */
  globalTags: string[];
  /** All section notes (transformed to agent shape). */
  allSectionNotesForAgent: Array<{ type: string; notes: string; tags: string[] }>;
  /** Project data (for context). */
  projectData: ProjectDataForAI | null;
  /** Project track data (for context). */
  projectTrack: ProjectTrackForAI | null;
  /** Document title. */
  title: string;
  /** Tracklist summary. */
  tracklist: TracklistItemForAI[];
  /** Колбэки. */
  onClose: () => void;
  onInsertLyrics: (text: string) => void;
  onReplaceLyrics: (text: string) => void;
  onAddTags: (tags: string[]) => void;
  onOpen?: () => void;
  onHaptic?: () => void;
}

export function LyricsAIPanel({
  open,
  isMobile,
  isProjectTrackMode,
  existingLyrics,
  selectedSectionForAgent,
  globalTags,
  allSectionNotesForAgent,
  projectData,
  projectTrack,
  title,
  tracklist,
  onClose,
  onInsertLyrics,
  onReplaceLyrics,
  onAddTags,
  onOpen,
  onHaptic,
}: LyricsAIPanelProps) {
  const haptic = onHaptic ?? (() => {});

  // Build the agent props once (same shape for desktop and mobile).
  const agentBaseProps = {
    existingLyrics,
    selectedSection: selectedSectionForAgent ?? undefined,
    globalTags,
    sectionTags: selectedSectionForAgent?.tags,
    allSectionNotes: allSectionNotesForAgent,
    stylePrompt: projectTrack?.style_prompt ?? "",
    title,
    projectContext: projectData
      ? {
          projectId: projectData.id,
          projectTitle: projectData.title,
          projectType: projectData.project_type ?? undefined,
          genre: projectData.genre ?? undefined,
          mood: projectData.mood ?? undefined,
          concept: projectData.concept ?? undefined,
          targetAudience: projectData.target_audience ?? undefined,
          referenceArtists: projectData.reference_artists ?? undefined,
          language: projectData.language ?? undefined,
        }
      : undefined,
    trackContext: projectTrack
      ? {
          position: projectTrack.position,
          title: projectTrack.title,
          notes: projectTrack.notes ?? undefined,
          recommendedTags: projectTrack.recommended_tags ?? undefined,
          recommendedStructure: projectTrack.recommended_structure ?? undefined,
        }
      : undefined,
    tracklist,
    onInsertLyrics,
    onReplaceLyrics,
    onAddTags,
  };

  return (
    <>
      {/* Desktop sidebar */}
      {!isMobile && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: LYRICS_AI_PANEL_WIDTH, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="border-l border-border/50 overflow-hidden bg-gradient-to-b from-muted/30 to-background flex flex-col"
            >
              <div className="w-[400px] h-full flex flex-col">
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

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
                            {tracklist.filter((t) => t.hasLyrics).length}/{tracklist.length} треков
                          </Badge>
                        )}
                      </div>

                      {projectData.concept && (
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{projectData.concept}</p>
                      )}
                    </div>
                  )}
                </div>

                <LyricsAIChatAgent {...agentBaseProps} className="flex-1 overflow-hidden" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile full-screen */}
      {isMobile && (
        <AnimatePresence>
          {open && (
            <MobileAIAgentPanel
              {...agentBaseProps}
              genre={projectData?.genre ?? undefined}
              mood={projectData?.mood ?? undefined}
              onClose={onClose}
              isOpen={open}
            />
          )}
        </AnimatePresence>
      )}

      {/* Mobile FAB for AI Assistant - positioned above player and Telegram MainButton.
          This is rendered when closed on mobile; the desktop FAB lives in LyricsEditor. */}
      {isMobile && !open && onOpen && (
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
              onOpen();
              haptic();
            }}
          >
            <Sparkles className="w-6 h-6" />
          </Button>
        </motion.div>
      )}
    </>
  );
}
