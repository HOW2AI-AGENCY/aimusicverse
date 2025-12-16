// TrackCommentsSection - Comments UI for track detail/player
import { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommentsList } from '@/components/comments/CommentsList';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';

interface TrackCommentsSectionProps {
  trackId: string;
  className?: string;
  defaultExpanded?: boolean;
}

export function TrackCommentsSection({ 
  trackId, 
  className,
  defaultExpanded = false 
}: TrackCommentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('rounded-xl border border-border/50 bg-card/50 overflow-hidden', className)}>
      {/* Header - Always visible */}
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between px-4 py-3 h-auto hover:bg-accent/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-medium text-sm">Комментарии</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>

      {/* Comments content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-border/30">
              <CommentsList trackId={trackId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
