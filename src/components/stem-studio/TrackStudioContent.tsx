/**
 * Clean Track Studio Content
 * 
 * Unified interface for section replacement workflow:
 * - Synchronized lyrics
 * - Waveform timeline with integrated sections
 * - Click section to edit
 * - Bottom sheet editor (mobile) / inline panel (desktop)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Scissors, Download, Share2, 
  Wand2, Clock, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTracks } from '@/hooks/useTracksOptimized';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useSectionDetection } from '@/hooks/useSectionDetection';
import { useReplacedSections } from '@/hooks/useReplacedSections';
import { useReplaceSectionRealtime } from '@/hooks/useReplaceSectionRealtime';
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';
import { StudioLyricsPanel } from '@/components/stem-studio/StudioLyricsPanel';
import { UnifiedWaveformTimeline } from '@/components/stem-studio/UnifiedWaveformTimeline';
import { QuickCompare } from '@/components/stem-studio/QuickCompare';
import { VersionTimeline } from '@/components/stem-studio/VersionTimeline';
import { ReplacementProgressIndicator } from '@/components/stem-studio/ReplacementProgressIndicator';
import { TrimDialog } from '@/components/stem-studio/TrimDialog';
import { RemixDialog } from '@/components/stem-studio/RemixDialog';
import { ExtendDialog } from '@/components/stem-studio/ExtendDialog';
import { CleanStudioLayout, StudioPlayerBar, SectionEditorSheet } from '@/components/studio';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useStudioActivityLogger } from '@/hooks/useStudioActivityLogger';
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

  // Activity logging
  const { logActivity, logReplacementApply, logReplacementDiscard } = useStudioActivityLogger(trackId);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  
  // Dialog state
  const [trimDialogOpen, setTrimDialogOpen] = useState(false);
  const [remixDialogOpen, setRemixDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  
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

  // Initialize audio
  useEffect(() => {
    if (!track?.audio_url) return;
    
    const audio = new Audio(track.audio_url);
    audio.preload = 'auto';
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [track?.audio_url]);

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

  // Apply replacement
  const handleApplyReplacement = useCallback(async () => {
    if (latestCompletion?.versionId) {
      try {
        await setPrimaryVersionAsync({ 
          trackId, 
          versionId: latestCompletion.versionId 
        });
        
        if (audioRef.current && latestCompletion.newAudioUrl) {
          audioRef.current.src = latestCompletion.newAudioUrl;
          audioRef.current.load();
        }
        
        queryClient.invalidateQueries({ queryKey: ['tracks'] });
        queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
        queryClient.invalidateQueries({ queryKey: ['replaced-sections', trackId] });
        
        logReplacementApply(latestCompletion.versionId);
        toast.success('Новая версия применена');
      } catch (error) {
        logger.error('Failed to apply replacement', error);
        toast.error('Ошибка при применении замены');
      }
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

  // Menu items (non-stem actions only)
  const menuItems = [
    { label: 'Обрезать трек', icon: <Scissors className="w-4 h-4 mr-2" />, onClick: () => setTrimDialogOpen(true) },
    { label: 'Расширить', icon: <Clock className="w-4 h-4 mr-2" />, onClick: () => setExtendDialogOpen(true) },
    { label: 'Ремикс', icon: <Wand2 className="w-4 h-4 mr-2" />, onClick: () => setRemixDialogOpen(true) },
  ];

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
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-muted/20">
          <VersionTimeline 
            trackId={trackId}
            onVersionChange={(versionId, audioUrl) => {
              if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.load();
              }
              queryClient.invalidateQueries({ queryKey: ['tracks'] });
            }}
          />
          <div className="flex items-center gap-2">
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
                className="h-8 gap-1.5"
              >
                <Scissors className="w-4 h-4" />
                <span className="hidden sm:inline">Заменить секцию</span>
              </Button>
            )}
          </div>
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

        {/* Waveform Timeline with Sections */}
        <div className={cn(
          "border-b border-border/30 bg-card/30",
          isMobile ? "px-3 py-3" : "px-4 py-4"
        )}>
          {track.audio_url && (
            <UnifiedWaveformTimeline
              audioUrl={track.audio_url}
              sections={detectedSections}
              duration={duration}
              currentTime={currentTime}
              isPlaying={isPlaying}
              selectedSectionIndex={selectedSectionIndex}
              customRange={customRange}
              replacedRanges={replacedRanges}
              onSectionClick={handleSectionSelect}
              onSeek={handleSeek}
              height={isMobile ? 80 : 100}
              showSectionLabels={true}
            />
          )}
        </div>

        {/* Section Editor (inline on desktop) */}
        {!isMobile && (
          <SectionEditorSheet
            open={editMode === 'editing'}
            onClose={clearSelection}
            trackId={trackId}
            trackTitle={track.title || 'Трек'}
            trackTags={track.tags}
            audioUrl={track.audio_url}
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
              Нажмите на секцию на таймлайне или в тексте песни, чтобы заменить её новым звучанием
            </p>
            {!canReplaceSection && (
              <p className="text-xs text-muted-foreground mt-4 max-w-sm">
                Замена секций доступна только для треков, сгенерированных в MusicVerse
              </p>
            )}
          </div>
        )}
      </CleanStudioLayout>

      {/* Section Editor (bottom sheet on mobile) */}
      {isMobile && (
        <SectionEditorSheet
          open={editMode === 'editing'}
          onClose={clearSelection}
          trackId={trackId}
          trackTitle={track.title || 'Трек'}
          trackTags={track.tags}
          audioUrl={track.audio_url}
          duration={duration}
          detectedSections={detectedSections}
        />
      )}

      {/* Compare Panel */}
      {editMode === 'comparing' && latestCompletion?.newAudioUrl && track.audio_url && (
        <QuickCompare
          open={true}
          onOpenChange={(open) => {
            if (!open) setLatestCompletion(null);
          }}
          onClose={() => setLatestCompletion(null)}
          originalAudioUrl={track.audio_url}
          replacementAudioUrl={latestCompletion.newAudioUrl}
          sectionStart={latestCompletion.section.start}
          sectionEnd={latestCompletion.section.end}
          onApply={handleApplyReplacement}
          onDiscard={handleDiscardReplacement}
        />
      )}

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
    </>
  );
};
