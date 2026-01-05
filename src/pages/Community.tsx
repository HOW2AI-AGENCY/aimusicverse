import { useState, useEffect, useCallback, useRef, forwardRef, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe, Music, Users, TrendingUp, Heart, Search, X, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePublicContentBatch, PublicTrackWithCreator } from "@/hooks/usePublicContent";
import { usePublicArtists } from "@/hooks/usePublicArtists";
import { UnifiedTrackCard } from "@/components/track/track-card-new";
import { ActorCard } from "@/components/actors/ActorCard";
import { motion, AnimatePresence } from '@/lib/motion';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ViewModeToggle } from "@/components/library/shared";
import { VirtuosoGrid } from "react-virtuoso";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

const GENRES = ["Pop", "Rock", "Hip-Hop", "Electronic", "R&B", "Jazz", "Indie", "Lo-Fi"];

// Grid container for VirtuosoGrid
const GridContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, style, ...props }, ref) => (
    <div
      ref={ref}
      style={style}
      {...props}
      className={cn(
        "grid gap-3",
        props.className
      )}
    >
      {children}
    </div>
  )
);
GridContainer.displayName = "GridContainer";

// Item wrapper for grid
const GridItemWrapper = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props}>{children}</div>
  )
);
GridItemWrapper.displayName = "GridItemWrapper";

// List container for VirtuosoGrid in list mode
const ListContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, style, ...props }, ref) => (
    <div
      ref={ref}
      style={style}
      {...props}
      className="flex flex-col gap-3"
    >
      {children}
    </div>
  )
);
ListContainer.displayName = "ListContainer";

