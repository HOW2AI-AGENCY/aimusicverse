/**
 * Panel showing all generated versions for a project track slot
 * Allows selecting master version
 */
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Star,
  Music,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from 'lucide-react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useProjectGeneratedTracks, ProjectGeneratedTrack } from '@/hooks/useProjectGeneratedTracks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { formatDuration } from '@/lib/formatters';

interface TrackVersionsPanelProps {
  projectId: string;
  projectTrackId: string;
  projectTrackTitle: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const TrackVersionsPanel = memo(function TrackVersionsPanel({ 
  projectId, 
  projectTrackId, 
  projectTrackTitle,
  isExpanded = false,
  onToggle,
}: TrackVersionsPanelProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { 
    tracksBySlot, 
    isLoading,
    setMasterTrack,
    isSettingMaster,
  } = useProjectGeneratedTracks(projectId);

  const versions = tracksBySlot[projectTrackId] || [];
  const versionsCount = versions.length;
  const masterVersion = versions.find(v => v.is_master);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only show if there are versions for this slot
  if (versionsCount === 0) {
    return null;
  }

  const renderTrackItem = (version: ProjectGeneratedTrack, index: number) => {
    const isCurrentTrack = activeTrack?.id === version.id;
    const isTrackPlaying = isCurrentTrack && isPlaying;
    const isMaster = version.is_master;

    return (
      <div
        key={version.id}
        className={cn(
          "flex items-center gap-1.5 p-1.5 rounded-md transition-all",
          isMaster 
            ? "bg-primary/10 ring-1 ring-primary/30" 
            : "bg-muted/30 hover:bg-muted/50",
          isCurrentTrack && "bg-primary/5"
        )}
      >
        {/* Cover */}
        <div 
          className="relative w-8 h-8 rounded-md overflow-hidden bg-secondary flex-shrink-0 cursor-pointer group"
          onClick={() => isTrackPlaying ? pauseTrack() : playTrack(version as unknown as Parameters<typeof playTrack>[0])}
        >
          {version.cover_url || version.local_cover_url ? (
            <img 
              src={version.local_cover_url || version.cover_url || ''} 
              alt={version.title || ''} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Music className="w-3 h-3 text-primary/50" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
            isTrackPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            {isTrackPlaying ? (
              <Pause className="w-3 h-3 text-white" />
            ) : (
              <Play className="w-3 h-3 text-white" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium truncate">
              Версия {index + 1}
            </span>
            {isMaster && (
              <Star className="w-2.5 h-2.5 text-primary fill-primary" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Clock className="w-2 h-2" />
              {formatDuration(version.duration_seconds || 0)}
            </span>
            {version.style && (
              <span className="truncate">{version.style.slice(0, 15)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {!isMaster ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-[9px] gap-0.5"
              onClick={() => setMasterTrack({ trackId: version.id, projectTrackId })}
              disabled={isSettingMaster}
            >
              {isSettingMaster ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <>
                  <Star className="w-2.5 h-2.5" />
                  Выбрать
                </>
              )}
            </Button>
          ) : (
            <Badge variant="default" className="text-[8px] h-4 px-1.5 gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Мастер
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-1.5">
      {/* Header - clickable to toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-1.5 py-1 rounded-md bg-secondary/50 hover:bg-secondary/70 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Music className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium">
            {versionsCount} {versionsCount === 1 ? 'версия' : versionsCount < 5 ? 'версии' : 'версий'}
          </span>
          {masterVersion && (
            <Badge variant="default" className="text-[8px] h-3.5 px-1 gap-0.5">
              <Star className="w-2 h-2" />
              Мастер
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Versions list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pt-1.5">
              {versions.map((version, index) => renderTrackItem(version, index))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
