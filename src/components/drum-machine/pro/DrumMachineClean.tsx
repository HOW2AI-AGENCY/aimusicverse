import React, { memo, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Square, Circle, Volume2, VolumeX, 
  ChevronDown, Trash2, Download, Send
} from 'lucide-react';
import { useDrumMachine } from '@/hooks/useDrumMachine';
import type { DrumKit, DrumPattern } from '@/lib/drum-kits';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const DrumMachineClean = memo(function DrumMachineClean() {
  const navigate = useNavigate();
  
  const {
    isReady,
    isPlaying,
    currentStep,
    bpm,
    volume,
    currentKit,
    pattern,
    soloTracks,
    mutedTracks,
    stepLength,
    recordingState,
    recordedAudioBlob,
    initialize,
    play,
    stop,
    toggleStep,
    triggerSound,
    setBpm,
    setVolume,
    setKit,
    loadPattern,
    clearPattern,
    toggleMute,
    getAvailableKits,
    getPresetPatterns,
    startRecording,
    stopRecording,
    exportToMidi,
  } = useDrumMachine();

  // Initialize on click
  const handleInit = useCallback(async () => {
    if (!isReady) {
      await initialize();
      toast.success('Готово к работе');
    }
  }, [isReady, initialize]);

  // Play/stop toggle
  const handlePlayStop = useCallback(() => {
    if (isPlaying) stop();
    else play();
  }, [isPlaying, play, stop]);

  // Recording
  const handleRecord = useCallback(async () => {
    if (recordingState === 'recording') {
      await stopRecording();
      toast.success('Записано');
    } else {
      await startRecording();
      if (!isPlaying) play();
    }
  }, [recordingState, startRecording, stopRecording, isPlaying, play]);

  // Send to PromptDJ
  const handleSendToDJ = useCallback(() => {
    sessionStorage.setItem('drumPatternForDJ', JSON.stringify({
      description: `${currentKit.name} ${bpm} BPM`,
      bpm,
      kitName: currentKit.name,
    }));
    toast.success('Отправлено в PromptDJ');
  }, [currentKit.name, bpm]);

  // Use as reference
  const handleUseAsRef = useCallback(() => {
    if (!recordedAudioBlob) return;
    const url = URL.createObjectURL(recordedAudioBlob);
    sessionStorage.setItem('audioReferenceFromDrums', JSON.stringify({
      audioUrl: url,
      styleDescription: `${currentKit.name} drum pattern, ${bpm} BPM`,
      source: 'drum-machine'
    }));
    navigate('/');
  }, [recordedAudioBlob, currentKit.name, bpm, navigate]);

  const hasSolo = soloTracks.size > 0;

  return (
    <div 
      className="flex flex-col gap-4 p-4 rounded-2xl bg-card/50 border border-border/30"
      onClick={handleInit}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        {/* Kit & Pattern Selection */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <span className="text-lg">{currentKit.icon}</span>
                <span className="hidden sm:inline">{currentKit.name}</span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {getAvailableKits().map((kit) => (
                <DropdownMenuItem 
                  key={kit.id} 
                  onClick={() => setKit(kit.id)}
                  className={cn(kit.id === currentKit.id && 'bg-accent')}
                >
                  <span className="mr-2">{kit.icon}</span>
                  {kit.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-9">
                Паттерны
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {getPresetPatterns().map((p) => (
                <DropdownMenuItem 
                  key={p.id} 
                  onClick={() => loadPattern(p)}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{p.bpm} BPM</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={(e) => { e.stopPropagation(); clearPattern(); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 gap-2"
            onClick={(e) => { e.stopPropagation(); exportToMidi(); }}
            disabled={!isReady}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">MIDI</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 gap-2"
            onClick={(e) => { e.stopPropagation(); handleSendToDJ(); }}
            disabled={!isReady}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">DJ</span>
          </Button>
        </div>
      </div>

      {/* Transport */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
        {/* Play/Stop */}
        <Button
          variant={isPlaying ? 'default' : 'outline'}
          size="icon"
          className={cn(
            'h-12 w-12 rounded-xl',
            isPlaying && 'bg-primary shadow-lg shadow-primary/30'
          )}
          onClick={(e) => { e.stopPropagation(); handlePlayStop(); }}
          disabled={!isReady}
        >
          {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </Button>

        {/* Record */}
        <Button
          variant={recordingState === 'recording' ? 'destructive' : 'ghost'}
          size="icon"
          className={cn(
            'h-10 w-10 rounded-lg',
            recordingState === 'recording' && 'animate-pulse'
          )}
          onClick={(e) => { e.stopPropagation(); handleRecord(); }}
          disabled={!isReady}
        >
          <Circle className={cn('w-4 h-4', recordingState === 'recording' && 'fill-current')} />
        </Button>

        {/* BPM */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); setBpm(Math.max(40, bpm - 5)); }}
          >−</Button>
          <div className="font-mono text-xl font-bold w-14 text-center">{bpm}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); setBpm(Math.min(220, bpm + 5)); }}
          >+</Button>
          <span className="text-xs text-muted-foreground">BPM</span>
        </div>

        <div className="flex-1" />

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            min={-40}
            max={0}
            step={1}
            onValueChange={([v]) => setVolume(v)}
            className="w-24"
          />
        </div>

        {/* Step indicator */}
        <div className="hidden md:flex items-center gap-1">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-4 rounded-sm transition-all',
                i % 4 === 0 && i > 0 && 'ml-1',
                isPlaying && i === currentStep
                  ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]'
                  : 'bg-muted/40'
              )}
            />
          ))}
        </div>
      </div>

      {/* Sequencer Grid */}
      <div className="flex flex-col gap-1 rounded-xl bg-black/20 p-3 overflow-x-auto">
        {/* Step numbers */}
        <div className="flex items-center gap-1 mb-2">
          <div className="w-16 shrink-0" />
          {Array.from({ length: stepLength }, (_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 min-w-[28px] text-center text-[10px] font-mono',
                i % 4 === 0 ? 'font-bold text-foreground' : 'text-muted-foreground',
                i % 4 === 0 && i > 0 && 'ml-2'
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Track rows */}
        {currentKit.sounds.map((sound) => {
          const steps = pattern[sound.id] || Array(stepLength).fill(false);
          const isMuted = mutedTracks.has(sound.id);
          const isSolo = soloTracks.has(sound.id);
          const isAudible = (!hasSolo || isSolo) && !isMuted;

          return (
            <div 
              key={sound.id}
              className={cn(
                'flex items-center gap-1',
                !isAudible && 'opacity-30'
              )}
            >
              {/* Track name + mute */}
              <button
                className={cn(
                  'w-16 shrink-0 px-2 py-2 rounded-lg text-xs font-semibold text-left truncate transition-all',
                  'hover:bg-muted/50',
                  isMuted && 'line-through opacity-50'
                )}
                onClick={(e) => { e.stopPropagation(); toggleMute(sound.id); }}
                onDoubleClick={(e) => { e.stopPropagation(); triggerSound(sound.id); }}
                style={{ color: sound.color }}
              >
                {sound.shortName}
              </button>

              {/* Steps */}
              {steps.slice(0, stepLength).map((active, step) => {
                const isCurrent = isPlaying && step === currentStep;
                return (
                  <button
                    key={step}
                    type="button"
                    className={cn(
                      'flex-1 min-w-[28px] h-8 rounded transition-all',
                      step % 4 === 0 && step > 0 && 'ml-2',
                      !active && 'bg-muted/20 hover:bg-muted/40',
                      isCurrent && !active && 'ring-1 ring-primary/50'
                    )}
                    style={{
                      backgroundColor: active ? sound.color : undefined,
                      boxShadow: active && isCurrent 
                        ? `0 0 12px ${sound.color}` 
                        : active 
                          ? `inset 0 1px 0 rgba(255,255,255,0.2)` 
                          : undefined
                    }}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      toggleStep(sound.id, step); 
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* Playhead */}
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
          <div className="w-16 shrink-0" />
          {Array.from({ length: stepLength }, (_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 min-w-[28px] h-1.5 rounded-full transition-all',
                i % 4 === 0 && i > 0 && 'ml-2',
                isPlaying && i === currentStep
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : 'bg-muted/20'
              )}
            />
          ))}
        </div>
      </div>

      {/* Recording indicator */}
      {recordedAudioBlob && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
          <span className="text-sm text-muted-foreground">Запись готова</span>
          <Button size="sm" variant="secondary" onClick={handleUseAsRef}>
            Использовать как референс
          </Button>
        </div>
      )}

      {/* Activation prompt */}
      {!isReady && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Нажмите для активации
        </div>
      )}
    </div>
  );
});
