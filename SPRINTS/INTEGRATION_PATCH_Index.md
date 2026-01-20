/**
 * Integration Patch for Index.tsx
 * Adds Sprint 32 components to homepage
 *
 * Инструкция по применению:
 * 1. Открыть src/pages/Index.tsx
 * 2. Добавить импорты в начале файла
 * 3. Добавить компоненты в соответствующие секции
 */

// ============ STEP 1: Add imports after existing imports ============
// После строки ~42 (после импорта ContinueDraftCard)

import { PersonalizedRecommendations } from '@/components/discovery/PersonalizedRecommendations';
import { FirstCommentCTA } from '@/components/comments/FirstCommentCTA';
import { ContinueCreatingCTA } from '@/components/generation/ContinueCreatingCTA';
import {
  TrackListSkeleton,
  TrackGridSkeleton,
  FeaturedSectionSkeleton,
} from '@/components/ui/skeletons/TrackListSkeleton';
import { useFirstGeneratedTrack } from '@/hooks/useFirstGeneratedTrack';

// ============ STEP 2: Add hook after useState declarations ============
// После строки ~78 (после const [audioDialogOpen, setAudioDialogOpen]...)

// Hook to get first generated track for recommendations
const { firstTrack, isFirstSession } = useFirstGeneratedTrack();

// ============ STEP 3: Replace skeleton sections ============
// Найти и заменить HeroSkeleton (строки ~54-67) на:

const HeroSkeleton = () => (
  <Suspense fallback={<TrackGridSkeleton count={4} columns={2} />}>
    <motion.section className="mb-4" {...fadeInUp}>
      {/* Use existing HeroSkeleton from FirstTimeHeroCard or create new one */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-background p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-56 bg-muted animate-pulse rounded" />
          <div className="flex gap-2 mt-4">
            <div className="h-12 w-28 bg-muted animate-pulse rounded" />
            <div className="h-12 w-28 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    </motion.section>
  </Suspense>
);

// ============ STEP 4: Add Personalized Recommendations after first generation ============
// Добавить после ContinueDraftCard (примерно строка ~320):

{/* Personalized Recommendations - shown after first generation */}
{firstTrack && !isNewUser && (
  <Suspense fallback={<TrackGridSkeleton count={4} columns={2} />}>
    <motion.section className="mb-4" {...lazySectionAnimation}>
      <PersonalizedRecommendations
        userTrack={firstTrack}
        maxRecommendations={8}
        onTrackClick={(trackId) => {
          hapticFeedback("light");
          navigate(`/track/${trackId}`);
        }}
        onCreateSimilar={(style, mood) => {
          hapticFeedback("medium");
          // Store preset for GenerateSheet
          const presetParams = {
            style,
            description: `${style} with ${mood} mood`,
            mood,
            quick: true,
          };
          sessionStorage.setItem('quickStartPreset', JSON.stringify(presetParams));
          sessionStorage.setItem('fromQuickCreate', 'true');
          navigate('/', { state: { openGenerate: true } });
        }}
        onExploreMore={() => {
          hapticFeedback("light");
          navigate('/library');
        }}
      />
    </motion.section>
  </Suspense>
)}

// ============ STEP 5: Add Continue Creating CTA after Featured Section ============
// Добавить после FeaturedSection (примерно строка ~340):

{/* Continue Creating CTA - shown after playing a track */}
{user && firstTrack && (
  <motion.section className="mb-4" {...fadeInUp}>
    <ContinueCreatingCTA
      track={firstTrack}
      variant="banner"
      onDismiss={() => {
        // Track dismissal in localStorage
        const dismissed = JSON.parse(
          localStorage.getItem('dismissed-continue-creating') || '{}'
        );
        dismissed[firstTrack.id] = Date.now();
        localStorage.setItem('dismissed-continue-creating', JSON.stringify(dismissed));
      }}
    />
  </motion.section>
)}

// ============ STEP 6: Replace loading skeletons for sections ============
// Заменить isLoading={showSkeleton} на:

{showSkeleton ? (
  <>
    {/* New Users: Hero Skeleton */}
    {isNewUser && <TrackGridSkeleton count={1} columns={1} />}

    {/* Featured Section Skeleton */}
    <FeaturedSectionSkeleton />

    {/* Recent Tracks Skeleton */}
    {user && <TrackListSkeleton count={5} />}
  </>
) : (
  // ... existing content
)}

// ============ STEP 7: Add First Comment CTA to track cards ============
// Это требует обновления TrackCard компонента отдельно

// В src/components/library/TrackCard.tsx добавить:

import { FirstCommentCTA } from '@/components/comments/FirstCommentCTA';

// Внутри компонента TrackCard, после метаданных трека:

{track.comment_count === 0 && !hasCommented && (
  <FirstCommentCTA
    trackId={track.id}
    trackTitle={track.title}
    variant="compact"
    onOpenComments={() => onOpenComments?.(track.id)}
  />
)}

// ============ USAGE INSTRUCTIONS ============
/**
 * 1. Copy imports to top of Index.tsx
 * 2. Add hook declaration after existing useState
 * 3. Add PersonalizedRecommendations section after ContinueDraftCard
 * 4. Add ContinueCreatingCTA after FeaturedSection
 * 5. Update loading states with new skeletons
 * 6. Test all integrations
 */
