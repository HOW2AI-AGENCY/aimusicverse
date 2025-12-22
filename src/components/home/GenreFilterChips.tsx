import { memo } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export interface Genre {
  id: string;
  label: string;
  icon: string;
}

export const GENRES: Genre[] = [
  { id: 'all', label: 'Все', icon: '🎵' },
  { id: 'electronic', label: 'Electronic', icon: '🎹' },
  { id: 'hip-hop', label: 'Hip-hop', icon: '🎤' },
  { id: 'pop', label: 'Pop', icon: '🎶' },
  { id: 'rock', label: 'Rock', icon: '🎸' },
  { id: 'ambient', label: 'Ambient', icon: '🌊' },
  { id: 'jazz', label: 'Jazz', icon: '🎷' },
  { id: 'classical', label: 'Classical', icon: '🎻' },
  { id: 'r&b', label: 'R&B', icon: '💜' },
  { id: 'lo-fi', label: 'Lo-Fi', icon: '☕' },
  { id: 'metal', label: 'Metal', icon: '🤘' },
  { id: 'folk', label: 'Folk', icon: '🪕' },
];

interface GenreFilterChipsProps {
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  className?: string;
}

export const GenreFilterChips = memo(function GenreFilterChips({
  selectedGenre,
  onGenreChange,
  className,
}: GenreFilterChipsProps) {
  return (
    <ScrollArea className={cn("-mx-3 px-3", className)}>
      <div className="flex gap-2 pb-2">
        {GENRES.map((genre) => {
          const isSelected = selectedGenre === genre.id;
          return (
            <motion.button
              key={genre.id}
              onClick={() => onGenreChange(genre.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                "border transition-all duration-200 whitespace-nowrap touch-manipulation min-h-[32px]",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-card/50 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
              )}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-sm">{genre.icon}</span>
              <span>{genre.label}</span>
            </motion.button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
});
