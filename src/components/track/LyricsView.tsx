import { useState, useEffect, useRef } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioTime } from '@/hooks/audio/useAudioTime';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from '@/lib/motion';
import { hapticImpact } from '@/lib/haptic';

interface LyricsViewProps {
  track: Track;
}

interface TimestampedWord {
  word: string;
  startS: number;
  endS: number;
}

interface TimestampedLyrics {
  alignedWords: TimestampedWord[];
}

const PREVIEW_LINES = 4; // Количество строк в preview на мобильных
const LONG_LYRICS_THRESHOLD = 150; // Символов, после которых считаем lyrics длинными

export function LyricsView({ track }: LyricsViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const { currentTime, isPlaying } = useAudioTime();
  const isMobile = useIsMobile();

  // Try to parse timestamped lyrics (only if it looks like JSON)
  const timestampedLyrics = (() => {
    try {
      if (track.lyrics && track.lyrics.trim().startsWith('{')) {
        const parsed = JSON.parse(track.lyrics);
        if (parsed.alignedWords && Array.isArray(parsed.alignedWords)) {
          return parsed as TimestampedLyrics;
        }
      }
    } catch {
      // Not timestamped lyrics
    }
    return null;
  })();

  const plainLyrics = timestampedLyrics
    ? timestampedLyrics.alignedWords.map(w => w.word).join(' ')
    : track.lyrics || '';

  // 📱 Progressive Disclosure: определяем, нужен ли collapse
  const isLongLyrics = plainLyrics.length > LONG_LYRICS_THRESHOLD;
  const shouldCollapse = isMobile && isLongLyrics;

  // Создаём preview: первые N строк
  const lyricsLines = plainLyrics.split('\n');
  const previewLyrics = shouldCollapse && !isExpanded
    ? lyricsLines.slice(0, PREVIEW_LINES).join('\n')
    : plainLyrics;

  const hiddenLinesCount = lyricsLines.length - PREVIEW_LINES;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainLyrics);
      setCopied(true);
      toast.success('Текст скопирован');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const handleToggleExpand = () => {
    hapticImpact('light');
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (!timestampedLyrics || !isPlaying) return;
    const words = timestampedLyrics.alignedWords;
    const idx = words.findIndex(w => currentTime >= w.startS && currentTime <= w.endS);
    if (idx !== -1 && idx !== activeWordIndex) setActiveWordIndex(idx);
  }, [currentTime, timestampedLyrics, isPlaying, activeWordIndex]);

  useEffect(() => {
    if (timestampedLyrics && isPlaying && activeWordIndex !== null && lyricsRef.current) {
      const el = lyricsRef.current.querySelector(`[data-word-index="${activeWordIndex}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeWordIndex, timestampedLyrics, isPlaying]);

  if (!track.lyrics) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Текст песни недоступен</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Текст песни</h3>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 touch-manipulation">
          {copied ? <><Check className="w-4 h-4" />Скопировано</> : <><Copy className="w-4 h-4" />Копировать</>}
        </Button>
      </div>
      <Card className="p-0 overflow-hidden">
        {/* 🖥️ Desktop: фиксированная высота со скроллом */}
        {!shouldCollapse ? (
          <ScrollArea className="h-[400px]">
            <div ref={lyricsRef} className="p-6">
              {timestampedLyrics ? (
                <div className="leading-relaxed">
                  {timestampedLyrics.alignedWords.map((word, i) => (
                    <span key={i} data-word-index={i} className={cn('inline px-0.5 rounded transition-all', activeWordIndex === i ? 'bg-primary text-primary-foreground font-medium' : '')}>
                      {word.word}{' '}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{plainLyrics}</p>
              )}
            </div>
          </ScrollArea>
        ) : (
          /* 📱 Mobile: progressive disclosure с анимацией */
          <div className="relative">
            <motion.div
              ref={lyricsRef}
              className="p-6"
              initial={false}
              animate={{
                maxHeight: isExpanded ? '800px' : '180px',
                overflow: 'hidden'
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {timestampedLyrics ? (
                <div className="leading-relaxed">
                  {timestampedLyrics.alignedWords.map((word, i) => (
                    <span key={i} data-word-index={i} className={cn('inline px-0.5 rounded transition-all', activeWordIndex === i ? 'bg-primary text-primary-foreground font-medium' : '')}>
                      {word.word}{' '}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{previewLyrics}</p>
              )}
            </motion.div>

            {/* Градиент fade для preview */}
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
            )}

            {/* Кнопка Показать полностью / Свернуть */}
            <div className="p-4 pt-0 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleExpand}
                className="gap-2 touch-manipulation text-primary hover:text-primary/80"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Свернуть
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Показать полностью {hiddenLinesCount > 0 && `(+${hiddenLinesCount} строк)`}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
