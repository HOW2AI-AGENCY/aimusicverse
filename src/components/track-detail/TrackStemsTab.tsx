import { useState, useRef, useEffect } from 'react';
import { useTrackStems } from '@/hooks/useTrackStems';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Loader2, Mic, Volume2, Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getStemLabel } from '@/lib/stemLabels';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { 
  registerStudioAudio, 
  unregisterStudioAudio, 
  pauseAllStudioAudio 
} from '@/hooks/studio/useStudioAudio';

interface TrackStemsTabProps {
  trackId: string;
}

export const TrackStemsTab = ({ trackId }: TrackStemsTabProps) => {
  const { data: stems, isLoading } = useTrackStems(trackId);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceId = `stems-tab-${trackId}`;
  
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();

  // Register with studio audio coordinator
  useEffect(() => {
    registerStudioAudio(sourceId, () => {
      audioRef.current?.pause();
      setPlayingId(null);
    });

    return () => {
      unregisterStudioAudio(sourceId);
      audioRef.current?.pause();
    };
  }, [sourceId]);

  // Pause when global player starts
  useEffect(() => {
    if (globalIsPlaying && playingId) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
  }, [globalIsPlaying, playingId]);

  const handlePlay = (stemId: string, audioUrl: string) => {
    if (playingId === stemId) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Stop any current playback
    audioRef.current?.pause();

    // Pause global player and other studio audio
    pauseTrack();
    pauseAllStudioAudio(sourceId);

    // Play this stem
    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(stemId);
  };

  const getStemIcon = (stemType: string) => {
    switch (stemType.toLowerCase()) {
      case 'vocal':
        return <Mic className="w-4 h-4" />;
      case 'instrumental':
        return <Volume2 className="w-4 h-4" />;
      default:
        return <Music className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stems || stems.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Стемы не найдены</h3>
        <p className="text-muted-foreground text-sm">
          Разделите трек на стемы через меню действий
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Стемы трека ({stems.length})
        </h3>
        {stems[0]?.separation_mode && (
          <Badge variant="secondary">
            {stems[0].separation_mode === 'simple' ? 'Простое разделение' : 'Детальное разделение'}
          </Badge>
        )}
      </div>

      <div className="grid gap-3">
        {stems.map((stem) => (
          <Card key={stem.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  {getStemIcon(stem.stem_type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{getStemLabel(stem.stem_type)}</h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(stem.created_at || '').toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant={playingId === stem.id ? "default" : "ghost"}
                  onClick={() => handlePlay(stem.id, stem.audio_url)}
                >
                  {playingId === stem.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    window.open(stem.audio_url, '_blank');
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
