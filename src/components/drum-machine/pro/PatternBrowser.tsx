import React, { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Music, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { DrumPattern } from '@/lib/drum-kits';

interface PatternBrowserProps {
  patterns: DrumPattern[];
  onLoadPattern: (pattern: DrumPattern) => void;
  onClearPattern: () => void;
  className?: string;
}

// Genre color mapping
const genreColors: Record<string, string> = {
  'House': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Hip-Hop': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Trap': 'bg-red-500/20 text-red-400 border-red-500/30',
  'DnB': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Latin': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Afro': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Disco': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Funk': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'R&B': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Techno': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'Breakbeat': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

interface PatternCardProps {
  pattern: DrumPattern;
  onLoad: () => void;
}

const PatternCard = memo(function PatternCard({ pattern, onLoad }: PatternCardProps) {
  const genreColor = genreColors[pattern.genre] || 'bg-muted text-muted-foreground border-border';
  
  // Calculate how many active steps for visual density indicator
  const totalSteps = Object.values(pattern.steps).reduce(
    (acc, steps) => acc + steps.filter(Boolean).length, 
    0
  );
  const density = Math.min(100, (totalSteps / 48) * 100);

  return (
    <button
      onClick={onLoad}
      className={cn(
        'flex flex-col gap-2 p-3 rounded-xl',
        'bg-card/50 hover:bg-card/80',
        'border border-border/30 hover:border-primary/50',
        'transition-all duration-200',
        'text-left min-w-[140px] w-[140px] shrink-0',
        'hover:shadow-lg hover:shadow-primary/5'
      )}
    >
      {/* Pattern mini visualization */}
      <div className="flex gap-px h-8 w-full overflow-hidden rounded-md bg-muted/30">
        {Array.from({ length: 16 }, (_, step) => {
          const hasHit = Object.values(pattern.steps).some(
            (steps) => steps[step]
          );
          return (
            <div
              key={step}
              className={cn(
                'flex-1 transition-colors',
                hasHit ? 'bg-primary/60' : 'bg-transparent',
                step % 4 === 0 && 'border-l border-border/30 first:border-l-0'
              )}
            />
          );
        })}
      </div>

      {/* Pattern name */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-sm leading-tight">{pattern.name}</span>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', genreColor)}>
          {pattern.genre}
        </Badge>
        <span className="text-[10px] text-muted-foreground font-mono">
          {pattern.bpm} BPM
        </span>
      </div>

      {/* Density bar */}
      <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary/50 rounded-full transition-all"
          style={{ width: `${density}%` }}
        />
      </div>
    </button>
  );
});

export const PatternBrowser = memo(function PatternBrowser({
  patterns,
  onLoadPattern,
  onClearPattern,
  className
}: PatternBrowserProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Group patterns by genre
  const genres = [...new Set(patterns.map(p => p.genre))];

  return (
    <div className={cn(
      'flex flex-col rounded-xl overflow-hidden',
      'bg-gradient-to-br from-card/50 to-muted/30',
      'border border-border/30',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:text-primary transition-colors"
        >
          <Music className="w-4 h-4" />
          <span className="font-medium text-sm">Паттерны</span>
          <Badge variant="secondary" className="text-[10px] px-1.5">
            {patterns.length}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearPattern}
          className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3 h-3" />
          Очистить
        </Button>
      </div>

      {/* Pattern grid - collapsible */}
      {isExpanded && (
        <div className="p-3">
          {/* Genre filter chips */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {genres.map(genre => (
              <Badge 
                key={genre}
                variant="outline"
                className={cn(
                  'text-[10px] px-2 py-0.5 cursor-pointer hover:bg-muted',
                  genreColors[genre]
                )}
              >
                {genre}
              </Badge>
            ))}
          </div>

          {/* Scrollable pattern cards */}
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {patterns.map((pattern) => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onLoad={() => onLoadPattern(pattern)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
});
