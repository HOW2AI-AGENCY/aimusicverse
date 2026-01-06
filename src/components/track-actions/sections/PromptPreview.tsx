/**
 * PromptPreview - Compact preview of track generation prompt
 * Shows truncated prompt with expand and copy functionality
 */

import { useState, memo } from 'react';
import { FileText, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';

interface PromptPreviewProps {
  prompt: string | null | undefined;
  style?: string | null;
  maxLines?: number;
  className?: string;
}

export const PromptPreview = memo(function PromptPreview({
  prompt,
  style,
  maxLines = 2,
  className,
}: PromptPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use prompt or fallback to style
  const displayText = prompt || style;
  
  if (!displayText) return null;

  const lines = displayText.split('\n');
  const isLong = lines.length > maxLines || displayText.length > 150;
  const truncatedText = isLong && !expanded 
    ? lines.slice(0, maxLines).join('\n').slice(0, 150) + '...'
    : displayText;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      toast.success('Промпт скопирован');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    setExpanded(!expanded);
  };

  return (
    <div className={cn(
      "rounded-lg bg-muted/30 border border-border/50 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {prompt ? 'Промпт' : 'Стиль'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div 
        className="px-3 py-2 cursor-pointer"
        onClick={isLong ? toggleExpand : undefined}
      >
        <p className={cn(
          "text-xs text-foreground/80 whitespace-pre-wrap break-words",
          !expanded && isLong && "line-clamp-2"
        )}>
          {truncatedText}
        </p>
        
        {isLong && (
          <button
            onClick={toggleExpand}
            className="flex items-center gap-1 mt-1.5 text-[10px] text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Свернуть
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Развернуть
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
});
