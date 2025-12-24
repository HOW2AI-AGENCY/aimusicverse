/**
 * Version Tree Visualization
 * Enhanced version history with tree structure
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Check, Clock, GitBranch, ChevronDown, Star, 
  Scissors, Wand2, Music, ArrowRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTrackVersions, TrackVersion } from '@/hooks/useTrackVersions';
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { format, ru } from '@/lib/date-utils';

interface VersionTreeProps {
  trackId: string;
  activeVersionId?: string | null;
  onVersionChange?: (versionId: string, audioUrl: string) => void;
  className?: string;
}

const versionTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  original: { icon: Star, label: 'Оригинал', color: 'text-yellow-500' },
  section_replacement: { icon: Scissors, label: 'Замена секции', color: 'text-blue-500' },
  remix: { icon: Wand2, label: 'Ремикс', color: 'text-purple-500' },
  extend: { icon: ArrowRight, label: 'Расширение', color: 'text-green-500' },
  vocal_replacement: { icon: Music, label: 'Новый вокал', color: 'text-pink-500' },
  arrangement_replacement: { icon: Music, label: 'Новая аранжировка', color: 'text-orange-500' },
};

export function VersionTree({
  trackId,
  activeVersionId,
  onVersionChange,
  className,
}: VersionTreeProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
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
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading || versionCount <= 1) {
    return null;
  }

  // Build version tree structure
  const buildTree = (versions: TrackVersion[]) => {
    // Sort by creation date
    const sorted = [...versions].sort((a, b) => 
      new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
    return sorted;
  };

  const versionTree = versions ? buildTree(versions) : [];

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
              <Badge variant="secondary">{versionCount}</Badge>
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-full pb-8">
            <div className="space-y-2 pr-4">
              {versionTree.map((version, index) => {
                const isActive = version.id === activeVersion?.id;
                const versionType = version.version_type || 'original';
                const config = versionTypeConfig[versionType] || versionTypeConfig.original;
                const TypeIcon = config.icon;
                
                return (
                  <motion.button
                    key={version.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleVersionSelect(version)}
                    disabled={isSettingPrimary}
                    className={cn(
                      "w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all",
                      isActive
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-card border border-border hover:border-primary/50"
                    )}
                  >
                    {/* Version indicator */}
                    <div className="relative">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {isSettingPrimary && version.id === activeVersion?.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isActive ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span className="font-mono font-bold">
                            {String.fromCharCode(65 + index)}
                          </span>
                        )}
                      </div>
                      {/* Tree connection line */}
                      {index < versionTree.length - 1 && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-border" />
                      )}
                    </div>
                    
                    {/* Version info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={cn("gap-1 text-xs", config.color)}>
                          <TypeIcon className="w-3 h-3" />
                          {config.label}
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

  // Desktop: Horizontal timeline with tree visualization
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        {versionTree.slice(0, 8).map((version, index) => {
          const isActive = version.id === activeVersion?.id;
          const versionType = version.version_type || 'original';
          const config = versionTypeConfig[versionType] || versionTypeConfig.original;
          const TypeIcon = config.icon;
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
                  {isSettingPrimary ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    letter
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeVersionIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full"
                    />
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px]">
                <div className="space-y-1.5">
                  <div className={cn("flex items-center gap-1.5 font-medium", config.color)}>
                    <TypeIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {version.created_at 
                      ? format(new Date(version.created_at), 'd MMM HH:mm', { locale: ru }) 
                      : 'Недавно'}
                  </div>
                  {version.duration_seconds && (
                    <div className="text-xs font-mono">
                      {formatTime(version.duration_seconds)}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {versionCount > 8 && (
          <Badge variant="outline" className="font-mono ml-1">
            +{versionCount - 8}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
