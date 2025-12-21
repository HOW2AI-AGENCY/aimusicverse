/**
 * AIToolbar - Horizontal toolbar with AI tools
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
}

export function AIToolbar({ 
  activeTool, 
  onSelectTool, 
  isLoading,
  className 
}: AIToolbarProps) {
  return (
    <div className={cn("w-full overflow-x-auto scrollbar-hide", className)}>
      <div className="flex gap-1.5 p-2 min-w-max">
        {AI_TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            isLoading={isLoading && activeTool === tool.id}
            onClick={() => onSelectTool(tool.id)}
            disabled={isLoading}
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
}

function ToolButton({ tool, isActive, isLoading, onClick, disabled }: ToolButtonProps) {
  const Icon = tool.icon;
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all",
        "min-w-[4.5rem]",
        isActive 
          ? `${tool.bgColor} border-2` 
          : "bg-muted/30 border-border/50 hover:bg-muted/50",
        disabled && !isLoading && "opacity-50 cursor-not-allowed"
      )}
      whileTap={{ scale: 0.95 }}
      animate={isLoading ? { scale: [1, 1.02, 1] } : {}}
      transition={isLoading ? { repeat: Infinity, duration: 1 } : {}}
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center",
        isActive ? tool.bgColor : "bg-muted/50"
      )}>
        <Icon className={cn(
          "w-4 h-4 transition-colors",
          isActive ? tool.color : "text-muted-foreground"
        )} />
      </div>
      <span className={cn(
        "text-[10px] font-medium leading-tight",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}>
        {tool.name}
      </span>
    </motion.button>
  );
}
