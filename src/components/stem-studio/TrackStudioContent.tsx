import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Scissors, Mic, Music, Shuffle, 
  Clock, Split, Wand2, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useTracks } from '@/hooks/useTracksOptimized';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useSectionDetection } from '@/hooks/useSectionDetection';
import { useReplacedSections } from '@/hooks/useReplacedSections';
import { useReplaceSectionRealtime } from '@/hooks/useReplaceSectionRealtime';
import { StudioLyricsPanel } from '@/components/stem-studio/StudioLyricsPanel';
import { StudioLyricsPanelCompact } from '@/components/stem-studio/StudioLyricsPanelCompact';
import { SectionTimelineVisualization } from '@/components/stem-studio/SectionTimelineVisualization';
import { SectionEditorPanel } from '@/components/stem-studio/SectionEditorPanel';
import { SectionEditorMobile } from '@/components/stem-studio/SectionEditorMobile';
import { MobileSectionTimelineCompact } from '@/components/stem-studio/MobileSectionTimelineCompact';
import { ReplacementHistoryPanel } from '@/components/stem-studio/ReplacementHistoryPanel';
import { ReplacementProgressIndicator } from '@/components/stem-studio/ReplacementProgressIndicator';
import { QuickComparePanel } from '@/components/stem-studio/QuickComparePanel';
import { QuickCompareMobile } from '@/components/stem-studio/QuickCompareMobile';
import { StudioQuickActions } from '@/components/stem-studio/StudioQuickActions';
import { StudioContextTips } from '@/components/stem-studio/StudioContextTips';
import { TrimDialog } from '@/components/stem-studio/TrimDialog';
import { VocalReplacementDialog } from '@/components/stem-studio/VocalReplacementDialog';
import { ArrangementReplacementDialog } from '@/components/stem-studio/ArrangementReplacementDialog';
import { TrackStudioMobileLayout } from '@/components/stem-studio/TrackStudioMobileLayout';
import { MobilePlayerTab } from '@/components/stem-studio/mobile/MobilePlayerTab';
import { MobileActionsTab } from '@/components/stem-studio/mobile/MobileActionsTab';
import { MobileSectionsTab } from '@/components/stem-studio/mobile/MobileSectionsTab';
import { MobileLyricsTab } from '@/components/stem-studio/mobile/MobileLyricsTab';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface TrackStudioContentProps {
  trackId: string;
}

