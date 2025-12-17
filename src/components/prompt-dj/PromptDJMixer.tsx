/**
 * PromptDJ Mixer - Simple knob interface with continuous reactive generation
 * Settings changes auto-generate continuation for seamless flow control
 * Enhanced with state persistence, predictive generation, and smart presets
 */

import { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Square, Loader2, Sparkles, Settings2, 
  Download, Music, Trash2, Zap, Radio, HelpCircle, Save, MoreVertical
} from 'lucide-react';
import { KnobCell } from './KnobCell';
import { OptimizedVisualizer } from './OptimizedVisualizer';
import { PromptDJOnboarding, usePromptDJOnboarding } from './PromptDJOnboarding';
import { PromptDJErrorBoundary } from './PromptDJErrorBoundary';
import { SmartPresetsPanel } from './SmartPresetsPanel';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePredictiveGeneration } from '@/hooks/usePredictiveGeneration';
import { usePromptHistory } from '@/hooks/usePromptHistory';
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
import { usePromptDJEnhanced, GeneratedTrack, CHANNEL_TYPES, ChannelType, PromptChannel } from '@/hooks/usePromptDJEnhanced';

// Quick presets - apply to first channels of matching types
const QUICK_PRESETS = [
  { id: 'lofi', label: '🎧 Lo-Fi', values: { genre: 'Lo-Fi', instrument: 'Piano', mood: 'Calm', texture: 'Vintage' } },
  { id: 'edm', label: '⚡ EDM', values: { genre: 'EDM', instrument: 'Synth', mood: 'Energetic', energy: 'High' } },
  { id: 'cinema', label: '🎬 Кино', values: { genre: 'Classical', instrument: 'Strings', mood: 'Epic', style: 'Cinematic' } },
  { id: 'trap', label: '🔥 Trap', values: { genre: 'Trap', instrument: 'Bass', mood: 'Dark', energy: 'Intense' } },
  { id: 'ambient', label: '🌊 Ambient', values: { genre: 'Ambient', instrument: 'Pads', mood: 'Dreamy', texture: 'Airy' } },
  { id: 'rock', label: '🎸 Rock', values: { genre: 'Rock', instrument: 'Guitar', mood: 'Aggressive', energy: 'Driving' } },
];

