import { useState, useEffect, useRef, memo, useMemo } from 'react';
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
  Loader2,
  Music
} from 'lucide-react';
import { ProjectTrack } from '@/hooks/useProjectTracks';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
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
import { TrackVersionsPanel } from './TrackVersionsPanel';
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

export const MinimalProjectTrackItem = memo(function MinimalProjectTrackItem({ 
  track, 
  dragHandleProps,
  isDragging,
  onGenerate,
  onOpenLyrics,
  onOpenLyricsWizard,
  generationStatus,
}: MinimalProjectTrackItemProps) {
  const isMobile = useIsMobile();
  const [editOpen, setEditOpen] = useState(false);
  // Auto-expand if track has linked track (to show versions)
  const [versionsExpanded, setVersionsExpanded] = useState(!!track.linked_track);
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

  // Check if ready to generate - need lyrics >= 50 chars and not just a prompt
  const isReadyToGenerate = useMemo(() => {
    if (lyricsStatus === 'prompt') return false;
    const lyricsText = track.lyrics || linkedTrack?.lyrics || '';
    return lyricsText.length >= 50;
  }, [track.lyrics, linkedTrack?.lyrics, lyricsStatus]);

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
          "rounded-lg bg-card/50 border border-border/50 transition-all overflow-hidden",
          isDragging && "shadow-lg border-primary scale-[1.02]",
          !isDragging && "hover:bg-card hover:border-border"
        )}
      >
        {/* Main row - larger padding on mobile for touch */}
        <div className={cn(
          "flex items-center gap-1.5",
          isMobile ? "p-2.5" : "p-2"
        )}>
          {/* Drag Handle - larger on mobile */}
          <div 
            {...dragHandleProps} 
            className={cn(
              "touch-manipulation cursor-grab active:cursor-grabbing",
              isMobile && "p-1 -m-1"
            )}
          >
            <GripVertical className={cn(
              "text-muted-foreground",
              isMobile ? "w-4 h-4" : "w-3.5 h-3.5"
            )} />
          </div>

          {/* Position */}
          <div className={cn(
            "rounded-md flex items-center justify-center font-semibold text-xs shrink-0",
            isMobile ? "w-7 h-7" : "w-6 h-6",
            statusConfig.bg,
            statusConfig.color
          )}>
            {track.position}
          </div>

          {/* Cover - show master version cover if available, otherwise linked track cover */}
          {(hasLinkedTrack || versionsExpanded) && (
            <div className={cn(
              "rounded-md overflow-hidden shrink-0 bg-secondary",
              isMobile ? "w-10 h-10" : "w-8 h-8"
            )}>
              {linkedTrack?.cover_url ? (
                <img 
                  src={linkedTrack.cover_url} 
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Music className="w-3 h-3 text-primary/50" />
                </div>
              )}
            </div>
          )}

            {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={cn(
                "font-medium truncate",
                isMobile ? "text-sm" : "text-xs"
              )}>{track.title}</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[9px] h-3.5 px-1 shrink-0",
                  statusConfig.color,
                  "border-current/30"
                )}
              >
                <StatusIcon className="w-2 h-2 mr-0.5" />
                {isMobile ? '' : statusConfig.label}
              </Badge>
            </div>
            
            {/* Track params indicators */}
            {((track as any).bpm_target || (track as any).key_signature || (track as any).energy_level) && (
              <div className="flex items-center gap-1 mt-0.5">
                {(track as any).bpm_target && (
                  <span className="text-[9px] text-muted-foreground bg-muted/50 px-1 rounded">
                    {(track as any).bpm_target} BPM
                  </span>
                )}
                {(track as any).key_signature && (
                  <span className="text-[9px] text-muted-foreground bg-muted/50 px-1 rounded">
                    {(track as any).key_signature}
                  </span>
                )}
                {(track as any).energy_level && (
                  <span className="text-[9px] text-muted-foreground bg-muted/50 px-1 rounded">
                    ⚡{(track as any).energy_level}
                  </span>
                )}
              </div>
            )}
            
            {/* Hide style_prompt on mobile to save space */}
            {!isMobile && track.style_prompt && (
              <p className="text-[10px] text-muted-foreground truncate">
                {track.style_prompt}
              </p>
            )}

            {/* Lyrics preview with status indicator */}
            {hasLyricsContent && (
              <motion.div 
                className={cn(
                  "flex items-center gap-0.5 text-[9px] text-muted-foreground/70 rounded px-0.5 -mx-0.5",
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
                      <LyricsStatusIcon className="w-2.5 h-2.5" />
                      {lyricsJustUpdated && <span className="text-[8px] text-primary font-medium ml-0.5">Обновлено!</span>}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {lyricsStatusConfig.tooltip}
                  </TooltipContent>
                </Tooltip>
                <span className="truncate">
                  {(linkedTrack?.lyrics || track.lyrics || '').replace(/\[.*?\]/g, '').slice(0, 40)}...
                </span>
              </motion.div>
            )}
          </div>

          {/* Actions - larger touch targets on mobile */}
          <div className={cn(
            "flex items-center shrink-0",
            isMobile ? "gap-1" : "gap-0.5"
          )}>
            {/* Lyrics Button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLyrics?.();
              }}
              className={isMobile ? "h-9 w-9" : "h-7 w-7"}
              title={hasLyricsContent ? 'Просмотр лирики' : 'Написать лирику'}
            >
              <FileText className={isMobile ? "w-4 h-4" : "w-3.5 h-3.5"} />
            </Button>

            {generationStatus ? (
              /* Generation in progress indicator */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10"
              >
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span className="text-[10px] font-medium text-primary">{generationStatus.stage}</span>
                <span className="text-[9px] text-primary/60">{generationStatus.progress}%</span>
              </motion.div>
            ) : hasLinkedTrack ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePlay}
                className={isMobile ? "h-9 w-9" : "h-7 w-7"}
              >
                {isPlayingThis ? (
                  <Pause className={isMobile ? "w-4 h-4" : "w-3.5 h-3.5"} />
                ) : (
                  <Play className={isMobile ? "w-4 h-4" : "w-3.5 h-3.5"} />
                )}
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={handleGenerateClick}
                    disabled={!isReadyToGenerate}
                    className={cn(
                      "gap-0.5",
                      isMobile ? "h-9 px-3 text-xs" : "h-7 px-2 text-[10px]",
                      !isReadyToGenerate && "opacity-50 cursor-not-allowed",
                      lyricsStatus === 'prompt' ? "bg-amber-500/80 hover:bg-amber-500" : "bg-primary/90"
                    )}
                  >
                    <Sparkles className={isMobile ? "w-3.5 h-3.5" : "w-3 h-3"} />
                    {!isMobile && 'Создать'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[200px]">
                  {lyricsStatus === 'prompt' 
                    ? 'Сначала сгенерируйте текст песни через AI Wizard' 
                    : !hasLyricsContent 
                      ? 'Требуется текст песни (минимум 50 символов)'
                      : 'Нажмите для генерации трека'}
                </TooltipContent>
              </Tooltip>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className={isMobile ? "h-9 w-9" : "h-7 w-7"}>
                  <MoreVertical className={isMobile ? "w-4 h-4" : "w-3.5 h-3.5"} />
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

        {/* Versions Panel - always show to allow fetching versions */}
        <div className="px-2 pb-2">
          <TrackVersionsPanel
            projectId={track.project_id}
            projectTrackId={track.id}
            projectTrackTitle={track.title}
            isExpanded={versionsExpanded}
            onToggle={() => setVersionsExpanded(!versionsExpanded)}
          />
        </div>
      </div>

      <EditTrackDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        track={track}
      />
    </>
  );
});