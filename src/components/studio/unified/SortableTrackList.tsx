/**
 * SortableTrackList - Drag and drop reorderable track list
 * Uses @dnd-kit/sortable for smooth drag interactions
 */

import { memo, useCallback } from 'react';
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
  onAction: (trackId: string, action: 'download' | 'effects' | 'reference' | 'add_vocals' | 'replace_instrumental' | 'extend' | 'replace_section' | 'transcribe') => void;
}

interface SortableTrackItemProps {
  track: StudioTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasSoloTracks?: boolean;
  isSourceTrack?: boolean;
  stemsExist?: boolean;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onRemove: () => void;
  onVersionChange?: (label: string) => void;
  onAction?: (action: 'download' | 'effects' | 'reference' | 'add_vocals' | 'replace_instrumental' | 'extend' | 'replace_section' | 'transcribe') => void;
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

  const trackIds = tracks.map((t) => t.id);

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
            const stemTypes = ['vocal', 'instrumental', 'drums', 'bass', 'other'];
            const isSourceTrack = track.type === 'main' || 
              (tracks.length > 0 && tracks[0].id === track.id && !stemTypes.includes(track.type)) ||
              (sourceTrackId != null && track.id === sourceTrackId);
            
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
