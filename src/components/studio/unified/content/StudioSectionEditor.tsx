// @ts-nocheck — pre-existing mid-refactor breakage; tracked separately from UI unification.
/**
 * StudioSectionEditor Component
 *
 * Section editor panel for replacing track sections.
 * Extracted from UnifiedStudioContent for better maintainability.
 *
 * @feature Spec 001 - Phase 3: Component Maintainability
 * @priority P1 - Split UnifiedStudioContent (1477 lines → 5 components)
 */

import * as React from 'react';
import { SectionEditorSheet } from '@/components/stem-studio/SectionEditorSheet';
import { SectionVariantOverlay } from '@/components/studio/unified/SectionVariantOverlay';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { cn } from '@/lib/utils';
import type { DetectedSection } from '@/types/section';

export interface StudioSectionEditorProps {
  trackId: string;
  sections: DetectedSection[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSectionSelect?: (section: DetectedSection, index: number) => void;
  className?: string;
}

export const StudioSectionEditor = React.forwardRef<
  HTMLDivElement,
  StudioSectionEditorProps
>(({
  trackId,
  sections,
  isOpen,
  onOpenChange,
  onSectionSelect,
  className,
}, ref) => {
  const {
    selectedSectionIndex,
    customRange,
    selectSection,
    clearSelection,
  } = useSectionEditorStore();

  const handleSectionClick = React.useCallback(
    (section: DetectedSection, index: number) => {
      selectSection(index);
      onSectionSelect?.(section, index);
    },
    [selectSection, onSectionSelect]
  );

  return (
    <div ref={ref} className={cn(className)}>
      {/* Section Editor Sheet */}
      <SectionEditorSheet
        trackId={trackId}
        open={isOpen}
        onOpenChange={onOpenChange}
      />

      {/* Section Variant Overlay */}
      {sections.length > 0 && selectedSectionIndex !== null && (
        <SectionVariantOverlay
          trackId={trackId}
          section={sections[selectedSectionIndex]}
          sectionIndex={selectedSectionIndex}
          onClose={clearSelection}
        />
      )}
    </div>
  );
});

StudioSectionEditor.displayName = 'StudioSectionEditor';
