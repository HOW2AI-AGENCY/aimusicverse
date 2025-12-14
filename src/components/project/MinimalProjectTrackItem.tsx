import { useState, useEffect, useRef } from 'react';
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
  Pause,
  FileQuestion,
  FileCheck,
  Wand2,
  Loader2
} from 'lucide-react';
import { ProjectTrack } from '@/hooks/useProjectTracks';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlayerStore } from '@/hooks/audio';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useProjectTracks } from '@/hooks/useProjectTracks';
import { toast } from 'sonner';
import { EditTrackDialog } from './EditTrackDialog';
import { motion } from '@/lib/motion';

interface GenerationStatus {
  progress: number;
  stage: string;
}

interface MinimalProjectTrackItemProps {
  track: ProjectTrack;
  dragHandleProps?: any;
  isDragging?: boolean;
  onGenerate: () => void;
  onOpenLyrics?: () => void;
  onOpenLyricsWizard?: () => void;
  generationStatus?: GenerationStatus | null;
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

const LYRICS_STATUS_CONFIG = {
  draft: { 
    icon: FileEdit, 
    label: 'Черновик', 
    color: 'text-muted-foreground',
    canGenerate: true,
    tooltip: 'Лирика в черновике'
  },
  prompt: { 
    icon: FileQuestion, 
    label: 'Промпт', 
    color: 'text-amber-500',
    canGenerate: false,
    tooltip: 'Это промпт для генерации, а не готовая лирика. Сгенерируйте текст через AI Wizard.'
  },
  generated: { 
    icon: Wand2, 
    label: 'AI', 
    color: 'text-blue-500',
    canGenerate: true,
    tooltip: 'Лирика сгенерирована AI'
  },
  approved: { 
    icon: FileCheck, 
    label: 'Готово', 
    color: 'text-green-500',
    canGenerate: true,
    tooltip: 'Лирика одобрена'
  },
};

export const MinimalProjectTrackItem = ({ 
  track, 
  dragHandleProps,
  isDragging,
  onGenerate,
  onOpenLyrics,
  onOpenLyricsWizard,
  generationStatus,
}: MinimalProjectTrackItemProps) => {
  const isMobile = useIsMobile();
  const [editOpen, setEditOpen] = useState(false);
  const { deleteTrack } = useProjectTracks(track.project_id);
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  
  const status = (track.status as keyof typeof STATUS_CONFIG) || 'draft';
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  // Get lyrics status - default to 'draft' if not set
  const lyricsStatus = (track.lyrics_status as keyof typeof LYRICS_STATUS_CONFIG) || 'draft';
  const lyricsStatusConfig = LYRICS_STATUS_CONFIG[lyricsStatus];
  const LyricsStatusIcon = lyricsStatusConfig.icon;
  
  const hasLinkedTrack = !!track.track_id && !!track.linked_track;
  const linkedTrack = track.linked_track;
  const isCurrentTrack = activeTrack?.id === linkedTrack?.id;
  const isPlayingThis = isCurrentTrack && isPlaying;

  // Check if we have actual lyrics content (use new lyrics field, fallback to notes for backward compat)
  const hasLyricsContent = !!(track.lyrics || linkedTrack?.lyrics);

  // Track lyrics changes for animation
  const prevLyricsRef = useRef(track.lyrics);
  const [lyricsJustUpdated, setLyricsJustUpdated] = useState(false);

  useEffect(() => {
    if (prevLyricsRef.current !== track.lyrics && track.lyrics) {
      setLyricsJustUpdated(true);
      const timer = setTimeout(() => setLyricsJustUpdated(false), 2000);
      return () => clearTimeout(timer);
    }
    prevLyricsRef.current = track.lyrics;
  }, [track.lyrics]);

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

  const handleGenerateClick = () => {
    // Check if lyrics status is 'prompt' - redirect to lyrics wizard
    if (lyricsStatus === 'prompt') {
      toast.warning('Сначала сгенерируйте текст песни', {
        description: 'В поле сейчас только промпт для генерации. Используйте AI Lyrics Wizard.',
        action: {
          label: 'AI Wizard',
          onClick: () => onOpenLyricsWizard?.(),
        },
      });
      return;
    }
    
    // Check if we have any lyrics at all
    if (!track.lyrics && !linkedTrack?.lyrics) {
      toast.warning('Требуется текст песни', {
        description: 'Напишите лирику или используйте AI Wizard.',
        action: {
          label: 'AI Wizard',
          onClick: () => onOpenLyricsWizard?.(),
        },
      });
      return;
    }

    // Check minimum lyrics length
    const lyricsText = track.lyrics || linkedTrack?.lyrics || '';
    if (lyricsText.length < 50) {
      toast.warning('Текст песни слишком короткий', {
        description: 'Минимум 50 символов. Дополните текст или используйте AI Wizard.',
        action: {
          label: 'Редактор',
          onClick: () => onOpenLyrics?.(),
        },
      });
      return;
    }
    
    onGenerate();
  };

  return (
    <>
      <div 
        className={cn(
          "rounded-xl bg-card/50 border border-border/50 transition-all overflow-hidden",
          isDragging && "shadow-lg border-primary scale-[1.02]",
          !isDragging && "hover:bg-card hover:border-border"
        )}
      >
        {/* Main row */}
        <div className="flex items-center gap-2 p-2.5">
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

            {/* Lyrics preview with status indicator */}
            {hasLyricsContent && (
              <motion.div 
                className={cn(
                  "flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/70 rounded px-1 -mx-1",
                  lyricsJustUpdated && "bg-primary/20"
                )}
                animate={lyricsJustUpdated ? { 
                  backgroundColor: ['hsl(var(--primary) / 0.3)', 'hsl(var(--primary) / 0)'] 
                } : {}}
                transition={{ duration: 2 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn("flex items-center gap-0.5", lyricsStatusConfig.color)}>
                      <LyricsStatusIcon className="w-3 h-3" />
                      {lyricsJustUpdated && <span className="text-[9px] text-primary font-medium ml-1">Обновлено!</span>}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {lyricsStatusConfig.tooltip}
                  </TooltipContent>
                </Tooltip>
                <span className="truncate">
                  {(linkedTrack?.lyrics || track.lyrics || '').replace(/\[.*?\]/g, '').slice(0, 50)}...
                </span>
              </motion.div>
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
              title={hasLyricsContent ? 'Просмотр лирики' : 'Написать лирику'}
            >
              <FileText className="w-4 h-4" />
            </Button>

            {generationStatus ? (
              /* Generation in progress indicator */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-xs font-medium text-primary">{generationStatus.stage}</span>
                <span className="text-[10px] text-primary/60">{generationStatus.progress}%</span>
              </motion.div>
            ) : hasLinkedTrack ? (
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={handleGenerateClick}
                    className={cn(
                      "h-8 px-3 gap-1",
                      lyricsStatus === 'prompt' ? "bg-amber-500/80 hover:bg-amber-500" : "bg-primary/90"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {!isMobile && 'Создать'}
                  </Button>
                </TooltipTrigger>
                {lyricsStatus === 'prompt' && (
                  <TooltipContent side="top" className="text-xs max-w-[200px]">
                    Лирика ещё не готова. Нажмите чтобы увидеть предупреждение.
                  </TooltipContent>
                )}
              </Tooltip>
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
                  {hasLyricsContent ? 'Просмотр лирики' : 'Написать лирику'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenLyricsWizard}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Lyrics Wizard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!hasLinkedTrack && (
                  <DropdownMenuItem onClick={handleGenerateClick}>
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

        {/* Generated versions row - if linked track exists */}
        {hasLinkedTrack && linkedTrack && (
          <div className="px-2.5 pb-2.5">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="w-8 h-8 rounded-md overflow-hidden bg-secondary shrink-0">
                {linkedTrack.cover_url && (
                  <img 
                    src={linkedTrack.cover_url} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{linkedTrack.title || track.title}</p>
                <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Сгенерирован
                  {linkedTrack.duration_seconds && (
                    <span className="text-muted-foreground">
                      • {Math.floor(linkedTrack.duration_seconds / 60)}:{(linkedTrack.duration_seconds % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePlay}
                className="h-7 w-7"
              >
                {isPlayingThis ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <EditTrackDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        track={track}
      />
    </>
  );
};