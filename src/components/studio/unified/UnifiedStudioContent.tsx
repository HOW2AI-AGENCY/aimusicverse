/**
 * UnifiedStudioContent - Unified Studio Interface
 * 
 * Combines section replacement and stem mixing in one interface:
 * 1. Main timeline with sections (click to edit)
 * 2. Section editor panel (inline on desktop, sheet on mobile)
 * 3. Integrated stem tracks below timeline (when available)
 * 4. Inline variant comparison after generation
 * 5. All actions accessible from one screen
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Scissors, Split, Layers, Sliders, ChevronLeft,
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  MoreVertical, Music2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTracks } from '@/hooks/useTracks';
import { useTrackStems, TrackStem } from '@/hooks/useTrackStems';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useSectionDetection } from '@/hooks/useSectionDetection';
import { useReplacedSections } from '@/hooks/useReplacedSections';
import { useReplaceSectionRealtime } from '@/hooks/useReplaceSectionRealtime';
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';
import { useStemSeparation } from '@/hooks/useStemSeparation';
import { StudioLyricsPanel } from '@/components/stem-studio/StudioLyricsPanel';
import { UnifiedWaveformTimeline } from '@/components/stem-studio/UnifiedWaveformTimeline';
import { VersionTimeline } from '@/components/stem-studio/VersionTimeline';
import { ReplacementProgressIndicator } from '@/components/stem-studio/ReplacementProgressIndicator';
import { TrimDialog } from '@/components/stem-studio/TrimDialog';
import { RemixDialog } from '@/components/stem-studio/RemixDialog';
import { ExtendDialog } from '@/components/stem-studio/ExtendDialog';
import { SectionEditorPanel } from '@/components/stem-studio/SectionEditorPanel';
import { 
  SectionEditorSheet,
  StudioActionsPanel,
  StemActionSheet,
  useStudioTrackState,
} from '@/components/studio';
import { IntegratedStemTracks } from './IntegratedStemTracks';
import { SectionVariantOverlay } from './SectionVariantOverlay';
import { StemMidiDrawer } from './StemMidiDrawer';
import { StemEffectsDrawer } from './StemEffectsDrawer';
import { AddTrackDrawer } from './AddTrackDrawer';
import { registerStudioAudio, unregisterStudioAudio } from '@/hooks/studio/useStudioAudio';
import { useStemAudioEngine, defaultStemEffects } from '@/hooks/studio/useStemAudioEngine';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useStudioActivityLogger } from '@/hooks/useStudioActivityLogger';
import { ReferenceManager } from '@/services/audio-reference';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { formatTime } from '@/lib/player-utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface UnifiedStudioContentProps {
  trackId: string;
}

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

export function UnifiedStudioContent({ trackId }: UnifiedStudioContentProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { tracks } = useTracks();
  const track = tracks?.find(t => t.id === trackId);
  const { data: stems = [], isLoading: stemsLoading } = useTrackStems(trackId);
  const { setPrimaryVersionAsync } = useVersionSwitcher();
  const { separate, isSeparating } = useStemSeparation();

  // Track state (raw/simple_stems/detailed_stems)
  const { 
    trackState, 
    vocalStem, 
    instrumentalStem,
    hasVocalStem,
    hasInstrumentalStem,
  } = useStudioTrackState(trackId);

  // Activity logging
  const { logActivity, logReplacementApply, logReplacementDiscard } = useStudioActivityLogger(trackId);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  // Stem states
  const [stemStates, setStemStates] = useState<Record<string, StemState>>({});
  const [masterVolume, setMasterVolume] = useState(0.85);
  const [masterMuted, setMasterMuted] = useState(false);

  // Dialog state
  const [trimDialogOpen, setTrimDialogOpen] = useState(false);
  const [remixDialogOpen, setRemixDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [stemActionSheetOpen, setStemActionSheetOpen] = useState(false);
  const [selectedStemForAction, setSelectedStemForAction] = useState<TrackStem | null>(null);
  const [showActionsPanel, setShowActionsPanel] = useState(!isMobile);
  const [showVariantComparison, setShowVariantComparison] = useState(false);
  
  // New: MIDI and Effects drawer states
  const [midiDrawerOpen, setMidiDrawerOpen] = useState(false);
  const [effectsDrawerOpen, setEffectsDrawerOpen] = useState(false);
  const [addTrackDrawerOpen, setAddTrackDrawerOpen] = useState(false);
  const [selectedStemForMidi, setSelectedStemForMidi] = useState<TrackStem | null>(null);
  const [selectedStemForEffects, setSelectedStemForEffects] = useState<TrackStem | null>(null);
  
  // Effects state for the selected stem
  const [stemEffects, setStemEffects] = useState(defaultStemEffects);
  
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

  // Fetch lyrics and detect sections
  const { data: lyricsData } = useTimestampedLyrics(track?.suno_task_id || null, track?.suno_id || null);
  const detectedSections = useSectionDetection(track?.lyrics, lyricsData?.alignedWords, duration);
  const { data: replacedSections } = useReplacedSections(trackId);
  
  // Realtime updates
  useReplaceSectionRealtime(trackId);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stemAudioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const animationFrameRef = useRef<number | undefined>(undefined);

  const hasStems = stems && stems.length > 0;

  // Reset on track change
  useEffect(() => {
    resetSectionEditor();
    logActivity('studio_open');
    return () => {
      logActivity('studio_close');
    };
  }, [trackId, resetSectionEditor, logActivity]);

  // Keep a single "current audio url" source of truth
  useEffect(() => {
    setCurrentAudioUrl(track?.audio_url || null);
  }, [track?.audio_url]);

  // Initialize stem states
  useEffect(() => {
    if (!stems || stems.length === 0) return;
    
    const initialStates: Record<string, StemState> = {};
    stems.forEach(stem => {
      if (!stemStates[stem.id]) {
        initialStates[stem.id] = { muted: false, solo: false, volume: 0.85 };
      }
    });
    
    if (Object.keys(initialStates).length > 0) {
      setStemStates(prev => ({ ...prev, ...initialStates }));
    }
  }, [stems]);

  // Initialize and manage stem audio elements
  useEffect(() => {
    if (!stems || stems.length === 0) return;

    // Create audio elements for each stem
    stems.forEach(stem => {
      if (!stemAudioRefs.current[stem.id]) {
        const audio = new Audio(stem.audio_url);
        audio.preload = 'auto';
        audio.volume = 0.85;
        stemAudioRefs.current[stem.id] = audio;
      }
    });

    // Cleanup: remove audio elements for stems that no longer exist
    const stemIds = new Set(stems.map(s => s.id));
    Object.keys(stemAudioRefs.current).forEach(id => {
      if (!stemIds.has(id)) {
        stemAudioRefs.current[id].pause();
        stemAudioRefs.current[id].src = '';
        delete stemAudioRefs.current[id];
      }
    });

    return () => {
      // Cleanup all stem audio on unmount
      Object.values(stemAudioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      stemAudioRefs.current = {};
    };
  }, [stems]);

  // Apply stem volume/mute/solo states
  useEffect(() => {
    if (!stems || stems.length === 0) return;

    const hasSoloedStems = Object.values(stemStates).some(s => s.solo);

    stems.forEach(stem => {
      const audio = stemAudioRefs.current[stem.id];
      if (!audio) return;

      const state = stemStates[stem.id];
      if (!state) return;

      // Calculate effective volume
      let effectiveVolume = state.volume * masterVolume;

      // Apply mute logic
      if (masterMuted || state.muted) {
        effectiveVolume = 0;
      }

      // Apply solo logic: if any stem is soloed, mute all others
      if (hasSoloedStems && !state.solo) {
        effectiveVolume = 0;
      }

      // Only set volume if audio is ready (has a valid source)
      try {
        if (audio.readyState >= 1) {
          audio.volume = Math.max(0, Math.min(1, effectiveVolume));
        }
      } catch (e) {
        // Ignore volume setting errors during loading
        logger.warn('Failed to set stem volume', { stemId: stem.id, error: e });
      }
    });
  }, [stems, stemStates, masterVolume, masterMuted]);

  // Initialize main audio with coordination
  useEffect(() => {
    if (!currentAudioUrl) return;

    const audio = new Audio(currentAudioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;

    // Register for audio coordination
    registerStudioAudio('unified-studio-player', () => {
      audio.pause();
      // Also pause all stems
      Object.values(stemAudioRefs.current).forEach(stemAudio => {
        stemAudio.pause();
      });
      setIsPlaying(false);
    });

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      // Pause all stems when track ends
      Object.values(stemAudioRefs.current).forEach(stemAudio => {
        stemAudio.pause();
        stemAudio.currentTime = 0;
      });
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      unregisterStudioAudio('unified-studio-player');
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [currentAudioUrl]);

  // Update main track volume (when no stems or stems not playing)
  useEffect(() => {
    if (!audioRef.current) return;
    // When stems are available, main track is muted during playback
    const hasPlayableStems = stems && stems.length > 0;
    if (hasPlayableStems && isPlaying) {
      audioRef.current.volume = 0;
    } else {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted, stems, isPlaying]);

  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, []);

  const togglePlay = async () => {
    // When stems are available, play stems instead of main track
    const hasPlayableStems = stems && stems.length > 0;

    if (isPlaying) {
      // Pause main audio
      audioRef.current?.pause();
      
      // Pause all stem audio
      Object.values(stemAudioRefs.current).forEach(audio => {
        audio.pause();
      });
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlaying(false);
    } else {
      try {
        if (hasPlayableStems) {
          // Play all stems synchronized
          const playPromises: Promise<void>[] = [];
          
          for (const audio of Object.values(stemAudioRefs.current)) {
            // Sync time before playing
            audio.currentTime = currentTime;
            // Only play if audio is ready
            if (audio.readyState >= 2) {
              playPromises.push(audio.play().catch(e => {
                logger.warn('Stem play failed', { error: e });
              }));
            }
          }
          
          // Also sync and play main audio (muted as reference for seeking/duration)
          if (audioRef.current && audioRef.current.readyState >= 2) {
            audioRef.current.currentTime = currentTime;
            audioRef.current.volume = 0; // Mute main track when playing stems
            playPromises.push(audioRef.current.play().catch(e => {
              logger.warn('Main audio play failed', { error: e });
            }));
          }
          
          await Promise.all(playPromises);
        } else {
          // No stems - play main audio only
          if (audioRef.current) {
            if (audioRef.current.readyState >= 2) {
              await audioRef.current.play();
            } else {
              // Wait for audio to load
              await new Promise<void>((resolve, reject) => {
                const audio = audioRef.current!;
                const onCanPlay = () => {
                  audio.removeEventListener('canplay', onCanPlay);
                  audio.play().then(resolve).catch(reject);
                };
                audio.addEventListener('canplay', onCanPlay);
                // Timeout after 5 seconds
                setTimeout(() => reject(new Error('Audio load timeout')), 5000);
              });
            }
          }
        }
        
        setIsPlaying(true);
        animationFrameRef.current = requestAnimationFrame(updateTime);
      } catch (error) {
        logger.error('Error playing audio', error);
        toast.error('Ошибка воспроизведения');
      }
    }
  };

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    
    // Seek main audio
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    
    // Seek all stem audio
    Object.values(stemAudioRefs.current).forEach(audio => {
      audio.currentTime = time;
    });
  }, []);

  const handleSkip = (direction: 'back' | 'forward') => {
    const skipAmount = 10;
    const newTime = direction === 'back' 
      ? Math.max(0, currentTime - skipAmount)
      : Math.min(duration, currentTime + skipAmount);
    handleSeek(newTime);
  };

  // Section selection
  const handleSectionSelect = useCallback((section: typeof detectedSections[0], index: number) => {
    selectSection(section, index);
  }, [selectSection]);

  // Stem separation
  const handleStemSeparation = async (mode: 'simple' | 'detailed') => {
    if (!track) return;
    try {
      await separate(track, mode);
      queryClient.invalidateQueries({ queryKey: ['track-stems', trackId] });
    } catch (error) {
      logger.error('Stem separation failed', error);
    }
  };

  // Stem controls
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

  const handleStemVolumeChange = (stemId: string, newVolume: number) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: { ...prev[stemId], volume: newVolume }
    }));
  };

  // Stem action handler
  const handleStemAction = (stem: TrackStem, action: 'midi' | 'reference' | 'download' | 'effects') => {
    switch (action) {
      case 'reference':
        ReferenceManager.createFromStem({
          audioUrl: stem.audio_url,
          stemType: stem.stem_type,
          trackId: trackId,
          trackTitle: track?.title || 'Стем',
          lyrics: track?.lyrics || undefined,
          style: track?.style || undefined,
        });
        toast.success('Референс из студии загружен');
        navigate('/', { state: { openGenerate: true } });
        break;
      case 'midi':
        setSelectedStemForMidi(stem);
        setMidiDrawerOpen(true);
        break;
      case 'effects':
        setSelectedStemForEffects(stem);
        setEffectsDrawerOpen(true);
        break;
      case 'download':
        window.open(stem.audio_url, '_blank');
        break;
    }
  };

  // Apply replacement
  type SaveMode = 'apply' | 'newVersion' | 'newTrack';
  
  const handleApplyReplacement = useCallback(async (
    selectedVariant: 'variantA' | 'variantB' = 'variantA',
    saveMode: SaveMode = 'apply'
  ) => {
    if (!latestCompletion) return;
    
    try {
      const audioUrl = selectedVariant === 'variantB' && latestCompletion.newAudioUrlB
        ? latestCompletion.newAudioUrlB
        : latestCompletion.newAudioUrl;
      
      if (saveMode === 'apply' && latestCompletion.versionId) {
        await setPrimaryVersionAsync({ 
          trackId, 
          versionId: latestCompletion.versionId 
        });
        
        if (audioRef.current && audioUrl) {
          audioRef.current.src = audioUrl;
          audioRef.current.load();
          setCurrentAudioUrl(audioUrl);
        }
        
        toast.success(`Вариант ${selectedVariant === 'variantA' ? 'A' : 'B'} применён`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
      queryClient.invalidateQueries({ queryKey: ['replaced-sections', trackId] });
      
      logReplacementApply(latestCompletion.versionId || 'unknown');
    } catch (error) {
      logger.error('Failed to apply replacement', error);
      toast.error('Ошибка при применении замены');
    }
    
    setLatestCompletion(null);
    setShowVariantComparison(false);
  }, [latestCompletion, trackId, setPrimaryVersionAsync, queryClient, setLatestCompletion, logReplacementApply]);

  const handleDiscardReplacement = useCallback(() => {
    logReplacementDiscard();
    setLatestCompletion(null);
    setShowVariantComparison(false);
    toast.info('Замена отменена');
  }, [setLatestCompletion, logReplacementDiscard]);

  // Show comparison when completion arrives
  useEffect(() => {
    if (latestCompletion?.status === 'completed' && latestCompletion.newAudioUrl) {
      setShowVariantComparison(true);
    }
  }, [latestCompletion]);

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
          setMuted(prev => !prev);
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
  }, [togglePlay, editMode, clearSelection]);

  const canReplaceSection = track?.suno_id && track?.suno_task_id;
  const replacedRanges = replacedSections?.map(s => ({ start: s.start, end: s.end })) || [];

  if (!track) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Menu items for header dropdown
  const menuItems = [
    { label: 'Обрезать трек', icon: <Scissors className="w-4 h-4 mr-2" />, onClick: () => setTrimDialogOpen(true) },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/library')}
            className="h-9 w-9 shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {track.cover_url && (
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-muted">
                <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-sm truncate">{track.title || 'Без названия'}</h1>
              {hasStems && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {stems.length} стемов
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1.5">
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

          {canReplaceSection && editMode === 'none' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode('selecting')}
              className="h-8 gap-1 text-xs"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Заменить</span>
            </Button>
          )}

          {!hasStems && !isSeparating && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStemSeparation('detailed')}
              className="h-8 gap-1 text-xs"
            >
              <Split className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Стемы</span>
            </Button>
          )}

          {isSeparating && (
            <Badge variant="secondary" className="h-8 gap-1 text-xs">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Разделение...</span>
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menuItems.map((item, idx) => (
                <DropdownMenuItem key={idx} onClick={item.onClick}>
                  {item.icon}
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Version & Progress indicators */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 bg-muted/20">
        <VersionTimeline 
          trackId={trackId}
          onVersionChange={(versionId, audioUrl) => {
            setCurrentAudioUrl(audioUrl);
            if (audioRef.current) {
              audioRef.current.src = audioUrl;
              audioRef.current.load();
            }
            queryClient.invalidateQueries({ queryKey: ['tracks'] });
          }}
        />
      </div>

      {/* Synchronized Lyrics (collapsible) */}
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

      {/* Main Content Area - scrollable on mobile */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        {/* Waveform Timeline with Sections */}
        <div className={cn(
          "border-b border-border/30 bg-card/30",
          isMobile ? "px-2 py-2" : "px-3 py-3"
        )}>
          {currentAudioUrl && (
            <UnifiedWaveformTimeline
              audioUrl={currentAudioUrl}
              sections={detectedSections}
              duration={duration}
              currentTime={currentTime}
              isPlaying={isPlaying}
              selectedSectionIndex={selectedSectionIndex}
              customRange={customRange}
              replacedRanges={replacedRanges}
              onSectionClick={handleSectionSelect}
              onSeek={handleSeek}
              height={isMobile ? 70 : 90}
              showSectionLabels={true}
            />
          )}
        </div>

        {/* Inline Variant Comparison */}
        {showVariantComparison && latestCompletion?.newAudioUrl && track.audio_url && (
          <div className="px-3 py-3 border-b border-border/30 bg-primary/5">
            <SectionVariantOverlay
              open={true}
              originalAudioUrl={track.audio_url}
              variantAUrl={latestCompletion.newAudioUrl}
              variantBUrl={latestCompletion.newAudioUrlB}
              sectionStart={latestCompletion.section.start}
              sectionEnd={latestCompletion.section.end}
              onApply={(variant) => handleApplyReplacement(variant)}
              onDiscard={handleDiscardReplacement}
            />
          </div>
        )}

        {/* Section Editor (inline on desktop) */}
        {!isMobile && editMode === 'editing' && (
          <SectionEditorPanel
            trackId={trackId}
            trackTitle={track.title || 'Трек'}
            trackTags={track.tags}
            audioUrl={currentAudioUrl}
            duration={duration}
            onClose={clearSelection}
          />
        )}

        {/* Integrated Stem Tracks */}
        {hasStems && (
          <IntegratedStemTracks
            stems={stems}
            stemStates={stemStates}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            masterVolume={masterVolume}
            masterMuted={masterMuted}
            onStemToggle={handleStemToggle}
            onStemVolumeChange={handleStemVolumeChange}
            onMasterVolumeChange={setMasterVolume}
            onMasterMuteToggle={() => setMasterMuted(!masterMuted)}
            onSeek={handleSeek}
            onStemAction={handleStemAction}
            onAddTrack={() => setAddTrackDrawerOpen(true)}
          />
        )}

        {/* Empty state when no section selected and no stems */}
        {editMode === 'none' && !hasStems && !showVariantComparison && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Music2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Студия трека</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Выберите секцию на таймлайне для замены или разделите трек на стемы
            </p>
            <div className="flex gap-2">
              {canReplaceSection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode('selecting')}
                >
                  <Scissors className="w-4 h-4 mr-2" />
                  Заменить секцию
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStemSeparation('detailed')}
                disabled={isSeparating}
              >
                <Split className="w-4 h-4 mr-2" />
                Разделить на стемы
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Player Bar */}
      <div className="flex-shrink-0 border-t border-border/50 bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Transport controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip('back')}
              className="h-9 w-9"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={togglePlay}
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip('forward')}
              className="h-9 w-9"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Volume control */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMuted(!muted)}
              className={cn("h-8 w-8", muted && "text-destructive")}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => setVolume(v[0])}
              disabled={muted}
              className="w-24"
            />
          </div>
        </div>
      </div>

      {/* Section Editor (bottom sheet on mobile) */}
      {isMobile && (
        <SectionEditorSheet
          open={editMode === 'editing'}
          onClose={clearSelection}
          trackId={trackId}
          trackTitle={track.title || 'Трек'}
          trackTags={track.tags}
          audioUrl={currentAudioUrl}
          duration={duration}
          detectedSections={detectedSections}
        />
      )}

      {/* Stem Action Sheet */}
      <StemActionSheet
        open={stemActionSheetOpen}
        onOpenChange={setStemActionSheetOpen}
        stem={selectedStemForAction}
        trackTitle={track.title || 'Трек'}
        onUseAsReference={(stem) => {
          navigate(`/create?reference=${encodeURIComponent(stem.audio_url)}&type=${stem.stem_type}`);
        }}
        onMidiTranscription={(stem, model) => {
          navigate(`/midi/${trackId}?stem=${stem.id}&model=${model}`);
        }}
        onGuitarAnalysis={(stem) => {
          toast.info('Анализ гитары в разработке');
        }}
        onDownload={(stem) => {
          window.open(stem.audio_url, '_blank');
        }}
      />

      {/* MIDI Drawer */}
      <StemMidiDrawer
        open={midiDrawerOpen}
        onOpenChange={setMidiDrawerOpen}
        stem={selectedStemForMidi}
        trackId={trackId}
        trackTitle={track.title || 'Трек'}
      />

      {/* Effects Drawer */}
      <StemEffectsDrawer
        open={effectsDrawerOpen}
        onOpenChange={setEffectsDrawerOpen}
        stem={selectedStemForEffects}
        effects={stemEffects}
        onUpdateEQ={(settings) => setStemEffects(prev => ({ ...prev, eq: { ...prev.eq, ...settings } }))}
        onUpdateCompressor={(settings) => setStemEffects(prev => ({ ...prev, compressor: { ...prev.compressor, ...settings } }))}
        onUpdateReverb={(settings) => setStemEffects(prev => ({ ...prev, reverb: { ...prev.reverb, ...settings } }))}
        onReset={() => setStemEffects(defaultStemEffects)}
      />

      {/* Add Track Drawer */}
      <AddTrackDrawer
        open={addTrackDrawerOpen}
        onOpenChange={setAddTrackDrawerOpen}
        trackId={trackId}
        trackUrl={currentAudioUrl || ''}
        trackTitle={track.title || undefined}
      />

      {/* Dialogs */}
      <TrimDialog
        open={trimDialogOpen}
        onOpenChange={setTrimDialogOpen}
        track={track}
        onTrimComplete={() => {}}
      />
      
      <RemixDialog
        open={remixDialogOpen}
        onOpenChange={setRemixDialogOpen}
        track={track}
      />
      
      <ExtendDialog
        open={extendDialogOpen}
        onOpenChange={setExtendDialogOpen}
        track={track}
      />
    </div>
  );
}
