/**
 * AIToolbar - Optimized horizontal scrollable toolbar for AI tools
 * Groups tools by category for better UX, with expand/collapse
 */

import { memo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AITool, AIToolId } from './types';
import { AI_TOOLS } from './constants';

interface AIToolbarProps {
  activeTool: AIToolId | null;
  onSelectTool: (toolId: AIToolId) => void;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
}

interface ToolButtonProps {
  tool: AITool;
  isActive: boolean;
  isLoading?: boolean;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}

// Primary tools shown by default (most used)
const PRIMARY_TOOL_IDS: AIToolId[] = ['write', 'analyze', 'producer', 'optimize', 'tags', 'rhyme'];
// Secondary tools shown when expanded
const SECONDARY_TOOL_IDS: AIToolId[] = ['continue', 'structure', 'rhythm', 'style_convert', 'paraphrase', 'hook_generator', 'vocal_map', 'translate', 'drill_builder', 'epic_builder', 'validate_v5'];

export function AIToolbar({ 
  activeTool, 
  onSelectTool, 
  isLoading,
  className,
  compact = false,
}: AIToolbarProps) {
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to active tool
  useEffect(() => {
    if (activeTool && scrollRef.current) {
      const activeButton = scrollRef.current.querySelector(`[data-tool="${activeTool}"]`);
      activeButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTool]);

  const primaryTools = AI_TOOLS.filter(t => PRIMARY_TOOL_IDS.includes(t.id));
  const secondaryTools = AI_TOOLS.filter(t => SECONDARY_TOOL_IDS.includes(t.id));
  const toolsToShow = expanded ? AI_TOOLS : primaryTools;

  return (
    <div className={cn("w-full", className)}>
      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide"
      >
        <div className={cn(
          "flex gap-1 p-1.5 min-w-max items-center",
          compact && "gap-0.5 p-1"
        )}>
          <AnimatePresence mode="popLayout">
            {toolsToShow.map((tool) => (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={activeTool === tool.id}
                isLoading={isLoading && activeTool === tool.id}
                onClick={() => onSelectTool(tool.id)}
                disabled={isLoading}
                compact={compact}
              />
            ))}
          </AnimatePresence>
          
          {/* Expand/Collapse button */}
          {secondaryTools.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "shrink-0 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50",
                compact ? "h-auto py-1.5 px-2" : "h-auto py-1.5 px-2.5"
              )}
            >
              <div className="flex flex-col items-center gap-0.5">
                {expanded ? (
                  <ChevronUp className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
                ) : (
                  <ChevronDown className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
                )}
                <span className={cn(
                  "font-medium text-muted-foreground",
                  compact ? "text-[9px]" : "text-[10px]"
                )}>
                  {expanded ? '−' : `+${secondaryTools.length}`}
                </span>
              </div>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const ToolButton = memo(function ToolButton({ 
  tool, 
  isActive, 
  isLoading, 
  onClick, 
  disabled, 
  compact 
}: ToolButtonProps) {
  const Icon = tool.icon;
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      data-tool={tool.id}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-xl border transition-all touch-manipulation",
        compact 
          ? "px-2 py-1.5 min-w-[3rem]" 
          : "px-2.5 py-1.5 min-w-[3.5rem]",
        isActive 
          ? `${tool.bgColor} border-2` 
          : "bg-muted/30 border-border/50 hover:bg-muted/50 active:scale-95",
        disabled && !isLoading && "opacity-50 cursor-not-allowed"
      )}
      whileTap={{ scale: 0.95 }}
    >
      <div className={cn(
        "rounded-lg flex items-center justify-center",
        compact ? "w-5 h-5" : "w-6 h-6",
        isActive ? tool.bgColor : "bg-muted/50"
      )}>
        {isLoading ? (
          <Loader2 className={cn(
            "animate-spin",
            compact ? "w-3 h-3" : "w-3.5 h-3.5",
            tool.color
          )} />
        ) : (
          <Icon className={cn(
            "transition-colors",
            compact ? "w-3 h-3" : "w-3.5 h-3.5",
            isActive ? tool.color : "text-muted-foreground"
          )} />
        )}
      </div>
      <span className={cn(
        "font-medium leading-tight truncate max-w-full",
        compact ? "text-[9px]" : "text-[10px]",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}>
        {tool.name}
      </span>
    </motion.button>
  );
});

export default AIToolbar;
