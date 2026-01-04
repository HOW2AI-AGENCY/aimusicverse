/**
 * DesktopFullscreenPlayer - Desktop optimized fullscreen player
 * 
 * Features:
 * - Synchronized lyrics with word highlighting using useLyricsSynchronization
 * - Two-column layout (cover + controls | lyrics)
 * - Volume control
 * - Keyboard shortcuts support
 * - Full action bar with context menu
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ListMusic, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAudioTime } from '@/hooks/audio/useAudioTime';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useGlobalAudioPlayer } from '@/hooks/audio/useGlobalAudioPlayer';
import { Track } from '@/types/track';
import { LazyImage } from '@/components/ui/lazy-image';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { WaveformProgressBar } from './WaveformProgressBar';
import { QueueSheet } from './QueueSheet';
import { LyricsPanel } from './LyricsPanel';
import { UnifiedPlayerControls } from './UnifiedPlayerControls';
import { PlayerActionsBar } from './PlayerActionsBar';
import { hapticImpact } from '@/lib/haptic';
import { logger } from '@/lib/logger';

interface TrackVersion {
  id: string;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  version_type: string;
  is_primary: boolean;
  metadata?: Record<string, unknown>;
}

interface DesktopFullscreenPlayerProps {
  track: Track;
  versions?: TrackVersion[];
  currentVersion?: TrackVersion | null;
  onClose: () => void;
}

export function DesktopFullscreenPlayer({ 
  track, 
  versions = [], 
  currentVersion, 
  onClose 
}: DesktopFullscreenPlayerProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [queueSheetOpen, setQueueSheetOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    versions.find(v => v.is_primary)?.id || versions[0]?.id || null
  );
  
  const { currentTime, duration, buffered, seek } = useAudioTime();
  const { isPlaying, volume, preservedTime, clearPreservedTime } = usePlayerStore();
  const { audioElement } = useGlobalAudioPlayer();
  
  // Ensure AudioContext is ready on mount with blob URL recovery
  useEffect(() => {
    let mounted = true;
    let hasRecovered = false;
    
    const ensureAudio = async () => {
      if (!audioElement || !mounted) {
        logger.warn('No audio element available on desktop fullscreen open');
        return;
      }
      
      try {
        const { resumeAudioContext, ensureAudioRoutedToDestination } = await import('@/lib/audioContextManager');
        
        const resumed = await resumeAudioContext(3);
        if (!resumed) {
          logger.warn('Failed to resume AudioContext on desktop fullscreen open');
        }
        
        await ensureAudioRoutedToDestination();
        
        if (audioElement.volume !== volume) {
          audioElement.volume = volume;
        }
        
        const audioSrc = audioElement.src;
        const isBlobSource = audioSrc?.startsWith('blob:');
        const canonicalUrl = track.streaming_url || track.audio_url;
        
        // Try to resume playback
        if (isPlaying && audioElement.paused && audioSrc) {
          logger.info('Attempting to resume audio on desktop fullscreen open', { 
            isBlobSource, 
            src: audioSrc.substring(0, 60) 
          });
          
          try {
            await audioElement.play();
            logger.info('Desktop fullscreen playback resumed successfully');
          } catch (playErr) {
            const error = playErr as Error;
            
            // If blob URL fails with format error, recover with canonical URL
            if ((error.name === 'NotSupportedError' || audioElement.error?.code === 4) && 
                isBlobSource && canonicalUrl && !hasRecovered) {
              hasRecovered = true;
              logger.info('Blob URL failed, recovering with canonical URL', { 
                canonicalUrl: canonicalUrl.substring(0, 60) 
              });
              
              const currentTime = preservedTime ?? audioElement.currentTime;
              audioElement.src = canonicalUrl;
              audioElement.load();
              
              // Wait for audio to be ready, then restore position and play
              audioElement.addEventListener('canplay', async function onCanPlay() {
                audioElement.removeEventListener('canplay', onCanPlay);
                if (!mounted) return;
                
                if (currentTime > 0 && !isNaN(currentTime)) {
                  audioElement.currentTime = currentTime;
                }
                clearPreservedTime();
                
                try {
                  await audioElement.play();
                  logger.info('Playback recovered successfully after blob error');
                } catch (retryErr) {
                  logger.error('Recovery play failed', retryErr);
                }
              }, { once: true });
              
              return;
            }
            
            if (error.name !== 'AbortError') {
              logger.error('Failed to resume audio on desktop fullscreen', playErr);
            }
          }
        }
        
        logger.info('Desktop fullscreen player audio initialized', { 
          volume, 
          isPlaying,
          audioPaused: audioElement.paused,
          isBlobSource
        });
      } catch (err) {
        logger.error('Error initializing desktop fullscreen audio', err);
      }
    };
    
    const timer = setTimeout(ensureAudio, 100);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [audioElement, isPlaying, volume, track.streaming_url, track.audio_url, preservedTime, clearPreservedTime]);

  // Restore preserved time on mount (from mode switch)
  useEffect(() => {
    if (preservedTime !== null && audioElement && !isNaN(preservedTime)) {
      const timer = setTimeout(() => {
        if (audioElement && preservedTime !== null) {
          audioElement.currentTime = preservedTime;
          clearPreservedTime();
          logger.info('Restored preserved time on desktop fullscreen', { time: preservedTime });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [preservedTime, audioElement, clearPreservedTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.code) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          seek(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          seek(Math.min(duration, currentTime + 10));
          break;
        case 'KeyF':
          setIsMaximized(prev => !prev);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, seek, currentTime, duration]);

  const selectedVersion = versions.find(v => v.id === selectedVersionId);
  const audioUrl = selectedVersion?.audio_url || track.audio_url;
  const coverUrl = selectedVersion?.cover_url || track.cover_url;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: '0%' }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'fixed inset-0 z-50 bg-background/95 backdrop-blur-xl',
        isMaximized ? 'p-0' : 'p-4 md:p-8'
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
              onClick={() => setIsMaximized(!isMaximized)}
              className="hidden md:flex"
              aria-label={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content - Two column layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Left: Album Art & Controls */}
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Album Art */}
            <Card className="relative aspect-square w-full max-w-md overflow-hidden glass-card border-primary/20">
              {coverUrl ? (
                <LazyImage
                  src={coverUrl}
                  alt={track.title || 'Track cover'}
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
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

            {/* Controls Card */}
            <Card className="w-full max-w-md glass-card border-primary/20 p-6 space-y-4">
              {/* Waveform Progress Bar */}
              <WaveformProgressBar
                audioUrl={audioUrl}
                trackId={track.id}
                currentTime={currentTime}
                duration={duration}
                buffered={buffered}
                onSeek={seek}
                mode="detailed"
                showBeatGrid={true}
              />

              {/* Action Buttons - PlayerActionsBar + Queue */}
              <div className="flex items-center justify-between">
                <PlayerActionsBar 
                  track={track} 
                  variant="horizontal"
                  size="md"
                  showStudioButton={true}
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    hapticImpact('light');
                    setQueueSheetOpen(true);
                  }}
                  className="h-11 w-11 touch-manipulation rounded-full hover:bg-muted/50"
                  aria-label="Queue"
                >
                  <ListMusic className="h-5 w-5" />
                </Button>
              </div>

              {/* Playback Controls with Seek Buttons */}
              <UnifiedPlayerControls 
                variant="fullscreen" 
                size="lg" 
                showVolume={true}
                showShuffleRepeat={true}
                showSeekButtons={true}
                seekSeconds={10}
              />
            </Card>
          </div>

          {/* Right: Lyrics Panel */}
          <Card className="glass-card border-primary/20 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border/50">
              <h3 className="text-lg md:text-xl font-semibold">Текст песни</h3>
            </div>
            <LyricsPanel 
              track={track} 
              variant="desktop" 
              showWordHighlight={true}
              className="flex-1"
            />
          </Card>
        </div>
      </div>
      
      {/* Queue Sheet */}
      <QueueSheet open={queueSheetOpen} onOpenChange={setQueueSheetOpen} />
    </motion.div>
  );
}

export default DesktopFullscreenPlayer;
