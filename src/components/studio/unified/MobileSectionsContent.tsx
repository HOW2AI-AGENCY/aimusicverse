/**
 * MobileSectionsContent - Section replacement for mobile studio
 * Uses real section detection from lyrics and timestamps
 * 
 * IMPROVEMENTS:
 * - Enhanced button/icon visibility for mobile
 * - Better section detection with merge threshold
 * - Synchronized lyrics with section boundaries
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { Scissors, Loader2, Music, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionEditorSheet } from '@/components/studio/editor/SectionEditorSheet';
import { MobileSectionsView } from './MobileSectionsView';
import { useSectionDetection, DetectedSection } from '@/hooks/useSectionDetection';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useReplacedSections } from '@/hooks/useReplacedSections';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { StudioProject, StudioTrack } from '@/stores/useUnifiedStudioStore';

interface MobileSectionsContentProps {
  project: StudioProject;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
}

export const MobileSectionsContent = memo(function MobileSectionsContent({
  project,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onPlayPause,
}: MobileSectionsContentProps) {
  const [selectedTrack, setSelectedTrack] = useState<StudioTrack | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const {
    selectedSection,
    selectedSectionIndex,
    selectSection,
    clearSelection,
  } = useSectionEditorStore();

  // For now, use first track (can expand to track selector later)
  const mainTrack = project.tracks[0];
  const sourceTrackId = project.sourceTrackId;

  // Fetch source track metadata for lyrics and suno IDs
  const { data: sourceTrack } = useQuery({
    queryKey: ['source-track', sourceTrackId],
    queryFn: async () => {
      if (!sourceTrackId) return null;
      const { data } = await supabase
        .from('tracks')
        .select('id, lyrics, suno_task_id, suno_id')
        .eq('id', sourceTrackId)
        .maybeSingle();
      return data;
    },
    enabled: !!sourceTrackId,
  });

  // Get timestamped lyrics for section detection
  const { data: lyricsData, isLoading: lyricsLoading } = useTimestampedLyrics(
    sourceTrack?.suno_task_id || null,
    sourceTrack?.suno_id || null
  );

  // Detect sections from lyrics
  const detectedSections = useSectionDetection(
    sourceTrack?.lyrics,
    lyricsData?.alignedWords,
    duration
  );

  // Get replaced sections
  const { data: replacedSections } = useReplacedSections(sourceTrackId || '');

  // Map replaced sections to ranges
  const replacedRanges = useMemo(() => {
    if (!replacedSections) return [];
    return replacedSections.map(s => ({
      start: s.start,
      end: s.end,
      status: s.status,
    }));
  }, [replacedSections]);

  // Handle section click - open editor
  const handleSectionClick = useCallback((section: DetectedSection, index: number) => {
    selectSection(section, index);
    if (mainTrack) {
      setSelectedTrack(mainTrack);
      setShowEditor(true);
    }
  }, [selectSection, mainTrack]);

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false);
    setSelectedTrack(null);
    clearSelection();
  }, [clearSelection]);

  // Loading state - improved visibility
  if (lyricsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="p-4 rounded-full bg-primary/10 mb-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
        <p className="text-base font-medium text-foreground">Анализ секций...</p>
        <p className="text-sm text-muted-foreground mt-1">Определяем структуру трека</p>
      </div>
    );
  }

  // No main track - improved visibility
  if (!mainTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <Music className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="text-base font-medium text-foreground">Нет дорожки</p>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          Добавьте дорожку для работы с секциями
        </p>
      </div>
    );
  }

  // No sections detected
  if (detectedSections.length === 0 && !lyricsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="p-4 rounded-full bg-amber-500/10 mb-4">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <p className="text-base font-medium text-foreground">Секции не найдены</p>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          Убедитесь, что у трека есть текст с разметкой секций
        </p>
      </div>
    );
  }

  return (
    <>
      <MobileSectionsView
        sections={detectedSections}
        replacedRanges={replacedRanges}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onSectionClick={handleSectionClick}
        onSeek={onSeek}
        onPlayPause={onPlayPause}
      />

      {/* Section Editor Sheet */}
      {selectedTrack && (
        <SectionEditorSheet
          open={showEditor}
          onClose={handleCloseEditor}
          trackId={sourceTrackId || selectedTrack.id}
          trackTitle={selectedTrack.name}
          audioUrl={selectedTrack.audioUrl || selectedTrack.clips?.[0]?.audioUrl}
          duration={duration}
          detectedSections={detectedSections}
        />
      )}
    </>
  );
});
