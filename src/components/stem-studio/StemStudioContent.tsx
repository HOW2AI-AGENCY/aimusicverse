import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, HelpCircle, Sliders, Scissors,
  Shuffle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useTrackStems } from '@/hooks/useTrackStems';
import { useTracks } from '@/hooks/useTracksOptimized';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useSectionDetection } from '@/hooks/useSectionDetection';
import { useReplacedSections } from '@/hooks/useReplacedSections';
import { useReplaceSectionRealtime } from '@/hooks/useReplaceSectionRealtime';
import { StemChannel } from '@/components/stem-studio/StemChannel';
import { StemDownloadPanel } from '@/components/stem-studio/StemDownloadPanel';
import { StemReferenceDialog } from '@/components/stem-studio/StemReferenceDialog';
import { MidiSection } from '@/components/stem-studio/MidiSection';
import { MixExportDialog } from '@/components/stem-studio/MixExportDialog';
import { MixPresetsMenu } from '@/components/stem-studio/MixPresetsMenu';
import { StudioLyricsPanel } from '@/components/stem-studio/StudioLyricsPanel';
import { StudioLyricsPanelCompact } from '@/components/stem-studio/StudioLyricsPanelCompact';
import { StemStudioTutorial, useStemStudioTutorial } from '@/components/stem-studio/StemStudioTutorial';
import { ReplacementHistoryPanel } from '@/components/stem-studio/ReplacementHistoryPanel';
import { SectionTimelineVisualization } from '@/components/stem-studio/SectionTimelineVisualization';
import { SectionEditorPanel } from '@/components/stem-studio/SectionEditorPanel';
import { SectionEditorMobile } from '@/components/stem-studio/mobile/SectionEditorMobile';
import { MobileSectionTimelineCompact } from '@/components/stem-studio/MobileSectionTimelineCompact';
import { MobileStudioHeader } from '@/components/stem-studio/MobileStudioHeader';
import { MobileMasterVolume } from '@/components/stem-studio/MobileMasterVolume';
import { SectionQuickActions } from '@/components/stem-studio/SectionQuickActions';
import { StudioQuickActions } from '@/components/stem-studio/StudioQuickActions';
import { StudioContextTips } from '@/components/stem-studio/StudioContextTips';
import { ReplacementProgressIndicator } from '@/components/stem-studio/ReplacementProgressIndicator';
import { QuickComparePanel } from '@/components/stem-studio/QuickComparePanel';
import { QuickCompareMobile } from '@/components/stem-studio/QuickCompareMobile';
import { RemixDialog } from '@/components/stem-studio/RemixDialog';
import { ExtendDialog } from '@/components/stem-studio/ExtendDialog';
import { TrimDialog } from '@/components/stem-studio/TrimDialog';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
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
  
  // Dialogs state
  const [showRemixDialog, setShowRemixDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showTrimDialog, setShowTrimDialog] = useState(false);
  
  // Section Editor State
  const { 
    editMode, 
    selectedSectionIndex, 
    customRange,
    latestCompletion,
    selectSection, 
    setCustomRange,
    setEditMode,
    setLatestCompletion,
    clearSelection,
    reset: resetSectionEditor,
  } = useSectionEditorStore();

  // Fetch timestamped lyrics and detect sections
  const { data: lyricsData } = useTimestampedLyrics(track?.suno_task_id || null, track?.suno_id || null);
  const detectedSections = useSectionDetection(track?.lyrics, lyricsData?.alignedWords, duration);
  const { data: replacedSections } = useReplacedSections(trackId);
  
  // Realtime updates for section replacements
  useReplaceSectionRealtime(trackId);

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

  // Reset section editor when track changes
  useEffect(() => {
    resetSectionEditor();
  }, [trackId, resetSectionEditor]);

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
          // Check if all audios have ended
          const allEnded = Object.values(audioRefs.current).every(a => a.ended || a.currentTime >= a.duration - 0.1);
          if (allEnded) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        });

        audio.addEventListener('error', (e) => {
          logger.error(`Audio load error for stem ${stem.id}`, e);
        });

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
      // Cleanup - pause all audios and clear refs
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        // Set src to empty to release resources
        audio.src = '';
        // Note: Event listeners will be garbage collected when audio element is released
      });
      audioRefs.current = {};
    };
  }, [stems, effectsEnabled, initializeStemEngine]);

  // Enable effects mode
  const handleEnableEffects = useCallback(async () => {
    if (!stems) return;
    
    try {
      // Resume audio context first
      await resumeContext();
      
      // Initialize all engines
      const initPromises = stems.map(stem => {
        const audio = audioRefs.current[stem.id];
        if (audio) {
          return initializeStemEngine(stem.id, audio);
        }
        return Promise.resolve();
      });
      
      await Promise.all(initPromises);
      
      // Small delay to ensure audio context is fully ready
      // Note: This is needed for Web Audio API initialization across browsers
      const ENGINE_READY_DELAY = 100; // ms
      await new Promise(resolve => setTimeout(resolve, ENGINE_READY_DELAY));
      
      setEffectsEnabled(true);
      toast.success('Режим эффектов активирован');
    } catch (error) {
      logger.error('Error enabling effects', error);
      toast.error('Ошибка активации эффектов');
    }
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
      
      if (effectsEnabled && enginesState[id]) {
        audio.volume = 1;
      } else {
        audio.volume = volume;
      }
    });
  }, [stemStates, masterVolume, masterMuted, effectsEnabled, enginesState]);

  const updateTime = useCallback(() => {
    const audios = Object.values(audioRefs.current);
    if (audios.length === 0) return;
    
    // Use average time from all audios for more accurate sync
    const avgTime = audios.reduce((sum, audio) => sum + audio.currentTime, 0) / audios.length;
    setCurrentTime(avgTime);
    
    // Check sync drift and re-sync only the most drifted audio to avoid glitches
    const DRIFT_THRESHOLD = 0.1; // seconds
    const audioWithDrift = audios.map(audio => ({
      audio,
      drift: Math.abs(audio.currentTime - avgTime)
    }));
    
    // Find most drifted audio
    const mostDrifted = audioWithDrift.reduce((max, current) => 
      current.drift > max.drift ? current : max
    );
    
    // Only sync if drift exceeds threshold
    if (mostDrifted.drift > DRIFT_THRESHOLD) {
      mostDrifted.audio.currentTime = avgTime;
    }
    
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, []);

  const togglePlay = async () => {
    const audios = Object.values(audioRefs.current);
    if (audios.length === 0) return;

    if (isPlaying) {
      // Pause all audios simultaneously
      audios.forEach(audio => audio.pause());
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlaying(false);
    } else {
      // Ensure all audios are at the same position before playing
      audios.forEach(audio => {
        audio.currentTime = currentTime;
      });

      try {
        // Play all audios as close to simultaneously as possible
        const playPromises = audios.map(audio => {
          // Reset any previous errors
          if (audio.error) {
            audio.load();
          }
          return audio.play();
        });
        
        await Promise.all(playPromises);
        setIsPlaying(true);
        animationFrameRef.current = requestAnimationFrame(updateTime);
      } catch (error) {
        logger.error('Error playing audio', error);
        toast.error('Ошибка воспроизведения');
        // Ensure all audios are paused on error
        audios.forEach(audio => audio.pause());
        setIsPlaying(false);
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
    const audios = Object.values(audioRefs.current);
    
    // Pause if playing to avoid glitches during seek
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      audios.forEach(audio => audio.pause());
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    
    // Set all audios to the same time
    setCurrentTime(time);
    audios.forEach(audio => {
      audio.currentTime = time;
    });
    
    // Resume if was playing
    if (wasPlaying) {
      Promise.all(audios.map(audio => audio.play()))
        .then(() => {
          setIsPlaying(true);
          animationFrameRef.current = requestAnimationFrame(updateTime);
        })
        .catch(error => {
          logger.error('Error resuming after seek', error);
          setIsPlaying(false);
        });
    }
  }, [isPlaying, updateTime]);

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

  // Handle section selection from timeline
  const handleSectionSelect = useCallback((section: typeof detectedSections[0], index: number) => {
    selectSection(section, index);
  }, [selectSection]);

  // Handle compare panel actions
  const handleApplyReplacement = useCallback(() => {
    setLatestCompletion(null);
    toast.success('Замена применена');
  }, [setLatestCompletion]);

  const handleDiscardReplacement = useCallback(() => {
    setLatestCompletion(null);
    toast.info('Замена отменена');
  }, [setLatestCompletion]);

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
        case 'Escape':
          if (editMode !== 'none') {
            clearSelection();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleSkip, editMode, clearSelection]);

  const canReplaceSection = track?.suno_id && track?.suno_task_id;
  const maxSectionDuration = duration * 0.5;
  const replacedRanges = replacedSections?.map(s => ({ start: s.start, end: s.end })) || [];

  if (!track || stemsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Note: Stem check is now handled in StemStudio.tsx page
  // This component only renders when stems are available
  if (!stems || stems.length === 0) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Tutorial Overlay */}
      <StemStudioTutorial 
        forceShow={showTutorial} 
        onComplete={() => setShowTutorial(false)} 
      />

      {/* Mobile Header */}
      {isMobile ? (
        <MobileStudioHeader
          title={track.title || 'Без названия'}
          onBack={() => navigate('/library')}
          canReplace={!!canReplaceSection}
          effectsEnabled={effectsEnabled}
          onEnableEffects={handleEnableEffects}
          onStartReplace={() => setEditMode('selecting')}
          onHelp={startTutorial}
          editMode={editMode}
        />
      ) : (
        /* Desktop Header */
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
            {/* Replacement Progress */}
            <ReplacementProgressIndicator 
              trackId={trackId}
              onViewResult={(taskId) => {
                const replaced = replacedSections?.find(s => s.taskId === taskId);
                if (replaced && track.audio_url && replaced.audioUrl) {
                  setLatestCompletion({
                    taskId,
                    originalAudioUrl: track.audio_url,
                    newAudioUrl: replaced.audioUrl,
                    section: { start: replaced.start, end: replaced.end },
                    status: 'completed',
                  });
                }
              }}
            />

            {/* Replace Section Button */}
            {canReplaceSection && editMode === 'none' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode('selecting')}
                  className="h-9 gap-1.5"
                >
                  <Scissors className="w-4 h-4" />
                  <span className="hidden sm:inline">Заменить</span>
                </Button>
                <ReplacementHistoryPanel trackId={trackId} trackAudioUrl={track.audio_url} />
              </>
            )}

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

            {stems && track.audio_url && (
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
                
                {/* Trim Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTrimDialog(true)}
                  className="h-9 gap-1.5"
                >
                  <Scissors className="w-4 h-4" />
                  <span className="hidden sm:inline">Обрезать</span>
                </Button>
                
                {/* Remix Button */}
                {track.suno_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemixDialog(true)}
                    className="h-9 gap-1.5"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span className="hidden sm:inline">Ремикс</span>
                  </Button>
                )}
                
                {/* Extend Button */}
                {track.suno_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExtendDialog(true)}
                    className="h-9 gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">Расширить</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </header>
      )}

      {/* Section Timeline Visualization - Desktop */}
      {!isMobile && canReplaceSection && detectedSections.length > 0 && (
        <div className="px-4 sm:px-6 py-3 border-b border-border/30 bg-card/30">
          <SectionTimelineVisualization
            sections={detectedSections}
            duration={duration}
            currentTime={currentTime}
            selectedIndex={selectedSectionIndex}
            customRange={customRange}
            replacedRanges={replacedRanges}
            onSectionClick={handleSectionSelect}
            onSeek={(time) => handleSeek([time])}
          />
          
          {/* Quick Actions */}
          {editMode !== 'none' && editMode !== 'comparing' && (
            <div className="mt-3">
              <SectionQuickActions
                sections={detectedSections}
                maxDuration={maxSectionDuration}
                onSelectSection={handleSectionSelect}
              />
            </div>
          )}
        </div>
      )}

      {/* Section Timeline Visualization - Mobile */}
      {isMobile && canReplaceSection && detectedSections.length > 0 && (
        <div className="px-4 py-2 border-b border-border/30 bg-card/30">
          <MobileSectionTimelineCompact
            sections={detectedSections}
            duration={duration}
            currentTime={currentTime}
            selectedIndex={selectedSectionIndex}
            replacedRanges={replacedRanges}
            onSectionClick={handleSectionSelect}
            onSeek={(time) => handleSeek([time])}
          />
        </div>
      )}

      {/* Fallback Timeline without sections */}
      {(!canReplaceSection || detectedSections.length === 0) && (
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
      )}

      {/* Section Editor Panel - Desktop (Inline) */}
      {!isMobile && editMode === 'editing' && (
        <SectionEditorPanel
          trackId={trackId}
          trackTitle={track.title || 'Трек'}
          trackTags={track.tags}
          duration={duration}
          onClose={clearSelection}
        />
      )}

      {/* Section Editor - Mobile (Sheet) */}
      {isMobile && (
        <SectionEditorMobile
          open={editMode === 'selecting' || editMode === 'editing'}
          onOpenChange={(open: boolean) => {
            if (!open) clearSelection();
          }}
          trackId={trackId}
          trackTitle={track.title || 'Трек'}
          trackTags={track.tags}
          trackLyrics={track.lyrics}
          audioUrl={track.audio_url}
          duration={duration}
          taskId={track.suno_task_id}
          audioId={track.suno_id}
        />
      )}

      {/* Quick Compare Panel (after replacement) - Desktop */}
      {!isMobile && editMode === 'comparing' && latestCompletion?.newAudioUrl && track.audio_url && (
        <QuickComparePanel
          originalAudioUrl={track.audio_url}
          replacementAudioUrl={latestCompletion.newAudioUrl}
          sectionStart={latestCompletion.section.start}
          sectionEnd={latestCompletion.section.end}
          onApply={handleApplyReplacement}
          onDiscard={handleDiscardReplacement}
          onClose={() => setLatestCompletion(null)}
        />
      )}

      {/* Quick Compare Panel - Mobile */}
      {isMobile && latestCompletion?.newAudioUrl && track.audio_url && (
        <QuickCompareMobile
          open={editMode === 'comparing'}
          onOpenChange={(open) => {
            if (!open) setLatestCompletion(null);
          }}
          originalAudioUrl={track.audio_url}
          replacementAudioUrl={latestCompletion.newAudioUrl}
          sectionStart={latestCompletion.section.start}
          sectionEnd={latestCompletion.section.end}
          onApply={handleApplyReplacement}
          onDiscard={handleDiscardReplacement}
        />
      )}

      {/* Master Volume */}
      {isMobile ? (
        <MobileMasterVolume
          volume={masterVolume}
          muted={masterMuted}
          onVolumeChange={setMasterVolume}
          onMuteToggle={() => setMasterMuted(!masterMuted)}
        />
      ) : (
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
      )}

      {/* Synchronized Lyrics - Compact on mobile, Full on desktop */}
      {isMobile ? (
        <StudioLyricsPanelCompact
          taskId={track.suno_task_id}
          audioId={track.suno_id}
          plainLyrics={track.lyrics}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSeek={handleSeek}
        />
      ) : (
        <StudioLyricsPanel
          taskId={track.suno_task_id}
          audioId={track.suno_id}
          plainLyrics={track.lyrics}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSeek={handleSeek}
          selectionMode={editMode === 'selecting'}
          onSectionSelect={(start, end, lyrics) => {
            setCustomRange(start, end);
            setEditMode('editing');
          }}
          highlightedSection={customRange}
        />
      )}

      {/* Mobile Actions */}
      {/* Mobile Actions - Compact buttons */}
      {isMobile && stems && (
        <div className="px-4 py-2 border-b border-border/30 flex gap-2 overflow-x-auto scrollbar-hide">
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
          
          {/* Trim Button - Mobile */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTrimDialog(true)}
            className="h-9 gap-1.5 shrink-0"
          >
            <Scissors className="w-4 h-4" />
            <span>Обрезать</span>
          </Button>
          
          {/* Remix Button - Mobile */}
          {track.suno_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRemixDialog(true)}
              className="h-9 gap-1.5 shrink-0"
            >
              <Shuffle className="w-4 h-4" />
              <span>Ремикс</span>
            </Button>
          )}
          
          {/* Extend Button - Mobile */}
          {track.suno_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExtendDialog(true)}
              className="h-9 gap-1.5 shrink-0"
            >
              <Clock className="w-4 h-4" />
              <span>Расширить</span>
            </Button>
          )}
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
      <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/50 px-4 sm:px-6 py-3 sm:py-4 safe-area-pb z-50">
        <div className={cn(
          "flex items-center gap-3 sm:gap-4 max-w-screen-xl mx-auto",
          isMobile ? "justify-center" : "justify-between"
        )}>
          {/* Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "rounded-full",
                isMobile ? "h-12 w-12" : "h-10 w-10"
              )}
              onClick={() => handleSkip('back')}
            >
              <SkipBack className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
            </Button>

            <Button
              onClick={togglePlay}
              size="icon"
              className={cn(
                "rounded-full shadow-lg hover:scale-105 transition-transform bg-primary text-primary-foreground",
                isMobile ? "w-16 h-16" : "w-14 h-14"
              )}
            >
              {isPlaying ? (
                <Pause className={cn(isMobile ? "w-7 h-7" : "w-6 h-6")} />
              ) : (
                <Play className={cn(isMobile ? "w-7 h-7 ml-0.5" : "w-6 h-6 ml-0.5")} />
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "rounded-full",
                isMobile ? "h-12 w-12" : "h-10 w-10"
              )}
              onClick={() => handleSkip('forward')}
            >
              <SkipForward className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
            </Button>
          </div>

          {/* Keyboard Shortcuts Hint (desktop only) */}
          {!isMobile && (
            <div className="text-xs text-muted-foreground hidden lg:flex items-center gap-4">
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">Space</kbd> Play/Pause</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">M</kbd> Mute</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">←</kbd><kbd className="px-1.5 py-0.5 rounded bg-muted ml-1">→</kbd> Skip</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">Esc</kbd> Cancel</span>
            </div>
          )}
        </div>
      </footer>
      
      {/* Dialogs */}
      {track && (
        <>
          <RemixDialog
            open={showRemixDialog}
            onOpenChange={setShowRemixDialog}
            track={track}
          />
          <ExtendDialog
            open={showExtendDialog}
            onOpenChange={setShowExtendDialog}
            track={track}
          />
          <TrimDialog
            open={showTrimDialog}
            onOpenChange={setShowTrimDialog}
            track={track}
          />
        </>
      )}
    </div>
  );
};
