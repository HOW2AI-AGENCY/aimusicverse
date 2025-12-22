/**
 * Desktop Library Layout - Master-Detail view for Library page
 * Shows track list on the left and track details on the right
 */

import { useState, useCallback } from 'react';
import { Track } from '@/hooks/useTracks';
import { cn } from '@/lib/utils';
import { TrackDetailPanel } from './TrackDetailPanel';
import { VirtualizedTrackList } from './VirtualizedTrackList';
import { Button } from '@/components/ui/button';
import { X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';

interface DesktopLibraryLayoutProps {
  tracks: Track[];
  viewMode: 'grid' | 'list';
  activeTrackId?: string;
  getCountsForTrack: (trackId: string) => { versionCount: number; stemCount: number };
  getMidiStatus: (trackId: string) => any;
  onPlay: (track: Track, index?: number) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string, audioUrl: string | null, coverUrl: string | null) => void;
  onToggleLike: (id: string, isLiked: boolean) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore?: boolean;
  className?: string;
}

export function DesktopLibraryLayout({
  tracks,
  viewMode,
  activeTrackId,
  getCountsForTrack,
  getMidiStatus,
  onPlay,
  onDelete,
  onDownload,
  onToggleLike,
  onLoadMore,
  hasMore,
  isLoadingMore,
  className,
}: DesktopLibraryLayoutProps) {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  const handleTrackSelect = useCallback((track: Track) => {
    setSelectedTrack(track);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedTrack(null);
  }, []);

  const handlePlayFromDetail = useCallback((track: Track) => {
    const index = tracks.findIndex(t => t.id === track.id);
    onPlay(track, index >= 0 ? index : undefined);
  }, [tracks, onPlay]);

  return (
    <div className={cn("flex gap-4 h-full min-h-[600px]", className)}>
      {/* Track List Panel */}
      <div className={cn(
        "flex-1 min-w-0 transition-all duration-300",
        selectedTrack && !isDetailExpanded ? "w-[55%]" : "w-full"
      )}>
        <VirtualizedTrackList
          tracks={tracks}
          viewMode={viewMode}
          activeTrackId={activeTrackId}
          getCountsForTrack={getCountsForTrack}
          getMidiStatus={getMidiStatus}
          onPlay={onPlay}
          onDelete={onDelete}
          onDownload={onDownload}
          onToggleLike={onToggleLike}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore ?? false}
          onTrackSelect={handleTrackSelect}
          selectedTrackId={selectedTrack?.id}
        />
      </div>

      {/* Detail Panel */}
      <AnimatePresence mode="wait">
        {selectedTrack && (
          <motion.div
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              width: isDetailExpanded ? '60%' : '45%' 
            }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-shrink-0 overflow-hidden"
          >
            <div className="h-full bg-card rounded-xl border border-border/50 overflow-hidden flex flex-col">
              {/* Detail Header */}
              <div className="flex items-center justify-between p-3 border-b border-border/30 bg-muted/30">
                <h3 className="text-sm font-medium truncate flex-1">
                  {selectedTrack.title}
                </h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsDetailExpanded(!isDetailExpanded)}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleCloseDetail}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto">
                <TrackDetailPanel
                  track={selectedTrack}
                  onPlay={handlePlayFromDetail}
                  onClose={handleCloseDetail}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}