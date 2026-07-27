/**
 * Unified hook for section replacement logic
 * Manages selection, validation, and mutation state with progress tracking
 */

import { useState, useCallback, useRef } from "react";
import { useSectionEditorStore } from "@/stores/useSectionEditorStore";
import { useReplaceSectionMutation } from "@/hooks/useReplaceSectionMutation";
import { useReplaceSectionProgress } from "@/hooks/generation/useReplaceSectionProgress";
import { DetectedSection } from "@/hooks/useSectionDetection";

interface UseSectionReplacementOptions {
  trackId: string;
  trackTags?: string | null;
  duration: number;
  detectedSections?: DetectedSection[];
  fullLyrics?: string | null;
  onSuccess?: () => void;
}

export function useSectionReplacement({
  trackId,
  trackTags,
  duration,
  detectedSections = [],
  fullLyrics,
  onSuccess,
}: UseSectionReplacementOptions) {
  const [localPrompt, setLocalPrompt] = useState("");
  const [localTags, setLocalTags] = useState(trackTags || "");
  const [localLyrics, setLocalLyrics] = useState("");

  const { selectedSection, selectedSectionIndex, customRange, setCustomRange, clearSelection, setActiveTask } =
    useSectionEditorStore();

  const replaceMutation = useReplaceSectionMutation();
  const sectionProgress = useReplaceSectionProgress();

  // Derived state
  const startTime = customRange?.start ?? selectedSection?.startTime ?? 0;
  const endTime = customRange?.end ?? selectedSection?.endTime ?? 0;
  const sectionDuration = endTime - startTime;
  // Suno hard limits for infill: section must be between 6 and 60 seconds.
  const MIN_SECTION_SECONDS = 6;
  const MAX_SECTION_SECONDS = 60;
  // Also cannot exceed 50% of the track duration.
  const maxDuration = Math.min(MAX_SECTION_SECONDS, duration > 0 ? duration * 0.5 : MAX_SECTION_SECONDS);
  const isValidDuration = sectionDuration >= MIN_SECTION_SECONDS && sectionDuration <= maxDuration;

  const hasSelection = customRange !== null || selectedSection !== null;

  // Initialize tags and lyrics from selection.
  // Using the "adjust state during render when prop changes" pattern avoids
  // setState-in-effect cascading renders. We keep a ref of the last-seen
  // external value so we only re-seed local state when the external value
  // actually changes (mirrors the old effect semantics).
  const prevTrackTagsRef = useRef<string | null | undefined>(trackTags);
  const prevSectionLyricsRef = useRef<string | undefined>(selectedSection?.lyrics);
  if (prevTrackTagsRef.current !== trackTags && trackTags && !localTags) {
    prevTrackTagsRef.current = trackTags;
    setLocalTags(trackTags);
  } else if (prevTrackTagsRef.current !== trackTags) {
    prevTrackTagsRef.current = trackTags;
  }

  if (prevSectionLyricsRef.current !== selectedSection?.lyrics && selectedSection?.lyrics) {
    prevSectionLyricsRef.current = selectedSection?.lyrics;
    setLocalLyrics(selectedSection.lyrics);
  } else if (prevSectionLyricsRef.current !== selectedSection?.lyrics) {
    prevSectionLyricsRef.current = selectedSection?.lyrics;
  }

  // Select a detected section
  const selectSection = useCallback(
    (index: number) => {
      const section = detectedSections[index];
      if (!section) return;

      const sectionLen = section.endTime - section.startTime;
      if (sectionLen > maxDuration) {
        // Trim to max allowed
        setCustomRange(section.startTime, section.startTime + maxDuration);
      } else {
        setCustomRange(section.startTime, section.endTime);
      }
      setLocalLyrics(section.lyrics);
    },
    [detectedSections, maxDuration, setCustomRange],
  );

  // Update time range with improved lyrics extraction
  const updateRange = useCallback(
    (start: number, end: number) => {
      setCustomRange(start, end);

      // Find matching section with improved tolerance based on section length
      const rangeDuration = end - start;
      const tolerance = Math.min(1.0, rangeDuration * 0.15); // 15% tolerance, max 1 second

      const matchingSection = detectedSections.find(
        (s) => Math.abs(s.startTime - start) < tolerance && Math.abs(s.endTime - end) < tolerance,
      );

      if (matchingSection) {
        setLocalLyrics(matchingSection.lyrics);
      } else {
        // Try to find overlapping sections and combine their lyrics
        const overlappingSections = detectedSections.filter((s) => {
          const overlapStart = Math.max(s.startTime, start);
          const overlapEnd = Math.min(s.endTime, end);
          const overlapDuration = overlapEnd - overlapStart;
          const sectionDuration = s.endTime - s.startTime;
          // At least 50% overlap with the section
          return overlapDuration > 0 && overlapDuration >= sectionDuration * 0.5;
        });

        if (overlappingSections.length > 0) {
          // Combine lyrics from overlapping sections
          const combinedLyrics = overlappingSections
            .sort((a, b) => a.startTime - b.startTime)
            .map((s) => s.lyrics.trim())
            .filter((l) => l.length > 0)
            .join("\n\n");

          if (combinedLyrics) {
            setLocalLyrics(combinedLyrics);
          }
        }
      }
    },
    [detectedSections, setCustomRange],
  );

  // Add preset to prompt
  const addPreset = useCallback((preset: string) => {
    setLocalPrompt((prev) => (prev ? `${prev}, ${preset}` : preset));
  }, []);

  // Execute replacement with progress tracking
  const executeReplacement = useCallback(async () => {
    if (!isValidDuration) return;

    // Suno regenerates the infill window from `fullLyrics`, so the edited section
    // text must be spliced INTO the full document (prompt is style-only).
    const originalSectionLyrics = selectedSection?.lyrics ?? "";
    const { lyrics: mergedFullLyrics, spliced } = spliceSectionLyrics(fullLyrics, originalSectionLyrics, localLyrics);

    if (localLyrics && localLyrics.trim() !== originalSectionLyrics.trim() && !spliced) {
      logger.warn("Edited section lyrics could not be spliced into full lyrics", {
        trackId,
        hasFullLyrics: Boolean(fullLyrics),
      });
    }

    sectionProgress.setSubmitting();

    try {
      const result = await replaceMutation.mutateAsync({
        trackId,
        prompt: localPrompt || undefined,
        tags: localTags || undefined,
        fullLyrics: mergedFullLyrics || fullLyrics || undefined,
        sectionLyrics: localLyrics || originalSectionLyrics || undefined,
        infillStartS: Math.round(startTime * 10) / 10,
        infillEndS: Math.round(endTime * 10) / 10,
      });

      if (result?.taskId) {
        setActiveTask(result.taskId);
        sectionProgress.startTracking(result.taskId, trackId, { start: startTime, end: endTime });
      }

      onSuccess?.();
    } catch (error) {
      sectionProgress.setError(error instanceof Error ? error.message : "Ошибка замены секции");
    }
  }, [
    isValidDuration,
    localPrompt,
    localLyrics,
    localTags,
    fullLyrics,
    startTime,
    endTime,
    trackId,
    selectedSection,
    replaceMutation,
    setActiveTask,
    onSuccess,
    sectionProgress,
  ]);

  // Reset state
  const reset = useCallback(() => {
    setLocalPrompt("");
    setLocalLyrics("");
    clearSelection();
    sectionProgress.reset();
  }, [clearSelection, sectionProgress]);

  return {
    // Selection state
    startTime,
    endTime,
    sectionDuration,
    maxDuration,
    hasSelection,
    selectedSection,
    selectedSectionIndex,

    // Validation
    isValidDuration,
    isSubmitting: replaceMutation.isPending || sectionProgress.isActive,

    // Progress tracking
    progress: sectionProgress,

    // Form state
    prompt: localPrompt,
    setPrompt: setLocalPrompt,
    tags: localTags,
    setTags: setLocalTags,
    lyrics: localLyrics,
    setLyrics: setLocalLyrics,

    // Actions
    selectSection,
    updateRange,
    addPreset,
    executeReplacement,
    reset,
  };
}

// Prompt presets
export const SECTION_PRESETS = [
  { id: "energetic", label: "⚡ Энергичнее", prompt: "more energetic, higher tempo, powerful" },
  { id: "soft", label: "🎵 Мягче", prompt: "softer, gentler, acoustic feel" },
  { id: "epic", label: "🎬 Эпичнее", prompt: "epic, orchestral, cinematic" },
  { id: "minimal", label: "🎹 Минимал", prompt: "minimal, stripped down, simple" },
  { id: "rock", label: "🎸 Рок", prompt: "rock style, distorted guitar, drums" },
  { id: "acoustic", label: "🎤 Акустика", prompt: "acoustic, unplugged, natural" },
] as const;