// Pull-to-refresh indicator
const PullToRefreshIndicator = memo(function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold,
}: {
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}) {
  const progress = Math.min(pullDistance / threshold, 1);
  const isReady = pullDistance >= threshold;
  
  return (
    <AnimatePresence>
      {(pullDistance > 0 || isRefreshing) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-safe-top"
          style={{
            transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          }}
        >
          <div className="flex flex-col items-center gap-2 px-4 py-2 bg-background/95 backdrop-blur-sm rounded-b-xl shadow-lg border-x border-b border-border">
            <motion.div
              animate={{
                rotate: isRefreshing ? 360 : isReady ? 180 : 0,
              }}
              transition={{
                duration: isRefreshing ? 1 : 0.3,
                repeat: isRefreshing ? Infinity : 0,
                ease: "linear",
              }}
            >
              <RefreshCw
                className={cn(
                  "w-5 h-5 transition-colors",
                  isReady || isRefreshing ? "text-primary" : "text-muted-foreground"
                )}
              />
            </motion.div>
            <span className="text-xs text-muted-foreground font-medium">
              {isRefreshing
                ? "Обновление..."
                : isReady
                ? "Отпустите для обновления"
                : "Потяните для обновления"}
            </span>
            {!isRefreshing && (
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default function Community() {
  // Telegram BackButton
  useTelegramBackButton({
    visible: true,
    fallbackPath: '/',
  });

  // URL params for tag search
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFromUrl = searchParams.get('tag');

  const { data: publicContent, isLoading: tracksLoading, refetch: refetchTracks } = usePublicContentBatch();
  const { data: publicArtists, isLoading: artistsLoading } = usePublicArtists(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tracks");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const canPull = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Pull-to-refresh constants
  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    canPull.current = scrollTop === 0;
    
    if (canPull.current) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canPull.current || !isPulling || isRefreshing) return;
    
    touchCurrentY.current = e.touches[0].clientY;
    const distance = touchCurrentY.current - touchStartY.current;
    
    if (distance > 0) {
      e.preventDefault();
      const resistance = Math.min(distance * 0.4, MAX_PULL);
      setPullDistance(resistance);
      
      if (resistance >= PULL_THRESHOLD && pullDistance < PULL_THRESHOLD) {
        triggerHapticFeedback('medium');
      }
    }
  }, [isPulling, isRefreshing, pullDistance, PULL_THRESHOLD, MAX_PULL]);

  const handleTouchEnd = useCallback(async () => {
    if (!canPull.current || !isPulling) return;
    
    setIsPulling(false);
    canPull.current = false;
    
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      triggerHapticFeedback('success');
      
      try {
        await refetchTracks();
      } catch (error) {
        console.error('Failed to refresh tracks:', error);
      } finally {
        setPullDistance(0);
        setTimeout(() => setIsRefreshing(false), 500);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, PULL_THRESHOLD, isRefreshing, refetchTracks]);

  // Apply tag from URL to search query
  useEffect(() => {
    if (tagFromUrl) {
      setSearchQuery(tagFromUrl);
    }
  }, [tagFromUrl]);

  // Clear tag filter
  const clearTagFilter = () => {
    setSearchQuery("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tag');
    setSearchParams(newParams, { replace: true });
  };

  const allTracks = publicContent?.allTracks || [];
  const popularTracks = publicContent?.popularTracks || [];

  const filteredTracks = allTracks.filter((track) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      track.title?.toLowerCase().includes(query) ||
      track.style?.toLowerCase().includes(query) ||
      track.tags?.toLowerCase().includes(query) ||
      (track as any).prompt?.toLowerCase().includes(query);
    const matchesGenre = !selectedGenre || track.style?.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  const filteredArtists = publicArtists?.filter((artist) => {
    const matchesSearch = artist.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || artist.genre_tags?.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div 
        className="container max-w-6xl mx-auto px-4 pb-6"
        style={{ paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + 0.75rem), calc(env(safe-area-inset-top, 0px) + 0.75rem))' }}
      >
        {/* Header */}
        <motion.header 
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full glass-card border-primary/20">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Сообщество
              </h1>
            <p className="text-sm text-muted-foreground">
              Открывайте музыку и артистов со всего мира
            </p>
          </div>
          
          {/* View mode toggle */}
          <ViewModeToggle 
            viewMode={viewMode} 
            onChange={setViewMode}
            className="ml-auto"
          />
          </div>
        </motion.header>

        {/* Search */}
        {/* Active tag indicator */}
        {tagFromUrl && (
          <motion.div
            className="mb-3 flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
              <Search className="w-3.5 h-3.5" />
              Тег: {tagFromUrl}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 hover:bg-transparent"
                onClick={clearTagFilter}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          </motion.div>
        )}

        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Поиск треков и артистов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base glass border-border/50"
            />
          </div>
        </motion.div>

        {/* Genre Filter Pills */}
        <motion.div 
          className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide -mx-4 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Badge
            variant={!selectedGenre ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap px-3 py-1.5 touch-manipulation"
            onClick={() => setSelectedGenre(null)}
          >
            Все жанры
          </Badge>
          {GENRES.map((genre) => (
            <Badge
              key={genre}
              variant={selectedGenre === genre ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap px-3 py-1.5 touch-manipulation"
              onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
            >
              {genre}
            </Badge>
          ))}
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="tracks" className="gap-2">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Треки</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Популярное</span>
            </TabsTrigger>
            <TabsTrigger value="artists" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Артисты</span>
            </TabsTrigger>
          </TabsList>

          {/* All Tracks */}
          <TabsContent value="tracks" className="mt-0">
            <div
              ref={containerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <PullToRefreshIndicator
                pullDistance={pullDistance}
                isRefreshing={isRefreshing}
                threshold={PULL_THRESHOLD}
              />
              
              {tracksLoading ? (
                <div className={cn(
                  "grid gap-3",
                  viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
                )}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : filteredTracks.length > 0 ? (
                viewMode === 'grid' ? (
                  <VirtuosoGrid
                    style={{ height: '100vh', minHeight: '400px' }}
                    data={filteredTracks}
                    components={{
                      // @ts-ignore - VirtuosoGrid has correct type, but TS inference is confused
                      List: forwardRef((props, ref) => (
                        <GridContainer 
                          {...props} 
                          ref={ref} 
                          className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                        />
                      )),
                      Item: GridItemWrapper,
                    }}
                    itemContent={(index, track) => (
                      <UnifiedTrackCard 
                        key={track.id}
                        variant="enhanced"
                        track={track} 
                        compact={false} 
                      />
                    )}
                  />
                ) : (
                  <VirtuosoGrid
                    style={{ height: '100vh', minHeight: '400px' }}
                    data={filteredTracks}
                    components={{
                      // @ts-ignore
                      List: ListContainer,
                      Item: GridItemWrapper,
                    }}
                    itemContent={(index, track) => (
                      <UnifiedTrackCard 
                        key={track.id}
                        variant="compact"
                        track={track as any}
                      />
                    )}
                  />
                )
              ) : (
                <EmptyState 
                  icon={Music}
                  title="Треки не найдены"
                  description="Попробуйте изменить поисковый запрос или фильтры"
                />
              )}
            </div>
          </TabsContent>

          {/* Popular Tracks */}
          <TabsContent value="popular" className="mt-0">
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <PullToRefreshIndicator
                pullDistance={pullDistance}
                isRefreshing={isRefreshing}
                threshold={PULL_THRESHOLD}
              />
              
              {tracksLoading ? (
                <div className={cn(
                  "grid gap-3",
                  viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
                )}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : popularTracks.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">Топ по популярности</span>
                  </div>
                  {viewMode === 'grid' ? (
                    <VirtuosoGrid
                      style={{ height: '100vh', minHeight: '400px' }}
                      data={popularTracks}
                      components={{
                        // @ts-ignore
                        List: forwardRef((props, ref) => (
                          <GridContainer 
                            {...props} 
                            ref={ref} 
                            className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                          />
                        )),
                        Item: GridItemWrapper,
                      }}
                      itemContent={(index, track) => (
                        <UnifiedTrackCard 
                          key={track.id}
                          variant="enhanced"
                          track={track} 
                          compact={false} 
                        />
                      )}
                    />
                  ) : (
                    <VirtuosoGrid
                      style={{ height: '100vh', minHeight: '400px' }}
                      data={popularTracks}
                      components={{
                        // @ts-ignore
                        List: ListContainer,
                        Item: GridItemWrapper,
                      }}
                      itemContent={(index, track) => (
                        <UnifiedTrackCard 
                          key={track.id}
                          variant="compact"
                          track={track as any}
                        />
                      )}
                    />
                  )}
                </div>
              ) : (
                <EmptyState 
                  icon={TrendingUp}
                  title="Пока нет популярных треков"
                  description="Лайкайте треки, чтобы они попадали в топ"
                />
              )}
            </div>
          </TabsContent>

          {/* Artists */}
          <TabsContent value="artists" className="mt-0">
            {artistsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : filteredArtists.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArtists.map((artist, index) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <ActorCard artist={artist} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Users}
                title="Артисты не найдены"
                description="Попробуйте изменить поисковый запрос или фильтры"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
