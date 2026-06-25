/**
 * PlaylistDetailPreview - Desktop detail panel for playlist preview
 * Shows playlist info, tracks list, and quick actions
 */

import { memo } from "react";
import { Music2, Clock, Globe, Lock, Play, Pencil, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LazyImage } from "@/components/ui/lazy-image";
import { cn } from "@/lib/utils";
import type { Playlist } from "@/hooks/usePlaylists";

interface PlaylistDetailPreviewProps {
  playlist: Playlist;
  onEdit: () => void;
  onDelete: () => void;
  onShare?: () => void;
  onPlay?: () => void;
  className?: string;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}

function getTrackWord(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return "треков";
  if (lastOne === 1) return "трек";
  if (lastOne >= 2 && lastOne <= 4) return "трека";
  return "треков";
}

export const PlaylistDetailPreview = memo(function PlaylistDetailPreview({
  playlist,
  onEdit,
  onDelete,
  onShare,
  onPlay,
  className,
}: PlaylistDetailPreviewProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Cover and Title */}
      <div className="flex gap-4">
        <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted shrink-0">
          {playlist.cover_url ? (
            <LazyImage
              src={playlist.cover_url}
              alt={playlist.title}
              coverSize="medium"
              responsive={false}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Music2 className="h-12 w-12 text-primary/40" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{playlist.title}</h2>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              {playlist.is_public ? (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  Публичный
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Приватный
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>
              {playlist.track_count ?? 0} {getTrackWord(playlist.track_count ?? 0)}
            </span>
            {(playlist.total_duration ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(playlist.total_duration ?? 0)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {playlist.description && <p className="text-sm text-muted-foreground">{playlist.description}</p>}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {onPlay && (
          <Button onClick={onPlay} className="gap-2">
            <Play className="h-4 w-4" />
            Воспроизвести
          </Button>
        )}
        <Button variant="outline" onClick={onEdit} className="gap-2">
          <Pencil className="h-4 w-4" />
          Редактировать
        </Button>
        {onShare && (
          <Button variant="outline" onClick={onShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Поделиться
          </Button>
        )}
        <Button variant="outline" onClick={onDelete} className="gap-2 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          Удалить
        </Button>
      </div>

      {/* Tracks Preview */}
      <div>
        <h3 className="text-sm font-medium mb-3">Треки в плейлисте</h3>
        {(playlist.track_count ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
            Плейлист пуст. Добавьте треки через редактирование.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
            {playlist.track_count} {getTrackWord(playlist.track_count ?? 0)} • Нажмите "Редактировать" для управления
          </p>
        )}
      </div>
    </div>
  );
});

export default PlaylistDetailPreview;
