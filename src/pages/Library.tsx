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
      
        {/* Modern Header */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Music2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Библиотека</h1>
                  <p className="text-sm text-muted-foreground">
                    {tracks?.length || 0} треков
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-9 w-9"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="h-9 w-9"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Поиск треков..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={sortBy} onValueChange={(v: 'recent' | 'popular' | 'liked') => setSortBy(v)}>
                <SelectTrigger className="w-40">
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

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tracksToDisplay.length === 0 ? (
            <Card className="glass-card border-primary/20 p-12 text-center">
              <Music2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'Ничего не найдено' : 'Пока нет треков'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Попробуйте изменить поисковой запрос'
                  : 'Создайте свой первый трек в генераторе'}
              </p>
            </Card>
          ) : (
            <motion.div
              layout
              className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'flex flex-col gap-3'
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
