import { useState } from 'react';
import { Sparkles, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { PublicTrackCard } from './PublicTrackCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';
import { motion, AnimatePresence } from '@/lib/motion';
import { GlassCard } from '@/components/ui/glass-card';

type DiscoveryTab = 'featured' | 'new' | 'popular';

interface UnifiedDiscoverySectionProps {
  featuredTracks: PublicTrackWithCreator[];
  recentTracks: PublicTrackWithCreator[];
  popularTracks: PublicTrackWithCreator[];
  isLoading: boolean;
  onRemix?: (trackId: string) => void;
  className?: string;
}

const tabs: { id: DiscoveryTab; label: string; icon: React.ReactNode }[] = [
  { id: 'featured', label: 'Избранное', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'new', label: 'Новое', icon: <Clock className="w-4 h-4" /> },
  { id: 'popular', label: 'Популярное', icon: <TrendingUp className="w-4 h-4" /> },
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

  if (isLoading) {
    return (
      <section className={cn('space-y-4', className)}>
        <div className="h-10 w-64 bg-muted/50 animate-pulse rounded-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="aspect-square bg-muted/50 animate-pulse rounded-xl"
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
    <section className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-gradient">Открытия</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 group hover:text-foreground">
          Все <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>

      {/* Tab Pills with glass effect */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const tabTracks = tab.id === 'featured' ? featuredTracks : tab.id === 'new' ? recentTracks : popularTracks;
          
          if (!tabTracks.length) return null;

          return (
            <motion.div
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "gap-2 rounded-full whitespace-nowrap transition-all relative overflow-hidden",
                  isActive && "bg-primary shadow-lg shadow-primary/30",
                  !isActive && "bg-background/50 backdrop-blur-sm border-border/50 hover:border-primary/50"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Track Grid with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Desktop Grid */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tracks.slice(0, 8).map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <PublicTrackCard track={track} onRemix={onRemix} />
              </motion.div>
            ))}
          </div>

          {/* Mobile Horizontal Scroll - improved sizing */}
          <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 pb-2">
              {tracks.slice(0, 10).map((track, index) => (
                <motion.div
                  key={track.id}
                  className="w-[160px] flex-shrink-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PublicTrackCard track={track} onRemix={onRemix} compact />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
