import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Pause, SkipBack, SkipForward, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrackStems } from '@/hooks/useTrackStems';
import { useTracks } from '@/hooks/useTracks';
import { StemTrack } from '@/components/stem-studio/StemTrack';
import { StudioTimeline } from '@/components/stem-studio/StudioTimeline';
import { toast } from 'sonner';

interface StemStudioContentProps {
  trackId: string;
}

export const StemStudioContent = ({ trackId }: StemStudioContentProps) => {
  const navigate = useNavigate();
  const { data: stems, isLoading: stemsLoading } = useTrackStems(trackId);
  const { tracks } = useTracks();
  const track = tracks?.find(t => t.id === trackId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [stemStates, setStemStates] = useState<Record<string, { muted: boolean; solo: boolean; volume: number }>>({});

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (stems) {
      const initialStates: Record<string, { muted: boolean; solo: boolean; volume: number }> = {};
      let maxDuration = 0;

      stems.forEach(stem => {
        initialStates[stem.id] = { muted: false, solo: false, volume: 0.85 };

        const audio = new Audio(stem.audio_url);
        audio.crossOrigin = 'anonymous';
        audioRefs.current[stem.id] = audio;

        audio.addEventListener('loadedmetadata', () => {
          if (audio.duration > maxDuration) {
            maxDuration = audio.duration;
            setDuration(maxDuration);
          }
        });
      });
      setStemStates(initialStates);
    }

    const audioElements = Object.values(audioRefs.current);
    return () => {
      audioElements.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [stems]);

  const updateTime = () => {
    if (isPlaying) {
      const firstAudio = Object.values(audioRefs.current)[0];
      if (firstAudio) {
        setCurrentTime(firstAudio.currentTime);
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  };

  const togglePlay = async () => {
    const audios = Object.values(audioRefs.current);

    if (isPlaying) {
      audios.forEach(audio => audio.pause());
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlaying(false);
    } else {
      // Sync all audio elements
      const targetTime = currentTime;
      audios.forEach(audio => {
        audio.currentTime = targetTime;
      });

      // Play all non-muted stems
      const playPromises = audios.map((audio, idx) => {
        const stemId = stems?.[idx]?.id;
        if (stemId && !stemStates[stemId]?.muted) {
          audio.volume = stemStates[stemId]?.volume || 0.85;
          return audio.play();
        }
        return Promise.resolve();
      });

      try {
        await Promise.all(playPromises);
        setIsPlaying(true);
        animationFrameRef.current = requestAnimationFrame(updateTime);
      } catch (error) {
        console.error('Error playing audio:', error);
        toast.error('Ошибка воспроизведения');
      }
    }
  };

  const handleStemToggle = (stemId: string, type: 'mute' | 'solo') => {
    setStemStates(prev => {
      const newStates = { ...prev };

      if (type === 'solo') {
        const isSolo = !prev[stemId].solo;

        // If enabling solo, mute all others
        if (isSolo) {
          Object.keys(newStates).forEach(id => {
            newStates[id] = { ...newStates[id], muted: id !== stemId };
          });
        } else {
          // If disabling solo, unmute all
          Object.keys(newStates).forEach(id => {
            newStates[id] = { ...newStates[id], muted: false };
          });
        }

        newStates[stemId] = { ...newStates[stemId], solo: isSolo };
      } else {
        newStates[stemId] = { ...newStates[stemId], muted: !prev[stemId].muted };
      }

      // Apply mute state to audio
      Object.keys(newStates).forEach(id => {
        const audio = audioRefs.current[id];
        if (audio) {
          audio.volume = newStates[id].muted ? 0 : (newStates[id].volume || 0.85);
        }
      });

      return newStates;
    });
  };

  const handleVolumeChange = (stemId: string, volume: number) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: { ...prev[stemId], volume }
    }));

    const audio = audioRefs.current[stemId];
    if (audio && !stemStates[stemId]?.muted) {
      audio.volume = volume;
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    Object.values(audioRefs.current).forEach(audio => {
      audio.currentTime = time;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track || stemsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stems || stems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">У этого трека нет стемов</p>
        <Button onClick={() => navigate('/library')}>Вернуться в библиотеку</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/library')}
            className="rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="h-6 w-[1px] bg-border" />
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Студия стемов
            </span>
            <h1 className="text-sm font-semibold">{track.title || 'Без названия'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Поделиться
          </Button>
        </div>
      </header>

      {/* Timeline */}
      <StudioTimeline
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
      />

      {/* Tracks */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
        {stems.map((stem) => (
          <StemTrack
            key={stem.id}
            stem={stem}
            state={stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 }}
            onToggle={(type) => handleStemToggle(stem.id, type)}
            onVolumeChange={(vol) => handleVolumeChange(stem.id, vol)}
            isPlaying={isPlaying}
          />
        ))}
      </main>

      {/* Footer Player */}
      <footer className="fixed bottom-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border/50 px-6 py-4">
        <div className="flex items-center justify-between gap-6 max-w-screen-xl mx-auto">
          {/* Controls */}
          <div className="flex items-center gap-4 w-1/3">
            <Button variant="ghost" size="icon" className="rounded-full">
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              onClick={togglePlay}
              size="icon"
              className="w-12 h-12 rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            <Button variant="ghost" size="icon" className="rounded-full">
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Time Display */}
          <div className="flex flex-col items-center w-1/3">
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Export */}
          <div className="flex items-center justify-end gap-4 w-1/3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold">Экспорт</span>
              <span className="text-[10px] text-muted-foreground">MP3 • 320kbps</span>
            </div>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Микс
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
