/**
 * Section showing all unlinked tracks for a project
 * Allows linking them to any project track slot
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Music,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Link2,
  AlertCircle
} from 'lucide-react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useProjectGeneratedTracks, ProjectGeneratedTrack } from '@/hooks/useProjectGeneratedTracks';
import { ProjectTrack } from '@/hooks/useProjectTracks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { formatTime } from '@/lib/formatters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UnlinkedTracksSectionProps {
  projectId: string;
  projectTracks: ProjectTrack[];
}

export function UnlinkedTracksSection({ projectId, projectTracks }: UnlinkedTracksSectionProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});
  
  const { 
    unlinkedTracks,
    isLoading,
    linkTrackToSlot,
    isLinking
  } = useProjectGeneratedTracks(projectId);

  if (isLoading) {
    return null;
  }

  if (unlinkedTracks.length === 0) {
    return null;
  }

  const handleLinkTrack = (trackId: string) => {
    const slotId = selectedSlots[trackId];
    if (!slotId) return;
    linkTrackToSlot({ trackId, targetProjectTrackId: slotId });
    // Clear selection after linking
    setSelectedSlots(prev => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });
  };

  const renderTrackItem = (track: ProjectGeneratedTrack) => {
    const isCurrentTrack = activeTrack?.id === track.id;
    const isTrackPlaying = isCurrentTrack && isPlaying;
    const selectedSlot = selectedSlots[track.id];

    return (
      <div
        key={track.id}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg transition-all",
          "bg-amber-500/10 ring-1 ring-amber-500/30",
          isCurrentTrack && "ring-primary"
        )}
      >
        {/* Cover */}
        <div 
          className="relative w-10 h-10 rounded-md overflow-hidden bg-secondary flex-shrink-0 cursor-pointer group"
          onClick={() => isTrackPlaying ? pauseTrack() : playTrack(track as unknown as Parameters<typeof playTrack>[0])}
        >
          {track.cover_url || track.local_cover_url ? (
            <img 
              src={track.local_cover_url || track.cover_url || ''} 
              alt={track.title || ''} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Music className="w-4 h-4 text-primary/50" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
            isTrackPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            {isTrackPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">
              {track.title || 'Без названия'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {formatTime(track.duration_seconds || 0)}
            </span>
            {track.style && (
              <span className="truncate">{track.style.slice(0, 20)}</span>
            )}
          </div>
        </div>

        {/* Link Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={selectedSlot || ''}
            onValueChange={(value) => setSelectedSlots(prev => ({ ...prev, [track.id]: value }))}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Выбрать слот..." />
            </SelectTrigger>
            <SelectContent>
              {projectTracks.map((pt) => (
                <SelectItem key={pt.id} value={pt.id} className="text-xs">
                  {pt.position}. {pt.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            size="sm"
            variant="default"
            className="h-8 px-3 text-xs gap-1"
            onClick={() => handleLinkTrack(track.id)}
            disabled={!selectedSlot || isLinking}
          >
            {isLinking ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Link2 className="w-3 h-3" />
                Привязать
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-amber-500/10 hover:bg-amber-500/15 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Непривязанные треки
          </span>
          <Badge variant="outline" className="text-xs h-5 px-2 text-amber-600 border-amber-500/50">
            {unlinkedTracks.length}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-amber-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-600" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground mb-2">
                Эти треки были сгенерированы для проекта, но не привязаны к конкретным слотам.
                Выберите слот и нажмите "Привязать".
              </p>
              {unlinkedTracks.map(track => renderTrackItem(track))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
