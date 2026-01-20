/**
 * Personalized Recommendations Component
 * Feature: Sprint 32 - US-007 Personalized Recommendations
 *
 * Shows personalized track recommendations based on user's first generated track
 */

import { memo, useCallback, useEffect, useState } from 'react';
import { motion } from '@/lib/motion';
import { Sparkles, TrendingUp, Play, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { logger } from '@/lib/logger';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';
import { usePublicContentBatch, type PublicTrackWithCreator } from '@/hooks/usePublicContent';
import { LazyImage } from '@/components/ui/lazy-image';

interface PersonalizedRecommendationsProps {
  userTrack: PublicTrackWithCreator;
  onTrackClick?: (trackId: string) => void;
  onCreateSimilar?: (style: string, mood: string) => void;
  onExploreMore?: () => void;
  className?: string;
  maxRecommendations?: number;
}

/**
 * Calculate similarity between two tracks
 */
function calculateSimilarity(
  trackA: PublicTrackWithCreator,
  trackB: PublicTrackWithCreator
): number {
  let score = 0;

  // Style match (40% weight)
  if (trackA.style && trackB.style) {
    const styleA = trackA.style.toLowerCase();
    const styleB = trackB.style.toLowerCase();
    if (styleA === styleB) {
      score += 0.4;
    } else if (styleA.includes(styleB) || styleB.includes(styleA)) {
      score += 0.2;
    }
  }

  // Tag overlap (60% weight)
  const tagsA = new Set(Array.isArray(trackA.tags) ? trackA.tags.map((t: string) => t.toLowerCase()) : []);
  const tagsB = new Set(Array.isArray(trackB.tags) ? trackB.tags.map((t: string) => t.toLowerCase()) : []);

  if (tagsA.size > 0 && tagsB.size > 0) {
    const intersection = [...tagsA].filter(t => tagsB.has(t));
    const union = new Set([...tagsA, ...tagsB]);
    if (union.size > 0) {
      const jaccardIndex = intersection.length / union.size;
      score += jaccardIndex * 0.6;
    }
  }

  return Math.min(score, 1);
}

/**
 * Explain similarity between two tracks
 */
function explainSimilarity(trackA: PublicTrackWithCreator, trackB: PublicTrackWithCreator): string {
  const reasons: string[] = [];

  if (trackA.style === trackB.style) {
    reasons.push(`стиль "${trackA.style}"`);
  }

  const tagsA = new Set(Array.isArray(trackA.tags) ? trackA.tags : []);
  const tagsB = new Set(Array.isArray(trackB.tags) ? trackB.tags : []);
  const commonTags = [...tagsA].filter(t => tagsB.has(t));

  if (commonTags.length > 0) {
    reasons.push(`теги: ${commonTags.slice(0, 3).join(', ')}`);
  }

  if (reasons.length === 0) {
    return 'Похожий трек';
  }

  return `Похоже по ${reasons.join(', ')}`;
}

interface SimilarTrack extends PublicTrackWithCreator {
  similarity: number;
}

/**
 * Hook to get personalized recommendations
 */
function usePersonalizedRecommendations(userTrack: PublicTrackWithCreator, limit: number = 8) {
  const [recommendations, setRecommendations] = useState<SimilarTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: publicContent } = usePublicContentBatch();

  useEffect(() => {
    if (!publicContent || !userTrack) return;

    setIsLoading(true);

    // Get all public tracks except user's track
    const allPublicTracks = [
      ...(publicContent.popularTracks || []),
      ...(publicContent.recentTracks || []),
      ...(publicContent.allTracks || []),
    ];

    // Remove duplicates
    const uniqueTracksMap = new Map<string, PublicTrackWithCreator>();
    allPublicTracks.forEach(t => {
      if (t.id !== userTrack.id) {
        uniqueTracksMap.set(t.id, t);
      }
    });

    const uniqueTracks = Array.from(uniqueTracksMap.values());

    // Find similar tracks
    const similar: SimilarTrack[] = uniqueTracks
      .map(track => ({
        ...track,
        similarity: calculateSimilarity(userTrack, track),
      }))
      .filter(track => track.similarity >= 0.2)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    setRecommendations(similar);
    setIsLoading(false);

    logger.info('Personalized recommendations generated', {
      userTrackId: userTrack.id,
      count: similar.length,
    });
  }, [userTrack, publicContent, limit]);

  return { recommendations, isLoading };
}

/**
 * Personalized Recommendations Component
 */
export const PersonalizedRecommendations = memo(function PersonalizedRecommendations({
  userTrack,
  onTrackClick,
  onCreateSimilar,
  onExploreMore,
  className,
  maxRecommendations = 8,
}: PersonalizedRecommendationsProps) {
  const { hapticFeedback } = useTelegram();
  const { trackEvent } = useAnalyticsTracking();
  const { recommendations, isLoading } = usePersonalizedRecommendations(
    userTrack,
    maxRecommendations
  );

  const handleTrackClick = useCallback(
    (track: SimilarTrack) => {
      hapticFeedback?.('light');
      trackEvent({
        eventType: 'feature_used',
        eventName: 'recommendation_clicked',
        metadata: { trackId: track.id, similarity: track.similarity, source: 'personalized' },
      });
      onTrackClick?.(track.id);
    },
    [hapticFeedback, trackEvent, onTrackClick]
  );

  const handleCreateSimilar = useCallback(
    (track: SimilarTrack) => {
      hapticFeedback?.('medium');
      trackEvent({
        eventType: 'feature_used',
        eventName: 'create_similar_tapped',
        metadata: { fromTrackId: track.id, style: track.style },
      });
      onCreateSimilar?.(track.style || '', '');
    },
    [hapticFeedback, trackEvent, onCreateSimilar]
  );

  const handleExploreMore = useCallback(() => {
    hapticFeedback?.('light');
    trackEvent({
      eventType: 'feature_used',
      eventName: 'explore_more_tapped',
      metadata: { source: 'personalized' },
    });
    onExploreMore?.();
  }, [hapticFeedback, trackEvent, onExploreMore]);

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Похожие треки</h3>
          <div className="w-20 h-5 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Похоже на ваш трек</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExploreMore}
          className="gap-1 text-xs"
        >
          Больше
          <TrendingUp className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        Треки похожие на &quot;{userTrack.title}&quot; по стилю
      </p>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-2 gap-3">
        {recommendations.map((track, index) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative"
          >
            <div
              className={cn(
                'relative aspect-square rounded-xl overflow-hidden',
                'bg-muted',
                'cursor-pointer',
                'transition-transform duration-200',
                'active:scale-95'
              )}
              onClick={() => handleTrackClick(track)}
            >
              {/* Cover image */}
              <LazyImage
                src={track.cover_url || ''}
                alt={track.title || 'Track'}
                className="w-full h-full object-cover"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {/* Play button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrackClick(track);
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 hover:bg-white/30 transition-colors"
                  >
                    <Play className="w-5 h-5 text-white fill-white" />
                  </button>

                  {/* Title */}
                  <p className="text-white text-sm font-medium line-clamp-1">
                    {track.title}
                  </p>

                  {/* Similarity explanation */}
                  <p className="text-white/70 text-xs mt-0.5 line-clamp-1">
                    {explainSimilarity(userTrack, track)}
                  </p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle like
                  }}
                  className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Create Similar button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCreateSimilar(track)}
              className="w-full mt-2 gap-1 text-xs h-8"
            >
              <Sparkles className="w-3 h-3" />
              Создать похожее
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
});
