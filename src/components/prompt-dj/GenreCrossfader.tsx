/**
 * GenreCrossfader - A/B genre mixer with visual crossfader
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GENRE_PRESETS, PresetItem } from '@/lib/prompt-dj-presets';

interface GenreCrossfaderProps {
  genreAId: string | null;
  genreBId: string | null;
  crossfaderPosition: number; // -1 to 1
  onGenreAChange: (id: string | null) => void;
  onGenreBChange: (id: string | null) => void;
  onCrossfaderChange: (position: number) => void;
  disabled?: boolean;
}

export const GenreCrossfader = memo(function GenreCrossfader({
  genreAId,
  genreBId,
  crossfaderPosition,
  onGenreAChange,
  onGenreBChange,
  onCrossfaderChange,
  disabled,
}: GenreCrossfaderProps) {
  // Calculate visual weights for A and B
  const aWeight = Math.round((1 - crossfaderPosition) / 2 * 100);
  const bWeight = Math.round((1 + crossfaderPosition) / 2 * 100);

  const genreA = GENRE_PRESETS.find(g => g.id === genreAId);
  const genreB = GENRE_PRESETS.find(g => g.id === genreBId);

  return (
    <div className="p-3 rounded-xl bg-card/30 border border-border/30 space-y-3">
      {/* Genre selectors */}
      <div className="flex items-center gap-3">
        {/* Genre A */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-400">A</span>
            <span className="text-[10px] text-muted-foreground">{aWeight}%</span>
          </div>
          <Select 
            value={genreAId || ''} 
            onValueChange={(v) => onGenreAChange(v || null)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs bg-purple-500/10 border-purple-500/30">
              <SelectValue placeholder="Жанр А" />
            </SelectTrigger>
            <SelectContent>
              {GENRE_PRESETS.map((genre) => (
                <SelectItem key={genre.id} value={genre.id} className="text-xs">
                  {genre.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* VS indicator */}
        <div className="text-[10px] font-bold text-muted-foreground">×</div>

        {/* Genre B */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-400">Б</span>
            <span className="text-[10px] text-muted-foreground">{bWeight}%</span>
          </div>
          <Select 
            value={genreBId || ''} 
            onValueChange={(v) => onGenreBChange(v || null)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs bg-blue-500/10 border-blue-500/30">
              <SelectValue placeholder="Жанр Б" />
            </SelectTrigger>
            <SelectContent>
              {GENRE_PRESETS.map((genre) => (
                <SelectItem key={genre.id} value={genre.id} className="text-xs">
                  {genre.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Crossfader */}
      <div className="relative">
        {/* Track background */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, 
                hsl(270, 91%, 65%) 0%, 
                hsl(270, 91%, 65%) ${aWeight}%, 
                hsl(217, 91%, 60%) ${aWeight}%, 
                hsl(217, 91%, 60%) 100%)`
            }}
          />
        </div>

        {/* Center marker */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/30 rounded-full z-10" />

        {/* Slider */}
        <Slider
          value={[crossfaderPosition]}
          onValueChange={([v]) => onCrossfaderChange(v)}
          min={-1}
          max={1}
          step={0.05}
          disabled={disabled || (!genreAId && !genreBId)}
          className="relative z-20"
        />

        {/* Labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-purple-400 font-medium">
            {genreA?.label || 'A'}
          </span>
          <span className="text-[9px] text-muted-foreground">
            {crossfaderPosition === 0 ? 'Центр' : crossfaderPosition < 0 ? '← A' : 'Б →'}
          </span>
          <span className="text-[9px] text-blue-400 font-medium">
            {genreB?.label || 'Б'}
          </span>
        </div>
      </div>
    </div>
  );
});
