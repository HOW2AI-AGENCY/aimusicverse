import { useState, memo, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { Flame, TrendingUp, Music2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { UnifiedTrackCard } from '@/components/track/track-card-new';
import { GenreFilterChips, GENRES } from './GenreFilterChips';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';
import { ResponsiveGrid } from '@/components/common/ResponsiveGrid';
import { GridSkeleton, TrackCardSkeleton } from '@/components/ui/skeleton-components';
import { EmptyState } from '@/components/common/EmptyState';

type FeedTab = 'new' | 'popular' | 'genre';

interface UnifiedTrackFeedProps {
  recentTracks: PublicTrackWithCreator[];
  popularTracks: PublicTrackWithCreator[];
  isLoading?: boolean;
  onRemix?: (trackId: string) => void;
  className?: string;
}

export const UnifiedTrackFeed = memo(function UnifiedTrackFeed({
  recentTracks,
  popularTracks,
  isLoading,
  onRemix,
  className,
}: UnifiedTrackFeedProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FeedTab>('new');
  const [selectedGenre, setSelectedGenre] = useState('all');

  // Filter tracks by genre (simplified - matches tags or style)
  const filteredByGenre = useMemo(() => {
    const allTracks = [...recentTracks];
    if (selectedGenre === 'all') return allTracks;
    
    return allTracks.filter(track => {
      const tags = (Array.isArray(track.tags) ? track.tags.join(' ') : (track.tags || '')).toLowerCase();
      const title = track.title?.toLowerCase() || '';
      const searchTerm = selectedGenre.toLowerCase();
      
      return tags.includes(searchTerm) || title.includes(searchTerm);
    });
  }, [recentTracks, selectedGenre]);

  // Get tracks based on active tab
  const displayTracks = useMemo(() => {
    switch (activeTab) {
      case 'new':
        return recentTracks.slice(0, 8);
      case 'popular':
        return popularTracks.slice(0, 8);
      case 'genre':
        return filteredByGenre.slice(0, 8);
      default:
        return recentTracks.slice(0, 8);
    }
  }, [activeTab, recentTracks, popularTracks, filteredByGenre]);

  const tabConfig = {
    new: { icon: Flame, label: 'Новое', color: 'text-orange-400' },
    popular: { icon: TrendingUp, label: 'Популярное', color: 'text-emerald-400' },
    genre: { icon: Music2, label: 'По жанрам', color: 'text-violet-400' },
  };

  return (
    <section className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center shadow-soft"
            whileHover={{ scale: 1.05, rotate: -5 }}
          >
            <Flame className="w-5 h-5 text-orange-500" />
          </motion.div>
          <div>
            <h2 className="text-base font-semibold">Лента треков</h2>
            <p className="text-xs text-muted-foreground">Открывайте новую музыку</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/community')}
          className="text-xs text-muted-foreground hover:text-primary gap-1.5 rounded-xl"
        >
          Все треки
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as FeedTab)}
        className="w-full"
      >
        <TabsList className="w-full h-10 p-1 bg-muted/30 rounded-xl grid grid-cols-3">
          {(Object.keys(tabConfig) as FeedTab[]).map((tab) => {
            const config = tabConfig[tab];
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium rounded-lg transition-all",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", activeTab === tab && config.color)} />
                <span className="hidden sm:inline">{config.label}</span>
                <span className="sm:hidden">{config.label.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Genre Filter - Only visible on genre tab */}
      {activeTab === 'genre' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <GenreFilterChips
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
          />
        </motion.div>
      )}

      {/* Track Grid */}
      {isLoading ? (
        <GridSkeleton count={8} columns={4} SkeletonComponent={TrackCardSkeleton} />
      ) : displayTracks.length > 0 ? (
        <motion.div
          key={activeTab + selectedGenre}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <ResponsiveGrid columns={4} gap={3}>
            {displayTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <UnifiedTrackCard
                  variant="enhanced"
                  track={track}
                  onRemix={onRemix}
                />
              </motion.div>
            ))}
          </ResponsiveGrid>
        </motion.div>
      ) : (
        <EmptyState
          icon={Music2}
          title={activeTab === 'genre' 
            ? `Нет треков в жанре "${GENRES.find(g => g.id === selectedGenre)?.label}"`
            : 'Треки пока не найдены'}
          variant="compact"
        />
      )}

      {/* Load More hint */}
      {displayTracks.length >= 8 && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/community')}
            className="text-xs gap-1.5 rounded-xl"
          >
            Показать ещё
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      )}
    </section>
  );
});
