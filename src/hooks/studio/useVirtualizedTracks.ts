/**
 * useVirtualizedTracks - Virtualization hook for track lists
 * 
 * Provides efficient rendering for large track lists using:
 * - Windowing (only render visible items)
 * - Intersection Observer for visibility detection
 * - Stable item heights for smooth scrolling
 */

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';

interface VirtualizedItem<T> {
  item: T;
  index: number;
  isVisible: boolean;
  style: React.CSSProperties;
}

interface UseVirtualizedTracksOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  containerHeight?: number;
  getItemKey: (item: T, index: number) => string;
}

interface UseVirtualizedTracksReturn<T> {
  virtualItems: VirtualizedItem<T>[];
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollTo: (index: number) => void;
  scrollToTop: () => void;
  visibleRange: { start: number; end: number };
}

export function useVirtualizedTracks<T>({
  items,
  itemHeight,
  overscan = 3,
  containerHeight,
  getItemKey,
}: UseVirtualizedTracksOptions<T>): UseVirtualizedTracksReturn<T> {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(containerHeight || 400);

  // Update viewport height on container resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setViewportHeight(entry.contentRect.height);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);
    
    return { start, end };
  }, [scrollTop, itemHeight, viewportHeight, items.length, overscan]);

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const result: VirtualizedItem<T>[] = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const item = items[i];
      if (!item) continue;
      
      result.push({
        item,
        index: i,
        isVisible: true,
        style: {
          position: 'absolute',
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      });
    }
    
    return result;
  }, [items, visibleRange, itemHeight]);

  // Total height for scrollbar
  const totalHeight = items.length * itemHeight;

  // Scroll to specific index
  const scrollTo = useCallback((index: number) => {
    if (!containerRef.current) return;
    
    const targetTop = index * itemHeight;
    containerRef.current.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });
  }, [itemHeight]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollTo,
    scrollToTop,
    visibleRange,
  };
}

// Simplified hook for basic lists
export function useSimpleVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerRef: React.RefObject<HTMLElement>
) {
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibility = () => {
      const { scrollTop, clientHeight } = container;
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.ceil((scrollTop + clientHeight) / itemHeight);
      
      const newIndices = new Set<number>();
      for (let i = Math.max(0, startIndex - 2); i <= Math.min(items.length - 1, endIndex + 2); i++) {
        newIndices.add(i);
      }
      
      setVisibleIndices(newIndices);
    };

    updateVisibility();
    container.addEventListener('scroll', updateVisibility, { passive: true });
    return () => container.removeEventListener('scroll', updateVisibility);
  }, [items.length, itemHeight, containerRef]);

  return {
    isVisible: (index: number) => visibleIndices.has(index),
    visibleCount: visibleIndices.size,
  };
}
