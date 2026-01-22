/**
 * Version Timeline Component
 * Visual representation of track versions with interactive switching
 * Includes audio prefetching for faster version switching
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Check, Clock, GitBranch, ChevronDown, Star, Scissors, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTrackVersions, TrackVersion } from '@/hooks/useTrackVersions';
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';
import { prefetchAudio, shouldPrefetch } from '@/lib/audioCache';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { format, ru } from '@/lib/date-utils';

interface VersionTimelineProps {
  trackId: string;
  activeVersionId?: string | null;
  onVersionChange?: (versionId: string, audioUrl: string) => void;
  className?: string;
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

export function VersionTimeline({
  trackId,
  activeVersionId,
  onVersionChange,
  className,
}: VersionTimelineProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { data: versions, isLoading } = useTrackVersions(trackId);
  const { setPrimaryVersionAsync, isSettingPrimary } = useVersionSwitcher();
  const haptic = useHapticFeedback();

  const activeVersion = versions?.find(v => v.is_primary) ?? (versions && versions.length > 0 ? versions[0] : undefined);
  const versionCount = versions?.length || 0;

  // Prefetch neighboring versions for instant switching
  useEffect(() => {
    if (!versions || versions.length <= 1 || !shouldPrefetch()) return;
    
    const activeIndex = versions.findIndex(v => v.id === activeVersion?.id);
    if (activeIndex === -1) return;

    // Prefetch next and previous versions
    const indicesToPrefetch = [activeIndex - 1, activeIndex + 1].filter(
      i => i >= 0 && i < versions.length && i !== activeIndex
    );

    indicesToPrefetch.forEach(i => {
      const version = versions[i];
      if (version?.audio_url) {
        prefetchAudio(version.audio_url).catch(() => {
          // Prefetch failure is not critical
        });
      }
    });
  }, [versions, activeVersion?.id]);

  const handleVersionSelect = async (version: TrackVersion) => {
    if (!version || version.id === activeVersion?.id) return;
    
    haptic.select();
    
    try {
      await setPrimaryVersionAsync({ trackId, versionId: version.id });
      onVersionChange?.(version.id, version.audio_url);
      setIsOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Prefetch version audio on hover for even faster switching
  const handleVersionHover = (version: TrackVersion) => {
    if (version?.audio_url && shouldPrefetch()) {
      prefetchAudio(version.audio_url).catch(() => {});
    }
  };

  if (isLoading || versionCount <= 1) {
    return null;
  }

  // Mobile: Full sheet with version history
  if (isMobile) {
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
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              История версий
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-full pb-8">
            <div className="space-y-2 pr-4">
              {versions?.map((version, index) => {
                const isActive = version.id === activeVersion?.id;
                const versionType = version.version_type || 'original';
                
                return (
                  <motion.button
                    key={version.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleVersionSelect(version)}
                    onMouseEnter={() => handleVersionHover(version)}
                    onTouchStart={() => handleVersionHover(version)}
                    disabled={isSettingPrimary}
                    className={cn(
                      "w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all",
                      isActive
                        ? "bg-primary/10 border-2 border-primary"
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
                      <div className="flex items-center gap-2 mb-1">
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
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {version.created_at ? format(new Date(version.created_at), 'd MMM, HH:mm', { locale: ru }) : 'Недавно'}
                        </span>
                        {version.duration_seconds && (
                          <span className="font-mono">
                            {formatTime(version.duration_seconds)}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Compact horizontal timeline
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
                  onMouseEnter={() => handleVersionHover(version)}
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
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    {versionTypeIcons[versionType]}
                    {versionTypeLabels[versionType] || versionType}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {version.created_at ? format(new Date(version.created_at), 'd MMM HH:mm', { locale: ru }) : 'Недавно'}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {versionCount > 5 && (
          <Badge variant="outline" className="font-mono ml-1">
            +{versionCount - 5}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
