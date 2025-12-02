import { useState, useEffect, useRef } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimestampedLyrics } from '@/lib/types/player';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from 'sonner';

interface LyricsViewProps {
  track: Track;
}

export function LyricsView({ track }: LyricsViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const { currentTime, isPlaying } = usePlayerStore();

  // Try to parse timestamped lyrics
  const timestampedLyrics = (() => {
    try {
      if (track.lyrics) {
        const parsed = JSON.parse(track.lyrics);
        if (parsed.alignedWords) return parsed as TimestampedLyrics;
      }
    } catch {
      // Not timestamped lyrics
    }
    return null;
  })();

  const handleCopy = async () => {
    const text = timestampedLyrics
      ? timestampedLyrics.alignedWords.map(w => w.word).join(' ')
      : track.lyrics || '';

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Lyrics copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy lyrics');
    }
  };

  // Auto-scroll to active line
  useEffect(() => {
    if (timestampedLyrics && isPlaying && activeLineIndex !== null && lyricsRef.current) {
      const activeLine = lyricsRef.current.querySelector(`[data-line-index="${activeLineIndex}"]`);
      if (activeLine) {
        activeLine.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeLineIndex, timestampedLyrics, isPlaying]);

  // Update active line based on current time
  useEffect(() => {
    if (!timestampedLyrics || !isPlaying) return;

    const words = timestampedLyrics.alignedWords;
    const activeIndex = words.findIndex(
      (word) => currentTime >= word.startS && currentTime <= word.endS
    );

    if (activeIndex !== -1) {
      setActiveLineIndex(activeIndex);
    }
  }, [currentTime, timestampedLyrics, isPlaying]);

  if (!track.lyrics) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No lyrics available for this track.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Lyrics</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
      </div>

      <Card className="p-6">
        <div ref={lyricsRef} className="space-y-2">
          {timestampedLyrics ? (
            // Timestamped lyrics with sync
            <div className="space-y-1">
              {timestampedLyrics.alignedWords.map((word, index) => (
                <span
                  key={index}
                  data-line-index={index}
                  className={cn(
                    'inline-block px-1 py-0.5 rounded transition-all duration-200',
                    activeLineIndex === index
                      ? 'bg-primary text-primary-foreground font-medium scale-105'
                      : 'text-muted-foreground'
                  )}
                >
                  {word.word}{' '}
                </span>
              ))}
            </div>
          ) : (
            // Normal lyrics (plain text)
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {track.lyrics}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
