import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { QueueItem } from './QueueItem';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { toast } from 'sonner';

interface QueueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QueueSheet({ open, onOpenChange }: QueueSheetProps) {
  const { queue, currentIndex, reorderQueue, removeFromQueue, clearQueue } = usePlayerStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = queue.findIndex((track) => track.id === active.id);
    const newIndex = queue.findIndex((track) => track.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderQueue(oldIndex, newIndex);
    }
  };

  const handleClearQueue = () => {
    if (queue.length === 0) return;
    
    clearQueue();
    toast.success('Queue cleared');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Queue ({queue.length} tracks)</SheetTitle>
            {queue.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearQueue}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-4 overflow-auto max-h-[calc(70vh-100px)]">
          {queue.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No tracks in queue</p>
              <p className="text-sm mt-2">Add tracks to start playing</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={queue.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {queue.map((track, index) => (
                    <QueueItem
                      key={track.id}
                      track={track}
                      isCurrentTrack={index === currentIndex}
                      onRemove={() => removeFromQueue(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
