/**
 * PromptDJ Clean - Minimalist DJ-style prompt mixer
 * Inspired by Google PromptDJ MIDI with rotary knobs
 */

import { memo, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Square, Loader2, Sparkles, Volume2, 
  Mic, Settings2, ChevronDown, Download, Music,
  Trash2, RotateCcw
} from 'lucide-react';
import { usePromptDJ } from '@/hooks/usePromptDJ';
import { PromptKnob } from './PromptKnob';
import { LiveVisualizer } from './LiveVisualizer';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ReferenceManager } from '@/services/audio-reference';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Channel colors
const CHANNEL_COLORS = {
  genre: '#a855f7',     // Purple
  instrument: '#3b82f6', // Blue  
  mood: '#ec4899',       // Pink
  custom: '#22c55e',     // Green
};

// Quick presets for instant style application
const QUICK_PRESETS = [
  { id: 'lofi', label: 'Lo-Fi', channels: { genre: 'lo-fi hip hop', instrument: 'piano, vinyl', mood: 'chill' } },
  { id: 'edm', label: 'EDM', channels: { genre: 'EDM, electronic', instrument: 'synth, bass', mood: 'energetic' } },
  { id: 'jazz', label: 'Jazz', channels: { genre: 'jazz', instrument: 'saxophone, piano', mood: 'smooth' } },
  { id: 'ambient', label: 'Ambient', channels: { genre: 'ambient', instrument: 'pads, strings', mood: 'atmospheric' } },
  { id: 'rock', label: 'Rock', channels: { genre: 'rock', instrument: 'electric guitar, drums', mood: 'powerful' } },
  { id: 'classical', label: 'Classical', channels: { genre: 'classical', instrument: 'orchestra, strings', mood: 'majestic' } },
];

