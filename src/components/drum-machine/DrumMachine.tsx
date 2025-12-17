import React, { useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Square, Grid3X3, ListMusic, Volume2, Download, Music, Send } from 'lucide-react';
import { useDrumMachine } from '@/hooks/useDrumMachine';
import { DrumPadGrid } from './DrumPadGrid';
import { DrumSequencer } from './DrumSequencer';
import { DrumKitSelector } from './DrumKitSelector';
import { PatternBank } from './PatternBank';
import { DrumRecorder } from './DrumRecorder';
import { DrumEffects } from './DrumEffects';
import { DrumStepLengthSelector } from './DrumStepLengthSelector';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type ViewMode = 'pads' | 'sequencer';

interface DrumMachineProps {
  className?: string;
}

export const DrumMachine = memo(function DrumMachine({ className }: DrumMachineProps) {
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

  // Initialize on first user interaction (required by browser autoplay policy)
  const handleInitialize = useCallback(async () => {
    if (!isReady) {
      await initialize();
      toast.success('Аудио активировано', { duration: 2000 });
    }
  }, [isReady, initialize]);

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

  const handlePlayStop = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  // Use recorded audio as reference for generation (unified system)
  const handleUseAsReference = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    // Use unified ReferenceManager
    import('@/services/audio-reference').then(({ ReferenceManager }) => {
      ReferenceManager.createFromCreativeTool('drums', {
        audioUrl: url,
        styleDescription: `${currentKit.name} drum pattern, ${bpm} BPM`,
        bpm,
      });
      toast.success('Бит добавлен как референс', {
        description: 'Перейдите на главную для генерации'
      });
      navigate('/');
    });
  }, [currentKit.name, bpm, navigate]);

  // Export pattern description to PromptDJ
  const handleSendToPromptDJ = useCallback(() => {
    const patternDescription = `${currentKit.name} drum beat, ${bpm} BPM, ${swing > 0 ? `${swing}% swing` : 'straight'} groove`;
    sessionStorage.setItem('drumPatternForDJ', JSON.stringify({
      description: patternDescription,
      bpm,
      kitName: currentKit.name,
    }));
    toast.success('Паттерн отправлен в PromptDJ', {
      description: 'Переключитесь на вкладку DJ'
    });
  }, [currentKit.name, bpm, swing]);

  return (
    <div 
      className={cn('flex flex-col gap-3 p-3 bg-card rounded-xl border', className)}
      onClick={handleInitialize}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-semibold flex items-center gap-2">
          🥁 Драм-машина
          {!isReady && (
            <span className="text-xs font-normal text-muted-foreground animate-pulse">
              (нажмите для активации)
            </span>
          )}
        </h3>
        
        <div className="flex items-center gap-2">
          <DrumStepLengthSelector
            stepLength={stepLength}
            onSetStepLength={setStepLength}
          />
          <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
            <Button
              variant={viewMode === 'pads' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('pads')}
              className="h-7 px-2"
            >
              <Grid3X3 className="w-3.5 h-3.5 mr-1" />
              Пэды
            </Button>
            <Button
              variant={viewMode === 'sequencer' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('sequencer')}
              className="h-7 px-2"
            >
              <ListMusic className="w-3.5 h-3.5 mr-1" />
              Секвенсор
            </Button>
          </div>
        </div>
      </div>

      {/* Kit selector */}
      <DrumKitSelector
        kits={getAvailableKits()}
        currentKitId={currentKit.id}
        onSelectKit={setKit}
      />

      {/* Recording */}
      <DrumRecorder
        recordingState={recordingState}
        recordedAudioUrl={recordedAudioUrl}
        recordedAudioBlob={recordedAudioBlob}
        isPlaying={isPlaying}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onClearRecording={clearRecording}
        onUseAsReference={handleUseAsReference}
      />

      {/* Main view */}
      {viewMode === 'pads' ? (
        <DrumPadGrid
          sounds={currentKit.sounds}
          onPadTrigger={handlePadTrigger}
          activePads={activePads}
        />
      ) : (
        <DrumSequencer
          sounds={currentKit.sounds}
          pattern={pattern}
          currentStep={currentStep}
          isPlaying={isPlaying}
          soloTracks={soloTracks}
          mutedTracks={mutedTracks}
          onToggleStep={toggleStep}
          onToggleSolo={toggleSolo}
          onToggleMute={toggleMute}
        />
      )}

      {/* Transport controls */}
      <div className="flex items-center gap-3 pt-2 border-t flex-wrap">
        <Button
          variant={isPlaying ? 'destructive' : 'default'}
          size="sm"
          onClick={handlePlayStop}
          disabled={!isReady}
          className="h-9 gap-1.5"
        >
          {isPlaying ? <><Square className="w-4 h-4" />Стоп</> : <><Play className="w-4 h-4" />Играть</>}
        </Button>

        <div className="flex items-center gap-2 flex-1 min-w-[120px]">
          <span className="text-xs text-muted-foreground w-8">BPM</span>
          <Slider value={[bpm]} min={40} max={220} step={1} onValueChange={([v]) => setBpm(v)} className="flex-1" />
          <span className="text-xs font-mono w-8 text-right">{bpm}</span>
        </div>

        <div className="flex items-center gap-2 w-28">
          <span className="text-xs text-muted-foreground">Swing</span>
          <Slider value={[swing]} min={0} max={100} step={1} onValueChange={([v]) => setSwing(v)} className="flex-1" />
          <span className="text-xs font-mono w-6">{swing}%</span>
        </div>

        <div className="flex items-center gap-1.5 w-20">
          <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
          <Slider value={[volume]} min={-40} max={0} step={1} onValueChange={([v]) => setVolume(v)} className="flex-1" />
        </div>

        <DrumEffects
          sounds={currentKit.sounds}
          trackEffects={trackEffects}
          onSetEffect={setTrackEffect}
        />

        <Button variant="outline" size="sm" onClick={exportToMidi} className="h-8 gap-1.5">
          <Download className="w-3.5 h-3.5" />
          <span className="text-xs hidden sm:inline">MIDI</span>
        </Button>
      </div>

      {/* Integration actions */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSendToPromptDJ}
          className="h-8 gap-1.5 flex-1"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="text-xs">В PromptDJ</span>
        </Button>
        
        {recordedAudioBlob && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUseAsReference(recordedAudioBlob)}
            className="h-8 gap-1.5 flex-1"
          >
            <Music className="w-3.5 h-3.5" />
            <span className="text-xs">Референс</span>
          </Button>
        )}
      </div>

      {/* Pattern bank */}
      <PatternBank
        patterns={getPresetPatterns()}
        onLoadPattern={loadPattern}
        onClearPattern={clearPattern}
      />
    </div>
  );
});
