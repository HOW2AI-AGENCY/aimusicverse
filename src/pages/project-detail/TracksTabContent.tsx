/**
 * TracksTabContent — содержимое вкладки "Треки" с поддержкой drag-and-drop.
 *
 * Извлечено из pages/ProjectDetail.tsx в Sprint 042 (god-page декомпозиция).
 */

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Music } from "@/lib/icons";
import { UnlinkedTracksSection } from "@/components/project/UnlinkedTracksSection";
import { cn } from "@/lib/utils";
import { SortableProjectTrack } from "./SortableProjectTrack";
import type { useProjectDetailData } from "@/hooks/project/useProjectDetailData";

type ProjectTrack = NonNullable<ReturnType<typeof useProjectDetailData>["tracks"]>[number];

interface TracksTabContentProps {
  projectId: string;
  tracks: ReturnType<typeof useProjectDetailData>["tracks"];
  tracksLoading: boolean;
  isGenerating: boolean;
  isMobile: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onGenerate: (track: ProjectTrack) => void;
  onOpenLyrics: (track: ProjectTrack) => void;
  onOpenLyricsWizard: (track: ProjectTrack) => void;
  onAddTrack: () => void;
  onGenerateTracklist: () => void;
}

export function TracksTabContent({
  projectId,
  tracks,
  tracksLoading,
  isGenerating,
  isMobile,
  onDragEnd,
  onGenerate,
  onOpenLyrics,
  onOpenLyricsWizard,
  onAddTrack,
  onGenerateTracklist,
}: TracksTabContentProps) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  return (
    <div className={cn(isMobile ? "px-3" : "px-4")}>
      {tracksLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : tracks && tracks.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tracks.map((track) => (
                <SortableProjectTrack
                  key={track.id}
                  track={track}
                  onGenerate={() => onGenerate(track)}
                  onOpenLyrics={() => onOpenLyrics(track)}
                  onOpenLyricsWizard={() => onOpenLyricsWizard(track)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-12">
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
      )}

      {tracks && tracks.length > 0 && (
        <div className="mt-4">
          <UnlinkedTracksSection projectId={projectId} projectTracks={tracks} />
        </div>
      )}
    </div>
  );
}
