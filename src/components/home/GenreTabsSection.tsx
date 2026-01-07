/**
 * Genre Tabs Section
 * Displays tracks by genre with tab navigation
 * Personalizes order based on user preferences
 * Mobile-optimized with scroll fade indicators
 */

import { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { HorizontalScrollFade } from '@/components/ui/horizontal-scroll-fade';
import { TracksGridSection } from './TracksGridSection';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';
import { cn } from '@/lib/utils';
import { Music2, Disc3, Guitar, Waves } from 'lucide-react';

interface GenreConfig {
  id: string;
  label: string;
  icon: typeof Music2;
  color: string;
  gradient: string;
  keywords: string[];
}

const GENRES: GenreConfig[] = [
  {
    id: 'hiphop',
    label: 'Хип-Хоп',
    icon: Disc3,
    color: 'text-violet-400',
    gradient: 'from-violet-500/20 to-purple-500/10',
    keywords: ['hip-hop', 'hiphop', 'hip hop', 'rap', 'trap', 'drill'],
  },
  {
    id: 'pop',
    label: 'Поп',
    icon: Music2,
    color: 'text-rose-400',
    gradient: 'from-rose-500/20 to-pink-500/10',
    keywords: ['pop', 'dance pop', 'synth pop', 'electro pop'],
  },
  {
    id: 'rock',
    label: 'Рок',
    icon: Guitar,
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-amber-500/10',
    keywords: ['rock', 'alternative', 'indie', 'metal', 'punk', 'grunge'],
  },
  {
    id: 'electronic',
    label: 'Электро',
    icon: Waves,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-blue-500/10',
    keywords: ['electronic', 'edm', 'house', 'techno', 'dubstep', 'trance', 'dnb', 'drum and bass'],
  },
];

interface GenreTabsSectionProps {
  tracks: PublicTrackWithCreator[];
  isLoading?: boolean;
  onRemix?: (trackId: string) => void;
}

export function GenreTabsSection({ tracks, isLoading, onRemix }: GenreTabsSectionProps) {
  const { preferredGenres } = useUserPreferences();
  
  // Sort genres by user preference
  const sortedGenres = useMemo(() => {
    if (!preferredGenres?.length) return GENRES;
    
    return [...GENRES].sort((a, b) => {
      const aIndex = preferredGenres.indexOf(a.id);
      const bIndex = preferredGenres.indexOf(b.id);
      
      // Preferred genres come first
      if (aIndex !== -1 && bIndex === -1) return -1;
      if (aIndex === -1 && bIndex !== -1) return 1;
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      return 0;
    });
  }, [preferredGenres]);

  // Default to first (most preferred) genre
  const [activeGenre, setActiveGenre] = useState(sortedGenres[0]?.id || 'hiphop');

  // Filter tracks by genre
  const tracksByGenre = useMemo(() => {
    const result: Record<string, PublicTrackWithCreator[]> = {};
    
    GENRES.forEach(genre => {
      result[genre.id] = tracks.filter(track => {
        const style = (track.style || '').toLowerCase();
        const prompt = (track.prompt || '').toLowerCase();
        const combined = `${style} ${prompt}`;
        
        return genre.keywords.some(keyword => combined.includes(keyword));
      });
    });
    
    return result;
  }, [tracks]);

  const activeConfig = GENRES.find(g => g.id === activeGenre) || GENRES[0];

  const handleTabChange = useCallback((value: string) => {
    setActiveGenre(value);
  }, []);

  // Don't render if no tracks
  if (!tracks.length && !isLoading) return null;

  return (
    <section className="mb-5">
      <Tabs value={activeGenre} onValueChange={handleTabChange} className="w-full">
        {/* Tab Navigation with scroll fade */}
        <HorizontalScrollFade fadeWidth={32} className="mb-4">
          <TabsList className="inline-flex w-max gap-1.5 bg-transparent p-0">
            {sortedGenres.map(genre => {
              const Icon = genre.icon;
              const isActive = activeGenre === genre.id;
              const trackCount = tracksByGenre[genre.id]?.length || 0;
              
              return (
                <TabsTrigger
                  key={genre.id}
                  value={genre.id}
                  className={cn(
                    // Touch-friendly size - 44px minimum height
                    'flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-full',
                    'text-sm font-medium transition-all',
                    'border border-transparent',
                    'data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10',
                    'data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-muted-foreground',
                    'hover:bg-muted active:scale-[0.98]',
                    'whitespace-nowrap'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive && genre.color)} />
                  <span>{genre.label}</span>
                  {trackCount > 0 && (
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                      isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {trackCount}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </HorizontalScrollFade>

        {/* Tab Content */}
        {GENRES.map(genre => (
          <TabsContent key={genre.id} value={genre.id} className="mt-0">
            <TracksGridSection
              title={`${genre.label}`}
              icon={genre.icon}
              iconColor={genre.color}
              iconGradient={genre.gradient}
              tracks={tracksByGenre[genre.id] || []}
              isLoading={isLoading}
              maxTracks={6}
              columns={2}
              showMoreLink={`/community?genre=${genre.id}`}
              showMoreLabel={`Все ${genre.label.toLowerCase()}`}
              onRemix={onRemix}
              hideHeader
            />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
