/**
 * HorizontalScrollFade - Container with gradient fade for horizontal scroll
 * Shows scroll indicators when content overflows
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollFadeProps {
  children: React.ReactNode;
  className?: string;
  showArrows?: boolean;
  fadeWidth?: number;
}

export function HorizontalScrollFade({
  children,
  className,
  showArrows = false,
  fadeWidth = 24,
}: HorizontalScrollFadeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  const scrollBy = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className={cn('relative group', className)}>
      {/* Left fade gradient */}
      {canScrollLeft && (
        <div 
          className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent"
          style={{ width: fadeWidth }}
        />
      )}

      {/* Right fade gradient */}
      {canScrollRight && (
        <div 
          className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent"
          style={{ width: fadeWidth }}
        />
      )}

      {/* Navigation arrows (optional) */}
      {showArrows && canScrollLeft && (
        <button
          onClick={() => scrollBy('left')}
          className={cn(
            'absolute left-1 top-1/2 -translate-y-1/2 z-20',
            'w-8 h-8 rounded-full bg-background/90 border shadow-sm',
            'flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-muted'
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {showArrows && canScrollRight && (
        <button
          onClick={() => scrollBy('right')}
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 z-20',
            'w-8 h-8 rounded-full bg-background/90 border shadow-sm',
            'flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-muted'
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-none"
      >
        {children}
      </div>
    </div>
  );
}
