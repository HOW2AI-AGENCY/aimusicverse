import { useParams } from 'react-router-dom';
import { StemStudioContent } from '@/components/stem-studio/StemStudioContent';
import { TrackStudioContent } from '@/components/stem-studio/TrackStudioContent';
import { useTrackStems } from '@/hooks/useTrackStems';
import { FeatureErrorBoundary } from '@/components/ui/feature-error-boundary';

export default function StemStudio() {
  const params = useParams();
  const trackId = params.trackId;
  const { data: stems, isLoading } = useTrackStems(trackId || '');

  if (!trackId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Трек не найден</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Route to appropriate studio based on stem availability
  const hasStems = stems && stems.length > 0;

  return (
    <FeatureErrorBoundary featureName="Stem Studio">
      {hasStems ? (
        <StemStudioContent key={trackId} trackId={trackId} />
      ) : (
        <TrackStudioContent key={trackId} trackId={trackId} />
      )}
    </FeatureErrorBoundary>
  );
}
