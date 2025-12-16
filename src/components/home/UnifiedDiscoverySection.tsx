import { useState } from 'react';
import { Sparkles, Clock, TrendingUp, ChevronRight, Flame, Star } from 'lucide-react';
import { PublicTrackCard } from './PublicTrackCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';
import { motion, AnimatePresence } from '@/lib/motion';

type DiscoveryTab = 'featured' | 'new' | 'popular';

interface UnifiedDiscoverySectionProps {
  featuredTracks: PublicTrackWithCreator[];
  recentTracks: PublicTrackWithCreator[];
  popularTracks: PublicTrackWithCreator[];
  isLoading: boolean;
  onRemix?: (trackId: string) => void;
  className?: string;
}

const tabs: { id: DiscoveryTab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'featured', label: 'Избранное', icon: <Star className="w-4 h-4" />, color: 'from-yellow-500 to-amber-500' },
  { id: 'new', label: 'Новое', icon: <Clock className="w-4 h-4" />, color: 'from-blue-500 to-cyan-500' },
  { id: 'popular', label: 'Популярное', icon: <TrendingUp className="w-4 h-4" />, color: 'from-pink-500 to-rose-500' },
];

export function UnifiedDiscoverySection({
  featuredTracks,
  recentTracks,
  popularTracks,
  isLoading,
  onRemix,
  className,
}: UnifiedDiscoverySectionProps) {
  const [activeTab, setActiveTab] = useState<DiscoveryTab>('featured');

  const getTracksForTab = () => {
    switch (activeTab) {
      case 'featured':
        return featuredTracks;
      case 'new':
        return recentTracks;
      case 'popular':
        return popularTracks;
      default:
        return featuredTracks;
    }
  };

  const tracks = getTracksForTab();
  const activeTabData = tabs.find(t => t.id === activeTab);

  if (isLoading) {
    return (
      <section className={cn('space-y-5', className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted/30 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-32 bg-muted/30 rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-9 w-24 bg-muted/30 animate-pulse rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="aspect-square bg-muted/30 animate-pulse rounded-2xl"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (!featuredTracks.length && !recentTracks.length && !popularTracks.length) {
    return null;
  }

  return (
    <section className={cn('space-y-5', className)}>
      {/* Enhanced Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
          </motion.div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gradient">Открытия</h2>
            <p className="text-xs text-muted-foreground">Лучшее от сообщества</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-xl"
        >
          Все
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Enhanced Tab Pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const tabTracks = tab.id === 'featured' ? featuredTracks : tab.id === 'new' ? recentTracks : popularTracks;
          
          if (!tabTracks.length) return null;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all",
                isActive 
                  ? "text-white shadow-lg" 
                  : "bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active background gradient */}
              {isActive && (
                <motion.div
                  className={cn("absolute inset-0 rounded-xl bg-gradient-to-r", tab.color)}
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              
              {/* Shimmer effect for active */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl overflow-hidden"
                  initial={false}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                </motion.div>
              )}
              
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
                <Badge 
                  variant={isActive ? "secondary" : "outline"}
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 ml-0.5",
                    isActive ? "bg-white/20 text-white border-none" : ""
                  )}
                >
                  {tabTracks.length}
                </Badge>
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Track Grid with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {/* Desktop Grid */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tracks.slice(0, 8).map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <PublicTrackCard track={track} onRemix={onRemix} />
              </motion.div>
            ))}
          </div>

          {/* Mobile Horizontal Scroll */}
          <div className="sm:hidden relative -mx-3">
            {/* Gradient fades */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            
            <div className="overflow-x-auto scrollbar-hide px-3">
              <div className="flex gap-3 pb-3">
                {tracks.slice(0, 10).map((track, index) => (
                  <motion.div
                    key={track.id}
                    className="w-[165px] flex-shrink-0"
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <PublicTrackCard track={track} onRemix={onRemix} compact />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
