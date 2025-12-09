import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Volume2, VolumeX, Maximize2, Minimize2, Heart, Download, MoreHorizontal, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAudioTime } from '@/hooks/audio';
import { usePlayerStore } from '@/hooks/audio';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useTracks, Track } from '@/hooks/useTracksOptimized';
import { useTrackActions } from '@/hooks/useTrackActions';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { PlaybackControls } from '@/components/player/PlaybackControls';
import { ProgressBar } from '@/components/player/ProgressBar';
import { QueueSheet } from '@/components/player/QueueSheet';
import { MobileFullscreenPlayer } from '@/components/player/MobileFullscreenPlayer';
import { useIsMobile } from '@/hooks/use-mobile';
import { hapticImpact } from '@/lib/haptic';

interface AlignedWord {
  word: string;
  startS: number;
  endS: number;
}

interface TrackVersion {
  id: string;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  version_type: string;
  is_primary: boolean;
  metadata?: Record<string, unknown>;
}

interface FullscreenPlayerProps {
  track: Track;
  versions?: TrackVersion[];
  onClose: () => void;
}

export function FullscreenPlayer({ track, versions = [], onClose }: FullscreenPlayerProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [queueSheetOpen, setQueueSheetOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    versions.find(v => v.is_primary)?.id || versions[0]?.id || null
  );
  
  const { toggleLike, downloadTrack } = useTracks();
  const { handleShare } = useTrackActions();
  
  // Use global audio system instead of local useAudioPlayer
  const { currentTime, duration, buffered, seek, setVolume: setAudioVolume } = useAudioTime();
  const { isPlaying } = usePlayerStore();
  
  const { data: lyricsData } = useTimestampedLyrics(
    track.suno_task_id || null,
    track.suno_id || null
  );
  
  const lyricsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll lyrics
  useEffect(() => {
    if (!lyricsData?.alignedWords || !lyricsRef.current) return;

    const currentWord = lyricsData.alignedWords.find(
      (word) => currentTime >= word.startS && currentTime <= word.endS
    );

    if (currentWord) {
      const wordElement = lyricsRef.current.querySelector(`[data-start="${currentWord.startS}"]`);
      if (wordElement) {
        wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, lyricsData]);

  // NOW it's safe to do conditional return after all hooks
  if (isMobile) {
    return <MobileFullscreenPlayer track={track} onClose={onClose} />;
  }

  const selectedVersion = versions.find(v => v.id === selectedVersionId);
  const audioUrl = selectedVersion?.audio_url || track.audio_url;
  const coverUrl = selectedVersion?.cover_url || track.cover_url;

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setAudioVolume(newVolume);
    if (newVolume > 0 && muted) setMuted(false);
  };

  const toggleMute = () => {
    if (muted) {
      setAudioVolume(volume);
      setMuted(false);
    } else {
      setAudioVolume(0);
      setMuted(true);
    }
  };

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const skipSeconds = (seconds: number) => {
    seek(Math.max(0, Math.min(duration, currentTime + seconds)));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: '0%' }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'fixed inset-0 z-50 bg-background/95 backdrop-blur-xl',
        isFullscreen ? 'p-0' : 'p-4 md:p-8'
      )}
    >
      <div className="h-full flex flex-col max-w-7xl mx-auto pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold truncate">
              {track.title || 'Без названия'}
            </h2>
            {track.style && (
              <p className="text-muted-foreground text-sm md:text-base">{track.style}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleShare(track)}
            >
                <MoreHorizontal className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="hidden md:flex"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Left: Album Art & Controls */}
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Album Art */}
            <Card className="relative aspect-square w-full max-w-md overflow-hidden glass-card border-primary/20">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={track.title || 'Track cover'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="text-6xl font-bold text-primary/20">
                    {track.title?.charAt(0) || '♪'}
                  </div>
                </div>
              )}
            </Card>

            {/* Version Selector */}
            {versions.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center">
                {versions.map((version, index) => (
                  <TooltipProvider key={version.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={selectedVersionId === version.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedVersionId(version.id)}
                          className={cn("min-w-20", version.is_primary && "border-primary")}
                        >
                          <Badge variant={version.is_primary ? 'default' : 'secondary'} className="mr-2">
                            {version.is_primary ? '★' : index + 1}
                          </Badge>
                          {version.version_type === 'original' ? 'Оригинал' : `Версия ${index + 1}`}
                        </Button>
                      </TooltipTrigger>
                      {version.is_primary && (
                        <TooltipContent>
                          <p>Основная версия</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}

            {/* Controls */}
            <Card className="w-full max-w-md glass-card border-primary/20 p-6 space-y-4">
              {/* Progress Bar */}
              <ProgressBar
                currentTime={currentTime}
                duration={duration}
                buffered={buffered}
                onSeek={seek}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    hapticImpact('light');
                    toggleLike({ trackId: track.id, isLiked: track.is_liked });
                  }}
                  className="h-11 w-11 touch-manipulation"
                  aria-label={track.is_liked ? "Unlike" : "Like"}
                >
                  <Heart className={cn("h-5 w-5", track.is_liked && "fill-current text-red-500")} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    hapticImpact('light');
                    setQueueSheetOpen(true);
                  }}
                  className="h-11 w-11 touch-manipulation"
                  aria-label="Queue"
                >
                  <ListMusic className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    hapticImpact('light');
                    downloadTrack({ trackId: track.id, audioUrl: audioUrl!, coverUrl: coverUrl! });
                  }}
                  className="h-11 w-11 touch-manipulation"
                  aria-label="Download"
                  disabled={!audioUrl}
                >
                  <Download className="h-5 w-5" />
                </Button>
              </div>

              {/* Playback Controls */}
              <PlaybackControls size="large" />

              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-11 w-11 flex-shrink-0 touch-manipulation"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[muted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                  aria-label="Volume"
                />
              </div>
            </Card>
          </div>

          {/* Right: Lyrics */}
          <Card className="glass-card border-primary/20 p-4 md:p-6 overflow-hidden flex flex-col">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Текст песни</h3>
            <div
              ref={lyricsRef}
              className="flex-1 overflow-y-auto space-y-1 pb-20 md:pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
            >
              {lyricsData?.alignedWords && lyricsData.alignedWords.length > 0 ? (
                <div className="space-y-2 md:space-y-4">
                  {lyricsData.alignedWords.reduce((lines, word, index) => {
                    if (index === 0 || word.word.includes('\n')) {
                      lines.push([]);
                    }
                    lines[lines.length - 1].push(word);
                    return lines;
                  }, [] as AlignedWord[][]).map((line, lineIndex) => {
                    const isActive = line.some(word => currentTime >= word.startS && currentTime <= word.endS);
                    const isPast = line.every(word => currentTime > word.endS);
                    return (
                      <motion.div
                        key={lineIndex}
                        initial={{ opacity: 0.4 }}
                        animate={{
                            opacity: isActive ? 1 : isPast ? 0.6 : 0.4,
                            scale: isActive ? 1.05 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          'text-base md:text-lg lg:text-xl font-medium cursor-pointer transition-all',
                          isActive && 'font-bold text-primary'
                        )}
                        onClick={() => seek(line[0].startS)}
                      >
                        {line.map((word, wordIndex) => (
                          <span key={wordIndex} className="mr-2">{word.word.replace('\n', '')}</span>
                        ))}
                      </motion.div>
                    );
                  })}
                </div>
              ) : track.lyrics ? (
                <div className="whitespace-pre-wrap text-base md:text-lg leading-relaxed pb-20 md:pb-0">
                  {track.lyrics}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Текст песни недоступен</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      {/* Queue Sheet */}
      <QueueSheet open={queueSheetOpen} onOpenChange={setQueueSheetOpen} />
    </motion.div>
  );
}
