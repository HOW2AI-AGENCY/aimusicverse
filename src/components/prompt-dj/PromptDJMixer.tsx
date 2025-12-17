/**
 * PromptDJ Mixer - Simple knob interface with continuous reactive generation
 * Settings changes auto-generate continuation for seamless flow control
 */

import { memo, useCallback, useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Square, Loader2, Sparkles, Settings2, 
  Download, Music, Trash2, Zap, Radio, HelpCircle
} from 'lucide-react';
import { PromptKnobEnhanced } from './PromptKnobEnhanced';
import { LiveVisualizer } from './LiveVisualizer';
import { PromptDJOnboarding, usePromptDJOnboarding } from './PromptDJOnboarding';
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
import { Switch } from '@/components/ui/switch';
import { usePromptDJEnhanced } from '@/hooks/usePromptDJEnhanced';

// Channel configuration - simple 6 knobs
const CHANNEL_CONFIG = [
  { 
    type: 'genre', 
    label: 'Жанр', 
    color: '#a855f7',
    presets: ['Electronic', 'Hip-Hop', 'Rock', 'Jazz', 'Pop', 'Ambient', 'Lo-Fi', 'EDM', 'Classical', 'Trap']
  },
  { 
    type: 'instrument1', 
    label: 'Инструмент', 
    color: '#3b82f6',
    presets: ['Piano', 'Guitar', 'Synth', 'Strings', 'Bass', 'Drums', 'Pads', 'Brass', 'Bells', 'Choir']
  },
  { 
    type: 'mood', 
    label: 'Настроение', 
    color: '#ec4899',
    presets: ['Energetic', 'Calm', 'Dark', 'Happy', 'Epic', 'Dreamy', 'Aggressive', 'Romantic', 'Mysterious', 'Groovy']
  },
  { 
    type: 'energy', 
    label: 'Энергия', 
    color: '#ef4444',
    presets: ['Low', 'Medium', 'High', 'Building', 'Dropping', 'Intense', 'Relaxed', 'Driving', 'Floating', 'Explosive']
  },
  { 
    type: 'texture', 
    label: 'Текстура', 
    color: '#f59e0b',
    presets: ['Smooth', 'Gritty', 'Airy', 'Dense', 'Sparse', 'Layered', 'Vintage', 'Modern', 'Organic', 'Digital']
  },
  { 
    type: 'style', 
    label: 'Стиль', 
    color: '#22c55e',
    presets: ['Minimalist', 'Maximalist', 'Retro', 'Futuristic', 'Cinematic', 'Experimental', 'Acoustic', 'Electronic']
  },
];

// Quick presets
const QUICK_PRESETS = [
  { id: 'lofi', label: '🎧 Lo-Fi', channels: { genre: 'Lo-Fi', instrument1: 'Piano', mood: 'Calm', texture: 'Vintage' } },
  { id: 'edm', label: '⚡ EDM', channels: { genre: 'EDM', instrument1: 'Synth', mood: 'Energetic', energy: 'High' } },
  { id: 'cinema', label: '🎬 Кино', channels: { genre: 'Classical', instrument1: 'Strings', mood: 'Epic', style: 'Cinematic' } },
  { id: 'trap', label: '🔥 Trap', channels: { genre: 'Trap', instrument1: 'Bass', mood: 'Dark', energy: 'Intense' } },
  { id: 'ambient', label: '🌊 Ambient', channels: { genre: 'Ambient', instrument1: 'Pads', mood: 'Dreamy', texture: 'Airy' } },
  { id: 'rock', label: '🎸 Rock', channels: { genre: 'Rock', instrument1: 'Guitar', mood: 'Aggressive', energy: 'Driving' } },
];

