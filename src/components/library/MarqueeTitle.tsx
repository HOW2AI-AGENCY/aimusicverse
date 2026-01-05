/**
 * MarqueeTitle - Animated scrolling title for long text
 * 
 * Shows static text if it fits, or applies a subtle marquee animation
 * when the text overflows its container.
 */

import { memo, useRef, useState, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface MarqueeTitleProps {
  title: string;
  className?: string;
}

function MarqueeTitleComponent({ title, className }: MarqueeTitleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        const isOverflowing = textWidth > containerWidth;
        setShouldAnimate(isOverflowing);
        setOverflow(isOverflowing ? textWidth - containerWidth + 20 : 0); // +20 for padding
      }
    };

    checkOverflow();
    
    // Recheck on resize
    const observer = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [title]);

  return (
    <div 
      ref={containerRef}
      className={cn("overflow-hidden flex-1 min-w-0", className)}
    >
      <motion.span
        ref={textRef}
        className="font-medium text-sm leading-tight whitespace-nowrap inline-block"
        animate={shouldAnimate ? {
          x: [0, -overflow, 0],
        } : { x: 0 }}
        transition={shouldAnimate ? {
          duration: Math.max(3, overflow / 30), // Speed based on overflow
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 2,
        } : {}}
      >
        {title || 'Без названия'}
      </motion.span>
    </div>
  );
}

export const MarqueeTitle = memo(MarqueeTitleComponent);
