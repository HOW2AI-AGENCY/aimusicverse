import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, ListMusic, Sparkles, Layers, Layers2, Clock, Music2, 
  Shuffle, Repeat, Repeat1, Save, Check, Radio, Loader2
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { QueueItem } from './QueueItem';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { toast } from 'sonner';
import { motion, AnimatePresence } from '@/lib/motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRadioMode } from '@/hooks/audio/useRadioMode';

interface QueueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QueueSheet({ open, onOpenChange }: QueueSheetProps) {
  // Telegram BackButton integration
  useTelegramBackButton({
    visible: open,
    onClick: () => onOpenChange(false),
  });

  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Radio mode for auto-adding similar tracks
  const { isEnabled: radioEnabled, isFetching: radioFetching, toggleRadioMode, autoAddedCount } = useRadioMode();

  const { 
    queue, 
    currentIndex, 
    reorderQueue, 
    removeFromQueue, 
    clearQueue, 
    versionMode, 
    toggleVersionMode,
    shuffle,
    repeat,
    toggleShuffle,
    toggleRepeat,
    activeTrack
  } = usePlayerStore();

  // Split queue into current track and upcoming tracks
  const { currentTrack, upNextTracks, remainingDuration } = useMemo(() => {
    const current = queue[currentIndex] || null;
    const upNext = queue.slice(currentIndex + 1);
    const remaining = upNext.reduce((acc, track) => acc + (track.duration_seconds || 0), 0);
    return { currentTrack: current, upNextTracks: upNext, remainingDuration: remaining };
  }, [queue, currentIndex]);

