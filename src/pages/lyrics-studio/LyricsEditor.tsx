/**
 * LyricsEditor — main editing surface of LyricsStudio.
 *
 * Owns:
 * - LyricsWorkspace (the sectioned editor)
 * - LyricsHistoryBar (undo/redo + versions button)
 * - Desktop FAB (when AI panel is closed)
 *
 * The mobile FAB lives in LyricsAIPanel because it triggers a panel that
 * itself is owned by LyricsAIPanel.
 *
 * Извлечено из pages/LyricsStudio.tsx в Sprint 042 (god-page декомпозиция).
 */

import { motion } from "@/lib/motion";
import { Bot } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { LyricsWorkspace, LyricsSection, LyricsHistoryBar } from "@/components/lyrics-workspace";
import type { LyricsHistoryEntry } from "@/stores/useLyricsHistoryStore";

interface LyricsEditorProps {
  /** Sections of the document. */
  sections: LyricsSection[];
  /** Global tags for the document. */
  globalTags: string[];
  /** Whether the document is saving. */
  isSaving: boolean;
  /** Whether we are on mobile. */
  isMobile: boolean;
  /** Whether the AI panel is currently open (FAB only shows when closed). */
  aiPanelOpen: boolean;
  /** Колбэки. */
  onSectionsChange: (newSections: LyricsSection[]) => void;
  onSelectSection: (section: LyricsSection | null) => void;
  onSave: () => void;
  onPushHistory: (entry: Omit<LyricsHistoryEntry, "timestamp">) => void;
  onRestoreFromHistory: (entry: LyricsHistoryEntry) => void;
  onOpenVersions: () => void;
  onOpenAi: () => void;
  onHaptic?: () => void;
}

export function LyricsEditor({
  sections,
  globalTags,
  isSaving,
  isMobile,
  aiPanelOpen,
  onSectionsChange,
  onSelectSection,
  onSave,
  onPushHistory,
  onRestoreFromHistory,
  onOpenVersions,
  onOpenAi,
  onHaptic,
}: LyricsEditorProps) {
  const haptic = onHaptic ?? (() => {});

  return (
    <div className="flex-1 overflow-hidden relative flex flex-col">
      <div className="flex-1 overflow-hidden">
        <LyricsWorkspace
          sections={sections}
          onChange={(newSections) => {
            onSectionsChange(newSections);
            // Push to local history
            onPushHistory({
              sections: newSections,
              tags: globalTags,
              changeType: "edit",
            });
          }}
          onSave={onSave}
          isSaving={isSaving}
          hideSaveButton
          onSectionSelect={onSelectSection}
        />
      </div>

      {/* History Bar */}
      <LyricsHistoryBar onStateChange={onRestoreFromHistory} onOpenVersions={onOpenVersions} />

      {/* Desktop FAB for AI when panel is closed. Mobile FAB lives in LyricsAIPanel. */}
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
              onOpenAi();
              haptic();
            }}
          >
            <Bot className="w-6 h-6" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
