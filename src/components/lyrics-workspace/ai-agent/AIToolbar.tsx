/**
 * AIToolbar - Compact horizontal toolbar with AI tools
 * Optimized for mobile with smaller buttons
 */

import { motion } from '@/lib/motion';
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

export function AIToolbar({ 
  activeTool, 
  onSelectTool, 
  isLoading,
  className,
  compact = false,
}: AIToolbarProps) {
  return (
    <div className={cn("w-full overflow-x-auto scrollbar-hide", className)}>
      <div className={cn(
        "flex gap-1 p-1.5 min-w-max",
        compact && "gap-0.5 p-1"
      )}>
        {AI_TOOLS.map((tool) => (
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
      </div>
    </div>
  );
}

interface ToolButtonProps {
  tool: AITool;
  isActive: boolean;
  isLoading?: boolean;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}

function ToolButton({ tool, isActive, isLoading, onClick, disabled, compact }: ToolButtonProps) {
  const Icon = tool.icon;
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
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
      animate={isLoading ? { scale: [1, 1.02, 1] } : {}}
      transition={isLoading ? { repeat: Infinity, duration: 1 } : {}}
    >
      <div className={cn(
        "rounded-lg flex items-center justify-center",
        compact ? "w-5 h-5" : "w-6 h-6",
        isActive ? tool.bgColor : "bg-muted/50"
      )}>
        <Icon className={cn(
          "transition-colors",
          compact ? "w-3 h-3" : "w-3.5 h-3.5",
          isActive ? tool.color : "text-muted-foreground"
        )} />
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
}
