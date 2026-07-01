/**
 * SortableProjectTrack — обёртка для drag-and-drop трека в списке.
 *
 * Извлечено из pages/ProjectDetail.tsx в Sprint 042 (god-page декомпозиция).
 */

import { useSortable } from "@dnd-kit/sortable";
import { MinimalProjectTrackItem } from "@/components/project/MinimalProjectTrackItem";
import type { useProjectDetailData } from "@/hooks/project/useProjectDetailData";

interface SortableProjectTrackProps {
  track: NonNullable<ReturnType<typeof useProjectDetailData>["tracks"]>[number];
  onGenerate: () => void;
  onOpenLyrics: () => void;
  onOpenLyricsWizard: () => void;
}

export function SortableProjectTrack({
  track,
  onGenerate,
  onOpenLyrics,
  onOpenLyricsWizard,
}: SortableProjectTrackProps) {
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
