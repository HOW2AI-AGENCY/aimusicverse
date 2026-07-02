/**
 * LyricsPage — synchronized lyrics with karaoke-style word highlighting.
 *
 * - Tap any line to seek to its timestamp
 * - Auto-scrolls active line into the top 35% of the viewport
 * - Falls back to plain text or an empty state when timestamps are unavailable
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic2 } from "@/lib/icons";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { hapticImpact } from "@/lib/haptic";
import { useTimestampedLyrics } from "@/hooks/useTimestampedLyrics";
import { useParsedLyrics } from "@/hooks/lyrics/useParsedLyrics";
import { useLyricsSynchronization } from "@/hooks/lyrics/useLyricsSynchronization";
import { useAudioTime } from "@/hooks/audio/useAudioTime";
import { SynchronizedWord } from "@/components/lyrics/SynchronizedWord";
import type { Track } from "@/types/track";

interface LyricsPageProps {
  track: Track;
  currentVersion?: {
    suno_task_id?: string | null;
    suno_id?: string | null;
    lyrics?: string | null;
  } | null;
  isActive: boolean;
  isPlaying: boolean;
  onOpenKaraoke?: () => void;
}

export function LyricsPage({ track, currentVersion, isActive, isPlaying, onOpenKaraoke }: LyricsPageProps) {
  const { seek } = useAudioTime();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const userScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [userScrolling, setUserScrolling] = useState(false);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLineTap = useCallback(
    (lineIndex: number, lineStart: number) => {
      hapticImpact("light");
      seek(lineStart);
      setFlashIndex(lineIndex);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashIndex(null), 260);
    },
    [seek],
  );

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    [],
  );

  const sunoTaskId = currentVersion?.suno_task_id ?? track.suno_task_id ?? null;
  const sunoId = currentVersion?.suno_id ?? track.suno_id ?? null;
  const trackLyrics = currentVersion?.lyrics ?? track.lyrics ?? null;

  const { data: lyricsData, isLoading } = useTimestampedLyrics(sunoTaskId, sunoId);
  const { lyricsLines, plainLyrics } = useParsedLyrics(lyricsData?.alignedWords, trackLyrics);

  const flat = lyricsLines ? lyricsLines.flat() : [];
  const {
    activeLineIndex,
    activeWordIndex,
    currentTime: syncedTime,
    constants,
  } = useLyricsSynchronization({
    words: flat,
    enabled: !!lyricsLines?.length,
  });

  // Auto-scroll the active line into the upper third of the visible area
  useEffect(() => {
    if (!isActive || !isPlaying || userScrolling) return;
    if (activeLineIndex < 0) return;
    const container = scrollRef.current;
    const target = activeLineRef.current;
    if (!container || !target) return;

    const cRect = container.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const elementTop = tRect.top - cRect.top + container.scrollTop;
    const desired = elementTop - cRect.height * 0.35;
    container.scrollTo({ top: Math.max(0, desired), behavior: "smooth" });
  }, [activeLineIndex, isActive, isPlaying, userScrolling]);

  // Mark user scrolling on touch/wheel for 4s
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const flag = () => {
      setUserScrolling(true);
      if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current);
      userScrollTimerRef.current = setTimeout(() => setUserScrolling(false), 4000);
    };
    el.addEventListener("touchstart", flag, { passive: true });
    el.addEventListener("wheel", flag, { passive: true });
    return () => {
      el.removeEventListener("touchstart", flag);
      el.removeEventListener("wheel", flag);
      if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current);
    };
  }, []);

  // Loading state — shimmer lines of consistent height
  if (isLoading && !lyricsLines && !plainLyrics) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-6 w-[min(70vw,18rem)] animate-pulse rounded-md bg-muted/30"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (!lyricsLines && !plainLyrics) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/40">
          <Mic2 className="h-6 w-6 text-muted-foreground/60" aria-hidden />
        </div>
        <p className="text-sm text-muted-foreground">Лирика недоступна для этого трека</p>
      </div>
    );
  }

  // Plain (non-synchronized) fallback
  if (!lyricsLines && plainLyrics) {
    return (
      <div
        ref={scrollRef}
        className="lyrics-fade-mask h-full overflow-y-auto px-4 py-6"
        style={{ overscrollBehavior: "contain" }}
      >
        <p className="mx-auto max-w-[28rem] xl:max-w-[36rem] whitespace-pre-wrap text-center text-base xl:text-lg font-medium leading-[1.65] text-foreground/85 pb-24">
          {plainLyrics}
        </p>
      </div>
    );
  }

  // Synchronized lyrics
  let globalWordIndex = 0;
  return (
    <div
      ref={scrollRef}
      className="lyrics-fade-mask relative h-full overflow-y-auto px-4 py-6"
      style={{ overscrollBehavior: "contain", touchAction: "pan-y" }}
    >
      {onOpenKaraoke && (
        <button
          type="button"
          onClick={() => {
            hapticImpact("light");
            onOpenKaraoke();
          }}
          className="absolute right-3 top-3 z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-card/60 px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-md ring-1 ring-border/40 hover:text-foreground"
        >
          Караоке
        </button>
      )}

      <div className="mx-auto flex max-w-[28rem] xl:max-w-[36rem] flex-col items-stretch gap-2 pb-24 text-center">
        {lyricsLines!.map((line, lineIndex) => {
          const isActiveLine = lineIndex === activeLineIndex;
          const isPastLine = activeLineIndex > -1 && lineIndex < activeLineIndex;
          const lineStart = line[0]?.startS ?? 0;

          return (
            <motion.div
              key={lineIndex}
              ref={isActiveLine ? activeLineRef : null}
              onClick={() => handleLineTap(lineIndex, lineStart)}
              animate={{ scale: isActiveLine ? 1.02 : 1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "cursor-pointer rounded-xl px-3 py-3 min-h-[44px] transition-colors",
                "will-change-transform transform-gpu",
                isActiveLine ? "text-foreground" : isPastLine ? "text-foreground/35" : "text-foreground/65",
                flashIndex === lineIndex &&
                  "bg-primary/10 ring-1 ring-primary/30 transition-[background-color,box-shadow] duration-200",
              )}
            >
              <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-1">
                {line.map((word, wordIndex) => {
                  const idx = globalWordIndex++;
                  const adjusted = syncedTime + constants.WORD_LOOK_AHEAD_MS / 1000;
                  const tol = constants.WORD_END_TOLERANCE_MS / 1000;
                  const isActiveWord = isActiveLine && adjusted >= word.startS && adjusted <= word.endS + tol;
                  const isPastWord = syncedTime > word.endS + tol;
                  return (
                    <SynchronizedWord
                      key={`${lineIndex}-${wordIndex}-${word.startS}`}
                      word={word.word}
                      isActive={isActiveWord}
                      isPast={isPastWord}
                      data-word-index={idx}
                      className="text-[19px] font-medium leading-[1.5]"
                      activeClassName="text-primary font-semibold"
                      pastClassName="text-foreground/35"
                      futureClassName=""
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
