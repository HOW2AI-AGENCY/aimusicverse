import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FeatureErrorBoundary } from '@/components/ui/feature-error-boundary';
import { useTrackStems } from '@/hooks/useTrackStems';
import { useTracks } from '@/hooks/useTracksOptimized';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  StudioLayout, 
  StudioProvider, 
  useStudioStore,
  selectActiveTab,
  PlayerTabContent,
  ToolsTabContent,
  ExportTabContent,
  type TrackInfo 
} from '@/components/studio';
import { StemSeparationPrompt } from '@/components/studio/StemSeparationPrompt';
import { StemStudioContent } from '@/components/stem-studio/StemStudioContent';
import { TrackStudioContent } from '@/components/stem-studio/TrackStudioContent';
import { toast } from 'sonner';

/**
 * UnifiedStudio - Universal Studio page for all tracks
 * Shows stem separation prompt if no stems available
 */

function StudioContent({ trackId, hasStems }: { trackId: string; hasStems: boolean }) {
  const activeTab = useStudioStore(selectActiveTab);
  const { tracks } = useTracks();
  const track = tracks?.find(t => t.id === trackId);
  const [showStemPrompt, setShowStemPrompt] = useState(!hasStems);
  const [skipStemPrompt, setSkipStemPrompt] = useState(false);

  // Reset prompt when stems become available
  useEffect(() => {
    if (hasStems) {
      setShowStemPrompt(false);
    }
  }, [hasStems]);

  const handleToolSelect = useCallback((toolId: string) => {
    toast.info(`Выбран инструмент: ${toolId}`);
    // Here we would open the appropriate dialog
  }, []);

  // Show stem separation prompt for tracks without stems
  if (showStemPrompt && !skipStemPrompt && track) {
    return (
      <div className="h-full flex items-center justify-center">
        <StemSeparationPrompt
          trackId={trackId}
          trackTitle={track.title || 'Без названия'}
          audioUrl={track.audio_url}
          sunoId={track.suno_id}
          onSeparationStarted={() => {
            toast.info('Разделение запущено, вы получите уведомление');
            setSkipStemPrompt(true);
          }}
          onSkip={() => setSkipStemPrompt(true)}
          className="max-w-lg"
        />
      </div>
    );
  }

  // Render tab content
  switch (activeTab) {
    case 'player':
      return <PlayerTabContent />;
    case 'tools':
      return <ToolsTabContent onToolSelect={handleToolSelect} />;
    case 'export':
      return <ExportTabContent />;
    case 'mixer':
      // Mixer only available with stems
      if (hasStems) {
        return <StemStudioContent trackId={trackId} />;
      }
      return (
        <div className="h-full flex items-center justify-center p-4">
          <StemSeparationPrompt
            trackId={trackId}
            trackTitle={track?.title || 'Без названия'}
            audioUrl={track?.audio_url || null}
            sunoId={track?.suno_id || null}
            onSeparationStarted={() => toast.info('Разделение запущено')}
            className="max-w-lg"
          />
        </div>
      );
    case 'editor':
      return <TrackStudioContent trackId={trackId} />;
    case 'ai':
      return (
        <div className="p-4 text-center text-muted-foreground">
          AI Анализ скоро будет доступен
        </div>
      );
    default:
      return <PlayerTabContent />;
  }
}

export default function UnifiedStudio() {
  const params = useParams();
  const navigate = useNavigate();
  const trackId = params.trackId;
  const isMobile = useIsMobile();
  
  const { data: stems, isLoading: stemsLoading } = useTrackStems(trackId || '');
  const { tracks, isLoading: tracksLoading } = useTracks();
  const track = tracks?.find(t => t.id === trackId);

  const isLoading = stemsLoading || tracksLoading;
  const hasStems = !!(stems && stems.length > 0);

  // Not found
  if (!trackId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Трек не найден</p>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Track not found
  if (!track) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Трек не найден</p>
      </div>
    );
  }

  // Build track info for provider
  const trackInfo: TrackInfo = {
    id: track.id,
    title: track.title || 'Без названия',
    audioUrl: track.audio_url,
    coverUrl: track.cover_url,
    lyrics: track.lyrics,
    style: track.style,
    sunoId: track.suno_id,
    sunoTaskId: track.suno_task_id,
  };

  return (
    <FeatureErrorBoundary featureName="Studio">
      <StudioProvider trackId={trackId} track={trackInfo} hasStems={hasStems}>
        <StudioLayout
          showTabs={true}
          showPlayer={true}
          onShowTutorial={() => toast.info('Обучение скоро будет доступно')}
        >
          <StudioContent trackId={trackId} hasStems={hasStems} />
        </StudioLayout>
      </StudioProvider>
    </FeatureErrorBoundary>
  );
}
