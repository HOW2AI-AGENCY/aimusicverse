/**
 * SectionReplacementHistory
 * 
 * Displays history of all section replacements for a track
 * with ability to preview, compare, and rollback to any version
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  History, Play, Pause, RotateCcw, Check, 
  Clock, ChevronDown, ChevronUp, X,
  GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { useReplacedSections } from '@/hooks/useReplacedSections';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SectionReplacementHistoryProps {
  trackId: string;
  currentAudioUrl: string;
  onRollback: (audioUrl: string, taskId: string, section: { start: number; end: number }) => void;
  onPreview: (audioUrl: string, section: { start: number; end: number }) => void;
  className?: string;
}

export function SectionReplacementHistory({
  trackId,
  currentAudioUrl,
  onRollback,
  onPreview,
  className,
}: SectionReplacementHistoryProps) {
  const { data: sections, isLoading } = useReplacedSections(trackId);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Group sections by date
  const groupedSections = useMemo(() => {
    if (!sections) return [];
    
    const groups: Record<string, typeof sections> = {};
    sections.forEach(section => {
      const date = format(new Date(section.createdAt), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(section);
    });
    
    return Object.entries(groups).map(([date, items]) => ({
      date,
      formattedDate: format(new Date(date), 'd MMMM yyyy', { locale: ru }),
      items,
    }));
  }, [sections]);

  const completedCount = sections?.filter(s => s.status === 'completed').length || 0;

  if (isLoading) {
    return (
      <div className={cn("animate-pulse h-10 bg-muted/30 rounded-lg", className)} />
    );
  }

  if (!sections?.length) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between h-9 px-3 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">История замен</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {completedCount}
            </Badge>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 border border-border/50 rounded-xl overflow-hidden bg-card/50"
        >
          <ScrollArea className="max-h-[300px]">
            <div className="p-2 space-y-3">
              {groupedSections.map((group) => (
                <div key={group.date}>
                  {/* Date header */}
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {group.formattedDate}
                    </span>
                  </div>
                  
                  {/* Sections for this date */}
                  <div className="space-y-1">
                    {group.items.map((section, idx) => (
                      <HistoryItem
                        key={section.taskId}
                        section={section}
                        index={group.items.length - idx}
                        isExpanded={expandedSection === section.taskId}
                        isPlaying={playingId === section.taskId}
                        onToggleExpand={() => {
                          setExpandedSection(
                            expandedSection === section.taskId ? null : section.taskId
                          );
                        }}
                        onPlay={() => {
                          if (section.audioUrl) {
                            setPlayingId(section.taskId);
                            onPreview(section.audioUrl, { 
                              start: section.start, 
                              end: section.end 
                            });
                          }
                        }}
                        onStop={() => setPlayingId(null)}
                        onRollback={() => {
                          if (section.audioUrl) {
                            onRollback(section.audioUrl, section.taskId, {
                              start: section.start,
                              end: section.end,
                            });
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface HistoryItemProps {
  section: {
    taskId: string;
    start: number;
    end: number;
    status: string;
    audioUrl?: string;
    audioUrlB?: string;
    createdAt: string;
  };
  index: number;
  isExpanded: boolean;
  isPlaying: boolean;
  onToggleExpand: () => void;
  onPlay: () => void;
  onStop: () => void;
  onRollback: () => void;
}

function HistoryItem({
  section,
  index,
  isExpanded,
  isPlaying,
  onToggleExpand,
  onPlay,
  onStop,
  onRollback,
}: HistoryItemProps) {
  const isCompleted = section.status === 'completed';
  const isPending = section.status === 'pending' || section.status === 'processing';
  const duration = section.end - section.start;
  const time = format(new Date(section.createdAt), 'HH:mm');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border transition-all",
        isExpanded 
          ? "border-primary/30 bg-primary/5" 
          : "border-border/30 bg-background/50 hover:bg-muted/30"
      )}
    >
      {/* Main row */}
      <div 
        className="flex items-center gap-2 p-2 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Status indicator */}
        <div className={cn(
          "w-2 h-2 rounded-full flex-shrink-0",
          isCompleted && "bg-green-500",
          isPending && "bg-amber-500 animate-pulse",
          section.status === 'failed' && "bg-destructive"
        )} />
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">
              Замена #{index}
            </span>
            <Badge 
              variant="outline" 
              className="h-4 px-1 text-[9px] font-mono"
            >
              {formatTime(section.start)} — {formatTime(section.end)}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {duration.toFixed(1)}с • {time}
          </p>
        </div>
        
        {/* Quick actions */}
        {isCompleted && section.audioUrl && !isExpanded && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                isPlaying ? onStop() : onPlay();
              }}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 ml-0.5" />
              )}
            </Button>
          </div>
        )}
        
        {/* Expand icon */}
        {isCompleted && (
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        )}
      </div>
      
      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && isCompleted && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 pt-1 border-t border-border/30 space-y-2">
              {/* Variant buttons */}
              <div className="flex items-center gap-2">
                {section.audioUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 flex-1"
                    onClick={() => {
                      isPlaying ? onStop() : onPlay();
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    Вариант A
                  </Button>
                )}
                {section.audioUrlB && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 flex-1"
                    onClick={() => {
                      // Play variant B
                    }}
                  >
                    <Play className="w-3 h-3" />
                    Вариант B
                  </Button>
                )}
              </div>
              
              {/* Rollback button */}
              <Button
                variant="secondary"
                size="sm"
                className="w-full h-8 text-xs gap-1.5"
                onClick={onRollback}
              >
                <RotateCcw className="w-3 h-3" />
                Откатить к этой версии
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
