/**
 * ProjectTracklistSection - Tracklist with drag-drop
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Music, Plus, Sparkles } from "@/lib/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MinimalProjectTrackItem } from "@/components/project/MinimalProjectTrackItem";
import { UnlinkedTracksSection } from "@/components/project/UnlinkedTracksSection";
import { cn } from "@/lib/utils";
import type { ProjectTrack } from "@/hooks/useProjectTracks";

interface ProjectTracklistSectionProps {
  projectId: string;
  tracks: ProjectTrack[] | undefined;
  isLoading: boolean;
  isGenerating: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onGenerateFromPlan: (track: ProjectTrack) => void;
  onOpenLyrics: (track: ProjectTrack) => void;
  onOpenLyricsWizard: (track: ProjectTrack) => void;
  onAddTrack: () => void;
  onGenerateTracklist: () => void;
  isMobile?: boolean;
}

interface SortableTrackItemProps {
  track: ProjectTrack;
  onGenerate: () => void;
  onOpenLyrics: () => void;
  onOpenLyricsWizard: () => void;
}

function SortableTrackItem({ track, onGenerate, onOpenLyrics, onOpenLyricsWizard }: SortableTrackItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: track.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style}>
      <MinimalProjectTrackItem
        track={track}
        dragHandleProps={{ ...listeners, ...attributes }}
        isDragging={isDragging}
        onGenerate={onGenerate}
        onOpenLyrics={onOpenLyrics}
        onOpenLyricsWizard={onOpenLyricsWizard}
      />
    </div>
  );
}

export const ProjectTracklistSection = memo(function ProjectTracklistSection({
  projectId,
  tracks,
  isLoading,
  isGenerating,
  onDragEnd,
  onGenerateFromPlan,
  onOpenLyrics,
  onOpenLyricsWizard,
  onAddTrack,
  onGenerateTracklist,
  isMobile = false,
}: ProjectTracklistSectionProps) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", isMobile ? "px-3" : "px-4")}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <div className={cn("text-center py-12", isMobile ? "px-3" : "px-4")}>
        <Music className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">Треклист пуст</p>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <Button onClick={onAddTrack} className="gap-2">
            <Plus className="w-4 h-4" />
            Добавить трек
          </Button>
          <Button variant="outline" onClick={onGenerateTracklist} disabled={isGenerating} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Сгенерировать AI
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(isMobile ? "px-3" : "px-4")}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tracks.map((track) => (
              <SortableTrackItem
                key={track.id}
                track={track}
                onGenerate={() => onGenerateFromPlan(track)}
                onOpenLyrics={() => onOpenLyrics(track)}
                onOpenLyricsWizard={() => onOpenLyricsWizard(track)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Unlinked Tracks Section */}
      <div className="mt-4">
        <UnlinkedTracksSection projectId={projectId} projectTracks={tracks} />
      </div>
    </div>
  );
});

export default ProjectTracklistSection;
