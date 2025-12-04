import { Music2, Clock, Globe, Lock, MoreVertical, Play, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Playlist } from '@/hooks/usePlaylists';

interface PlaylistCardProps {
  playlist: Playlist;
  formatDuration: (seconds: number) => string;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PlaylistCard({ playlist, formatDuration, onOpen, onEdit, onDelete }: PlaylistCardProps) {
  return (
    <div 
      className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors cursor-pointer group"
      onClick={onOpen}
    >
      {/* Cover */}
      <div className="aspect-square bg-muted relative">
        {playlist.cover_url ? (
          <img
            src={playlist.cover_url}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Music2 className="h-16 w-16 text-primary/40" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full">
            <Play className="h-6 w-6" />
          </Button>
        </div>

        {/* Public/Private badge */}
        <div className="absolute top-2 right-2">
          {playlist.is_public ? (
            <div className="bg-black/60 rounded-full p-1.5" title="Публичный">
              <Globe className="h-3.5 w-3.5 text-white" />
            </div>
          ) : (
            <div className="bg-black/60 rounded-full p-1.5" title="Приватный">
              <Lock className="h-3.5 w-3.5 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate">{playlist.title}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span>{playlist.track_count} {getTrackWord(playlist.track_count)}</span>
              {playlist.total_duration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(playlist.total_duration)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="h-4 w-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {playlist.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {playlist.description}
          </p>
        )}
      </div>
    </div>
  );
}

function getTrackWord(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;
  
  if (lastTwo >= 11 && lastTwo <= 19) return 'треков';
  if (lastOne === 1) return 'трек';
  if (lastOne >= 2 && lastOne <= 4) return 'трека';
  return 'треков';
}
