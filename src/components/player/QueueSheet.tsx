import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2, ListMusic, Sparkles, Layers, Layers2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { QueueItem } from './QueueItem';
import { usePlayerStore } from '@/hooks/audio';
import { toast } from 'sonner';
import { motion, AnimatePresence } from '@/lib/motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface QueueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QueueSheet({ open, onOpenChange }: QueueSheetProps) {
  const { queue, currentIndex, reorderQueue, removeFromQueue, clearQueue, versionMode, toggleVersionMode } = usePlayerStore();

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
    toast.success('Очередь очищена');
    onOpenChange(false);
  };

  const handleToggleVersionMode = () => {
    toggleVersionMode();
    toast.success(
      versionMode === 'active' 
        ? 'Режим: все версии треков' 
        : 'Режим: только активные версии'
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[70vh] rounded-t-3xl border-t border-border/50 bg-background/95 backdrop-blur-xl"
      >
        <SheetHeader className="pb-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2 rounded-xl bg-primary/10"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <ListMusic className="w-5 h-5 text-primary" />
              </motion.div>
              <div>
                <SheetTitle className="text-left">Очередь</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {queue.length} {queue.length === 1 ? 'трек' : queue.length < 5 ? 'трека' : 'треков'}
                </p>
              </div>
            </div>
            {queue.length > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearQueue}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Очистить
                </Button>
              </motion.div>
            )}
          </div>

          {/* Version Mode Toggle */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
            <div className="flex items-center gap-2">
              {versionMode === 'all' ? (
                <Layers className="w-4 h-4 text-primary" />
              ) : (
                <Layers2 className="w-4 h-4 text-muted-foreground" />
              )}
              <Label htmlFor="version-mode" className="text-sm cursor-pointer">
                {versionMode === 'all' ? 'Все версии' : 'Только активные'}
              </Label>
            </div>
            <Switch
              id="version-mode"
              checked={versionMode === 'all'}
              onCheckedChange={handleToggleVersionMode}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {versionMode === 'all' 
              ? 'Воспроизводятся все A/B версии треков'
              : 'Воспроизводятся только основные версии'}
          </p>
        </SheetHeader>

        <div className="mt-4 overflow-auto max-h-[calc(70vh-120px)] scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {queue.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center text-center py-12"
              >
                <motion.div
                  className="p-4 rounded-2xl bg-muted/50 mb-4"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </motion.div>
                <p className="text-muted-foreground font-medium">Очередь пуста</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Добавьте треки для воспроизведения
                </p>
              </motion.div>
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
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
