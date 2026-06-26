/**
 * PlayerControls - Lyrics display section with gesture handling.
 * Handles horizontal swipe for track switching, double-tap seek,
 * auto-scroll, and delegates lyrics rendering to PlayerLyricsContent.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, PanInfo } from "@/lib/motion";
import { hapticImpact } from "@/lib/haptic";
import { DoubleTapSeekFeedback } from "./DoubleTapSeekFeedback";
import { PlayerLyricsContent } from "./PlayerLyricsContent";

const HORIZONTAL_SWIPE_THRESHOLD = 80;
const HORIZONTAL_VELOCITY_THRESHOLD = 400;
const DOUBLE_TAP_DELAY = 300;
const SEEK_AMOUNT = 10;

interface AlignedWord {
  word: string;
  startS: number;
  endS: number;
}

interface LyricsSyncState {
  activeLineIndex: number;
  activeWordIndex: number;
  syncedTime: number;
  constants: { WORD_LOOK_AHEAD_MS: number; WORD_END_TOLERANCE_MS: number };
}

interface PlayerControlsProps {
  lyricsLines: AlignedWord[][] | null;
  plainLyrics: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  syncState: LyricsSyncState;
  onSeek: (time: number) => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
}

export function PlayerControls({
  lyricsLines,
  plainLyrics,
  isPlaying,
  currentTime,
  duration,
  syncState,
  onSeek,
  onNextTrack,
  onPreviousTrack,
}: PlayerControlsProps) {
  const [userScrolling, setUserScrolling] = useState(false);
  const [horizontalDragOffset, setHorizontalDragOffset] = useState(0);
  const [doubleTapSide, setDoubleTapSide] = useState<"left" | "right" | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const isProgrammaticScrollRef = useRef(false);

  const { activeLineIndex, activeWordIndex, syncedTime, constants } = syncState;

  // Handle user scroll detection
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      const scrollDelta = Math.abs(container.scrollTop - lastScrollTopRef.current);
      if (scrollDelta > 5) {
        setUserScrolling(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => setUserScrolling(false), 5000);
      }
      lastScrollTopRef.current = container.scrollTop;
    };
    const handleTouchStart = () => {
      setUserScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
    const handleTouchEnd = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setUserScrolling(false), 5000);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Auto-scroll to active word/line
  useEffect(() => {
    if (activeLineIndex < 0 || !lyricsContainerRef.current || userScrolling || !isPlaying) return;
    const container = lyricsContainerRef.current;
    const activeWord = container.querySelector(`[data-word-index="${activeWordIndex}"]`) as HTMLElement;
    const targetElement = activeWord || activeLineRef.current;
    if (!targetElement) return;
    requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const elementRect = targetElement.getBoundingClientRect();
      const elementTopInContainer = elementRect.top - containerRect.top + container.scrollTop;
      const targetScrollTop = elementTopInContainer - containerRect.height * 0.3;
      const currentElementPos = elementRect.top - containerRect.top;
      const isInView = currentElementPos > containerRect.height * 0.2 && currentElementPos < containerRect.height * 0.5;
      if (!isInView) {
        isProgrammaticScrollRef.current = true;
        container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
        setTimeout(() => { isProgrammaticScrollRef.current = false; }, 400);
      }
    });
  }, [activeLineIndex, activeWordIndex, userScrolling, isPlaying]);

  const handleHorizontalDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setHorizontalDragOffset(0);
      if (info.offset.x < -HORIZONTAL_SWIPE_THRESHOLD || info.velocity.x < -HORIZONTAL_VELOCITY_THRESHOLD) {
        hapticImpact("medium"); onNextTrack(); return;
      }
      if (info.offset.x > HORIZONTAL_SWIPE_THRESHOLD || info.velocity.x > HORIZONTAL_VELOCITY_THRESHOLD) {
        hapticImpact("medium"); onPreviousTrack(); return;
      }
    },
    [onNextTrack, onPreviousTrack],
  );

  const handleHorizontalDrag = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setHorizontalDragOffset(info.offset.x);
  }, []);

  const handleDoubleTapSeek = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const now = Date.now();
      const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
      if (clientX === undefined) return;
      const isLeftSide = clientX < window.innerWidth / 2;
      if (now - lastTapRef.current.time < DOUBLE_TAP_DELAY) {
        e.preventDefault(); e.stopPropagation();
        const newTime = Math.max(0, Math.min(currentTime + (isLeftSide ? -SEEK_AMOUNT : SEEK_AMOUNT), duration));
        onSeek(newTime);
        hapticImpact("medium");
        setDoubleTapSide(isLeftSide ? "left" : "right");
        setTimeout(() => setDoubleTapSide(null), 500);
        lastTapRef.current = { time: 0, x: 0 };
      } else {
        lastTapRef.current = { time: now, x: clientX };
      }
    },
    [currentTime, duration, onSeek],
  );

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.2, right: 0.2 }}
      onDrag={handleHorizontalDrag}
      onDragEnd={handleHorizontalDragEnd}
      onTouchStart={handleDoubleTapSeek}
      className="flex-1 relative min-h-0 flex flex-col touch-pan-y"
    >
      <AnimatePresence>
        {doubleTapSide && <DoubleTapSeekFeedback side={doubleTapSide} seekAmount={SEEK_AMOUNT} />}
      </AnimatePresence>
      <AnimatePresence>
        {Math.abs(horizontalDragOffset) > 20 && (
          <>
            {horizontalDragOffset > 20 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: Math.min(horizontalDragOffset / HORIZONTAL_SWIPE_THRESHOLD, 1) * 0.6 }}
                exit={{ opacity: 0 }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
              >
                <ChevronLeft className="w-8 h-8 text-muted-foreground" />
              </motion.div>
            )}
            {horizontalDragOffset < -20 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: Math.min(Math.abs(horizontalDragOffset) / HORIZONTAL_SWIPE_THRESHOLD, 1) * 0.6 }}
                exit={{ opacity: 0 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
              >
                <ChevronRight className="w-8 h-8 text-muted-foreground" />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {userScrolling && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 right-2 z-10 flex items-center gap-2"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUserScrolling(false)}
              className="h-7 px-2 text-xs bg-muted/90 backdrop-blur-sm"
            >
              Вкл. автоскролл
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ overscrollBehavior: "contain", touchAction: "pan-y" }}
      >
        <PlayerLyricsContent
          lyricsLines={lyricsLines}
          plainLyrics={plainLyrics}
          activeLineIndex={activeLineIndex}
          syncedTime={syncedTime}
          constants={constants}
          activeLineRef={activeLineRef}
          onSeek={onSeek}
        />
      </div>
    </motion.div>
  );
}