export const TrackStudioContent = ({ trackId }: TrackStudioContentProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { tracks } = useTracks();
  const track = tracks?.find(t => t.id === trackId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [isSeparating, setIsSeparating] = useState(false);
  const [trimDialogOpen, setTrimDialogOpen] = useState(false);
  const [vocalDialogOpen, setVocalDialogOpen] = useState(false);
  const [arrangementDialogOpen, setArrangementDialogOpen] = useState(false);
  
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Reset section editor when track changes
  useEffect(() => {
    resetSectionEditor();
  }, [trackId, resetSectionEditor]);

  // Initialize audio element
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

  const handleSeek = useCallback((value: number[] | number) => {
    const time = Array.isArray(value) ? value[0] : value;
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

  // Separate stems action
  const handleSeparateStems = async (mode: 'simple' | 'detailed') => {
    if (!track?.audio_url || !track?.suno_id) {
      toast.error('Недостаточно данных для разделения');
      return;
    }

    setIsSeparating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const { error } = await supabase.functions.invoke('suno-separate-vocals', {
        body: {
          trackId: track.id,
          audioId: track.suno_id,
          audioUrl: track.audio_url,
          mode,
          userId: user.id,
        }
      });

      if (error) throw error;

      toast.success(
        mode === 'simple' 
          ? 'Разделение на 2 стема запущено' 
          : 'Разделение на 6+ стемов запущено',
        { description: 'Процесс займёт 1-3 минуты' }
      );
    } catch (error) {
      logger.error('Error separating stems', error);
      toast.error('Ошибка при разделении стемов');
    } finally {
      setIsSeparating(false);
    }
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
  }, [togglePlay, handleSkip, editMode, clearSelection]);

  const canReplaceSection = track?.suno_id && track?.suno_task_id;
  const maxSectionDuration = duration * 0.5;
  const replacedRanges = replacedSections?.map(s => ({ start: s.start, end: s.end })) || [];

  if (!track) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Mobile Layout with Tabs
  if (isMobile) {
    return (
      <>
        <TrackStudioMobileLayout
          trackTitle={track.title || 'Без названия'}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={togglePlay}
          onSeek={(time) => handleSeek([time])}
          onBack={() => navigate('/library')}
          canReplaceSection={!!canReplaceSection}
          playerContent={
            <MobilePlayerTab
              track={track}
              volume={volume}
              muted={muted}
              onVolumeChange={setVolume}
              onMuteToggle={() => setMuted(!muted)}
              isSeparating={isSeparating}
              onSeparate={handleSeparateStems}
            />
          }
          lyricsContent={
            <MobileLyricsTab
              taskId={track.suno_task_id}
              audioId={track.suno_id}
              plainLyrics={track.lyrics}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onSeek={(time) => handleSeek([time])}
            />
          }
          sectionsContent={
            <MobileSectionsTab
              sections={detectedSections}
              duration={duration}
              currentTime={currentTime}
              selectedIndex={selectedSectionIndex}
              replacedRanges={replacedRanges}
              onSectionSelect={handleSectionSelect}
              onSeek={(time) => handleSeek([time])}
              onStartReplace={() => setEditMode('editing')}
            />
          }
          actionsContent={
            <MobileActionsTab
              track={track}
              hasStems={false}
              isSeparating={isSeparating}
              onSeparate={handleSeparateStems}
              onReplaceSection={canReplaceSection ? () => setEditMode('selecting') : undefined}
              onTrim={() => setTrimDialogOpen(true)}
              onReplaceVocal={() => setVocalDialogOpen(true)}
              onReplaceArrangement={() => setArrangementDialogOpen(true)}
            />
          }
        />

        {/* Mobile Section Editor */}
        <SectionEditorMobile
          open={editMode === 'selecting' || editMode === 'editing'}
          onOpenChange={(open) => {
            if (!open) clearSelection();
          }}
          trackId={trackId}
          trackTitle={track.title || 'Трек'}
          trackTags={track.tags}
          duration={duration}
          sections={detectedSections}
        />

        {/* Mobile Compare Panel */}
        {latestCompletion?.newAudioUrl && track.audio_url && (
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

        {/* Dialogs */}
        <TrimDialog
          open={trimDialogOpen}
          onOpenChange={setTrimDialogOpen}
          track={track}
          onTrimComplete={() => {}}
        />
        
        <VocalReplacementDialog
          open={vocalDialogOpen}
          onOpenChange={setVocalDialogOpen}
          track={track}
          hasStems={false}
        />
        
        <ArrangementReplacementDialog
          open={arrangementDialogOpen}
          onOpenChange={setArrangementDialogOpen}
          track={track}
          hasStems={false}
        />
      </>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
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
              Студия трека
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
        </div>
      </header>

      {/* Quick Actions Bar */}
      <StudioQuickActions
        track={track}
        hasStems={false}
        isSeparating={isSeparating}
        onSeparate={handleSeparateStems}
        onReplaceSection={canReplaceSection ? () => setEditMode('selecting') : undefined}
        onTrim={() => setTrimDialogOpen(true)}
        onReplaceVocal={() => setVocalDialogOpen(true)}
        onReplaceArrangement={() => setArrangementDialogOpen(true)}
      />

      {/* Contextual Tips */}
      <StudioContextTips track={track} hasStems={false} />

      {/* Section Timeline Visualization */}
      {canReplaceSection && detectedSections.length > 0 && (
        <div className={cn(
          "border-b border-border/30 bg-card/30",
          isMobile ? "px-4 py-2" : "px-4 sm:px-6 py-3"
        )}>
          {isMobile ? (
            <MobileSectionTimelineCompact
              sections={detectedSections}
              duration={duration}
              currentTime={currentTime}
              selectedIndex={selectedSectionIndex}
              replacedRanges={replacedRanges}
              onSectionClick={handleSectionSelect}
              onSeek={(time) => handleSeek([time])}
            />
          ) : (
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
          )}
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

      {/* Section Editor Panel - Desktop */}
      {!isMobile && editMode === 'editing' && (
        <SectionEditorPanel
          trackId={trackId}
          trackTitle={track.title || 'Трек'}
          trackTags={track.tags}
          duration={duration}
          onClose={clearSelection}
        />
      )}

      {/* Section Editor - Mobile */}
      {isMobile && (
        <SectionEditorMobile
          open={editMode === 'selecting' || editMode === 'editing'}
          onOpenChange={(open) => {
            if (!open) clearSelection();
          }}
          trackId={trackId}
          trackTitle={track.title || 'Трек'}
          trackTags={track.tags}
          duration={duration}
          sections={detectedSections}
        />
      )}

      {/* Quick Compare Panel - Desktop */}
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

      {/* Volume Control */}
      <div className="px-4 sm:px-6 py-3 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMuted(!muted)}
            className={cn(
              "h-9 w-9 rounded-full",
              muted && "text-destructive"
            )}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide">Громкость</span>
              <span className="text-xs text-muted-foreground">{Math.round(volume * 100)}%</span>
            </div>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => setVolume(v[0])}
              className="w-full"
              disabled={muted}
            />
          </div>
        </div>
      </div>

      {/* Synchronized Lyrics */}
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

      {/* Main Content Area - Empty for tracks without stems */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-32">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Split className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Стемы недоступны</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Разделите трек на стемы для расширенного редактирования
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => handleSeparateStems('simple')}
              disabled={isSeparating || !track.suno_id}
              className="gap-2"
            >
              <Split className="w-4 h-4" />
              Простое (Вокал + Инстр.)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSeparateStems('detailed')}
              disabled={isSeparating || !track.suno_id}
              className="gap-2"
            >
              <Music className="w-4 h-4" />
              Детальное (6+ стемов)
            </Button>
          </div>
          {!track.suno_id && (
            <p className="text-xs text-muted-foreground">
              Разделение доступно только для треков, сгенерированных в MusicVerse
            </p>
          )}
        </div>
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
            </div>
          )}
        </div>
      </footer>

      {/* Dialogs */}
      <TrimDialog
        open={trimDialogOpen}
        onOpenChange={setTrimDialogOpen}
        track={track}
        onTrimComplete={() => {}}
      />
      
      <VocalReplacementDialog
        open={vocalDialogOpen}
        onOpenChange={setVocalDialogOpen}
        track={track}
        hasStems={false}
      />
      
      <ArrangementReplacementDialog
        open={arrangementDialogOpen}
        onOpenChange={setArrangementDialogOpen}
        track={track}
        hasStems={false}
      />
    </div>
  );
};
