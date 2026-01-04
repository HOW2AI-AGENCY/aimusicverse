import React, { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Square, Circle, Volume2,
  ChevronDown, Trash2, Download, Send
} from 'lucide-react';
import { useDrumMachine } from '@/hooks/useDrumMachine';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReferenceManager } from '@/services/audio-reference';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const DrumMachineClean = memo(function DrumMachineClean() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
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
      toast.success('Готово');
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
    toast.success('Отправлено в DJ');
  }, [currentKit.name, bpm]);

  // Use as reference
  const handleUseAsRef = useCallback(() => {
    if (!recordedAudioBlob) return;
    const url = URL.createObjectURL(recordedAudioBlob);
    ReferenceManager.createFromCreativeTool('drums', url, {
      tags: `${currentKit.name}, drum pattern, ${bpm} BPM`,
    });
    toast.success('Паттерн добавлен как референс');
    navigate('/');
  }, [recordedAudioBlob, currentKit.name, bpm, navigate]);

  const hasSolo = soloTracks.size > 0;
  const displaySteps = isMobile ? 8 : stepLength;

  return (
    <div 
      className="flex flex-col gap-3 p-3 sm:p-4 rounded-2xl bg-card/50 border border-border/30"
      onClick={handleInit}
    >
      {/* Header - compact on mobile */}
      <div className="flex items-center justify-between gap-2">
        {/* Kit Selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 px-2 sm:px-3">
              <span className="text-lg">{currentKit.icon}</span>
              <span className="hidden sm:inline text-sm">{currentKit.name}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
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

        {/* Patterns */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 h-9 px-2">
              <span className="text-xs">Паттерн</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {getPresetPatterns().map((p) => (
              <DropdownMenuItem key={p.id} onClick={() => loadPattern(p)}>
                <span className="text-sm">{p.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{p.bpm}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); clearPattern(); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); exportToMidi(); }}
            disabled={!isReady}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); handleSendToDJ(); }}
            disabled={!isReady}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Transport - responsive */}
      <div className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl bg-muted/30">
        {/* Play/Stop */}
        <Button
          variant={isPlaying ? 'default' : 'outline'}
          size="icon"
          className={cn(
            'h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0',
            isPlaying && 'bg-primary shadow-lg shadow-primary/30'
          )}
          onClick={(e) => { e.stopPropagation(); handlePlayStop(); }}
          disabled={!isReady}
        >
          {isPlaying ? <Square className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
        </Button>

        {/* Record */}
        <Button
          variant={recordingState === 'recording' ? 'destructive' : 'ghost'}
          size="icon"
          className={cn(
            'h-9 w-9 rounded-lg shrink-0',
            recordingState === 'recording' && 'animate-pulse'
          )}
          onClick={(e) => { e.stopPropagation(); handleRecord(); }}
          disabled={!isReady}
        >
          <Circle className={cn('w-4 h-4', recordingState === 'recording' && 'fill-current')} />
        </Button>

        {/* BPM */}
        <div className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1">
          <button
            className="text-base sm:text-lg font-bold hover:text-primary transition-colors px-1"
            onClick={(e) => { e.stopPropagation(); setBpm(Math.max(40, bpm - 5)); }}
          >−</button>
          <span className="w-8 sm:w-10 text-center font-mono font-bold text-sm sm:text-lg">{bpm}</span>
          <button
            className="text-base sm:text-lg font-bold hover:text-primary transition-colors px-1"
            onClick={(e) => { e.stopPropagation(); setBpm(Math.min(220, bpm + 5)); }}
          >+</button>
        </div>

        <div className="flex-1" />

        {/* Volume - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            min={-40}
            max={0}
            step={1}
            onValueChange={([v]) => setVolume(v)}
            className="w-20"
          />
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
