import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Music2, Search, Loader2, Grid3x3, List, SlidersHorizontal } from 'lucide-react';
import { useTracks, type Track } from '@/hooks/useTracksOptimized';
import { TrackCard } from '@/components/TrackCard';
import { Button } from '@/components/ui/button';
import { GenerationProgress } from '@/components/GenerationProgress';
import { useGenerationRealtime } from '@/hooks/useGenerationRealtime';
import { useTrackVersions } from '@/hooks/useTrackVersions';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundaryWrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from 'use-debounce';

export default function Library() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { activeTrack, playTrack } = usePlayerStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'liked'>('recent');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  useGenerationRealtime();

  const {
    tracks,
    isLoading,
    deleteTrack,
    toggleLike,
    logPlay,
    downloadTrack,
  } = useTracks({
    searchQuery: debouncedSearchQuery,
    sortBy,
  });

  const fullscreenTrackId = activeTrack?.id;
  const { data: versions } = useTrackVersions(fullscreenTrackId || '');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const tracksToDisplay = tracks || [];

  const handlePlay = (track: Track) => {
    if (!track.audio_url) return;
    playTrack(track);
    logPlay(track.id);
  };

  const handleDownload = (trackId: string, audioUrl: string | null, coverUrl: string | null) => {
    if (!audioUrl) return;
    downloadTrack({ trackId, audioUrl, coverUrl: coverUrl || undefined });
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `track-${trackId}.mp3`;
    link.click();
  };

  return (
    <ErrorBoundaryWrapper>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
        <GenerationProgress />
      
        {/* Modern Header - Improved responsive design */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/50 safe-area-top">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Библиотека</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {tracks?.length || 0} {tracks?.length === 1 ? 'трек' : tracks?.length && tracks.length < 5 ? 'трека' : 'треков'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-10 w-10 min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 transition-transform"
                  aria-label="Сетка"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="h-10 w-10 min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 transition-transform"
                  aria-label="Список"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search and Filters - Improved mobile layout */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Поиск треков..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 sm:h-10"
                  aria-label="Поиск"
                />
              </div>
              
              <Select value={sortBy} onValueChange={(v: 'recent' | 'popular' | 'liked') => setSortBy(v)}>
                <SelectTrigger className="w-full sm:w-40 h-11 sm:h-10 touch-manipulation" aria-label="Сортировка">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Недавние</SelectItem>
                  <SelectItem value="popular">Популярные</SelectItem>
                  <SelectItem value="liked">Понравившиеся</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content - Improved responsive padding and layout */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tracksToDisplay.length === 0 ? (
            <Card className="glass-card border-primary/20 p-8 sm:p-12 text-center">
              <Music2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {searchQuery ? 'Ничего не найдено' : 'Пока нет треков'}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {searchQuery
                  ? 'Попробуйте изменить поисковой запрос'
                  : 'Создайте свой первый трек в генераторе'}
              </p>
            </Card>
          ) : (
            <motion.div
              layout
              className={viewMode === 'grid' 
                ? 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'
                : 'flex flex-col gap-2 sm:gap-3'
              }
            >
              <AnimatePresence mode="popLayout">
                {tracksToDisplay.map((track) => (
                  <motion.div
                    key={track.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TrackCard
                      track={track}
                      layout={viewMode}
                      isPlaying={activeTrack?.id === track.id}
                      onPlay={() => handlePlay(track)}
                      onDelete={() => deleteTrack(track.id)}
                      onDownload={() => handleDownload(track.id, track.audio_url, track.cover_url)}
                      onToggleLike={() =>
                        toggleLike({
                          trackId: track.id,
                          isLiked: track.is_liked || false,
                        })
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </ErrorBoundaryWrapper>
  );
}