export const PromptDJMixer = memo(function PromptDJMixer() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // Onboarding
  const { showOnboarding, setShowOnboarding, resetOnboarding } = usePromptDJOnboarding();
  
  // Ref for tracking settings changes in continuous mode
  const settingsChangedRef = useRef(false);
  const continuousTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Start continuous mode - live DJ session
  const startLiveSession = useCallback(() => {
    setIsLive(true);
    setContinuousMode(true);
    previewWithSynth();
    toast.success('🎧 Live сессия запущена! Меняйте настройки для управления потоком');
  }, [previewWithSynth]);

  // Stop live session
  const stopLiveSession = useCallback(() => {
    setIsLive(false);
    setContinuousMode(false);
    stopPreview();
    stopPlayback();
    if (continuousTimerRef.current) {
      clearTimeout(continuousTimerRef.current);
    }
    toast.info('Live сессия остановлена');
  }, [stopPreview, stopPlayback]);

  // Track settings changes in continuous mode
  const handleChannelUpdate = useCallback((id: string, updates: any) => {
    updateChannel(id, updates);
    if (continuousMode && isLive) {
      settingsChangedRef.current = true;
    }
  }, [updateChannel, continuousMode, isLive]);

  const handleSettingsUpdate = useCallback((updates: any) => {
    updateGlobalSettings(updates);
    if (continuousMode && isLive) {
      settingsChangedRef.current = true;
    }
  }, [updateGlobalSettings, continuousMode, isLive]);

  // In continuous mode, auto-generate when settings change (debounced)
  useEffect(() => {
    if (!continuousMode || !isLive || !settingsChangedRef.current) return;
    
    // Clear previous timer
    if (continuousTimerRef.current) {
      clearTimeout(continuousTimerRef.current);
    }
    
    // Debounce generation to avoid too many calls
    continuousTimerRef.current = setTimeout(async () => {
      if (settingsChangedRef.current && !isGenerating) {
        settingsChangedRef.current = false;
        // Generate new segment with current settings
        try {
          await generateMusic();
        } catch (e) {
          console.error('Continuous generation error:', e);
        }
      }
    }, 2000); // 2 second debounce
    
    return () => {
      if (continuousTimerRef.current) {
        clearTimeout(continuousTimerRef.current);
      }
    };
  }, [channels, globalSettings, continuousMode, isLive, isGenerating, generateMusic]);

  // Apply quick preset
  const applyPreset = useCallback((preset: typeof QUICK_PRESETS[0]) => {
    Object.entries(preset.channels).forEach(([type, value]) => {
      const channel = channels.find(c => c.type === type);
      if (channel) {
        handleChannelUpdate(channel.id, { value, enabled: true, weight: 1 });
      }
    });
    toast.success(`Пресет "${preset.label}" применён`);
  }, [channels, handleChannelUpdate]);

  // Handle channel preset selection
  const handlePresetSelect = useCallback((channelId: string, preset: string) => {
    handleChannelUpdate(channelId, { value: preset, enabled: true });
    setSelectedChannel(null);
  }, [handleChannelUpdate]);

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

  // Download
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
          handleChannelUpdate(customChannel.id, { value: description, enabled: true, weight: 1 });
        }
        if (bpm) handleSettingsUpdate({ bpm });
        toast.success('Паттерн из драм-машины загружен');
        sessionStorage.removeItem('drumPatternForDJ');
      } catch {}
    }
  }, []);

  const knobSize = isMobile ? 'sm' : 'md';

  return (
    <div className="flex flex-col gap-3">
      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <PromptDJOnboarding
            onComplete={() => setShowOnboarding(false)}
            onSkip={() => setShowOnboarding(false)}
          />
        )}
      </AnimatePresence>

      {/* Header with visualizer */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5 border border-border/30">
        <LiveVisualizer
          analyzerNode={analyzerNode}
          isActive={isPlaying || isPreviewPlaying || isLive}
          className="absolute inset-0 opacity-20"
        />
        
        <div className="relative z-10 p-3">
          {/* Live mode indicator */}
          {isLive && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-400">LIVE</span>
              <span className="text-[10px] text-muted-foreground flex-1">
                Меняйте ручки для управления потоком
              </span>
            </div>
          )}
          
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
              {currentPrompt || 'Вращайте ручки...'}
            </p>
          </div>
        </div>
      </div>

      {/* 6 Knobs grid */}
      <div className={cn(
        'grid gap-3 p-3 rounded-xl bg-card/30 border border-border/30',
        isMobile ? 'grid-cols-3' : 'grid-cols-6'
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
                      isActive={(isPlaying || isPreviewPlaying || isLive) && channel.enabled && channel.weight > 0}
                      size={knobSize}
                      onChange={(val) => handleChannelUpdate(channel.id, { weight: val })}
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleChannelUpdate(channel.id, { enabled: !channel.enabled })}
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
        {/* Transport row */}
        <div className="flex items-center justify-center gap-2">
          {/* Preview button */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'h-10 w-10 rounded-full',
              isPreviewPlaying && !isLive && 'bg-amber-500/20 border-amber-500'
            )}
            onClick={isPreviewPlaying ? stopPreview : previewWithSynth}
            disabled={isGenerating || isLive}
          >
            <Zap className="w-4 h-4" />
          </Button>

          {/* Live/Stop button */}
          {isLive ? (
            <Button
              size="lg"
              variant="destructive"
              className="h-12 w-12 rounded-full"
              onClick={stopLiveSession}
            >
              <Square className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              size="lg"
              className={cn(
                'h-12 w-12 rounded-full',
                'bg-gradient-to-br from-red-500 to-orange-500',
                'hover:from-red-600 hover:to-orange-600',
                'shadow-lg shadow-red-500/20',
              )}
              onClick={startLiveSession}
              disabled={isGenerating}
              title="Запустить Live сессию"
            >
              <Radio className="w-5 h-5" />
            </Button>
          )}

          {/* Generate single track */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'h-10 w-10 rounded-full',
              'border-purple-500/30 hover:bg-purple-500/20'
            )}
            onClick={generateMusic}
            disabled={isGenerating || !currentPrompt}
            title="Сгенерировать трек"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* BPM & Settings */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">BPM</span>
            <div className="flex items-center bg-muted/20 rounded-lg">
              <button 
                className="w-6 h-6 flex items-center justify-center text-sm hover:bg-muted/30 rounded-l-lg"
                onClick={() => handleSettingsUpdate({ bpm: Math.max(60, globalSettings.bpm - 5) })}
              >−</button>
              <span className="w-8 text-center font-mono text-xs font-bold">{globalSettings.bpm}</span>
              <button 
                className="w-6 h-6 flex items-center justify-center text-sm hover:bg-muted/30 rounded-r-lg"
                onClick={() => handleSettingsUpdate({ bpm: Math.min(180, globalSettings.bpm + 5) })}
              >+</button>
            </div>
          </div>

          {/* Duration */}
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
                onClick={() => handleSettingsUpdate({ duration: d })}
              >
                {d}s
              </button>
            ))}
          </div>

          {/* Help button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full"
            onClick={resetOnboarding}
            title="Справка"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>

          {/* Settings */}
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Settings2 className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[50vh]">
              <SheetHeader>
                <SheetTitle>Настройки</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                {/* Continuous mode toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Непрерывный режим</p>
                    <p className="text-xs text-muted-foreground">
                      Авто-генерация при изменении настроек
                    </p>
                  </div>
                  <Switch 
                    checked={continuousMode} 
                    onCheckedChange={setContinuousMode}
                  />
                </div>
                
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
                    onValueChange={([v]) => handleSettingsUpdate({ density: v })}
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
                    onValueChange={([v]) => handleSettingsUpdate({ brightness: v })}
                    min={0} max={1} step={0.05}
                  />
                </div>
                
                {/* Key */}
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
                        onClick={() => handleSettingsUpdate({ key })}
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
            💾 {audioCache.size} в кэше
          </div>
        )}
      </div>

      {/* Generated tracks */}
      {generatedTracks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground px-1">
            История ({generatedTracks.length})
          </h4>
          
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {generatedTracks.map((track) => (
              <div
                key={track.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg',
                  'bg-card/40 border border-border/30',
                  currentTrack?.id === track.id && 'border-primary/50'
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => currentTrack?.id === track.id && isPlaying ? stopPlayback() : playTrack(track)}
                >
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Square className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>

                <p className="flex-1 text-[10px] text-muted-foreground truncate">
                  {track.prompt.slice(0, 40)}...
                </p>

                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUseAsReference(track)}>
                    <Music className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDownload(track)}>
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeTrack(track.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
