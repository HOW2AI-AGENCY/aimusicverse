/**
 * StudioActivityLog - Visual display of studio action history
 * Shows recent changes with icons, timestamps, and details
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  History, Scissors, Music2, GitBranch, Wand2, 
  ChevronDown, ChevronUp, Crop, Expand, Activity,
  Volume2, VolumeX, Check, X, Loader2, Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useStudioChangeLog, StudioChangeEntry, getChangeTypeLabel, StudioChangeType } from '@/hooks/useStudioChangeLog';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, ru } from '@/lib/date-utils';

interface StudioActivityLogProps {
  trackId: string;
  className?: string;
  maxItems?: number;
  collapsible?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  scissors: <Scissors className="w-3.5 h-3.5" />,
  music: <Music2 className="w-3.5 h-3.5" />,
  'git-branch': <GitBranch className="w-3.5 h-3.5" />,
  wand: <Wand2 className="w-3.5 h-3.5" />,
  crop: <Crop className="w-3.5 h-3.5" />,
  expand: <Expand className="w-3.5 h-3.5" />,
  activity: <Activity className="w-3.5 h-3.5" />,
  monitor: <Monitor className="w-3.5 h-3.5" />,
};

function getIcon(type: StudioChangeType): React.ReactNode {
  if (type.startsWith('section_replacement')) return iconMap.scissors;
  if (type.includes('mute')) return <VolumeX className="w-3.5 h-3.5" />;
  if (type.includes('unmute') || type.includes('volume')) return <Volume2 className="w-3.5 h-3.5" />;
  if (type.startsWith('stem_')) return iconMap.music;
  if (type.startsWith('version_')) return iconMap['git-branch'];
  if (type.includes('trim')) return iconMap.crop;
  if (type.includes('extend')) return iconMap.expand;
  if (type.includes('remix')) return iconMap.wand;
  if (type.includes('studio')) return iconMap.monitor;
  return iconMap.activity;
}

function getStatusBadge(type: StudioChangeType): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string } | null {
  if (type.includes('completed')) return { variant: 'default', label: 'Готово' };
  if (type.includes('started')) return { variant: 'secondary', label: 'В процессе' };
  if (type.includes('failed') || type.includes('discarded')) return { variant: 'outline', label: 'Отменено' };
  if (type.includes('applied')) return { variant: 'default', label: 'Применено' };
  return null;
}

function ActivityItem({ entry, index }: { entry: StudioChangeEntry; index: number }) {
  const statusBadge = getStatusBadge(entry.change_type as StudioChangeType);
  const metadata = entry.metadata as Record<string, unknown> | null;
  
  const timeAgo = formatDistanceToNow(new Date(entry.created_at), { 
    addSuffix: true,
    locale: ru 
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0"
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
        entry.change_type.includes('completed') || entry.change_type.includes('applied')
          ? "bg-primary/10 text-primary"
          : entry.change_type.includes('failed') || entry.change_type.includes('discarded')
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground"
      )}>
        {getIcon(entry.change_type as StudioChangeType)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium truncate">
            {getChangeTypeLabel(entry.change_type as StudioChangeType)}
          </span>
          {statusBadge && (
            <Badge variant={statusBadge.variant} className="text-[10px] h-4 px-1.5">
              {statusBadge.label}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          {metadata?.sectionStart !== undefined && metadata?.sectionEnd !== undefined && (
            <span className="font-mono">
              {formatSeconds(metadata.sectionStart as number)} — {formatSeconds(metadata.sectionEnd as number)}
            </span>
          )}
          {entry.field_name && (
            <Badge variant="outline" className="text-[10px] h-4">
              {entry.field_name}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function StudioActivityLog({ 
  trackId, 
  className, 
  maxItems = 10,
  collapsible = true 
}: StudioActivityLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { changeLog, isLoading } = useStudioChangeLog(trackId);
  
  // Filter out session open/close for cleaner display
  const filteredLog = changeLog?.filter(
    entry => !entry.change_type.includes('studio_opened') && !entry.change_type.includes('studio_closed')
  ).slice(0, maxItems) || [];

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground text-sm", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Загрузка истории...</span>
      </div>
    );
  }

  if (filteredLog.length === 0) {
    return (
      <div className={cn("text-muted-foreground text-sm", className)}>
        <span className="flex items-center gap-2">
          <History className="w-4 h-4" />
          История изменений пуста
        </span>
      </div>
    );
  }

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between h-9 px-3">
            <span className="flex items-center gap-2 text-sm">
              <History className="w-4 h-4" />
              История ({filteredLog.length})
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="max-h-60 mt-2">
            <div className="px-1">
              {filteredLog.map((entry, index) => (
                <ActivityItem key={entry.id} entry={entry} index={index} />
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">История изменений</span>
        <Badge variant="secondary" className="text-xs">
          {filteredLog.length}
        </Badge>
      </div>
      <ScrollArea className="max-h-60">
        <div className="space-y-0">
          {filteredLog.map((entry, index) => (
            <ActivityItem key={entry.id} entry={entry} index={index} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
