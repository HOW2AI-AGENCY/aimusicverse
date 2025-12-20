/**
 * TrackStudioContent - Unified Studio Interface
 * 
 * User Flow:
 * 1. Raw track → Section replacement, Stem separation options
 * 2. Simple stems (vocal/instrumental) → + New Vocal, New Arrangement
 * 3. Detailed stems (6+) → Per-stem actions (MIDI, reference, download)
 * 
 * Interface:
 * - Synchronized lyrics panel (collapsible)
 * - Waveform timeline with integrated sections
 * - Click section to edit with slide-up editor
 * - State-aware actions panel
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Scissors, Split, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTracks } from '@/hooks/useTracks';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useSectionDetection } from '@/hooks/useSectionDetection';
import { useReplacedSections } from '@/hooks/useReplacedSections';
import { useReplaceSectionRealtime } from '@/hooks/useReplaceSectionRealtime';
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';
import { useStemSeparation } from '@/hooks/useStemSeparation';
import { StudioLyricsPanel } from '@/components/stem-studio/StudioLyricsPanel';
import { UnifiedWaveformTimeline } from '@/components/stem-studio/UnifiedWaveformTimeline';
import { QuickCompare } from '@/components/stem-studio/QuickCompare';
import { VersionTimeline } from '@/components/stem-studio/VersionTimeline';
import { ReplacementProgressIndicator } from '@/components/stem-studio/ReplacementProgressIndicator';
import { TrimDialog } from '@/components/stem-studio/TrimDialog';
import { RemixDialog } from '@/components/stem-studio/RemixDialog';
import { ExtendDialog } from '@/components/stem-studio/ExtendDialog';
import { NewVocalDialog } from '@/components/NewVocalDialog';
import { NewArrangementDialog } from '@/components/NewArrangementDialog';
import { 
  CleanStudioLayout, 
  StudioPlayerBar, 
  SectionEditorSheet,
  StudioActionsPanel,
  StemActionSheet,
  useStudioTrackState,
  MultiTrackStudioLayout,
} from '@/components/studio';
import { registerStudioAudio, unregisterStudioAudio } from '@/hooks/studio/useStudioAudio';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useStudioActivityLogger } from '@/hooks/useStudioActivityLogger';
import { ReferenceManager } from '@/services/audio-reference';
import { TrackStem } from '@/hooks/useTrackStems';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useIsMobile } from '@/hooks/use-mobile';

interface TrackStudioContentProps {
  trackId: string;
}

export const TrackStudioContent = ({ trackId }: TrackStudioContentProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { tracks } = useTracks();
  const track = tracks?.find(t => t.id === trackId);
  const { setPrimaryVersionAsync } = useVersionSwitcher();
  const { separate, isSeparating } = useStemSeparation();

  // Track state (raw/simple_stems/detailed_stems)
  const { 
    trackState, 
    stems, 
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

  // Dialog state
  const [trimDialogOpen, setTrimDialogOpen] = useState(false);
  const [remixDialogOpen, setRemixDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [newVocalDialogOpen, setNewVocalDialogOpen] = useState(false);
  const [newArrangementDialogOpen, setNewArrangementDialogOpen] = useState(false);
  const [stemActionSheetOpen, setStemActionSheetOpen] = useState(false);
  const [selectedStemForAction, setSelectedStemForAction] = useState<TrackStem | null>(null);
  const [showActionsPanel, setShowActionsPanel] = useState(!isMobile);
  const [studioMode, setStudioMode] = useState<'section' | 'daw'>('section');
  
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
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Reset on track change
  useEffect(() => {
    resetSectionEditor();
    logActivity('studio_open');
    return () => {
      logActivity('studio_close');
    };
  }, [trackId, resetSectionEditor, logActivity]);

  // Keep a single "current audio url" source of truth for the whole Studio UI
  useEffect(() => {
    setCurrentAudioUrl(track?.audio_url || null);
  }, [track?.audio_url]);

  // Initialize audio with coordination
  useEffect(() => {
    if (!currentAudioUrl) return;

    const audio = new Audio(currentAudioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;

    // Register for audio coordination
    registerStudioAudio('main-studio-player', () => {
      audio.pause();
      setIsPlaying(false);
    });

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      unregisterStudioAudio('main-studio-player');
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [currentAudioUrl]);

  // Update volume
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
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
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
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
      // Invalidate stems query to refresh
      queryClient.invalidateQueries({ queryKey: ['track-stems', trackId] });
    } catch (error) {
      logger.error('Stem separation failed', error);
    }
  };

  // Stem action handler
  const handleStemAction = (stem: TrackStem, action: string) => {
    switch (action) {
      case 'use_as_reference':
        // Use unified ReferenceManager
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
      case 'midi_transcription':
        setSelectedStemForAction(stem);
        setStemActionSheetOpen(true);
        break;
      case 'guitar_analysis':
        toast.info('Анализ гитары в разработке');
        break;
      case 'download':
        window.open(stem.audio_url, '_blank');
        break;
    }
  };

  // Apply replacement - accepts selected variant (A or B) and save mode
  type SaveMode = 'apply' | 'newVersion' | 'newTrack';
  
  const handleApplyReplacement = useCallback(async (
    selectedVariant: 'variantA' | 'variantB' = 'variantA',
    saveMode: SaveMode = 'apply'
  ) => {
    if (!latestCompletion) return;
    
    try {
      // Use the correct URL based on selected variant
      const audioUrl = selectedVariant === 'variantB' && latestCompletion.newAudioUrlB
        ? latestCompletion.newAudioUrlB
        : latestCompletion.newAudioUrl;
      
      if (saveMode === 'apply') {
        let applied = false;
        
        if (latestCompletion.versionId) {
          // Apply as primary version - updates the track
          await setPrimaryVersionAsync({ 
            trackId, 
            versionId: latestCompletion.versionId 
          });
          applied = true;
        } else if (audioUrl) {
          // Try to find version by task ID
          const { data: version } = await supabase
            .from('track_versions')
            .select('id')
            .eq('track_id', trackId)
            .eq('metadata->>original_task_id', latestCompletion.taskId)
            .single();
          
          if (version?.id) {
            await setPrimaryVersionAsync({ trackId, versionId: version.id });
            applied = true;
          } else {
            // No version found - update track's audio_url directly
            await supabase
              .from('tracks')
              .update({ audio_url: audioUrl })
              .eq('id', trackId);
            applied = true;
          }
        }
        
        if (applied && audioRef.current && audioUrl) {
          audioRef.current.src = audioUrl;
          audioRef.current.load();
          setCurrentAudioUrl(audioUrl);
        }
        
        toast.success(`Вариант ${selectedVariant === 'variantA' ? 'A' : 'B'} применён`);
      } else if (saveMode === 'newVersion') {
        toast.success(`Сохранено как новая версия`);
      } else if (saveMode === 'newTrack') {
        toast.success(`Создан новый трек`);
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
  }, [latestCompletion, trackId, setPrimaryVersionAsync, queryClient, setLatestCompletion, logReplacementApply]);

  const handleDiscardReplacement = useCallback(() => {
    logReplacementDiscard();
    setLatestCompletion(null);
    toast.info('Замена отменена');
  }, [setLatestCompletion, logReplacementDiscard]);

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

  // DAW Mode
  if (studioMode === 'daw' && track.audio_url) {
    return (
      <>
        {/* Mode Toggle Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStudioMode('section')}
            >
              ← Назад
            </Button>
            <span className="font-medium text-sm">{track.title || 'Multi-Track DAW'}</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStudioMode('section')}
              className="h-7 text-xs"
            >
              Секции
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setStudioMode('daw')}
              className="h-7 text-xs"
            >
              <Layers className="w-3.5 h-3.5 mr-1" />
              DAW
            </Button>
          </div>
        </div>
        
        <div className="pt-14 h-screen">
          <MultiTrackStudioLayout
            trackId={trackId}
            trackTitle={track.title || 'Трек'}
            trackAudioUrl={track.audio_url}
            duration={duration || track.duration_seconds || 180}
            className="h-full"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <CleanStudioLayout
        trackTitle={track.title || 'Без названия'}
        trackCoverUrl={track.cover_url}
        menuItems={menuItems}
        playerBar={
          <StudioPlayerBar
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            muted={muted}
            onTogglePlay={togglePlay}
            onSeek={handleSeek}
            onSkip={handleSkip}
            onVolumeChange={setVolume}
            onMuteToggle={() => setMuted(!muted)}
            compact={isMobile}
          />
        }
      >
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
          <div className="flex items-center gap-1.5">
            <ReplacementProgressIndicator 
              trackId={trackId}
              onViewResult={(taskId) => {
                const replaced = replacedSections?.find(s => s.taskId === taskId);
                if (replaced && track.audio_url) {
                  // Get audio URLs - try audioUrl first, fallback to checking if any variant exists
                  const variantA = replaced.audioUrl;
                  const variantB = replaced.audioUrlB;
                  
                  if (variantA) {
                    setLatestCompletion({
                      taskId,
                      originalAudioUrl: track.audio_url,
                      newAudioUrl: variantA,
                      newAudioUrlB: variantB,
                      section: { start: replaced.start, end: replaced.end },
                      status: 'completed',
                    });
                  }
                }
              }}
            />
            {canReplaceSection && editMode === 'none' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode('selecting')}
                className="h-7 gap-1 text-xs"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Заменить</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStudioMode('daw')}
              className="h-7 gap-1 text-xs"
              title="Мульти-трек DAW"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DAW</span>
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={cn(
          "flex-1 flex overflow-hidden",
          isMobile ? "flex-col" : "flex-row"
        )}>
          {/* Left: Timeline + Lyrics */}
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden",
            !isMobile && showActionsPanel && "border-r border-border/30"
          )}>
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

            {/* Section Editor (inline on desktop) */}
            {!isMobile && editMode === 'editing' && (
              <SectionEditorSheet
                open={true}
                onClose={clearSelection}
                trackId={trackId}
                trackTitle={track.title || 'Трек'}
                trackTags={track.tags}
                audioUrl={currentAudioUrl}
                duration={duration}
                detectedSections={detectedSections}
              />
            )}

            {/* Info when no section selected */}
            {editMode === 'none' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Scissors className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Выберите секцию для замены</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Нажмите на секцию на таймлайне или в тексте песни
                </p>
                {isMobile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowActionsPanel(true)}
                    className="mt-4"
                  >
                    <Split className="w-4 h-4 mr-2" />
                    Показать действия
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions Panel (desktop) or hidden on mobile */}
          {!isMobile && (
            <div className="w-80 overflow-y-auto p-4 bg-muted/10">
              <StudioActionsPanel
                trackState={trackState}
                stems={stems}
                canReplaceSection={!!canReplaceSection}
                onSectionReplace={() => setEditMode('selecting')}
                onStemSeparation={handleStemSeparation}
                onNewVocal={hasInstrumentalStem ? () => setNewVocalDialogOpen(true) : undefined}
                onNewArrangement={hasVocalStem ? () => setNewArrangementDialogOpen(true) : undefined}
                onStemAction={(stem, action) => {
                  if (action === 'midi_transcription') {
                    setSelectedStemForAction(stem);
                    setStemActionSheetOpen(true);
                  } else {
                    handleStemAction(stem, action);
                  }
                }}
                onTrim={() => setTrimDialogOpen(true)}
                onExtend={() => setExtendDialogOpen(true)}
                onRemix={() => setRemixDialogOpen(true)}
                isSeparating={isSeparating}
              />
            </div>
          )}
        </div>
      </CleanStudioLayout>

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

      {/* Mobile Actions Panel (as drawer) */}
      {isMobile && showActionsPanel && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="font-semibold">Действия со студией</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActionsPanel(false)}
              >
                Закрыть
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <StudioActionsPanel
                trackState={trackState}
                stems={stems}
                canReplaceSection={!!canReplaceSection}
                onSectionReplace={() => {
                  setShowActionsPanel(false);
                  setEditMode('selecting');
                }}
                onStemSeparation={(mode) => {
                  setShowActionsPanel(false);
                  handleStemSeparation(mode);
                }}
                onNewVocal={hasInstrumentalStem ? () => {
                  setShowActionsPanel(false);
                  setNewVocalDialogOpen(true);
                } : undefined}
                onNewArrangement={hasVocalStem ? () => {
                  setShowActionsPanel(false);
                  setNewArrangementDialogOpen(true);
                } : undefined}
                onStemAction={(stem, action) => {
                  setShowActionsPanel(false);
                  if (action === 'midi_transcription') {
                    setSelectedStemForAction(stem);
                    setStemActionSheetOpen(true);
                  } else {
                    handleStemAction(stem, action);
                  }
                }}
                onTrim={() => {
                  setShowActionsPanel(false);
                  setTrimDialogOpen(true);
                }}
                onExtend={() => {
                  setShowActionsPanel(false);
                  setExtendDialogOpen(true);
                }}
                onRemix={() => {
                  setShowActionsPanel(false);
                  setRemixDialogOpen(true);
                }}
                isSeparating={isSeparating}
              />
            </div>
          </div>
        </div>
      )}

      {/* Compare Panel - supports A/B/C comparison */}
      {editMode === 'comparing' && latestCompletion?.newAudioUrl && track.audio_url && (
        <QuickCompare
          open={true}
          onOpenChange={(open) => {
            if (!open) setLatestCompletion(null);
          }}
          onClose={() => setLatestCompletion(null)}
          originalAudioUrl={track.audio_url}
          variantAUrl={latestCompletion.newAudioUrl}
          variantBUrl={latestCompletion.newAudioUrlB}
          sectionStart={latestCompletion.section.start}
          sectionEnd={latestCompletion.section.end}
          onApply={(selectedVariant) => handleApplyReplacement(selectedVariant)}
          onDiscard={handleDiscardReplacement}
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
          // Navigate to MIDI page with stem
          navigate(`/midi/${trackId}?stem=${stem.id}&model=${model}`);
        }}
        onGuitarAnalysis={(stem) => {
          toast.info('Анализ гитары в разработке');
        }}
        onDownload={(stem) => {
          window.open(stem.audio_url, '_blank');
        }}
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

      {/* New Vocal Dialog - requires instrumental stem */}
      {instrumentalStem && (
        <NewVocalDialog
          open={newVocalDialogOpen}
          onOpenChange={setNewVocalDialogOpen}
          track={track}
          instrumentalStem={instrumentalStem}
        />
      )}

      {/* New Arrangement Dialog - requires vocal stem */}
      {vocalStem && (
        <NewArrangementDialog
          open={newArrangementDialogOpen}
          onOpenChange={setNewArrangementDialogOpen}
          track={track}
          vocalStem={vocalStem}
        />
      )}
    </>
  );
};
