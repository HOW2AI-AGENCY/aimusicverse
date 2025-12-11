import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Music, Split, Scissors, Mic2, 
  Music2, Clock, Shuffle, Download, Share2, Heart
} from 'lucide-react';
import { FeatureErrorBoundary } from '@/components/ui/feature-error-boundary';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTrackStems } from '@/hooks/useTrackStems';
import { useTracks } from '@/hooks/useTracksOptimized';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStudioStore } from '@/stores/useStudioStore';
import { StudioProvider, useStudio } from '@/components/studio/StudioProvider';
import { StemMixer } from '@/components/studio/StemMixer';
import { StudioQuickActions } from '@/components/studio/StudioQuickActions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { TrackInfo } from '@/stores/useStudioStore';

/**
 * UnifiedStudio - Clean, focused studio interface
 */

function StudioInterface({ trackId, hasStems }: { trackId: string; hasStems: boolean }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { play, pause, seek, skip } = useStudio();
  
  const audio = useStudioStore((state) => state.audio);
  const track = useStudioStore((state) => state.track);
  const setVolume = useStudioStore((state) => state.setVolume);
  const toggleMute = useStudioStore((state) => state.toggleMute);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (audio.isPlaying) {
      pause();
    } else {
      await play();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50 safe-area-inset-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Студия</p>
          <h1 className="font-semibold truncate">{track?.title || 'Без названия'}</h1>
        </div>

        <div className="flex items-center gap-1">
          {hasStems && (
            <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
              Стемы
            </Badge>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Cover & Track Info */}
        <div className="p-4 pb-2">
          <div className="flex gap-4 items-start">
            {track?.coverUrl ? (
              <motion.img 
                src={track.coverUrl} 
                alt={track.title || ''} 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover shadow-lg"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-muted flex items-center justify-center">
                <Music className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-lg font-bold truncate mb-1">
                {track?.title || 'Без названия'}
              </h2>
              {track?.style && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {track.style}
                </p>
              )}
              
              {/* Mini actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-3 gap-1.5">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">Лайк</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3 gap-1.5">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs">Поделиться</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="px-4 py-3">
          <div className="h-20 bg-muted/30 rounded-xl flex items-center justify-center overflow-hidden">
            <div className="flex items-end gap-[2px] h-12">
              {Array.from({ length: 60 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary/60 rounded-full"
                  animate={{ 
                    height: audio.isPlaying 
                      ? Math.random() * 40 + 8 
                      : 8 + Math.abs(Math.sin(i * 0.2)) * 24
                  }}
                  transition={{ 
                    duration: audio.isPlaying ? 0.1 : 0.5,
                    repeat: audio.isPlaying ? Infinity : 0,
                    repeatType: "reverse"
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 space-y-1">
          <Slider
            value={[audio.currentTime]}
            min={0}
            max={audio.duration || 100}
            step={0.1}
            onValueChange={(v) => seek(v[0])}
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatTime(audio.currentTime)}</span>
            <span>{formatTime(audio.duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip('back')}
            className="h-12 w-12 rounded-full"
          >
            <SkipBack className="w-6 h-6" />
          </Button>
          
          <Button
            size="icon"
            onClick={handlePlayPause}
            className="h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          >
            {audio.isPlaying ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 ml-1" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip('forward')}
            className="h-12 w-12 rounded-full"
          >
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-center gap-3 pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8 rounded-full"
          >
            {audio.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider
            value={[audio.muted ? 0 : audio.volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => setVolume(v[0])}
            className="w-28"
          />
        </div>

        <Separator className="mx-4" />

        {/* Stem Mixer or Separation Prompt */}
        {hasStems ? (
          <StemMixer trackId={trackId} />
        ) : (
          <StudioQuickActions 
            trackId={trackId} 
            hasSunoId={!!track?.sunoId}
            showSeparationPrompt={true}
          />
        )}
      </main>
    </div>
  );
}

export default function UnifiedStudio() {
  const params = useParams();
  const navigate = useNavigate();
  const trackId = params.trackId;
  
  const { data: stems, isLoading: stemsLoading } = useTrackStems(trackId || '');
  const { tracks, isLoading: tracksLoading } = useTracks();
  const track = tracks?.find(t => t.id === trackId);

  const isLoading = stemsLoading || tracksLoading;
  const hasStems = !!(stems && stems.length > 0);

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

  if (!track) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Трек не найден</p>
      </div>
    );
  }

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
        <StudioInterface trackId={trackId} hasStems={hasStems} />
      </StudioProvider>
    </FeatureErrorBoundary>
  );
}
