import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Popular genres based on Suno AI v5 capabilities
const GENRES = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical',
  'Country', 'R&B', 'Metal', 'Folk', 'Indie', 'Latin',
  'Blues', 'Reggae', 'Punk', 'Soul', 'Funk', 'Ambient'
];

const MOODS = [
  'Energetic', 'Calm', 'Happy', 'Sad', 'Angry', 'Romantic',
  'Melancholic', 'Uplifting', 'Dark', 'Peaceful', 'Intense', 'Dreamy'
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'popular', label: 'Popular' },
  { value: 'trending', label: 'Trending' },
  { value: 'featured', label: 'Featured' },
];

interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
  className?: string;
}

export interface FilterState {
  genres: string[];
  moods: string[];
  sort: string;
  searchTerm?: string;
}

export function FilterBar({ onFilterChange, className }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    moods: [],
    sort: 'recent',
    searchTerm: '',
  });

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleGenre = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre];
    updateFilters({ genres: newGenres });
  };

  const toggleMood = (mood: string) => {
    const newMoods = filters.moods.includes(mood)
      ? filters.moods.filter((m) => m !== mood)
      : [...filters.moods, mood];
    updateFilters({ moods: newMoods });
  };

  const clearFilters = () => {
    updateFilters({ genres: [], moods: [], searchTerm: '' });
  };

  const hasActiveFilters = filters.genres.length > 0 || filters.moods.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Controls */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Sort: {SORT_OPTIONS.find(opt => opt.value === filters.sort)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filters.sort === option.value}
                onCheckedChange={() => updateFilters({ sort: option.value })}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Genre Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Genre
              {filters.genres.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {filters.genres.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-[400px] overflow-y-auto">
            <DropdownMenuLabel>Select Genres</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {GENRES.map((genre) => (
              <DropdownMenuCheckboxItem
                key={genre}
                checked={filters.genres.includes(genre)}
                onCheckedChange={() => toggleGenre(genre)}
              >
                {genre}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mood Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Mood
              {filters.moods.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {filters.moods.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-[400px] overflow-y-auto">
            <DropdownMenuLabel>Select Moods</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MOODS.map((mood) => (
              <DropdownMenuCheckboxItem
                key={mood}
                checked={filters.moods.includes(mood)}
                onCheckedChange={() => toggleMood(mood)}
              >
                {mood}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.genres.map((genre) => (
            <Badge
              key={genre}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20"
              onClick={() => toggleGenre(genre)}
            >
              {genre}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {filters.moods.map((mood) => (
            <Badge
              key={mood}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20"
              onClick={() => toggleMood(mood)}
            >
              {mood}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
