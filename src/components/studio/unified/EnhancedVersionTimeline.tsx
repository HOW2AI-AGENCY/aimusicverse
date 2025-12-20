/**
 * EnhancedVersionTimeline - Improved version history with details and actions
 * Shows version timeline with waveform previews and change details
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Check, Clock, GitBranch, ChevronDown, Star, 
  Scissors, Wand2, Play, Pause, MoreHorizontal,
  Download, Trash2, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTrackVersions, TrackVersion } from '@/hooks/useTrackVersions';
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { useRef, useEffect } from 'react';

interface EnhancedVersionTimelineProps {
  trackId: string;
  activeVersionId?: string | null;
  onVersionChange?: (versionId: string, audioUrl: string) => void;
  onVersionPreview?: (version: TrackVersion) => void;
  className?: string;
  showDetails?: boolean;
}

const versionTypeIcons: Record<string, React.ReactNode> = {
  original: <Star className="w-3.5 h-3.5" />,
  section_replacement: <Scissors className="w-3.5 h-3.5" />,
  remix: <Wand2 className="w-3.5 h-3.5" />,
  extend: <GitBranch className="w-3.5 h-3.5" />,
};

const versionTypeLabels: Record<string, string> = {
  original: 'Оригинал',
  section_replacement: 'Замена секции',
  remix: 'Ремикс',
  extend: 'Расширение',
};

function VersionPreviewPlayer({ 
  audioUrl, 
  onPlay, 
  onStop,
  isActive 
}: { 
  audioUrl: string; 
  onPlay: () => void;
  onStop: () => void;
  isActive: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    audioRef.current = audio;

    const updateProgress = () => {
      if (audioRef.current) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
      animationRef.current = requestAnimationFrame(updateProgress);
    };

    audio.addEventListener('play', () => {
      setIsPlaying(true);
      onPlay();
      animationRef.current = requestAnimationFrame(updateProgress);
    });

    audio.addEventListener('pause', () => {
      setIsPlaying(false);
      onStop();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      onStop();
    });

    return () => {
      audio.pause();
      audio.src = '';
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioUrl, onPlay, onStop]);

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      await audioRef.current.play();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        className="h-8 w-8 rounded-full"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </Button>
      
      {/* Mini progress bar */}
      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function EnhancedVersionTimeline({
  trackId,
  activeVersionId,
  onVersionChange,
  onVersionPreview,
  className,
  showDetails = false,
}: EnhancedVersionTimelineProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [previewingVersionId, setPreviewingVersionId] = useState<string | null>(null);
  const { data: versions, isLoading } = useTrackVersions(trackId);
  const { setPrimaryVersionAsync, isSettingPrimary } = useVersionSwitcher();
  const haptic = useHapticFeedback();

  const activeVersion = versions?.find(v => v.is_primary) ?? versions?.[0];
  const versionCount = versions?.length || 0;

  const handleVersionSelect = async (version: TrackVersion) => {
    if (!version || version.id === activeVersion?.id) return;
    
    haptic.select();
    
    try {
      await setPrimaryVersionAsync({ trackId, versionId: version.id });
      onVersionChange?.(version.id, version.audio_url);
      setIsOpen(false);
      toast.success('Версия активирована');
    } catch (error) {
      toast.error('Ошибка при смене версии');
    }
  };

  const handleDownload = (version: TrackVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.select();
    window.open(version.audio_url, '_blank');
  };

  if (isLoading || versionCount <= 1) {
    return null;
  }

  // Mobile sheet content
  const VersionsList = () => (
    <div className="space-y-2">
      {versions?.map((version, index) => {
        const isActive = version.id === activeVersion?.id;
        const versionType = version.version_type || 'original';
        const isPreviewing = previewingVersionId === version.id;
        
        return (
          <motion.div
            key={version.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleVersionSelect(version)}
            className={cn(
              "relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all",
              isActive
                ? "bg-primary/10 border-2 border-primary"
                : isPreviewing
                ? "bg-accent/50 border border-primary/50"
                : "bg-card border border-border hover:border-primary/50"
            )}
          >
            {/* Version indicator */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              isActive ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {isActive ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="font-mono font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
              )}
            </div>
            
            {/* Version info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="secondary" className="gap-1 text-xs">
                  {versionTypeIcons[versionType]}
                  {versionTypeLabels[versionType] || versionType}
                </Badge>
                {isActive && (
                  <Badge className="bg-primary/20 text-primary text-xs">
                    Активная
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {version.created_at 
                    ? format(new Date(version.created_at), 'd MMM, HH:mm', { locale: ru }) 
                    : 'Недавно'}
                </span>
                {version.duration_seconds && (
                  <span className="font-mono">
                    {formatTime(version.duration_seconds)}
                  </span>
                )}
              </div>

              {/* Preview controls */}
              <div className="flex items-center gap-2">
                <VersionPreviewPlayer
                  audioUrl={version.audio_url}
                  isActive={isPreviewing}
                  onPlay={() => setPreviewingVersionId(version.id)}
                  onStop={() => setPreviewingVersionId(null)}
                />
                
                <div className="flex-1" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onVersionPreview && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onVersionPreview(version);
                      }}>
                        <Eye className="w-4 h-4 mr-2" />
                        Просмотр деталей
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => handleDownload(version, e)}>
                      <Download className="w-4 h-4 mr-2" />
                      Скачать
                    </DropdownMenuItem>
                    {!isActive && versions && versions.length > 1 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info('Удаление версий в разработке');
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Удалить версию
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  // Mobile: Full sheet
  if (isMobile || showDetails) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn("gap-2 h-9", className)}
          >
            <GitBranch className="w-4 h-4" />
            <span className="font-mono">v{versionCount}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              История версий
              <Badge variant="secondary" className="ml-2">
                {versionCount} версий
              </Badge>
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-full pb-8">
            <VersionsList />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Compact horizontal timeline with hover details
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        {versions?.slice(0, 5).map((version, index) => {
          const isActive = version.id === activeVersion?.id;
          const versionType = version.version_type || 'original';
          const letter = String.fromCharCode(65 + index);
          
          return (
            <Tooltip key={version.id}>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => handleVersionSelect(version)}
                  disabled={isSettingPrimary}
                  className={cn(
                    "relative w-8 h-8 rounded-lg font-mono font-bold text-sm transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {letter}
                  {isActive && (
                    <motion.div
                      layoutId="activeVersionIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full"
                    />
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-medium">
                    {versionTypeIcons[versionType]}
                    {versionTypeLabels[versionType] || versionType}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {version.created_at 
                        ? format(new Date(version.created_at), 'd MMM HH:mm', { locale: ru }) 
                        : 'Недавно'}
                    </span>
                    {version.duration_seconds && (
                      <span className="font-mono">
                        {formatTime(version.duration_seconds)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-primary">
                    Нажмите для активации
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {versionCount > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="h-8 px-2 font-mono"
          >
            +{versionCount - 5}
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