  // Calculate total duration
  const totalDuration = queue.reduce((acc, track) => acc + (track.duration_seconds || 0), 0);
  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ч ${mins} мин`;
    }
    return `${mins} мин`;
  };

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

  /**
   * Save queue as playlist
   */
  const handleSaveAsPlaylist = async () => {
    if (!user || queue.length === 0) return;

    setIsSaving(true);
    try {
      // Create playlist
      const { data: playlist, error: playlistError } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          title: `Плейлист ${new Date().toLocaleDateString('ru-RU')}`,
          description: 'Создан из очереди воспроизведения',
          is_public: false,
          track_count: queue.length,
          total_duration: totalDuration,
        })
        .select()
        .single();

      if (playlistError) throw playlistError;

      // Add tracks to playlist
      const trackEntries = queue.map((track, index) => ({
        playlist_id: playlist.id,
        track_id: track.id,
        position: index,
      }));

      const { error: tracksError } = await supabase
        .from('playlist_tracks')
        .insert(trackEntries);

      if (tracksError) throw tracksError;

      toast.success('Плейлист создан', {
        description: `${queue.length} треков сохранено`,
      });
    } catch (error) {
      console.error('Failed to save playlist:', error);
      toast.error('Не удалось сохранить плейлист');
    } finally {
      setIsSaving(false);
    }
  };

  const getRepeatIcon = () => {
    if (repeat === 'one') return <Repeat1 className="w-4 h-4" />;
    return <Repeat className="w-4 h-4" />;
  };

  const getRepeatLabel = () => {
    switch (repeat) {
      case 'one': return 'Повторять трек';
      case 'all': return 'Повторять всё';
      default: return 'Без повтора';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[75vh] rounded-t-3xl border-t border-border/50 bg-background/98 backdrop-blur-xl p-0"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/30 p-4 pb-3">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-soft"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                >
                  <ListMusic className="w-5 h-5 text-primary" />
                </motion.div>
                <div>
                  <SheetTitle className="text-left text-base">Очередь воспроизведения</SheetTitle>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                      <Music2 className="w-2.5 h-2.5" />
                      {queue.length} {queue.length === 1 ? 'трек' : queue.length < 5 ? 'трека' : 'треков'}
                    </Badge>
                    {totalDuration > 0 && (
                      <Badge variant="outline" className="text-[10px] h-5 gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTotalDuration(totalDuration)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {queue.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearQueue}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-8 px-3"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Очистить
                </Button>
              )}
            </div>
          </SheetHeader>

          {/* Controls row */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
            {/* Shuffle toggle */}
            <Button
              variant={shuffle ? "default" : "outline"}
              size="sm"
              onClick={toggleShuffle}
              className={cn(
                "h-8 px-3 rounded-xl gap-1.5 text-xs",
                shuffle && "bg-primary/20 text-primary hover:bg-primary/30 border-primary/30"
              )}
            >
              <Shuffle className="w-3.5 h-3.5" />
              Перемешать
            </Button>

            {/* Repeat toggle */}
            <Button
              variant={repeat !== 'off' ? "default" : "outline"}
              size="sm"
              onClick={toggleRepeat}
              className={cn(
                "h-8 px-3 rounded-xl gap-1.5 text-xs",
                repeat !== 'off' && "bg-primary/20 text-primary hover:bg-primary/30 border-primary/30"
              )}
            >
              {getRepeatIcon()}
              {getRepeatLabel()}
            </Button>

            {/* Version mode toggle */}
            <Button
              variant={versionMode === 'all' ? "default" : "outline"}
              size="sm"
              onClick={handleToggleVersionMode}
              className={cn(
                "h-8 px-3 rounded-xl gap-1.5 text-xs",
                versionMode === 'all' && "bg-generate/20 text-generate hover:bg-generate/30 border-generate/30"
              )}
            >
              {versionMode === 'all' ? <Layers className="w-3.5 h-3.5" /> : <Layers2 className="w-3.5 h-3.5" />}
              {versionMode === 'all' ? 'Все' : 'Активные'}
            </Button>
          </div>

          {/* Second row: Radio mode and Save */}
          <div className="flex items-center gap-2 mt-2">
            {/* Radio mode toggle */}
            <Button
              variant={radioEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleRadioMode}
              disabled={radioFetching}
              className={cn(
                "h-8 px-3 rounded-xl gap-1.5 text-xs",
                radioEnabled && "bg-accent text-accent-foreground"
              )}
            >
              {radioFetching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Radio className="w-3.5 h-3.5" />
              )}
              Радио
              {radioEnabled && autoAddedCount > 0 && (
                <span className="ml-1 text-[10px] opacity-70">+{autoAddedCount}</span>
              )}
            </Button>

            {/* Save as playlist */}
            {user && queue.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAsPlaylist}
                disabled={isSaving}
                className="h-8 px-3 rounded-xl gap-1.5 text-xs ml-auto"
              >
                {isSaving ? (
                  <Check className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Сохранить
              </Button>
            )}
          </div>
        </div>

        {/* Queue content */}
        <ScrollArea className="h-[calc(75vh-140px)]">
          <div className="p-4 pt-2">
            <AnimatePresence mode="popLayout">
              {queue.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center text-center py-16"
                >
                  <motion.div
                    className="p-5 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 mb-5 shadow-soft"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <Sparkles className="w-10 h-10 text-muted-foreground/60" />
                  </motion.div>
                  <p className="text-base font-medium text-muted-foreground">Очередь пуста</p>
                  <p className="text-sm text-muted-foreground/70 mt-1.5 max-w-[200px]">
                    Добавьте треки для воспроизведения из библиотеки
                  </p>
                </motion.div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={queue.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {/* Now Playing Section */}
                      {currentTrack && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2 px-1">
                            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                              Сейчас играет
                            </p>
                          </div>
                          <QueueItem
                            track={currentTrack}
                            isCurrentTrack={true}
                            onRemove={() => removeFromQueue(currentIndex)}
                          />
                        </div>
                      )}

                      {/* Up Next Section */}
                      {upNextTracks.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2 px-1 pt-3 border-t border-border/30">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                              Далее • {upNextTracks.length} {upNextTracks.length === 1 ? 'трек' : upNextTracks.length < 5 ? 'трека' : 'треков'}
                            </p>
                            {remainingDuration > 0 && (
                              <p className="text-[10px] text-muted-foreground">
                                {formatTotalDuration(remainingDuration)}
                              </p>
                            )}
                          </div>
                          <div className="space-y-1">
                            {upNextTracks.map((track, idx) => (
                              <QueueItem
                                key={track.id}
                                track={track}
                                isCurrentTrack={false}
                                onRemove={() => removeFromQueue(currentIndex + 1 + idx)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Previous tracks (already played) */}
                      {currentIndex > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2 px-1 pt-3 border-t border-border/30">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                              Уже воспроизведено
                            </p>
                          </div>
                          <div className="space-y-1 opacity-60">
                            {queue.slice(0, currentIndex).map((track, idx) => (
                              <QueueItem
                                key={track.id}
                                track={track}
                                isCurrentTrack={false}
                                onRemove={() => removeFromQueue(idx)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
