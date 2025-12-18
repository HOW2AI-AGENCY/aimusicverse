import { useParams, useNavigate } from 'react-router-dom';
import { StemStudioContent } from '@/components/stem-studio/StemStudioContent';
import { TrackStudioContent } from '@/components/stem-studio/TrackStudioContent';
import { useTrackStems } from '@/hooks/useTrackStems';
import { useTracks } from '@/hooks/useTracks';
import { FeatureErrorBoundary } from '@/components/ui/feature-error-boundary';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Music2, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function StemStudio() {
  const params = useParams();
  const navigate = useNavigate();
  const trackId = params.trackId;
  const { tracks, isLoading: tracksLoading } = useTracks();
  const { data: stems, isLoading: stemsLoading } = useTrackStems(trackId || '');

  const track = tracks?.find(t => t.id === trackId);
  const isLoading = tracksLoading || stemsLoading;

  // Validate track exists and is generated
  useEffect(() => {
    if (!isLoading && trackId && tracks) {
      if (!track) {
        toast.error('Трек не найден');
        navigate('/library');
      } else if (!track.audio_url) {
        toast.error('Трек ещё не сгенерирован');
        navigate('/library');
      }
    }
  }, [isLoading, trackId, tracks, track, navigate]);

  if (!trackId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Трек не найден</p>
        <Button variant="outline" onClick={() => navigate('/library')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          В библиотеку
        </Button>
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

  // Track not found or not generated - will redirect via useEffect
  if (!track || !track.audio_url) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Music2 className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          {!track ? 'Трек не найден' : 'Трек ещё не сгенерирован'}
        </p>
        <Button variant="outline" onClick={() => navigate('/library')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          В библиотеку
        </Button>
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