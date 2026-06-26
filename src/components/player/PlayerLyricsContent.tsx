/**
 * PlayerLyricsContent - Renders synchronized, plain, or empty lyrics.
 */

import { RefObject } from "react";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";
import { hapticImpact } from "@/lib/haptic";
import { SynchronizedWord } from "@/components/lyrics/SynchronizedWord";

interface AlignedWord {
  word: string;
  startS: number;
  endS: number;
}

interface PlayerLyricsContentProps {
  lyricsLines: AlignedWord[][] | null;
  plainLyrics: string | null;
  activeLineIndex: number;
  syncedTime: number;
  constants: { WORD_LOOK_AHEAD_MS: number; WORD_END_TOLERANCE_MS: number };
  activeLineRef: RefObject<HTMLDivElement | null>;
  onSeek: (time: number) => void;
}

export function PlayerLyricsContent({
  lyricsLines,
  plainLyrics,
  activeLineIndex,
  syncedTime,
  constants,
  activeLineRef,
  onSeek,
}: PlayerLyricsContentProps) {
  const handleWordClick = (startTime: number) => {
    hapticImpact("light");
    onSeek(startTime);
  };

  if (lyricsLines) {
    let globalWordIndex = 0;
    return (
      <div className="flex flex-col items-center text-center space-y-1 pb-[30vh] lyrics-container-enter">
        {lyricsLines.map((line, lineIndex) => {
          const isActiveLine = lineIndex === activeLineIndex;
          const isPastLine = activeLineIndex > -1 && lineIndex < activeLineIndex;
          const lineStart = line[0]?.startS ?? 0;

          return (
            <motion.div
              key={lineIndex}
              ref={isActiveLine ? activeLineRef : null}
              onClick={() => handleWordClick(lineStart)}
              animate={{
                scale: isActiveLine ? 1.02 : 1,
                opacity: isActiveLine ? 1 : isPastLine ? 0.35 : 0.5,
              }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "px-3 py-1 rounded-lg cursor-pointer w-full lyric-line",
                "will-change-[transform,opacity,background-color] transform-gpu",
                isActiveLine && "bg-primary/10 lyric-line--active",
              )}
            >
              <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-0.5">
                {line.map((word, wordIndex) => {
                  const currentGlobalIndex = globalWordIndex++;
                  const adjustedTime = syncedTime + constants.WORD_LOOK_AHEAD_MS / 1000;
                  const endTolerance = constants.WORD_END_TOLERANCE_MS / 1000;
                  const isActiveWord =
                    isActiveLine && adjustedTime >= word.startS && adjustedTime <= word.endS + endTolerance;
                  const isPastWord = syncedTime > word.endS + endTolerance;

                  return (
                    <SynchronizedWord
                      key={`${lineIndex}-${wordIndex}-${word.startS}`}
                      word={word.word}
                      isActive={isActiveWord}
                      isPast={isPastWord}
                      data-word-index={currentGlobalIndex}
                      className="text-lg font-medium"
                      activeClassName="text-primary scale-110 font-bold"
                      pastClassName="text-foreground/70"
                      futureClassName="text-foreground/50"
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  if (plainLyrics) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-center text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">{plainLyrics}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center">
      <p className="text-muted-foreground text-center">Текст песни недоступен</p>
    </div>
  );
}
