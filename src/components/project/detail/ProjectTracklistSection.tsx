/**
 * ProjectTracklistSection - Tracklist with drag-drop
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Plus, Sparkles } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { MinimalProjectTrackItem } from '@/components/project/MinimalProjectTrackItem';
import { UnlinkedTracksSection } from '@/components/project/UnlinkedTracksSection';
import { cn } from '@/lib/utils';
import type { ProjectTrack } from '@/hooks/useProjectTracks';

interface ProjectTracklistSectionProps {
  projectId: string;
  tracks: ProjectTrack[] | undefined;
  isLoading: boolean;
  isGenerating: boolean;
  onDragEnd: (result: DropResult) => void;
  onGenerateFromPlan: (track: ProjectTrack) => void;
  onOpenLyrics: (track: ProjectTrack) => void;
  onOpenLyricsWizard: (track: ProjectTrack) => void;
  onAddTrack: () => void;
  onGenerateTracklist: () => void;
  isMobile?: boolean;
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
          <Button 
            variant="outline" 
            onClick={onGenerateTracklist}
            disabled={isGenerating}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Сгенерировать AI
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(isMobile ? "px-3" : "px-4")}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="project-tracks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {tracks.map((track, index) => (
                <Draggable key={track.id} draggableId={track.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <MinimalProjectTrackItem
                        track={track}
                        dragHandleProps={provided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                        onGenerate={() => onGenerateFromPlan(track)}
                        onOpenLyrics={() => onOpenLyrics(track)}
                        onOpenLyricsWizard={() => onOpenLyricsWizard(track)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Unlinked Tracks Section */}
      <div className="mt-4">
        <UnlinkedTracksSection projectId={projectId} projectTracks={tracks} />
      </div>
    </div>
  );
});

export default ProjectTracklistSection;
