import React, { useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Square, Grid3X3, ListMusic, Volume2, Download } from 'lucide-react';
import { useDrumMachine } from '@/hooks/useDrumMachine';
import { DrumPadGrid } from './DrumPadGrid';
import { DrumSequencer } from './DrumSequencer';
import { DrumKitSelector } from './DrumKitSelector';
import { PatternBank } from './PatternBank';
import { DrumRecorder } from './DrumRecorder';
import { DrumEffects } from './DrumEffects';
import { DrumStepLengthSelector } from './DrumStepLengthSelector';

type ViewMode = 'pads' | 'sequencer';

interface DrumMachineProps {
  className?: string;
}

export const DrumMachine = memo(function DrumMachine({ className }: DrumMachineProps) {
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

  useEffect(() => {
    initialize();
  }, [initialize]);

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

  return (
    <div className={cn('flex flex-col gap-3 p-3 bg-card rounded-xl border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-semibold flex items-center gap-2">
          🥁 Драм-машина
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
          <span className="text-xs hidden sm:inline">Export</span>
        </Button>
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
