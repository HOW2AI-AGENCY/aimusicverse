import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, HelpCircle, Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useTrackStems } from '@/hooks/useTrackStems';
import { useTracks } from '@/hooks/useTracksOptimized';
import { StemChannel } from '@/components/stem-studio/StemChannel';
import { StemDownloadPanel } from '@/components/stem-studio/StemDownloadPanel';
import { StemReferenceDialog } from '@/components/stem-studio/StemReferenceDialog';
import { MidiSection } from '@/components/stem-studio/MidiSection';
import { MixExportDialog } from '@/components/stem-studio/MixExportDialog';
import { MixPresetsMenu } from '@/components/stem-studio/MixPresetsMenu';
import { StudioLyricsPanel } from '@/components/stem-studio/StudioLyricsPanel';
import { StemStudioTutorial, useStemStudioTutorial } from '@/components/stem-studio/StemStudioTutorial';
import { useStemStudioEngine } from '@/hooks/useStemStudioEngine';
import { defaultStemEffects, StemEffects } from '@/hooks/useStemAudioEngine';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useIsMobile } from '@/hooks/use-mobile';

interface StemStudioContentProps {
  trackId: string;
}

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

export const StemStudioContent = ({ trackId }: StemStudioContentProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: stems, isLoading: stemsLoading } = useTrackStems(trackId);
  const { tracks } = useTracks();
  const track = tracks?.find(t => t.id === trackId);
  const { showTutorial, setShowTutorial, startTutorial } = useStemStudioTutorial();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.85);
  const [masterMuted, setMasterMuted] = useState(false);
  const [stemStates, setStemStates] = useState<Record<string, StemState>>({});
  const [effectsEnabled, setEffectsEnabled] = useState(false);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Audio effects engine
  const stemIds = stems?.map(s => s.id) || [];
  const {
    enginesState,
    isInitialized: engineReady,
    initializeStemEngine,
    updateStemEQ,
    updateStemCompressor,
    updateStemReverb,
    applyStemEQPreset,
    applyStemCompressorPreset,
    applyStemReverbPreset,
    resetStemEffects,
    getCompressorReduction,
    setStemVolume,
    setMasterVolume: setEngineMasterVolume,
    resumeContext,
  } = useStemStudioEngine(stemIds);

  // Sync volumes to Web Audio when effects enabled
  useEffect(() => {
    if (!effectsEnabled) return;
    
    const hasSolo = Object.values(stemStates).some(s => s.solo);
    
    Object.keys(stemStates).forEach(stemId => {
      const state = stemStates[stemId];
      if (!state) return;
      
      const isMuted = masterMuted || state.muted || (hasSolo && !state.solo);
      const volume = isMuted ? 0 : state.volume;
      setStemVolume(stemId, volume);
    });
    
    setEngineMasterVolume(masterVolume);
  }, [effectsEnabled, stemStates, masterVolume, masterMuted, setStemVolume, setEngineMasterVolume]);
  // Initialize audio elements and stem states
  useEffect(() => {
    if (!stems || stems.length === 0) return;
    
    const initialStates: Record<string, StemState> = {};
    let maxDuration = 0;

    stems.forEach(stem => {
      initialStates[stem.id] = { muted: false, solo: false, volume: 0.85 };

      if (!audioRefs.current[stem.id]) {
        const audio = new Audio(stem.audio_url);
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        audioRefs.current[stem.id] = audio;

        audio.addEventListener('loadedmetadata', () => {
          if (audio.duration > maxDuration) {
            maxDuration = audio.duration;
            setDuration(maxDuration);
          }
        });

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });

        // Initialize audio engine for this stem when effects enabled
        if (effectsEnabled) {
          initializeStemEngine(stem.id, audio);
        }
      }
    });
    
    setStemStates(prev => {
      if (Object.keys(prev).length === 0) {
        return initialStates;
      }
      return prev;
    });

    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current = {};
    };
  }, [stems, effectsEnabled, initializeStemEngine]);

  // Enable effects mode - initialize all engines
  const handleEnableEffects = useCallback(async () => {
    if (!stems) return;
    
    await resumeContext();
    
    stems.forEach(stem => {
      const audio = audioRefs.current[stem.id];
      if (audio) {
        initializeStemEngine(stem.id, audio);
      }
    });
    
    setEffectsEnabled(true);
    toast.success('Режим эффектов активирован');
  }, [stems, initializeStemEngine, resumeContext]);

  // Load mix preset
  const handleLoadPreset = useCallback((preset: {
    masterVolume: number;
    stems: Record<string, { volume: number; muted: boolean; solo: boolean; effects: StemEffects }>;
  }) => {
    setMasterVolume(preset.masterVolume);
    
    const newStates: Record<string, StemState> = {};
    Object.entries(preset.stems).forEach(([stemId, stemData]) => {
      newStates[stemId] = {
        volume: stemData.volume,
        muted: stemData.muted,
        solo: stemData.solo,
      };
      
      // Apply effects if enabled
      if (effectsEnabled && stemData.effects) {
        updateStemEQ(stemId, stemData.effects.eq);
        updateStemCompressor(stemId, stemData.effects.compressor);
        updateStemReverb(stemId, stemData.effects.reverb);
      }
    });
    
    setStemStates(newStates);
  }, [effectsEnabled, updateStemEQ, updateStemCompressor, updateStemReverb]);

  // Update volumes when master or individual volumes change
  useEffect(() => {
    const hasSolo = Object.values(stemStates).some(s => s.solo);
    
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      const state = stemStates[id];
      if (!state) return;
      
      const isMuted = masterMuted || state.muted || (hasSolo && !state.solo);
      const volume = isMuted ? 0 : state.volume * masterVolume;
      
      // When effects are enabled, audio goes through Web Audio API
      // HTMLAudioElement volume should be 1 (controlled by gainNode)
      if (effectsEnabled && enginesState[id]) {
        audio.volume = 1; // Let Web Audio handle volume
      } else {
        audio.volume = volume;
      }
    });
  }, [stemStates, masterVolume, masterMuted, effectsEnabled, enginesState]);

  const updateTime = useCallback(() => {
    const firstAudio = Object.values(audioRefs.current)[0];
    if (firstAudio) {
      setCurrentTime(firstAudio.currentTime);
    }
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, []);

  const togglePlay = async () => {
    const audios = Object.values(audioRefs.current);
    if (audios.length === 0) return;

    if (isPlaying) {
      audios.forEach(audio => audio.pause());
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlaying(false);
    } else {
      audios.forEach(audio => {
        audio.currentTime = currentTime;
      });

      try {
        await Promise.all(audios.map(audio => audio.play()));
        setIsPlaying(true);
        animationFrameRef.current = requestAnimationFrame(updateTime);
      } catch (error) {
        logger.error('Error playing audio', error);
        toast.error('Ошибка воспроизведения');
      }
    }
  };

  const handleStemToggle = (stemId: string, type: 'mute' | 'solo') => {
    setStemStates(prev => {
      const newStates = { ...prev };

      if (type === 'solo') {
        const wasSolo = prev[stemId]?.solo;
        newStates[stemId] = { ...newStates[stemId], solo: !wasSolo };
        
        if (!wasSolo) {
          Object.keys(newStates).forEach(id => {
            if (id !== stemId) {
              newStates[id] = { ...newStates[id], solo: false };
            }
          });
        }
      } else {
        newStates[stemId] = { ...newStates[stemId], muted: !prev[stemId]?.muted };
      }

      return newStates;
    });
  };

  const handleVolumeChange = (stemId: string, volume: number) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: { ...prev[stemId], volume }
    }));
  };

  const handleSeek = useCallback((value: number[] | number) => {
    const time = Array.isArray(value) ? value[0] : value;
    setCurrentTime(time);
    Object.values(audioRefs.current).forEach(audio => {
      audio.currentTime = time;
    });
  }, []);

  const handleSkip = (direction: 'back' | 'forward') => {
    const skipAmount = 10;
    const newTime = direction === 'back' 
      ? Math.max(0, currentTime - skipAmount)
      : Math.min(duration, currentTime + skipAmount);
    handleSeek([newTime]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          handleSkip('back');
          break;
        case 'ArrowRight':
          handleSkip('forward');
          break;
        case 'KeyM':
          setMasterMuted(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleSkip]);

  if (!track || stemsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stems || stems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <p className="text-muted-foreground">У этого трека нет стемов</p>
        <Button onClick={() => navigate('/library')}>Вернуться в библиотеку</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Tutorial Overlay */}
      <StemStudioTutorial 
        forceShow={showTutorial} 
        onComplete={() => setShowTutorial(false)} 
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/50 bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/library')}
            className="rounded-full h-10 w-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Студия стемов
            </span>
            <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-none">
              {track.title || 'Без названия'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Effects Mode Toggle */}
          {!effectsEnabled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableEffects}
              className="h-9 gap-1.5"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">Эффекты</span>
            </Button>
          ) : (
            <Badge variant="secondary" className="h-9 px-3 gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-xs">FX</span>
            </Badge>
          )}

          {/* Help button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={startTutorial}
            className="h-9 w-9 rounded-full"
            title="Показать обучение"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>

          {!isMobile && stems && track.audio_url && (
            <>
              <MixPresetsMenu
                trackId={trackId}
                masterVolume={masterVolume}
                stemStates={stemStates}
                stemEffects={enginesState}
                onLoadPreset={handleLoadPreset}
                effectsEnabled={effectsEnabled}
              />
              <MidiSection 
                trackId={trackId} 
                trackTitle={track.title || 'Трек'} 
                audioUrl={track.audio_url}
              />
              <StemReferenceDialog 
                stems={stems} 
                trackTitle={track.title || 'Трек'} 
                trackLyrics={track.lyrics}
                trackStyle={track.style}
                trackPrompt={track.prompt}
                trackTags={track.tags}
              />
              <StemDownloadPanel stems={stems} trackTitle={track.title || 'Трек'} />
              <MixExportDialog
                stems={stems}
                stemStates={stemStates}
                stemEffects={enginesState}
                masterVolume={masterVolume}
                trackTitle={track.title || 'Трек'}
                effectsEnabled={effectsEnabled}
              />
            </>
          )}
        </div>
      </header>

      {/* Timeline / Progress */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-card/30">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground font-mono tabular-nums w-12">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground font-mono tabular-nums w-12 text-right">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Master Volume */}
      <div className="px-4 sm:px-6 py-3 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMasterMuted(!masterMuted)}
            className={cn(
              "h-9 w-9 rounded-full",
              masterMuted && "text-destructive"
            )}
          >
            {masterMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide">Master</span>
              <span className="text-xs text-muted-foreground">{Math.round(masterVolume * 100)}%</span>
            </div>
            <Slider
              value={[masterVolume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => setMasterVolume(v[0])}
              className="w-full"
              disabled={masterMuted}
            />
          </div>
        </div>
      </div>

      {/* Synchronized Lyrics */}
      <StudioLyricsPanel
        taskId={track.suno_task_id}
        audioId={track.suno_id}
        plainLyrics={track.lyrics}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onSeek={handleSeek}
      />

      {/* Mobile Actions */}
      {isMobile && stems && (
        <div className="px-4 py-3 border-b border-border/30 flex gap-2 overflow-x-auto">
          <MixPresetsMenu
            trackId={trackId}
            masterVolume={masterVolume}
            stemStates={stemStates}
            stemEffects={enginesState}
            onLoadPreset={handleLoadPreset}
            effectsEnabled={effectsEnabled}
          />
          {track.audio_url && (
            <MidiSection 
              trackId={trackId} 
              trackTitle={track.title || 'Трек'} 
              audioUrl={track.audio_url}
            />
          )}
          <StemReferenceDialog 
            stems={stems} 
            trackTitle={track.title || 'Трек'} 
            trackLyrics={track.lyrics}
            trackStyle={track.style}
            trackPrompt={track.prompt}
            trackTags={track.tags}
          />
          <StemDownloadPanel stems={stems} trackTitle={track.title || 'Трек'} />
          <MixExportDialog
            stems={stems}
            stemStates={stemStates}
            stemEffects={enginesState}
            masterVolume={masterVolume}
            trackTitle={track.title || 'Трек'}
            effectsEnabled={effectsEnabled}
          />
        </div>
      )}

      {/* Stem Channels */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 pb-32">
        {stems.map((stem) => (
          <StemChannel
            key={stem.id}
            stem={stem}
            state={stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 }}
            effects={enginesState[stem.id]?.effects || defaultStemEffects}
            onToggle={(type) => handleStemToggle(stem.id, type)}
            onVolumeChange={(vol) => handleVolumeChange(stem.id, vol)}
            onEQChange={effectsEnabled ? (s) => updateStemEQ(stem.id, s) : undefined}
            onCompressorChange={effectsEnabled ? (s) => updateStemCompressor(stem.id, s) : undefined}
            onReverbChange={effectsEnabled ? (s) => updateStemReverb(stem.id, s) : undefined}
            onEQPreset={effectsEnabled ? (p) => applyStemEQPreset(stem.id, p) : undefined}
            onCompressorPreset={effectsEnabled ? (p) => applyStemCompressorPreset(stem.id, p) : undefined}
            onReverbPreset={effectsEnabled ? (p) => applyStemReverbPreset(stem.id, p) : undefined}
            onResetEffects={effectsEnabled ? () => resetStemEffects(stem.id) : undefined}
            getCompressorReduction={effectsEnabled ? () => getCompressorReduction(stem.id) : undefined}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            isEngineReady={effectsEnabled && engineReady}
          />
        ))}
      </main>

      {/* Footer Player */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/50 px-4 sm:px-6 py-4 safe-area-pb z-50">
        <div className={cn(
          "flex items-center gap-4 max-w-screen-xl mx-auto",
          isMobile ? "justify-center" : "justify-between"
        )}>
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-10 w-10"
              onClick={() => handleSkip('back')}
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              onClick={togglePlay}
              size="icon"
              className="w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform bg-primary text-primary-foreground"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-10 w-10"
              onClick={() => handleSkip('forward')}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Keyboard Shortcuts Hint (desktop only) */}
          {!isMobile && (
            <div className="text-xs text-muted-foreground hidden lg:flex items-center gap-4">
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">Space</kbd> Play/Pause</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">M</kbd> Mute</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">←</kbd><kbd className="px-1.5 py-0.5 rounded bg-muted ml-1">→</kbd> Skip</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