export const PromptDJClean = memo(function PromptDJClean() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    channels,
    updateChannel,
    globalSettings,
    updateGlobalSettings,
    isGenerating,
    generatedTracks,
    generateMusic,
    isPlaying,
    currentTrack,
    playTrack,
    stopPlayback,
    currentPrompt,
    analyzerNode,
    removeTrack,
  } = usePromptDJ();

  // Apply preset
  const applyPreset = useCallback((preset: typeof QUICK_PRESETS[0]) => {
    Object.entries(preset.channels).forEach(([type, value]) => {
      const channel = channels.find(c => c.type === type);
      if (channel) {
        updateChannel(channel.id, { value, enabled: true, weight: 1 });
      }
    });
    toast.success(`Пресет "${preset.label}" применён`);
  }, [channels, updateChannel]);

  // Reset all channels
  const resetChannels = useCallback(() => {
    channels.forEach(channel => {
      updateChannel(channel.id, { weight: 0.5, enabled: channel.type !== 'custom' });
    });
  }, [channels, updateChannel]);

  // Use track as reference
  const handleUseAsReference = useCallback((track: typeof generatedTracks[0]) => {
    ReferenceManager.createFromCreativeTool('dj', track.audioUrl, {
      prompt: track.prompt,
    });
    toast.success('Трек добавлен как референс');
    navigate('/');
  }, [navigate]);

  // Download track
  const handleDownload = useCallback(async (track: typeof generatedTracks[0]) => {
    try {
      const response = await fetch(track.audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptdj-${track.createdAt.getTime()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Ошибка скачивания');
    }
  }, []);

  // Check for drum pattern from DrumMachine
  useEffect(() => {
    const drumData = sessionStorage.getItem('drumPatternForDJ');
    if (drumData) {
      try {
        const { description, bpm } = JSON.parse(drumData);
        const customChannel = channels.find(c => c.type === 'custom');
        if (customChannel) {
          updateChannel(customChannel.id, { value: description, enabled: true, weight: 1 });
        }
        if (bpm) updateGlobalSettings({ bpm });
        toast.success('Паттерн из драм-машины загружен');
        sessionStorage.removeItem('drumPatternForDJ');
      } catch (e) {
        console.error('Failed to parse drum pattern:', e);
      }
    }
  }, [channels, updateChannel, updateGlobalSettings]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header with visualizer */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5 border border-border/30 p-4">
        {/* Visualizer background */}
        <LiveVisualizer
          analyzerNode={analyzerNode}
          isActive={isPlaying}
          className="absolute inset-0 opacity-30"
        />
        
        <div className="relative z-10 flex flex-col gap-4">
          {/* Quick presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant="ghost"
                size="sm"
                className="shrink-0 h-8 px-3 text-xs rounded-full bg-muted/30 hover:bg-muted/50"
                onClick={() => applyPreset(preset)}
                disabled={isGenerating}
              >
                {preset.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 h-8 w-8 rounded-full bg-muted/30"
              onClick={resetChannels}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Prompt preview */}
          <div className="px-3 py-2 rounded-xl bg-black/20 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground mb-0.5">Промпт:</p>
            <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
              {currentPrompt || 'Вращайте ручки для создания микса...'}
            </p>
          </div>
        </div>
      </div>

      {/* Knobs grid */}
      <div className={cn(
        'grid gap-6 p-4 rounded-2xl bg-card/30 border border-border/30',
        isMobile ? 'grid-cols-2' : 'grid-cols-4'
      )}>
        {channels.map((channel) => (
          <PromptKnob
            key={channel.id}
            value={channel.weight / 2} // Convert 0-2 to 0-1
            label={channel.value || channel.type}
            color={CHANNEL_COLORS[channel.type as keyof typeof CHANNEL_COLORS]}
            enabled={channel.enabled}
            isActive={isPlaying && channel.enabled && channel.weight > 0}
            size={isMobile ? 'sm' : 'md'}
            onChange={(val) => updateChannel(channel.id, { weight: val * 2 })} // Convert back
            onLabelChange={(label) => updateChannel(channel.id, { value: label })}
            onToggle={() => updateChannel(channel.id, { enabled: !channel.enabled })}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-card/30 border border-border/30">
        {/* Transport */}
        <div className="flex items-center justify-center gap-3">
          <Button
            size="lg"
            className={cn(
              'h-14 w-14 rounded-full',
              'bg-gradient-to-br from-purple-500 to-blue-500',
              'hover:from-purple-600 hover:to-blue-600',
              'shadow-lg shadow-purple-500/20',
              'disabled:opacity-50'
            )}
            onClick={generateMusic}
            disabled={isGenerating || !currentPrompt}
          >
            {isGenerating ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </Button>

          {isPlaying && (
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={stopPlayback}
            >
              <Square className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* BPM & Settings */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">BPM</span>
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg px-2 py-1">
              <button 
                className="text-lg leading-none hover:text-primary transition-colors"
                onClick={() => updateGlobalSettings({ bpm: Math.max(60, globalSettings.bpm - 5) })}
              >−</button>
              <span className="w-10 text-center font-mono font-bold">{globalSettings.bpm}</span>
              <button 
                className="text-lg leading-none hover:text-primary transition-colors"
                onClick={() => updateGlobalSettings({ bpm: Math.min(180, globalSettings.bpm + 5) })}
              >+</button>
            </div>
          </div>

          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings2 className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[60vh]">
              <SheetHeader>
                <SheetTitle>Настройки</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                {/* Density */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Плотность</span>
                    <span className="text-muted-foreground">
                      {globalSettings.density < 0.3 ? 'Минимальная' : 
                       globalSettings.density > 0.7 ? 'Максимальная' : 'Средняя'}
                    </span>
                  </div>
                  <Slider
                    value={[globalSettings.density]}
                    onValueChange={([v]) => updateGlobalSettings({ density: v })}
                    min={0} max={1} step={0.05}
                  />
                </div>
                {/* Brightness */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Яркость</span>
                    <span className="text-muted-foreground">
                      {globalSettings.brightness < 0.3 ? 'Тёплый' : 
                       globalSettings.brightness > 0.7 ? 'Яркий' : 'Нейтральный'}
                    </span>
                  </div>
                  <Slider
                    value={[globalSettings.brightness]}
                    onValueChange={([v]) => updateGlobalSettings({ brightness: v })}
                    min={0} max={1} step={0.05}
                  />
                </div>
                {/* Duration */}
                <div className="flex gap-2">
                  {[10, 20, 30].map((d) => (
                    <Button
                      key={d}
                      variant={globalSettings.duration === d ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => updateGlobalSettings({ duration: d })}
                    >
                      {d}s
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Generated tracks */}
      <AnimatePresence>
        {generatedTracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-2"
          >
            <div className="text-xs text-muted-foreground px-1">
              История ({generatedTracks.length})
            </div>
            
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {generatedTracks.map((track) => (
                <motion.div
                  key={track.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl',
                    'bg-card/50 border border-border/30',
                    currentTrack?.id === track.id && 'ring-1 ring-primary'
                  )}
                >
                  {/* Play button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full bg-muted/30"
                    onClick={() => {
                      if (currentTrack?.id === track.id && isPlaying) {
                        stopPlayback();
                      } else {
                        playTrack(track);
                      }
                    }}
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </Button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{track.prompt}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {track.createdAt.toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleUseAsReference(track)}
                      title="Использовать как референс"
                    >
                      <Music className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(track)}
                      title="Скачать"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeTrack(track.id)}
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
