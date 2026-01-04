/**
 * Multi-Track Studio Layout - Main DAW-style interface
 */

import { useState, useEffect, useCallback } from 'react';
import { useStudioProjectStore } from '@/stores/useStudioProjectStore';
import { MultiTrackTimeline } from './timeline/MultiTrackTimeline';
import { AddTrackDialog } from './AddTrackDialog';
import { SFXGeneratorPanel } from './SFXGeneratorPanel';
import { InstrumentalGeneratorPanel } from './InstrumentalGeneratorPanel';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Square,
  Undo,
  Redo,
  Save,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from 'sonner';
import { ClipType } from '@/stores/useStudioProjectStore';

interface MultiTrackStudioLayoutProps {
  trackId: string;
  trackTitle: string;
  trackAudioUrl: string;
  duration: number;
  className?: string;
}

export function MultiTrackStudioLayout({
  trackId,
  trackTitle,
  trackAudioUrl,
  duration,
  className,
}: MultiTrackStudioLayoutProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const {
    currentProject,
    isPlaying,
    currentTime,
    createProject,
    setPlaying,
    setCurrentTime,
    setMasterVolume,
  } = useStudioProjectStore();

  const [showAddTrack, setShowAddTrack] = useState(false);
  const [generatorSheet, setGeneratorSheet] = useState<'sfx' | 'instrumental' | null>(null);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [audioElements, setAudioElements] = useState<HTMLAudioElement[]>([]);

  // Initialize project if not loaded
  useEffect(() => {
    if (!currentProject || currentProject.trackId !== trackId) {
      createProject(trackId, trackTitle, trackAudioUrl, duration);
    }
  }, [trackId, trackTitle, trackAudioUrl, duration, currentProject, createProject]);

  // Setup audio elements for playback
  useEffect(() => {
    if (!currentProject) return;

    const audios: HTMLAudioElement[] = [];
    
    for (const track of currentProject.tracks) {
      for (const clip of track.clips) {
        const audio = new Audio(clip.audioUrl);
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        audios.push(audio);
      }
    }
    
    setAudioElements(audios);

    return () => {
      audios.forEach(a => {
        a.pause();
        a.src = '';
      });
    };
  }, [currentProject?.tracks]);

  // Playback sync
  useEffect(() => {
    if (!currentProject) return;
    
    let animationFrame: number;
    
    const updatePlayback = () => {
      if (isPlaying && audioElements.length > 0) {
        const avgTime = audioElements.reduce((sum, a) => sum + a.currentTime, 0) / audioElements.length;
        setCurrentTime(avgTime);
        animationFrame = requestAnimationFrame(updatePlayback);
      }
    };

    if (isPlaying) {
      audioElements.forEach(audio => {
        audio.currentTime = currentTime;
        audio.volume = isMasterMuted ? 0 : currentProject.masterVolume;
        audio.play().catch(console.error);
      });
      animationFrame = requestAnimationFrame(updatePlayback);
    } else {
      audioElements.forEach(audio => audio.pause());
    }

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying, currentProject, audioElements, currentTime, isMasterMuted, setCurrentTime]);

  const handlePlayPause = useCallback(() => {
    setPlaying(!isPlaying);
  }, [isPlaying, setPlaying]);

  const handleStop = useCallback(() => {
    setPlaying(false);
    setCurrentTime(0);
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, [setPlaying, setCurrentTime, audioElements]);

  const handleSkip = useCallback((direction: 'back' | 'forward') => {
    const newTime = direction === 'back' 
      ? Math.max(0, currentTime - 5)
      : Math.min(duration, currentTime + 5);
    
    setCurrentTime(newTime);
    audioElements.forEach(audio => audio.currentTime = newTime);
  }, [currentTime, duration, setCurrentTime, audioElements]);

  const handleAddTrackSelect = (type: ClipType, action: 'generate' | 'upload') => {
    if (action === 'generate') {
      if (type === 'sfx') {
        setGeneratorSheet('sfx');
      } else if (type === 'instrumental' || type === 'vocal') {
        setGeneratorSheet('instrumental');
      }
    } else {
      // TODO: Implement file upload
      toast.info('Загрузка файлов будет добавлена в следующем обновлении');
    }
  };


  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Загрузка проекта...</div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Transport Bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 border-b border-border/30 bg-card/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip('back')}
            className="h-8 w-8"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStop}
            className="h-8 w-8"
          >
            <Square className="h-4 w-4" />
          </Button>
          
          <Button
            variant={isPlaying ? "default" : "secondary"}
            size="icon"
            onClick={handlePlayPause}
            className="h-10 w-10"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip('forward')}
            className="h-8 w-8"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Time Display */}
        <div className="text-sm font-mono bg-muted/50 px-3 py-1 rounded">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Master Volume */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMasterMuted(!isMasterMuted)}
            className="h-8 w-8"
          >
            {isMasterMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          {!isMobile && (
            <Slider
              value={[currentProject.masterVolume * 100]}
              max={100}
              step={1}
              onValueChange={([v]) => setMasterVolume(v / 100)}
              className="w-24"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Отменить">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Повторить">
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Сохранить">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Экспорт">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-hidden">
        <MultiTrackTimeline 
          onAddTrack={() => setShowAddTrack(true)}
        />
      </div>

      {/* Add Track Dialog */}
      <AddTrackDialog
        open={showAddTrack}
        onOpenChange={setShowAddTrack}
        onSelectType={handleAddTrackSelect}
      />

      {/* Generator Sheets */}
      <Sheet open={generatorSheet === 'sfx'} onOpenChange={(open) => !open && setGeneratorSheet(null)}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className={isMobile ? 'h-[85vh]' : ''}>
          <SheetHeader>
            <SheetTitle>Генератор SFX</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <SFXGeneratorPanel onClose={() => setGeneratorSheet(null)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={generatorSheet === 'instrumental'} onOpenChange={(open) => !open && setGeneratorSheet(null)}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className={isMobile ? 'h-[85vh]' : ''}>
          <SheetHeader>
            <SheetTitle>Генератор инструментала</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <InstrumentalGeneratorPanel 
              mainTrackUrl={trackAudioUrl}
              trackId={trackId}
              onClose={() => setGeneratorSheet(null)} 
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
