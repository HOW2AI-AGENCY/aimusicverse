import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getDisplayTags, TagCategory } from '@/lib/styleTagParser';

interface TrackStyleTagsProps {
  style?: string | null;
  tags?: string | string[] | null;
  maxTags?: number;
  onClick?: (tag: string) => void;
  compact?: boolean;
  className?: string;
}

// Color schemes for different categories
const CATEGORY_STYLES: Record<TagCategory, { bg: string; text: string; hover: string }> = {
  genre: { 
    bg: 'bg-primary/10', 
    text: 'text-primary', 
    hover: 'hover:bg-primary/20' 
  },
  mood: { 
    bg: 'bg-violet-500/10', 
    text: 'text-violet-500', 
    hover: 'hover:bg-violet-500/20' 
  },
  vocal: { 
    bg: 'bg-rose-500/10', 
    text: 'text-rose-500', 
    hover: 'hover:bg-rose-500/20' 
  },
  tempo: { 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-500', 
    hover: 'hover:bg-amber-500/20' 
  },
  instrument: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-500', 
    hover: 'hover:bg-emerald-500/20' 
  },
  structure: { 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-500', 
    hover: 'hover:bg-blue-500/20' 
  }
};

/**
 * TrackStyleTags - Displays clickable style tags for a track
 * 
 * Features:
 * - Advanced tag parsing (handles , / . ; | separators)
 * - Category-based color coding
 * - Click to filter by tag
 * - Compact mode for tight spaces
 */
export const TrackStyleTags = memo(function TrackStyleTags({
  style,
  tags,
  maxTags = 3,
  onClick,
  compact = false,
  className
}: TrackStyleTagsProps) {
  const { visible, hiddenCount } = useMemo(
    () => getDisplayTags(style, tags, maxTags),
    [style, tags, maxTags]
  );

  if (visible.length === 0) {
    return (
      <span className={cn(
        "text-muted-foreground/50 italic",
        compact ? "text-[10px]" : "text-xs"
      )}>
        Без стиля
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {visible.map((tag) => {
        const categoryStyle = CATEGORY_STYLES[tag.category];
        
        return (
          <button
            key={tag.normalized}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClick?.(tag.value);
            }}
            className={cn(
              "rounded-full transition-colors truncate",
              categoryStyle.bg,
              categoryStyle.text,
              onClick && categoryStyle.hover,
              onClick && "cursor-pointer",
              !onClick && "cursor-default",
              compact 
                ? "text-[9px] px-1.5 py-0.5 max-w-[60px]" 
                : "text-[10px] px-2 py-0.5 max-w-[80px]"
            )}
            title={tag.value}
          >
            {tag.value}
          </button>
        );
      })}
      
      {hiddenCount > 0 && (
        <span className={cn(
          "text-muted-foreground/50",
          compact ? "text-[9px]" : "text-[10px]"
        )}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
});
