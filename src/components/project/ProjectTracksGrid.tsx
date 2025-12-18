/**
 * Grid component to display all generated tracks for a project track slot
 * Shows versions with approval workflow
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  XCircle, 
  Star,
  Music,
  Clock,
  Loader2
} from 'lucide-react';
import { usePlayerStore } from '@/hooks/audio';
import { ProjectGeneratedTrack, useProjectGeneratedTracks } from '@/hooks/useProjectGeneratedTracks';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatTime } from '@/lib/formatters';
import { motion, AnimatePresence } from '@/lib/motion';

interface ProjectTracksGridProps {
  projectId: string;
  projectTrackId: string;
  projectTrackTitle: string;
  onClose?: () => void;
}

export function ProjectTracksGrid({ 
  projectId, 
  projectTrackId, 
  projectTrackTitle,
  onClose 
}: ProjectTracksGridProps) {
  const isMobile = useIsMobile();
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { 
    tracksBySlot, 
    isLoading,
    approveTrack,
    rejectTrack,
    setMasterTrack,
    isApproving,
    isSettingMaster
  } = useProjectGeneratedTracks(projectId, projectTrackId);

  const tracks = tracksBySlot[projectTrackId] || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <Card className="glass-card border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Music className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Нет сгенерированных треков для "{projectTrackTitle}"
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Нажмите "Создать" чтобы сгенерировать трек
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Версии для "{projectTrackTitle}" ({tracks.length})
        </h4>
      </div>

      <div className={cn(
        "grid gap-3",
        isMobile ? "grid-cols-1" : "grid-cols-2"
      )}>
        <AnimatePresence>
          {tracks.map((track, index) => {
            const isCurrentTrack = activeTrack?.id === track.id;
            const isTrackPlaying = isCurrentTrack && isPlaying;

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "glass-card transition-all overflow-hidden",
                  track.is_master && "ring-2 ring-primary border-primary/50",
                  track.is_approved && !track.is_master && "border-green-500/30",
                  isCurrentTrack && "bg-primary/5"
                )}>
                  <CardContent className="p-3">
                    {/* Cover and info */}
                    <div className="flex gap-3">
                      {/* Cover */}
                      <div 
                        className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer group"
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
                            <Music className="w-6 h-6 text-primary/50" />
                          </div>
                        )}
                        
                        {/* Play overlay */}
                        <div className={cn(
                          "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                          isTrackPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                          {isTrackPlaying ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {track.title || 'Без названия'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(track.duration_seconds || 0)}
                              </span>
                            </div>
                          </div>

                          {/* Status badges */}
                          <div className="flex flex-col gap-1">
                            {track.is_master && (
                              <Badge className="bg-primary text-primary-foreground text-[10px] h-5">
                                <Star className="w-3 h-3 mr-0.5" />
                                Мастер
                              </Badge>
                            )}
                            {track.is_approved && !track.is_master && (
                              <Badge variant="outline" className="text-green-500 border-green-500/50 text-[10px] h-5">
                                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                Одобрен
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Style */}
                        {track.style && (
                          <p className="text-[10px] text-muted-foreground truncate mt-1">
                            {track.style}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-3 pt-3 border-t border-border/50">
                      {!track.is_master && (
                        <Button
                          size="sm"
                          variant={track.is_approved ? "outline" : "default"}
                          className="flex-1 h-7 text-xs"
                          onClick={() => setMasterTrack({ trackId: track.id, projectTrackId })}
                          disabled={isSettingMaster}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Выбрать
                        </Button>
                      )}
                      
                      {!track.is_approved && !track.is_master && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          onClick={() => approveTrack(track.id)}
                          disabled={isApproving}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Одобрить
                        </Button>
                      )}

                      {track.is_approved && !track.is_master && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive/80"
                          onClick={() => rejectTrack(track.id)}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Отменить
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
