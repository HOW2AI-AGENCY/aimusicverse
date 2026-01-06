/**
 * SortableTrackList - Drag and drop reorderable track list
 * Uses @dnd-kit/sortable for smooth drag interactions
 */

import { memo, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence } from '@/lib/motion';
import { StudioTrack } from '@/stores/useUnifiedStudioStore';
import { StudioTrackRow } from './StudioTrackRow';
import { StudioPendingTrackRow } from './StudioPendingTrackRow';
import { cn } from '@/lib/utils';
import { useStemTypeTranscriptionStatus, StemTranscriptionData } from '@/hooks/studio/useStemTypeTranscriptionStatus';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SortableTrackListProps {
  tracks: StudioTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasSoloTracks?: boolean;
  sourceTrackId?: string; // The ID of the source track for extend/replace operations
  stemsExist?: boolean; // If stems exist, disable extend/replace
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onVolumeChange: (trackId: string, volume: number) => void;
  onSeek: (time: number) => void;
  onRemove: (trackId: string) => void;
  onVersionChange: (trackId: string, label: string) => void;
  onAction: (trackId: string, action: 'download' | 'effects' | 'reference' | 'add_vocals' | 'replace_instrumental' | 'extend' | 'replace_section' | 'transcribe' | 'view_notation') => void;
}

interface SortableTrackItemProps {
  track: StudioTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasSoloTracks?: boolean;
  isSourceTrack?: boolean;
  stemsExist?: boolean;
  hasTranscription?: boolean;
  transcription?: StemTranscriptionData | null;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onRemove: () => void;
  onVersionChange?: (label: string) => void;
  onAction?: (action: 'download' | 'effects' | 'reference' | 'add_vocals' | 'replace_instrumental' | 'extend' | 'replace_section' | 'transcribe' | 'view_notation') => void;
}

const SortableTrackItem = memo(function SortableTrackItem({
  track,
  ...props
}: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  if (track.status === 'pending') {
    return (
      <div ref={setNodeRef} style={style}>
        <StudioPendingTrackRow
          track={{
            id: track.id,
            name: track.name,
            type: track.type,
            taskId: track.taskId,
            status: 'pending',
          }}
          onCancel={props.onRemove}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "opacity-80 shadow-xl ring-2 ring-primary/50 rounded-xl"
      )}
      {...attributes}
    >
      {/* Drag handle overlay - only on desktop */}
      <div
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-8 cursor-grab active:cursor-grabbing z-10 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
        style={{ touchAction: 'none' }}
      >
        <div className="w-1 h-8 rounded-full bg-muted-foreground/30" />
      </div>
      
      <StudioTrackRow
        track={track}
        isPlaying={props.isPlaying}
        currentTime={props.currentTime}
        duration={props.duration}
        hasSoloTracks={props.hasSoloTracks}
        isSourceTrack={props.isSourceTrack}
        stemsExist={props.stemsExist}
        hasTranscription={props.hasTranscription}
        transcription={props.transcription}
        onToggleMute={props.onToggleMute}
        onToggleSolo={props.onToggleSolo}
        onVolumeChange={props.onVolumeChange}
        onSeek={props.onSeek}
        onRemove={props.onRemove}
        onVersionChange={props.onVersionChange}
        onAction={props.onAction}
      />
    </div>
  );
});

export const SortableTrackList = memo(function SortableTrackList({
  tracks,
  isPlaying,
  currentTime,
  duration,
  hasSoloTracks = false,
  sourceTrackId,
  stemsExist = false,
  onReorder,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
  onSeek,
  onRemove,
  onVersionChange,
  onAction,
}: SortableTrackListProps) {
  // Get transcription status for stem types of the source track
  const stemTypes = useMemo(() => {
    const types = new Set<string>();
    tracks.forEach((t) => types.add(t.type));
    return Array.from(types);
  }, [tracks]);

  const { data: transcriptionStatus } = useStemTypeTranscriptionStatus({
    sourceTrackId,
    stemTypes,
  });

  // Fetch full transcription data for all stems that have transcriptions
  const { data: transcriptionsMap } = useQuery({
    queryKey: ['stem-transcriptions-full', sourceTrackId, stemTypes.sort().join(',')],
    queryFn: async (): Promise<Record<string, StemTranscriptionData>> => {
      if (!sourceTrackId || stemTypes.length === 0) return {};

      // Get stems for this track
      const { data: stems, error: stemsError } = await supabase
        .from('track_stems')
        .select('id, stem_type')
        .eq('track_id', sourceTrackId)
        .in('stem_type', stemTypes);

      if (stemsError || !stems?.length) return {};

      const stemIds = stems.map(s => s.id);

      // Get transcriptions for these stems
      const { data: transcriptions, error: transError } = await supabase
        .from('stem_transcriptions')
        .select('*')
        .in('stem_id', stemIds);

      if (transError || !transcriptions?.length) return {};

      // Build map: stemType -> transcription data
      const result: Record<string, StemTranscriptionData> = {};
      
      for (const trans of transcriptions) {
        const stem = stems.find(s => s.id === trans.stem_id);
        if (!stem) continue;

        result[stem.stem_type] = {
          stemType: stem.stem_type,
          stemId: stem.id,
          midiUrl: trans.midi_url,
          pdfUrl: trans.pdf_url,
          gp5Url: trans.gp5_url,
          mxmlUrl: trans.mxml_url,
          notes: trans.notes as any[] | null,
          notesCount: trans.notes_count,
          bpm: trans.bpm ? Number(trans.bpm) : null,
          keyDetected: trans.key_detected,
          durationSeconds: trans.duration_seconds ? Number(trans.duration_seconds) : null,
        };
      }

      return result;
    },
    enabled: !!sourceTrackId && stemTypes.length > 0,
    staleTime: 60 * 1000,
  });

  // DnD kit needs stable item IDs
  const trackIds = useMemo(() => tracks.map((t) => t.id), [tracks]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requires 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex((t) => t.id === active.id);
      const newIndex = tracks.findIndex((t) => t.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  }, [tracks, onReorder]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={trackIds} strategy={verticalListSortingStrategy}>
        <AnimatePresence>
          {tracks.map((track) => {
            // Check if this track is the source track (main track that can be extended/replaced)
            // A track is the source if: it has type 'main' OR the track.id matches the original source
            const stemTypesArr = ['vocal', 'instrumental', 'drums', 'bass', 'other'];
            const isSourceTrack = track.type === 'main' || 
              (tracks.length > 0 && tracks[0].id === track.id && !stemTypesArr.includes(track.type)) ||
              (sourceTrackId != null && track.id === sourceTrackId);
            
            // Check if track has transcription (by stem type for this studio project)
            const hasTranscription = transcriptionStatus?.[track.type] || false;
            const transcription = transcriptionsMap?.[track.type] || null;
            
            return (
              <SortableTrackItem
                key={track.id}
                track={track}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                hasSoloTracks={hasSoloTracks}
                isSourceTrack={isSourceTrack}
                stemsExist={stemsExist}
                hasTranscription={hasTranscription}
                transcription={transcription}
                onToggleMute={() => onToggleMute(track.id)}
                onToggleSolo={() => onToggleSolo(track.id)}
                onVolumeChange={(v) => onVolumeChange(track.id, v)}
                onSeek={onSeek}
                onRemove={() => onRemove(track.id)}
                onVersionChange={track.versions ? (label) => onVersionChange(track.id, label) : undefined}
                onAction={(action) => onAction(track.id, action)}
              />
            );
          })}
        </AnimatePresence>
      </SortableContext>
    </DndContext>
  );
});
