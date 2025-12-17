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
        'flex flex-col gap-4',
        className
      )}
      onClick={handleInitialize}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">BeatMaker Pro</h2>
              <p className="text-xs text-muted-foreground">
                {!isReady ? 'Нажмите для активации' : `${currentKit.name} • ${stepLength} steps`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
            <Button
              variant={viewMode === 'pads' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('pads')}
              className="h-9 px-3 rounded-lg"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Пэды
            </Button>
            <Button
              variant={viewMode === 'sequencer' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('sequencer')}
              className="h-9 px-3 rounded-lg"
            >
              <ListMusic className="w-4 h-4 mr-2" />
              Секвенсор
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
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={exportToMidi}
          disabled={!isReady}
          className="h-9 gap-2"
        >
          <Download className="w-4 h-4" />
          MIDI
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSendToPromptDJ}
          disabled={!isReady}
          className="h-9 gap-2"
        >
          <Send className="w-4 h-4" />
          В PromptDJ
        </Button>

        {recordedAudioBlob && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUseAsReference}
            className="h-9 gap-2"
          >
            <Music className="w-4 h-4" />
            Как референс
          </Button>
        )}

        {recordedAudioUrl && (
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
            <Mic className="w-4 h-4 text-destructive" />
            <audio src={recordedAudioUrl} controls className="h-8 flex-1" />
          </div>
        )}
      </div>
    </div>
  );
});
