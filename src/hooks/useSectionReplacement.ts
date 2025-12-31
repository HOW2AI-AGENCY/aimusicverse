/**
 * Unified hook for section replacement logic
 * Manages selection, validation, and mutation state with progress tracking
 */

import { useState, useCallback, useEffect } from 'react';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useReplaceSectionMutation } from '@/hooks/useReplaceSectionMutation';
import { useReplaceSectionProgress } from '@/hooks/generation/useReplaceSectionProgress';
import { DetectedSection } from '@/hooks/useSectionDetection';

interface UseSectionReplacementOptions {
  trackId: string;
  trackTags?: string | null;
  duration: number;
  detectedSections?: DetectedSection[];
  onSuccess?: () => void;
}

export function useSectionReplacement({
  trackId,
  trackTags,
  duration,
  detectedSections = [],
  onSuccess,
}: UseSectionReplacementOptions) {
  const [localPrompt, setLocalPrompt] = useState('');
  const [localTags, setLocalTags] = useState(trackTags || '');
  const [localLyrics, setLocalLyrics] = useState('');
  
  const {
    selectedSection,
    selectedSectionIndex,
    customRange,
    setCustomRange,
    clearSelection,
    setActiveTask,
  } = useSectionEditorStore();

  const replaceMutation = useReplaceSectionMutation();
  const sectionProgress = useReplaceSectionProgress();

  // Derived state
  const startTime = customRange?.start ?? selectedSection?.startTime ?? 0;
  const endTime = customRange?.end ?? selectedSection?.endTime ?? 0;
  const sectionDuration = endTime - startTime;
  // Use a reasonable default max duration if track duration is 0 (not loaded yet)
  const maxDuration = duration > 0 ? duration * 0.5 : 120; // 2 min default max
  const isValidDuration = sectionDuration > 0 && (duration === 0 || sectionDuration <= maxDuration);
  const hasSelection = customRange !== null || selectedSection !== null;

  // Initialize tags and lyrics from selection
  useEffect(() => {
    if (trackTags && !localTags) {
      setLocalTags(trackTags);
    }
  }, [trackTags]);

  useEffect(() => {
    if (selectedSection?.lyrics) {
      setLocalLyrics(selectedSection.lyrics);
    }
  }, [selectedSection]);

  // Select a detected section
  const selectSection = useCallback((index: number) => {
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
  }, [detectedSections, maxDuration, setCustomRange]);

  // Update time range
  const updateRange = useCallback((start: number, end: number) => {
    setCustomRange(start, end);
    
    // Find matching section
    const matchingSection = detectedSections.find(
      s => Math.abs(s.startTime - start) < 0.5 && Math.abs(s.endTime - end) < 0.5
    );
    if (matchingSection) {
      setLocalLyrics(matchingSection.lyrics);
    }
  }, [detectedSections, setCustomRange]);

  // Add preset to prompt
  const addPreset = useCallback((preset: string) => {
    setLocalPrompt(prev => prev ? `${prev}, ${preset}` : preset);
  }, []);

  // Execute replacement with progress tracking
  const executeReplacement = useCallback(async () => {
    if (!isValidDuration) return;

    // Build prompt with lyrics if changed
    let finalPrompt = localPrompt;
    if (localLyrics && localLyrics !== selectedSection?.lyrics) {
      finalPrompt = localLyrics + (localPrompt ? `\n\n${localPrompt}` : '');
    }

    sectionProgress.setSubmitting();

    try {
      const result = await replaceMutation.mutateAsync({
        trackId,
        prompt: finalPrompt || undefined,
        tags: localTags || undefined,
        infillStartS: Math.round(startTime * 10) / 10,
        infillEndS: Math.round(endTime * 10) / 10,
      });

      if (result?.taskId) {
        setActiveTask(result.taskId);
        sectionProgress.startTracking(result.taskId, trackId, { start: startTime, end: endTime });
      }

      onSuccess?.();
    } catch (error) {
      sectionProgress.setError(error instanceof Error ? error.message : 'Ошибка замены секции');
    }
  }, [
    isValidDuration, localPrompt, localLyrics, localTags,
    startTime, endTime, trackId, selectedSection, replaceMutation,
    setActiveTask, onSuccess, sectionProgress
  ]);

  // Reset state
  const reset = useCallback(() => {
    setLocalPrompt('');
    setLocalLyrics('');
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
  { id: 'energetic', label: '⚡ Энергичнее', prompt: 'more energetic, higher tempo, powerful' },
  { id: 'soft', label: '🎵 Мягче', prompt: 'softer, gentler, acoustic feel' },
  { id: 'epic', label: '🎬 Эпичнее', prompt: 'epic, orchestral, cinematic' },
  { id: 'minimal', label: '🎹 Минимал', prompt: 'minimal, stripped down, simple' },
  { id: 'rock', label: '🎸 Рок', prompt: 'rock style, distorted guitar, drums' },
  { id: 'acoustic', label: '🎤 Акустика', prompt: 'acoustic, unplugged, natural' },
] as const;
