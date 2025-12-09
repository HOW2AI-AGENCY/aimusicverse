import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Play, 
  Sparkles, 
  MoreVertical,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileEdit,
  Trash2,
  Edit,
  Pause
} from 'lucide-react';
import { ProjectTrack } from '@/hooks/useProjectTracks';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlayerStore } from '@/hooks/audio';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjectTracks } from '@/hooks/useProjectTracks';
import { toast } from 'sonner';
import { EditTrackDialog } from './EditTrackDialog';

interface MinimalProjectTrackItemProps {
  track: ProjectTrack;
  dragHandleProps?: any;
  isDragging?: boolean;
  onGenerate: () => void;
  onOpenLyrics?: () => void;
  onOpenLyricsWizard?: () => void;
}

const STATUS_CONFIG = {
  draft: { 
    icon: FileEdit, 
    label: 'Черновик', 
    color: 'text-muted-foreground',
    bg: 'bg-muted/50'
  },
  in_progress: { 
    icon: Clock, 
    label: 'Генерация', 
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  completed: { 
    icon: CheckCircle2, 
    label: 'Готов', 
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  },
  error: { 
    icon: AlertCircle, 
    label: 'Ошибка', 
    color: 'text-destructive',
    bg: 'bg-destructive/10'
  },
};

export const MinimalProjectTrackItem = ({ 
  track, 
  dragHandleProps,
  isDragging,
  onGenerate,
  onOpenLyrics,
  onOpenLyricsWizard,
}: MinimalProjectTrackItemProps) => {
  const isMobile = useIsMobile();
  const [editOpen, setEditOpen] = useState(false);
  const { deleteTrack } = useProjectTracks(track.project_id);
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  
  const status = (track.status as keyof typeof STATUS_CONFIG) || 'draft';
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  
  const hasLinkedTrack = !!track.track_id && !!track.linked_track;
  const linkedTrack = track.linked_track;
  const isCurrentTrack = activeTrack?.id === linkedTrack?.id;
  const isPlayingThis = isCurrentTrack && isPlaying;

  const handlePlay = () => {
    if (!linkedTrack) return;
    
    if (isPlayingThis) {
      pauseTrack();
    } else {
      playTrack({
        id: linkedTrack.id,
        title: linkedTrack.title || track.title,
        audio_url: linkedTrack.audio_url,
        cover_url: linkedTrack.cover_url,
        duration_seconds: linkedTrack.duration_seconds,
        lyrics: linkedTrack.lyrics,
      } as any);
    }
  };

  const handleDelete = () => {
    if (confirm('Удалить трек из треклиста?')) {
      deleteTrack(track.id);
      toast.success('Трек удален');
    }
  };

  return (
    <>
      <div 
        className={cn(
          "flex items-center gap-2 p-2.5 rounded-xl bg-card/50 border border-border/50 transition-all",
          isDragging && "shadow-lg border-primary scale-[1.02]",
          !isDragging && "hover:bg-card hover:border-border"
        )}
      >
        {/* Drag Handle */}
        <div {...dragHandleProps} className="touch-manipulation cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Position */}
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0",
          statusConfig.bg,
          statusConfig.color
        )}>
          {track.position}
        </div>

        {/* Cover (if linked track) */}
        {hasLinkedTrack && linkedTrack?.cover_url && (
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-secondary">
            <img 
              src={linkedTrack.cover_url} 
              alt={track.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate">{track.title}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] h-4 px-1.5 shrink-0",
                statusConfig.color,
                "border-current/30"
              )}
            >
              <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
              {isMobile ? '' : statusConfig.label}
            </Badge>
          </div>
          
          {track.style_prompt && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {track.style_prompt}
            </p>
          )}

          {/* Lyrics preview */}
          {(track.notes || linkedTrack?.lyrics) && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/70">
              <FileText className="w-3 h-3" />
              <span className="truncate">
                {(linkedTrack?.lyrics || track.notes || '').replace(/\[.*?\]/g, '').slice(0, 50)}...
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Lyrics Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLyrics?.();
            }}
            className="h-8 w-8"
            title={track.notes || linkedTrack?.lyrics ? 'Просмотр лирики' : 'Написать лирику'}
          >
            <FileText className="w-4 h-4" />
          </Button>

          {hasLinkedTrack ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePlay}
              className="h-8 w-8"
            >
              {isPlayingThis ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onGenerate}
              className="h-8 px-3 gap-1 bg-primary/90"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {!isMobile && 'Создать'}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenLyrics}>
                <FileText className="w-4 h-4 mr-2" />
                {track.notes || linkedTrack?.lyrics ? 'Просмотр лирики' : 'Написать лирику'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenLyricsWizard}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Lyrics Wizard
              </DropdownMenuItem>
              {!hasLinkedTrack && (
                <DropdownMenuItem onClick={onGenerate}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Генерировать
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EditTrackDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        track={track}
      />
    </>
  );
};
