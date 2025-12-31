/**
 * MobileTracksContent - Track list for mobile studio
 * Displays all tracks with mute/solo/volume controls
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Volume2, VolumeX, Headphones, Play, Pause,
  MoreVertical, Plus, Trash2, Wand2, Mic2, ArrowRightFromLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { StudioProject, StudioTrack, TRACK_COLORS } from '@/stores/useUnifiedStudioStore';

interface MobileTracksContentProps {
  project: StudioProject;
  isPlaying: boolean;
  currentTime: number;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onVolumeChange: (trackId: string, volume: number) => void;
  onRemoveTrack: (trackId: string) => void;
  onAddTrack: () => void;
  onTrackAction: (trackId: string, action: string) => void;
}

export const MobileTracksContent = memo(function MobileTracksContent({
  project,
  isPlaying,
  currentTime,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
  onRemoveTrack,
  onAddTrack,
  onTrackAction,
}: MobileTracksContentProps) {
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

  const toggleExpand = useCallback((trackId: string) => {
    setExpandedTrack(prev => prev === trackId ? null : trackId);
  }, []);

  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'vocal':
        return '🎤';
      case 'instrumental':
        return '🎸';
      case 'drums':
        return '🥁';
      case 'bass':
        return '🎸';
      case 'sfx':
        return '✨';
      default:
        return '🎵';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Дорожки</h3>
          <p className="text-xs text-muted-foreground">
            {project.tracks.length} {project.tracks.length === 1 ? 'дорожка' : 'дорожек'}
          </p>
        </div>
        <Button size="sm" onClick={onAddTrack} className="gap-1">
          <Plus className="w-4 h-4" />
          Добавить
        </Button>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto px-3 pb-20">
        <AnimatePresence>
          {project.tracks.map((track, index) => (
            <TrackCard
              key={track.id}
              track={track}
              index={index}
              isExpanded={expandedTrack === track.id}
              onToggleExpand={() => toggleExpand(track.id)}
              onToggleMute={() => onToggleMute(track.id)}
              onToggleSolo={() => onToggleSolo(track.id)}
              onVolumeChange={(v) => onVolumeChange(track.id, v)}
              onRemove={() => onRemoveTrack(track.id)}
              onAction={(action) => onTrackAction(track.id, action)}
              getIcon={getTrackIcon}
            />
          ))}
        </AnimatePresence>

        {project.tracks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4 text-sm">
              Нет дорожек в проекте
            </p>
            <Button onClick={onAddTrack}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить первую дорожку
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

// Individual track card
interface TrackCardProps {
  track: StudioTrack;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onVolumeChange: (volume: number) => void;
  onRemove: () => void;
  onAction: (action: string) => void;
  getIcon: (type: string) => string;
}

const TrackCard = memo(function TrackCard({
  track,
  index,
  isExpanded,
  onToggleExpand,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
  onRemove,
  onAction,
  getIcon,
}: TrackCardProps) {
  const isPending = track.status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "mb-2 rounded-lg border transition-all overflow-hidden",
        isExpanded ? "bg-card border-primary/50" : "bg-card/50 border-border/50",
        track.muted && "opacity-60"
      )}
    >
      {/* Main Row */}
      <button
        onClick={onToggleExpand}
        className="w-full p-3 flex items-center gap-3 text-left"
      >
        {/* Icon */}
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${track.color}20` }}
        >
          {getIcon(track.type)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{track.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px] h-4">
              {track.type}
            </Badge>
            {track.versions && track.versions.length > 1 && (
              <Badge variant="secondary" className="text-[10px] h-4">
                {track.activeVersionLabel || 'A'}
              </Badge>
            )}
            {isPending && (
              <Badge variant="default" className="text-[10px] h-4 animate-pulse">
                Генерация...
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant={track.muted ? "destructive" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
          >
            {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant={track.solo ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSolo();
            }}
          >
            <Headphones className="w-4 h-4" />
          </Button>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Volume Slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16">Громкость</span>
                <Slider
                  value={[track.volume]}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => onVolumeChange(v[0])}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-8 text-right">
                  {Math.round(track.volume * 100)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {track.type === 'instrumental' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs"
                    onClick={() => onAction('add_vocals')}
                  >
                    <Mic2 className="w-3 h-3" />
                    Вокал
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-xs"
                  onClick={() => onAction('extend')}
                >
                  <ArrowRightFromLine className="w-3 h-3" />
                  Продлить
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-xs"
                  onClick={() => onAction('replace_section')}
                >
                  <Wand2 className="w-3 h-3" />
                  Секции
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 ml-auto">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => onAction('effects')}>
                      Эффекты
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('download')}>
                      Скачать
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onRemove}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
