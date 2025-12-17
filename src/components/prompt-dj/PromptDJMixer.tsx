/**
 * PromptDJ Mixer - Professional 8-channel prompt mixer
 * Inspired by Google Lyria RealTime with rotary knobs
 */

import { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Square, Loader2, Sparkles, Settings2, 
  Download, Music, Trash2, ChevronDown, Wand2,
  Volume2, Zap
} from 'lucide-react';
import { PromptKnobEnhanced } from './PromptKnobEnhanced';
import { LiveVisualizer } from './LiveVisualizer';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { usePromptDJEnhanced } from '@/hooks/usePromptDJEnhanced';

// Channel configuration with presets
const CHANNEL_CONFIG = [
  { 
    type: 'genre', 
    label: 'Жанр', 
    color: '#a855f7',
    presets: ['Electronic', 'Hip-Hop', 'Rock', 'Jazz', 'Pop', 'Ambient', 'Classical', 'Lo-Fi', 'EDM', 'R&B', 'Metal', 'Folk']
  },
  { 
    type: 'instrument1', 
    label: 'Инстр. 1', 
    color: '#3b82f6',
    presets: ['Piano', 'Guitar', 'Synth', 'Strings', 'Bass', 'Drums', 'Brass', 'Organ', 'Flute', 'Bells', 'Pads', 'Choir']
  },
  { 
    type: 'instrument2', 
    label: 'Инстр. 2', 
    color: '#06b6d4',
    presets: ['Piano', 'Guitar', 'Synth', 'Strings', 'Bass', 'Drums', 'Brass', 'Organ', 'Flute', 'Bells', 'Pads', 'Choir']
  },
  { 
    type: 'mood', 
    label: 'Настроение', 
    color: '#ec4899',
    presets: ['Energetic', 'Calm', 'Dark', 'Happy', 'Sad', 'Epic', 'Mysterious', 'Romantic', 'Aggressive', 'Dreamy', 'Groovy', 'Tense']
  },
  { 
    type: 'texture', 
    label: 'Текстура', 
    color: '#f59e0b',
    presets: ['Smooth', 'Gritty', 'Airy', 'Dense', 'Sparse', 'Layered', 'Raw', 'Polished', 'Vintage', 'Modern', 'Organic', 'Digital']
  },
  { 
    type: 'energy', 
    label: 'Энергия', 
    color: '#ef4444',
    presets: ['Low', 'Medium', 'High', 'Building', 'Dropping', 'Explosive', 'Subtle', 'Intense', 'Relaxed', 'Driving', 'Floating', 'Pulsing']
  },
  { 
    type: 'style', 
    label: 'Стиль', 
    color: '#22c55e',
    presets: ['Minimalist', 'Maximalist', 'Retro', 'Futuristic', 'Acoustic', 'Electronic', 'Hybrid', 'Cinematic', 'Experimental', 'Traditional', 'Underground', 'Mainstream']
  },
  { 
    type: 'custom', 
    label: 'Свой', 
    color: '#8b5cf6',
    presets: []
  },
];

// Quick mix presets
const QUICK_PRESETS = [
  { id: 'lofi-chill', label: '🎧 Lo-Fi', channels: { genre: 'Lo-Fi', instrument1: 'Piano', mood: 'Calm', texture: 'Vintage' } },
  { id: 'edm-energy', label: '⚡ EDM', channels: { genre: 'EDM', instrument1: 'Synth', mood: 'Energetic', energy: 'High' } },
  { id: 'cinematic', label: '🎬 Кино', channels: { genre: 'Classical', instrument1: 'Strings', mood: 'Epic', style: 'Cinematic' } },
  { id: 'trap-dark', label: '🔥 Trap', channels: { genre: 'Hip-Hop', instrument1: 'Bass', mood: 'Dark', energy: 'Intense' } },
  { id: 'ambient', label: '🌊 Ambient', channels: { genre: 'Ambient', instrument1: 'Pads', mood: 'Dreamy', texture: 'Airy' } },
  { id: 'rock-power', label: '🎸 Rock', channels: { genre: 'Rock', instrument1: 'Guitar', mood: 'Aggressive', energy: 'Driving' } },
  { id: 'jazz-smooth', label: '🎷 Jazz', channels: { genre: 'Jazz', instrument1: 'Piano', instrument2: 'Brass', mood: 'Smooth' } },
  { id: 'synthwave', label: '🌆 Synth', channels: { genre: 'Electronic', instrument1: 'Synth', mood: 'Mysterious', style: 'Retro' } },
];