const PromptDJMixerInner = memo(function PromptDJMixerInner() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [savingTrackId, setSavingTrackId] = useState<string | null>(null);
  
  // Onboarding
  const { showOnboarding, setShowOnboarding, resetOnboarding } = usePromptDJOnboarding();
  
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
    // Live mode from hook
    isLiveMode,
    liveStatus,
    startLiveMode,
    stopLiveMode,
  } = usePromptDJEnhanced();

  // Predictive pre-generation
  const { hasPrediction, isPreGenerating } = usePredictiveGeneration(currentPrompt, {
    enabled: !isLiveMode && !isGenerating,
    duration: globalSettings.duration,
  });

  // Prompt history for smart presets
  const { saveGeneration } = usePromptHistory();

  // Handle smart preset recommendation
  const handleApplyRecommendation = useCallback((type: ChannelType, value: string) => {
    const channel = channels.find(c => c.type === type && !c.value);
    if (channel) {
      updateChannel(channel.id, { value, enabled: true, weight: 0.8 });
    } else {
      // Find first channel of this type
      const typeChannel = channels.find(c => c.type === type);
      if (typeChannel) {
        updateChannel(typeChannel.id, { value, enabled: true, weight: 0.8 });
      }
    }
  }, [channels, updateChannel]);

  // Load preset from history
  const handleLoadPreset = useCallback((preset: { channels: PromptChannel[] }) => {
    preset.channels.forEach((ch, i) => {
      if (channels[i]) {
        updateChannel(channels[i].id, {
          type: ch.type,
          value: ch.value,
          weight: ch.weight,
          enabled: ch.enabled,
        });
      }
    });
  }, [channels, updateChannel]);

  // Save track to cloud as reference
  const handleSaveToCloud = useCallback(async (track: GeneratedTrack) => {
    if (!user) {
      toast.error('Авторизуйтесь для сохранения');
      return;
    }
    
    setSavingTrackId(track.id);
    
    try {
      // Fetch audio to get duration
      const audio = new Audio(track.audioUrl);
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = resolve;
        audio.onerror = reject;
        setTimeout(reject, 5000);
      });
      
      const duration = audio.duration || 0;
      
      // Save to reference_audio table
      const { error } = await supabase
        .from('reference_audio')
        .insert({
          user_id: user.id,
          file_url: track.audioUrl,
          file_name: `PromptDJ Mix - ${new Date().toLocaleDateString('ru')}`,
          source: 'promptdj',
          style_description: track.prompt,
          duration_seconds: duration,
          analysis_status: 'completed',
          bpm: globalSettings.bpm,
          genre: channels.find(c => c.type === 'genre')?.value || null,
          mood: channels.find(c => c.type === 'mood')?.value || null,
          energy: channels.find(c => c.type === 'energy')?.value || null,
        });
      
      if (error) throw error;
      
      toast.success('Трек сохранён в облако');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSavingTrackId(null);
    }
  }, [user, globalSettings.bpm, channels]);

  // Apply quick preset - find first channel of each type to apply values
  const applyPreset = useCallback((preset: typeof QUICK_PRESETS[0]) => {
    const appliedTypes = new Set<string>();
    Object.entries(preset.values).forEach(([type, value]) => {
      // Find first channel of this type that hasn't been used
      const channel = channels.find(c => c.type === type && !appliedTypes.has(c.id));
      if (channel) {
        appliedTypes.add(channel.id);
        updateChannel(channel.id, { value: value as string, enabled: true, weight: 1 });
      }
    });
    toast.success(`Пресет "${preset.label}" применён`);
  }, [channels, updateChannel]);

  // Handle channel type change - wrapped for KnobCell
  const handleTypeChange = useCallback((channelId: string, newType: ChannelType) => {
    updateChannel(channelId, { type: newType, value: '' });
    setSelectedChannel(null);
  }, [updateChannel]);

  // Handle select channel - wrapped for KnobCell  
  const handleSelectChannel = useCallback((id: string | null) => {
    setSelectedChannel(id);
  }, []);

  // Compute isActive state once
  const isKnobsActive = useMemo(() => 
    isPlaying || isPreviewPlaying || isLiveMode, 
    [isPlaying, isPreviewPlaying, isLiveMode]
  );

  // Use as reference and navigate
  const handleUseAsReference = useCallback((track: GeneratedTrack) => {
    sessionStorage.setItem('audioReferenceFromDJ', JSON.stringify({
      audioUrl: track.audioUrl,
      styleDescription: track.prompt,
      source: 'promptdj'
    }));
    toast.success('Трек добавлен как референс');
    navigate('/');
  }, [navigate]);

  // Download
  const handleDownload = useCallback(async (track: GeneratedTrack) => {
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

  const knobSize = isMobile ? 'sm' : 'md';

  // Get live status text
  const getLiveStatusText = () => {
    switch (liveStatus) {
      case 'generating': return 'Генерация...';
      case 'transitioning': return 'Переход...';
      case 'playing': return 'Меняйте настройки';
      default: return '';
    }
  };

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
        <OptimizedVisualizer
          analyzerNode={analyzerNode}
          isActive={isPlaying || isPreviewPlaying || isLiveMode}
          className="absolute inset-0 opacity-20"
          variant="bars"
          barCount={24}
        />
        
        <div className="relative z-10 p-3">
          {/* Live mode indicator */}
          {isLiveMode && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30">
              <div className={cn(
                "w-2 h-2 rounded-full",
                liveStatus === 'generating' || liveStatus === 'transitioning' 
                  ? 'bg-amber-500 animate-pulse' 
                  : 'bg-red-500 animate-pulse'
              )} />
              <span className="text-xs font-medium text-red-400">LIVE</span>
              <span className="text-[10px] text-muted-foreground flex-1">
                {getLiveStatusText()}
              </span>
              {(liveStatus === 'generating' || liveStatus === 'transitioning') && (
                <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
              )}
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

      {/* 9 Knobs grid (3x3 on mobile, 9 columns on desktop) */}
      <div className={cn(
        'grid gap-3 p-3 rounded-xl bg-card/30 border border-border/30',
        isMobile ? 'grid-cols-3' : 'grid-cols-9'
      )}>
        {channels.map((channel) => (
          <KnobCell
            key={channel.id}
            channel={channel}
            isSelected={selectedChannel === channel.id}
            isActive={isKnobsActive}
            size={knobSize}
            onSelect={handleSelectChannel}
            onUpdate={updateChannel}
            onTypeChange={handleTypeChange}
          />
        ))}
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
              isPreviewPlaying && !isLiveMode && 'bg-amber-500/20 border-amber-500'
            )}
            onClick={isPreviewPlaying ? stopPreview : previewWithSynth}
            disabled={isGenerating || isLiveMode}
          >
            <Zap className="w-4 h-4" />
          </Button>

          {/* Live/Stop button */}
          {isLiveMode ? (
            <Button
              size="lg"
              variant="destructive"
              className="h-12 w-12 rounded-full"
              onClick={stopLiveMode}
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
              onClick={startLiveMode}
              disabled={isGenerating || !currentPrompt}
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
            disabled={isGenerating || isLiveMode || !currentPrompt}
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
                onClick={() => updateGlobalSettings({ bpm: Math.max(60, globalSettings.bpm - 5) })}
              >−</button>
              <span className="w-8 text-center font-mono text-xs font-bold">{globalSettings.bpm}</span>
              <button 
                className="w-6 h-6 flex items-center justify-center text-sm hover:bg-muted/30 rounded-r-lg"
                onClick={() => updateGlobalSettings({ bpm: Math.min(180, globalSettings.bpm + 5) })}
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
                onClick={() => updateGlobalSettings({ duration: d })}
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

                {/* Actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel className="text-[10px]">Действия</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => handleSaveToCloud(track)}
                      disabled={savingTrackId === track.id}
                      className="text-xs"
                    >
                      {savingTrackId === track.id ? (
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3 mr-2" />
                      )}
                      Сохранить в облако
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleUseAsReference(track)} className="text-xs">
                      <Music className="w-3 h-3 mr-2" />
                      Как референс
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleDownload(track)} className="text-xs">
                      <Download className="w-3 h-3 mr-2" />
                      Скачать
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => removeTrack(track.id)} 
                      className="text-xs text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Wrap with error boundary for production stability
export const PromptDJMixer = memo(function PromptDJMixer() {
  return (
    <PromptDJErrorBoundary>
      <PromptDJMixerInner />
    </PromptDJErrorBoundary>
  );
});
