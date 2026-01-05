import { memo, useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getDisplayTags, TagCategory } from '@/lib/styleTagParser';

/**
 * ScrollableTagsRow - Horizontal scrollable tags with animation hint
 * 
 * Features:
 * - Horizontal scroll for overflow content
 * - Subtle "sway" animation to hint at more content
 * - Fade gradient indicator on right edge
 * - Click-to-filter support
 */

interface ScrollableTagsRowProps {
  style?: string | null;
  tags?: string | string[] | null;
  onClick?: (tag: string) => void;
  className?: string;
}

const CATEGORY_COLORS: Record<TagCategory, string> = {
  genre: 'bg-primary/15 text-primary hover:bg-primary/25',
  mood: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 hover:bg-orange-500/25',
  instrument: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25',
  vocal: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 hover:bg-pink-500/25',
  tempo: 'bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25',
  structure: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/25',
};

export const ScrollableTagsRow = memo(function ScrollableTagsRow({ 
  style, 
  tags, 
  onClick,
  className 
}: ScrollableTagsRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  
  const parsedTags = useMemo(() => getDisplayTags(style, tags, 10), [style, tags]);
  
  // Check if content overflows container
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && contentRef.current) {
        setIsOverflowing(contentRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [parsedTags]);
  
  if (parsedTags.visible.length === 0) {
    return (
      <span className={cn("text-[10px] text-muted-foreground/50 italic px-1", className)}>
        Без стиля
      </span>
    );
  }
  
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Scrollable container */}
      <div 
        ref={containerRef}
        className="overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <motion.div 
          ref={contentRef}
          className="flex items-center gap-1 w-max py-0.5"
          animate={isOverflowing ? {
            x: [0, -20, 0],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 3
          }}
        >
          {parsedTags.visible.map((tag, index) => (
            <button
              key={`${tag.normalized}-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(tag.value);
              }}
              className={cn(
                "flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
                "cursor-pointer active:scale-95",
                CATEGORY_COLORS[tag.category]
              )}
            >
              {tag.value}
            </button>
          ))}
          
          {parsedTags.hiddenCount > 0 && (
            <span className="flex-shrink-0 text-[9px] text-muted-foreground/50 px-1">
              +{parsedTags.hiddenCount}
            </span>
          )}
        </motion.div>
      </div>
      
      {/* Fade indicator for more content */}
      {isOverflowing && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-card to-transparent pointer-events-none" 
          aria-hidden="true"
        />
      )}
    </div>
  );
});
