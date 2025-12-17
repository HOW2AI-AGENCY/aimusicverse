import React, { memo, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Grid3X3, ListMusic, Download, Send, Music, Mic,
  Layers, Sparkles
} from 'lucide-react';
import { useDrumMachine } from '@/hooks/useDrumMachine';
import { TransportBar } from './TransportBar';
import { DrumPadsPro } from './DrumPadsPro';
import { SequencerPro } from './SequencerPro';
import { KitSelectorPro } from './KitSelectorPro';
import { PatternBrowser } from './PatternBrowser';
import { DrumStepLengthSelector } from '../DrumStepLengthSelector';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type ViewMode = 'pads' | 'sequencer';

interface DrumMachineProProps {
  className?: string;
}

export const DrumMachinePro = memo(function DrumMachinePro({ className }: DrumMachineProProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('pads');
  const [activePads, setActivePads] = useState<Set<string>>(new Set());
  
  const {
    isReady,
    isPlaying,
    currentStep,
    bpm,
    swing,
    volume,
    currentKit,
    pattern,
    soloTracks,
    mutedTracks,
    stepLength,
    recordingState,
    recordedAudioUrl,
    recordedAudioBlob,
    trackEffects,
    initialize,
    play,
    stop,
    toggleStep,
    triggerSound,
    setBpm,
    setSwing,
    setVolume,
    setKit,
    loadPattern,
    clearPattern,
    toggleSolo,
    toggleMute,
    getAvailableKits,
    getPresetPatterns,
    setStepLength,
    startRecording,
    stopRecording,
    clearRecording,
    setTrackEffect,
    exportToMidi,
  } = useDrumMachine();

  // Initialize on first user interaction
  const handleInitialize = useCallback(async () => {
    if (!isReady) {
      await initialize();
      toast.success('Драм-машина активирована', { duration: 2000 });
    }
  }, [isReady, initialize]);

  // Pad trigger with visual feedback
  const handlePadTrigger = useCallback((soundId: string, velocity?: number) => {
    triggerSound(soundId, velocity);
    setActivePads(prev => new Set([...prev, soundId]));
    setTimeout(() => {
      setActivePads(prev => {
        const next = new Set(prev);
        next.delete(soundId);
        return next;
      });
    }, 100);
  }, [triggerSound]);

  // Sync active pads with sequencer playback
  useEffect(() => {
    if (isPlaying) {
      const activeInStep = new Set<string>();
      Object.entries(pattern).forEach(([soundId, steps]) => {
        if (steps[currentStep]) {
          activeInStep.add(soundId);
        }
      });
      setActivePads(activeInStep);
    }
  }, [isPlaying, currentStep, pattern]);

  // Play/stop handler
  const handlePlayStop = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  // Reset handler
  const handleReset = useCallback(() => {
    stop();
  }, [stop]);

  // Recording handler
  const handleRecord = useCallback(async () => {
    if (recordingState === 'recording') {
      await stopRecording();
      toast.success('Запись сохранена');
    } else {
      await startRecording();
      if (!isPlaying) play();
      toast.info('Запись началась');
    }
  }, [recordingState, startRecording, stopRecording, isPlaying, play]);

  // Track volume change
  const handleTrackVolumeChange = useCallback((soundId: string, vol: number) => {
    setTrackEffect(soundId, { volume: vol });
  }, [setTrackEffect]);

  // Use recorded audio as reference
  const handleUseAsReference = useCallback(() => {
    if (!recordedAudioBlob) return;
    
    const url = URL.createObjectURL(recordedAudioBlob);
    sessionStorage.setItem('audioReferenceFromDrums', JSON.stringify({
      audioUrl: url,
      styleDescription: `${currentKit.name} drum pattern, ${bpm} BPM`,
      source: 'drum-machine'
    }));
    toast.success('Бит добавлен как референс', {
      description: 'Перейдите на главную для генерации'
    });
    navigate('/');
  }, [recordedAudioBlob, currentKit.name, bpm, navigate]);

  // Send to PromptDJ
  const handleSendToPromptDJ = useCallback(() => {
    const patternDescription = `${currentKit.name} drum beat, ${bpm} BPM, ${swing > 0 ? `${swing}% swing` : 'straight'} groove`;
    sessionStorage.setItem('drumPatternForDJ', JSON.stringify({
      description: patternDescription,
      bpm,
      kitName: currentKit.name,
    }));
    toast.success('Паттерн отправлен в PromptDJ');
  }, [currentKit.name, bpm, swing]);

  return (
    <div 
      className={cn(
        'flex flex-col gap-5',
        className
      )}
      onClick={handleInitialize}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              {isReady && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                BeatMaker Pro
              </h2>
              <p className="text-xs text-muted-foreground">
                {!isReady ? '• Нажмите для активации' : `${currentKit.name} • ${stepLength} шагов`}
              </p>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Kit Selector */}
          <KitSelectorPro
            kits={getAvailableKits()}
            currentKit={currentKit}
            onSelectKit={setKit}
          />

          {/* Step Length */}
          <DrumStepLengthSelector
            stepLength={stepLength}
            onSetStepLength={setStepLength}
          />

          {/* View Mode Toggle */}
          <div className="flex gap-1 p-1.5 bg-muted/40 rounded-xl border border-border/30">
            <Button
              variant={viewMode === 'pads' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('pads')}
              className={cn(
                'h-10 px-4 rounded-lg gap-2 font-medium',
                viewMode === 'pads' && 'shadow-md'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">Пэды</span>
            </Button>
            <Button
              variant={viewMode === 'sequencer' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('sequencer')}
              className={cn(
                'h-10 px-4 rounded-lg gap-2 font-medium',
                viewMode === 'sequencer' && 'shadow-md'
              )}
            >
              <ListMusic className="w-4 h-4" />
              <span className="hidden sm:inline">Секвенсор</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Transport Bar */}
      <TransportBar
        isPlaying={isPlaying}
        isRecording={recordingState === 'recording'}
        bpm={bpm}
        swing={swing}
        volume={volume}
        currentStep={currentStep}
        stepLength={stepLength}
        isReady={isReady}
        onPlay={handlePlayStop}
        onStop={stop}
        onRecord={handleRecord}
        onBpmChange={setBpm}
        onSwingChange={setSwing}
        onVolumeChange={setVolume}
        onReset={handleReset}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {viewMode === 'pads' ? (
          <DrumPadsPro
            sounds={currentKit.sounds}
            onPadTrigger={handlePadTrigger}
            activePads={activePads}
            mutedTracks={mutedTracks}
            soloTracks={soloTracks}
          />
        ) : (
          <SequencerPro
            sounds={currentKit.sounds}
            pattern={pattern}
            currentStep={currentStep}
            stepLength={stepLength}
            isPlaying={isPlaying}
            soloTracks={soloTracks}
            mutedTracks={mutedTracks}
            trackEffects={trackEffects}
            onToggleStep={toggleStep}
            onToggleSolo={toggleSolo}
            onToggleMute={toggleMute}
            onVolumeChange={handleTrackVolumeChange}
          />
        )}
      </div>

      {/* Pattern Browser */}
      <PatternBrowser
        patterns={getPresetPatterns()}
        onLoadPattern={loadPattern}
        onClearPattern={clearPattern}
      />

      {/* Action Bar */}
      <div className="flex items-center gap-3 flex-wrap p-4 rounded-2xl bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 border border-border/30">
        <Button
          variant="outline"
          size="sm"
          onClick={exportToMidi}
          disabled={!isReady}
          className="h-10 gap-2 rounded-xl border-border/50 hover:border-primary/50"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Экспорт</span> MIDI
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSendToPromptDJ}
          disabled={!isReady}
          className="h-10 gap-2 rounded-xl border-border/50 hover:border-primary/50"
        >
          <Send className="w-4 h-4" />
          В PromptDJ
        </Button>

        {recordedAudioBlob && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUseAsReference}
            className="h-10 gap-2 rounded-xl"
          >
            <Music className="w-4 h-4" />
            Как референс
          </Button>
        )}

        <div className="flex-1" />

        {recordedAudioUrl && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 border border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <Mic className="w-4 h-4 text-destructive" />
            </div>
            <audio src={recordedAudioUrl} controls className="h-8 max-w-[200px]" />
          </div>
        )}
      </div>
    </div>
  );
});
