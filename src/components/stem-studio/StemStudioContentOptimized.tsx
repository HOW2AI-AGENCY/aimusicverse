/**
 * Optimized Stem Studio Content with Mobile-First Layout
 * 
 * Uses StemStudioMobileOptimized layout on mobile devices
 * Falls back to standard layout on desktop
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrackStems } from '@/hooks/useTrackStems';
import { useTracks } from '@/hooks/useTracksOptimized';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useSectionDetection } from '@/hooks/useSectionDetection';
import { useReplacedSections } from '@/hooks/useReplacedSections';
import { useReplaceSectionRealtime } from '@/hooks/useReplaceSectionRealtime';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useStemStudioEngine } from '@/hooks/studio';
import { defaultStemEffects, StemEffects } from '@/hooks/studio';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Mobile optimized layout
import { StemStudioMobileOptimized } from './StemStudioMobileOptimized';
import { StemsTabContent, SettingsTabContent } from './mobile-optimized';
import { EffectsTabContent, EditorTabContent, LyricsTabContent } from './tabs';

// Original desktop layout
import { StemStudioContent as DesktopStemStudioContent } from './StemStudioContent';

// Dialogs
import { RemixDialog } from './RemixDialog';
import { ExtendDialog } from './ExtendDialog';
import { TrimDialog } from './TrimDialog';

interface StemStudioContentOptimizedProps {
  trackId: string;
}

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

export const StemStudioContentOptimized = ({ trackId }: StemStudioContentOptimizedProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // If desktop, use original layout
  if (!isMobile) {
    return <DesktopStemStudioContent trackId={trackId} />;
  }
  
  // Mobile optimized layout from here
  const { data: stems, isLoading: stemsLoading } = useTrackStems(trackId);
  const { tracks } = useTracks();
  const track = tracks?.find(t => t.id === trackId);

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
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current = {};
    };
  }, [stems, effectsEnabled, initializeStemEngine]);

  // Enable effects mode
  const handleEnableEffects = useCallback(async () => {
    if (!stems) return;
    
    try {
      await resumeContext();
      
      const initPromises = stems.map(stem => {
        const audio = audioRefs.current[stem.id];
        if (audio) {
          return initializeStemEngine(stem.id, audio);
        }
        return Promise.resolve();
      });
      
      await Promise.all(initPromises);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setEffectsEnabled(true);
      toast.success('Режим эффектов активирован');
    } catch (error) {
      logger.error('Error enabling effects', error);
      toast.error('Ошибка активации эффектов');
    }
  }, [stems, initializeStemEngine, resumeContext]);

  // Playback controls
  const togglePlay = useCallback(() => {
    const audios = Object.values(audioRefs.current);
    if (audios.length === 0) return;

    if (isPlaying) {
      audios.forEach(audio => audio.pause());
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlaying(false);
    } else {
      const hasSolo = Object.values(stemStates).some(s => s.solo);
      
      audios.forEach(audio => {
        const stemId = Object.keys(audioRefs.current).find(
          key => audioRefs.current[key] === audio
        );
        if (!stemId) return;
        
        const state = stemStates[stemId];
        if (!state) return;
        
        const isMuted = masterMuted || state.muted || (hasSolo && !state.solo);
        audio.volume = isMuted ? 0 : state.volume * masterVolume;
        audio.play().catch(err => {
          logger.error('Error playing audio', err);
        });
      });
      
      setIsPlaying(true);
      
      const updateTime = () => {
        const audio = audios[0];
        if (audio) {
          setCurrentTime(audio.currentTime);
        }
        animationFrameRef.current = requestAnimationFrame(updateTime);
      };
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [isPlaying, stemStates, masterVolume, masterMuted]);

  const handleSeek = useCallback((time: number[]) => {
    const audios = Object.values(audioRefs.current);
    const targetTime = time[0];
    audios.forEach(audio => {
      audio.currentTime = targetTime;
    });
    setCurrentTime(targetTime);
  }, []);

  const handleStemToggle = useCallback((stemId: string, type: 'mute' | 'solo') => {
    setStemStates(prev => {
      const newStates = { ...prev };
      
      if (type === 'mute') {
        newStates[stemId] = { ...prev[stemId], muted: !prev[stemId].muted };
      } else if (type === 'solo') {
        const newSolo = !prev[stemId].solo;
        newStates[stemId] = { ...prev[stemId], solo: newSolo };
      }
      
      return newStates;
    });
  }, []);

  const handleVolumeChange = useCallback((stemId: string, volume: number) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: { ...prev[stemId], volume },
    }));
    
    if (!effectsEnabled) {
      const audio = audioRefs.current[stemId];
      if (audio) {
        audio.volume = volume * masterVolume;
      }
    }
  }, [effectsEnabled, masterVolume]);

  if (!track || !stems) {
    return <div className="h-screen flex items-center justify-center">Загрузка...</div>;
  }

  const canEditSections = detectedSections.length > 0 && track.suno_id;

  return (
    <>
      <StemStudioMobileOptimized
        trackTitle={track.title || 'Без названия'}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        onBack={() => navigate('/library')}
        hasEditor={canEditSections}
        stemsContent={
          <StemsTabContent
            stems={stems}
            trackId={trackId}
            trackTitle={track.title || 'Трек'}
            stemStates={stemStates}
            stemEffects={enginesState}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            effectsEnabled={effectsEnabled}
            engineReady={engineReady}
            onToggle={handleStemToggle}
            onVolumeChange={handleVolumeChange}
            onSeek={handleSeek}
            onEQChange={(stemId, settings) => updateStemEQ(stemId, settings)}
            onCompressorChange={(stemId, settings) => updateStemCompressor(stemId, settings)}
            onReverbChange={(stemId, settings) => updateStemReverb(stemId, settings)}
            onEQPreset={(stemId, preset) => applyStemEQPreset(stemId, preset)}
            onCompressorPreset={(stemId, preset) => applyStemCompressorPreset(stemId, preset)}
            onReverbPreset={(stemId, preset) => applyStemReverbPreset(stemId, preset)}
            onResetEffects={(stemId) => resetStemEffects(stemId)}
            getCompressorReduction={(stemId) => getCompressorReduction(stemId)}
          />
        }
        effectsContent={
          <EffectsTabContent
            masterVolume={masterVolume}
            masterMuted={masterMuted}
            effectsEnabled={effectsEnabled}
            engineReady={engineReady}
            onVolumeChange={setMasterVolume}
            onMuteToggle={() => setMasterMuted(!masterMuted)}
            onEnableEffects={handleEnableEffects}
          />
        }
        lyricsContent={
          <LyricsTabContent
            lyricsData={lyricsData}
            currentTime={currentTime}
            onSeek={handleSeek}
          />
        }
        editorContent={
          canEditSections ? (
            <EditorTabContent
              trackId={trackId}
              trackAudioUrl={track.audio_url}
              detectedSections={detectedSections}
              replacedSections={replacedSections || []}
              selectedSectionIndex={selectedSectionIndex}
              customRange={customRange}
              editMode={editMode}
              latestCompletion={latestCompletion}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onSelectSection={selectSection}
              onSetCustomRange={setCustomRange}
              onSeek={handleSeek}
            />
          ) : undefined
        }
        settingsContent={
          <SettingsTabContent
            masterVolume={masterVolume}
            masterMuted={masterMuted}
            onVolumeChange={setMasterVolume}
            onMuteToggle={() => setMasterMuted(!masterMuted)}
            effectsEnabled={effectsEnabled}
            onEnableEffects={handleEnableEffects}
            onTrim={() => setShowTrimDialog(true)}
            onRemix={track.suno_id ? () => setShowRemixDialog(true) : undefined}
            onExtend={track.suno_id ? () => setShowExtendDialog(true) : undefined}
            hasSunoId={!!track.suno_id}
            hasStems={stems.length > 0}
          />
        }
      />

      {/* Dialogs */}
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
  );
};
