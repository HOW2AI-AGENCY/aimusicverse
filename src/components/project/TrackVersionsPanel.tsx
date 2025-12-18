/**
 * Panel showing all generated versions for a project track slot
 * Allows selecting master version and linking orphaned tracks
 */
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
  CheckCircle2,
  Link2
} from 'lucide-react';
import { usePlayerStore } from '@/hooks/audio';
import { useProjectGeneratedTracks, ProjectGeneratedTrack } from '@/hooks/useProjectGeneratedTracks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface TrackVersionsPanelProps {
  projectId: string;
  projectTrackId: string;
  projectTrackTitle: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function TrackVersionsPanel({ 
  projectId, 
  projectTrackId, 
  projectTrackTitle,
  isExpanded = false,
  onToggle,
}: TrackVersionsPanelProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { 
    tracksBySlot, 
    unlinkedTracks,
    isLoading,
    setMasterTrack,
    linkTrackToSlot,
    isSettingMaster,
    isLinking
  } = useProjectGeneratedTracks(projectId);

  const versions = tracksBySlot[projectTrackId] || [];
  const versionsCount = versions.length;
  const masterVersion = versions.find(v => v.is_master);
  
  // Total available tracks (linked + unlinked)
  const totalAvailable = versionsCount + unlinkedTracks.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show panel if there are versions OR unlinked tracks to link
  if (totalAvailable === 0) {
    return null;
  }

  const renderTrackItem = (version: ProjectGeneratedTrack, index: number, isUnlinked: boolean = false) => {
    const isCurrentTrack = activeTrack?.id === version.id;
    const isTrackPlaying = isCurrentTrack && isPlaying;
    const isMaster = version.is_master;

    return (
      <div
        key={version.id}
        className={cn(
          "flex items-center gap-1.5 p-1.5 rounded-md transition-all",
          isUnlinked 
            ? "bg-amber-500/10 ring-1 ring-amber-500/30" 
            : isMaster 
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
              {isUnlinked ? (version.title || 'Без названия') : `Версия ${index + 1}`}
            </span>
            {isMaster && (
              <Star className="w-2.5 h-2.5 text-primary fill-primary" />
            )}
            {isUnlinked && (
              <Badge variant="outline" className="text-[7px] h-3 px-1 text-amber-600 border-amber-500/50">
                Не привязан
              </Badge>
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
          {isUnlinked ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-[9px] gap-0.5 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
              onClick={() => linkTrackToSlot({ trackId: version.id, targetProjectTrackId: projectTrackId })}
              disabled={isLinking}
            >
              {isLinking ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <>
                  <Link2 className="w-2.5 h-2.5" />
                  Привязать
                </>
              )}
            </Button>
          ) : !isMaster ? (
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
            {versionsCount > 0 && (
              <>{versionsCount} {versionsCount === 1 ? 'версия' : versionsCount < 5 ? 'версии' : 'версий'}</>
            )}
            {versionsCount === 0 && unlinkedTracks.length > 0 && (
              <span className="text-amber-600">Нет привязанных версий</span>
            )}
          </span>
          {masterVersion && (
            <Badge variant="default" className="text-[8px] h-3.5 px-1 gap-0.5">
              <Star className="w-2 h-2" />
              Мастер
            </Badge>
          )}
          {unlinkedTracks.length > 0 && (
            <Badge variant="outline" className="text-[8px] h-3.5 px-1 gap-0.5 text-amber-600 border-amber-500/50">
              +{unlinkedTracks.length} доступно
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
              {/* Linked versions */}
              {versions.map((version, index) => renderTrackItem(version, index, false))}
              
              {/* Unlinked tracks section */}
              {unlinkedTracks.length > 0 && (
                <>
                  {versionsCount > 0 && (
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[9px] text-muted-foreground">Не привязанные треки</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  {unlinkedTracks.map((track, index) => renderTrackItem(track, index, true))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
