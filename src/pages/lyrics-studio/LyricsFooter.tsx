/**
 * LyricsFooter — всплывающие панели (Section Notes + Versions), привязанные
 * к низу/центру LyricsStudio.
 *
 * Извлечено из pages/LyricsStudio.tsx в Sprint 042 (god-page декомпозиция).
 *
 * Notes: SectionNotesPanel из studio/unified имеет ограниченный публичный API
 * (sectionId, className, maxHeight) — лишние props передаются как no-op. Это
 * поведение сохранено 1-в-1 с оригиналом (где @ts-nocheck скрывал расхождение).
 */

import { SectionNotesPanel } from "@/components/studio/unified/SectionNotesPanel";
import { LyricsVersionsPanel } from "@/components/lyrics-workspace";
import type { LyricsSection } from "@/components/lyrics-workspace";
import type { LyricsVersion } from "@/hooks/useLyricsVersioning";

interface LyricsFooterProps {
  /** Currently selected section (drives SectionNotesPanel visibility). */
  selectedSection: LyricsSection | null;
  /** All sections (used to find the index of the selected section). */
  sections: LyricsSection[];
  /** Section notes panel open state. */
  notesPanelOpen: boolean;
  /** Versions panel open state. */
  versionsPanelOpen: boolean;
  /** Versions data. */
  versions: LyricsVersion[];
  /** Currently active version. */
  currentVersion: LyricsVersion | null;
  /** Versions loading state. */
  versionsLoading: boolean;
  /** Existing note for the selected section. */
  existingNote: unknown;
  /** Lyrics template id (for persisting notes to template storage). */
  lyricsTemplateId: string | undefined;
  /** Колбэки. */
  onNotesOpenChange: (open: boolean) => void;
  onVersionsOpenChange: (open: boolean) => void;
  onSaveNote: (data: unknown) => Promise<void>;
  onEnrichWithTags: (tags: string[]) => void;
  onRestoreVersion: (versionId: string) => void;
  onDeleteVersion: (versionId: string) => void;
}

export function LyricsFooter({
  selectedSection,
  sections,
  notesPanelOpen,
  versionsPanelOpen,
  versions,
  currentVersion,
  versionsLoading,
  existingNote,
  lyricsTemplateId,
  onNotesOpenChange,
  onVersionsOpenChange,
  onSaveNote,
  onEnrichWithTags,
  onRestoreVersion,
  onDeleteVersion,
}: LyricsFooterProps) {
  return (
    <>
      {/* Section Notes Panel */}
      {selectedSection && (
        <SectionNotesPanel
          {...({
            open: notesPanelOpen,
            onOpenChange: onNotesOpenChange,
            sectionId: selectedSection.id,
            sectionType: selectedSection.type,
            sectionContent: selectedSection.content,
            position: sections.findIndex((s) => s.id === selectedSection.id),
            existingNote,
            lyricsTemplateId,
            onSave: onSaveNote,
            onEnrichWithTags,
          } as any)}
        />
      )}

      {/* Versions Panel */}
      <LyricsVersionsPanel
        open={versionsPanelOpen}
        onOpenChange={onVersionsOpenChange}
        versions={versions}
        currentVersion={currentVersion}
        isLoading={versionsLoading}
        onRestore={onRestoreVersion}
        onDelete={onDeleteVersion}
      />
    </>
  );
}
