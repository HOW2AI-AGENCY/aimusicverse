/**
 * SimplifiedTagsRow - Compact tags display for track cards
 * 
 * Shows max 2 tags + overflow indicator
 * Cleaner than ScrollableTagsRow for card use
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getDisplayTags, TagCategory } from '@/lib/styleTagParser';
import { tagColors } from '@/lib/design-colors';

interface SimplifiedTagsRowProps {
  style?: string | null;
  tags?: string | string[] | null;
  onClick?: (tag: string) => void;
  maxTags?: number;
  className?: string;
}

const CATEGORY_COLORS: Record<TagCategory, string> = {
  genre: `${tagColors.genre.bg} ${tagColors.genre.text}`,
  mood: `${tagColors.mood.bg} ${tagColors.mood.text}`,
  instrument: `${tagColors.instrument.bg} ${tagColors.instrument.text}`,
  vocal: `${tagColors.vocal.bg} ${tagColors.vocal.text}`,
  tempo: `${tagColors.tempo.bg} ${tagColors.tempo.text}`,
  structure: `${tagColors.structure.bg} ${tagColors.structure.text}`,
};

export const SimplifiedTagsRow = memo(function SimplifiedTagsRow({ 
  style, 
  tags, 
  onClick,
  maxTags = 2,
  className 
}: SimplifiedTagsRowProps) {
  const parsedTags = useMemo(() => getDisplayTags(style, tags, maxTags), [style, tags, maxTags]);
  
  if (parsedTags.visible.length === 0) {
    return (
      <span className={cn("text-[10px] text-muted-foreground/50 italic", className)}>
        —
      </span>
    );
  }
  
  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {parsedTags.visible.map((tag, index) => (
        <button
          key={`${tag.normalized}-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(tag.value);
          }}
          className={cn(
            "px-1.5 py-0.5 rounded text-[10px] font-medium transition-all duration-200",
            "cursor-pointer active:scale-95 hover:brightness-110",
            CATEGORY_COLORS[tag.category]
          )}
        >
          {tag.value}
        </button>
      ))}
      
      {parsedTags.hiddenCount > 0 && (
        <span className="text-[9px] text-muted-foreground/50">
          +{parsedTags.hiddenCount}
        </span>
      )}
    </div>
  );
});
