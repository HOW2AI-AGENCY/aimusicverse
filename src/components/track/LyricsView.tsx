import { useState, useEffect, useRef } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioTime } from '@/hooks/audio';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export function LyricsView({ track }: LyricsViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const { currentTime, isPlaying } = useAudioTime();

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
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
          {copied ? <><Check className="w-4 h-4" />Скопировано</> : <><Copy className="w-4 h-4" />Копировать</>}
        </Button>
      </div>
      <Card className="p-0">
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
      </Card>
    </div>
  );
}