export const PromptDJMixer = memo(function PromptDJMixer() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  
  const {
    channels,
    updateChannel,
    globalSettings,
    updateGlobalSettings,
    isGenerating,
    generatedTracks,
    generateMusic,
    previewWithSynth,
    stopPreview,
    isPreviewPlaying,
    isPlaying,
    currentTrack,
    playTrack,
    stopPlayback,
    currentPrompt,
    analyzerNode,
    removeTrack,
    audioCache,
  } = usePromptDJEnhanced();

  // Apply quick preset
  const applyPreset = useCallback((preset: typeof QUICK_PRESETS[0]) => {
    Object.entries(preset.channels).forEach(([type, value]) => {
      const channel = channels.find(c => c.type === type);
      if (channel) {
        updateChannel(channel.id, { value, enabled: true, weight: 1 });
      }
    });
    toast.success(`Пресет "${preset.label}" применён`);
  }, [channels, updateChannel]);

  // Handle channel preset selection
  const handlePresetSelect = useCallback((channelId: string, preset: string) => {
    updateChannel(channelId, { value: preset, enabled: true });
    setSelectedChannel(null);
  }, [updateChannel]);

  // Use as reference
  const handleUseAsReference = useCallback((track: any) => {
    sessionStorage.setItem('audioReferenceFromDJ', JSON.stringify({
      audioUrl: track.audioUrl,
      styleDescription: track.prompt,
      source: 'promptdj'
    }));
    toast.success('Трек добавлен как референс');
    navigate('/');
  }, [navigate]);

  // Download track
  const handleDownload = useCallback(async (track: any) => {
    try {
      const response = await fetch(track.audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptdj-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Ошибка скачивания');
    }
  }, []);

  // Load drum pattern from session
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
      } catch {}
    }
  }, []);

  // Get knob size based on screen and channel count
  const knobSize = isMobile ? 'sm' : 'md';

  return (
    <div className="flex flex-col gap-3">
      {/* Header with visualizer and presets */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5 border border-border/30">
        {/* Visualizer background */}
        <LiveVisualizer
          analyzerNode={analyzerNode}
          isActive={isPlaying || isPreviewPlaying}
          className="absolute inset-0 opacity-20"
        />
        
        <div className="relative z-10 p-3">
          {/* Quick presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {QUICK_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant="ghost"
                size="sm"
                className="shrink-0 h-7 px-2.5 text-[11px] rounded-full bg-muted/20 hover:bg-muted/40"
                onClick={() => applyPreset(preset)}
                disabled={isGenerating}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Prompt preview */}
          <div className="px-2 py-1.5 rounded-lg bg-black/20 backdrop-blur-sm">
            <p className="text-[10px] text-muted-foreground">Промпт:</p>
            <p className="text-xs font-medium line-clamp-2 min-h-[2rem]">
              {currentPrompt || 'Вращайте ручки для создания микса...'}
            </p>
          </div>
        </div>
      </div>

      {/* Knobs grid - 8 channels */}
      <div className={cn(
        'grid gap-3 p-3 rounded-xl bg-card/30 border border-border/30',
        isMobile ? 'grid-cols-4' : 'grid-cols-8'
      )}>
        {CHANNEL_CONFIG.map((config) => {
          const channel = channels.find(c => c.type === config.type);
          if (!channel) return null;
          
          return (
            <div key={channel.id} className="flex flex-col items-center">
              <DropdownMenu 
                open={selectedChannel === channel.id} 
                onOpenChange={(open) => setSelectedChannel(open ? channel.id : null)}
              >
                <DropdownMenuTrigger asChild>
                  <div>
                    <PromptKnobEnhanced
                      value={channel.weight}
                      label={channel.value || config.label}
                      sublabel={channel.value ? config.label : undefined}
                      color={config.color}
                      enabled={channel.enabled}
                      isActive={(isPlaying || isPreviewPlaying) && channel.enabled && channel.weight > 0}
                      size={knobSize}
                      onChange={(val) => updateChannel(channel.id, { weight: val })}
                      onLabelClick={() => setSelectedChannel(channel.id)}
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="max-h-60 overflow-y-auto">
                  <DropdownMenuLabel className="text-xs">{config.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {config.presets.map((preset) => (
                    <DropdownMenuItem
                      key={preset}
                      onClick={() => handlePresetSelect(channel.id, preset)}
                      className="text-xs"
                    >
                      {preset}
                    </DropdownMenuItem>
                  ))}
                  {config.type === 'custom' && (
                    <DropdownMenuItem className="text-xs text-muted-foreground">
                      Введите свой текст...
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => updateChannel(channel.id, { enabled: !channel.enabled })}
                    className="text-xs"
                  >
                    {channel.enabled ? '🔇 Выключить' : '🔊 Включить'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-card/30 border border-border/30">
        {/* Transport */}
        <div className="flex items-center justify-center gap-2">
          {/* Preview button */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'h-10 w-10 rounded-full',
              isPreviewPlaying && 'bg-amber-500/20 border-amber-500'
            )}
            onClick={isPreviewPlaying ? stopPreview : previewWithSynth}
            disabled={isGenerating || !currentPrompt}
          >
            {isPreviewPlaying ? (
              <Square className="w-4 h-4" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
          </Button>

          {/* Generate button */}
          <Button
            size="lg"
            className={cn(
              'h-12 w-12 rounded-full',
              'bg-gradient-to-br from-purple-500 to-blue-500',
              'hover:from-purple-600 hover:to-blue-600',
              'shadow-lg shadow-purple-500/20',
            )}
            onClick={generateMusic}
            disabled={isGenerating || !currentPrompt}
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </Button>

          {/* Stop button */}
          {isPlaying && (
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={stopPlayback}
            >
              <Square className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* BPM & Settings row */}
        <div className="flex items-center justify-between gap-2">
          {/* BPM control */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">BPM</span>
            <div className="flex items-center bg-muted/20 rounded-lg">
              <button 
                className="w-6 h-6 flex items-center justify-center text-sm hover:bg-muted/30 rounded-l-lg"
                onClick={() => updateGlobalSettings({ bpm: Math.max(60, globalSettings.bpm - 5) })}
              >−</button>
              <span className="w-8 text-center font-mono text-xs font-bold">{globalSettings.bpm}</span>
              <button 
                className="w-6 h-6 flex items-center justify-center text-sm hover:bg-muted/30 rounded-r-lg"
                onClick={() => updateGlobalSettings({ bpm: Math.min(180, globalSettings.bpm + 5) })}
              >+</button>
            </div>
          </div>

          {/* Duration pills */}
          <div className="flex gap-1">
            {[10, 20, 30].map((d) => (
              <button
                key={d}
                className={cn(
                  'px-2 py-0.5 text-[10px] rounded-full transition-all',
                  globalSettings.duration === d 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/20 hover:bg-muted/40'
                )}
                onClick={() => updateGlobalSettings({ duration: d })}
              >
                {d}s
              </button>
            ))}
          </div>

          {/* Settings button */}
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Settings2 className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[50vh]">
              <SheetHeader>
                <SheetTitle>Настройки микса</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                {/* Density */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Плотность</span>
                    <span className="text-muted-foreground text-xs">
                      {globalSettings.density < 0.3 ? 'Разреженный' : 
                       globalSettings.density > 0.7 ? 'Плотный' : 'Средний'}
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
                    <span className="text-muted-foreground text-xs">
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
                {/* Key selection */}
                <div className="space-y-2">
                  <span className="text-sm">Тональность</span>
                  <div className="flex flex-wrap gap-1">
                    {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((key) => (
                      <button
                        key={key}
                        className={cn(
                          'w-8 h-8 rounded text-xs font-medium',
                          globalSettings.key === key 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted/30 hover:bg-muted/50'
                        )}
                        onClick={() => updateGlobalSettings({ key })}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Cache indicator */}
        {audioCache.size > 0 && (
          <div className="text-[10px] text-center text-muted-foreground">
            💾 {audioCache.size} треков в кэше
          </div>
        )}
      </div>

      {/* Generated tracks history */}
      <AnimatePresence>
        {generatedTracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-1.5"
          >
            <div className="text-[10px] text-muted-foreground px-1">
              История ({generatedTracks.length})
            </div>
            
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {generatedTracks.map((track) => (
                <motion.div
                  key={track.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg',
                    'bg-card/40 border border-border/20',
                    currentTrack?.id === track.id && 'ring-1 ring-primary'
                  )}
                >
                  {/* Play button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full bg-muted/20"
                    onClick={() => {
                      if (currentTrack?.id === track.id && isPlaying) {
                        stopPlayback();
                      } else {
                        playTrack(track);
                      }
                    }}
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Square className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3 ml-0.5" />
                    )}
                  </Button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] truncate">{track.prompt}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {track.createdAt.toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleUseAsReference(track)}
                    >
                      <Music className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDownload(track)}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeTrack(track.id)}
                    >
                      <Trash2 className="w-3 h-3" />
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
