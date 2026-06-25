/**
 * LyricsAutoScroll Component
 *
 * Handles automatic scrolling of lyrics to keep current line visible.
 * Extracted from StudioLyricsPanel for better maintainability.
 *
 * @feature Spec 001 - Phase 3: Component Maintainability
 * @priority P1 - Split StudioLyricsPanel (624 lines → subcomponents)
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import type { LyricLine } from "./LyricsRenderer";

export interface LyricsAutoScrollProps {
  lines: LyricLine[];
  currentTime: number;
  isPlaying: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
  className?: string;
}

export const LyricsAutoScroll = React.forwardRef<HTMLDivElement, LyricsAutoScrollProps>(
  ({ lines, currentTime, isPlaying, scrollContainerRef, children, className }, ref) => {
    const autoScrollRef = React.useRef<HTMLDivElement>(null);
    const lastScrollTimeRef = React.useRef<number>(0);

    // Find current line index
    const currentLineIndex = React.useMemo(() => {
      return lines.findIndex((line) => currentTime >= line.startTime && currentTime <= line.endTime);
    }, [lines, currentTime]);

    // Auto-scroll to current line
    React.useEffect(() => {
      if (!isPlaying || currentLineIndex === -1) return;

      const container = scrollContainerRef?.current || autoScrollRef.current;
      if (!container) return;

      // Debounce scroll updates
      const now = Date.now();
      if (now - lastScrollTimeRef.current < 500) return;

      lastScrollTimeRef.current = now;

      // Find the current line element
      const lineElements = container.querySelectorAll("[data-line-index]");
      const currentLineElement = lineElements[currentLineIndex] as HTMLElement;

      if (currentLineElement) {
        currentLineElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, [currentLineIndex, isPlaying, scrollContainerRef]);

    return (
      <div ref={ref} className={cn("overflow-auto", className)}>
        <div ref={autoScrollRef}>{children}</div>
      </div>
    );
  },
);

LyricsAutoScroll.displayName = "LyricsAutoScroll";
