/**
 * PromptDJ Mixer - Improved UI with Quick Start, compact visualizer, and essentials mode
 * Enhanced UX with editable prompt, progress tracking, waveform history, and smart suggestions
 */

import { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Square, Loader2, Settings2, 
  Zap, Radio, HelpCircle, Rocket
} from 'lucide-react';
import { EssentialsKnobGrid } from './EssentialsKnobGrid';
import { CompactVisualizer } from './CompactVisualizer';
import { EditablePromptPreview } from './EditablePromptPreview';
import { GenerateButton } from './GenerateButton';
import { TrackHistoryItem } from './TrackHistoryItem';
import { QuickStartSheet, type QuickStartPreset } from './QuickStartSheet';
import { SmartSuggestions } from './SmartSuggestions';
import { PromptDJOnboarding, usePromptDJOnboarding } from './PromptDJOnboarding';
import { PromptDJErrorBoundary } from './PromptDJErrorBoundary';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePredictiveGeneration } from '@/hooks/usePredictiveGeneration';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { usePromptDJEnhanced, GeneratedTrack, ChannelType, PromptChannel } from '@/hooks/usePromptDJEnhanced';

// Quick presets for header chips
const QUICK_PRESETS = [
  { id: 'lofi', label: '🎧 Lo-Fi', values: { genre: 'Lo-Fi', instrument: 'Piano', mood: 'Calm', texture: 'Vintage' } },
  { id: 'edm', label: '⚡ EDM', values: { genre: 'EDM', instrument: 'Synth', mood: 'Energetic', energy: 'High' } },
  { id: 'cinema', label: '🎬 Кино', values: { genre: 'Classical', instrument: 'Strings', mood: 'Epic', style: 'Cinematic' } },
  { id: 'trap', label: '🔥 Trap', values: { genre: 'Trap', instrument: 'Bass', mood: 'Dark', energy: 'Intense' } },
];

const PromptDJMixerInner = memo(function PromptDJMixerInner() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const haptic = useHapticFeedback();
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [savingTrackId, setSavingTrackId] = useState<string | null>(null);
  const [isKnobAdjusting, setIsKnobAdjusting] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  
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
    isLiveMode,
    liveStatus,
    startLiveMode,
    stopLiveMode,
    forceRegenerateInLive,
  } = usePromptDJEnhanced();

  // Predictive pre-generation - check cache
  const { hasPrediction } = usePredictiveGeneration(currentPrompt, {
    enabled: !isLiveMode && !isGenerating,
    duration: globalSettings.duration,
  });

  // Show quick start on first visit
  useEffect(() => {
    const hasSeenQuickStart = localStorage.getItem('promptdj-seen-quickstart');
    if (!hasSeenQuickStart && !showOnboarding) {
      setShowQuickStart(true);
      localStorage.setItem('promptdj-seen-quickstart', 'true');
    }
  }, [showOnboarding]);

  // Knob change handlers for Live mode with haptic feedback
  const handleKnobChangeStart = useCallback(() => {
    setIsKnobAdjusting(true);
    haptic.tap();
  }, [haptic]);

  const handleKnobChangeEnd = useCallback(() => {
    setIsKnobAdjusting(false);
    haptic.select();
    if (isLiveMode && liveStatus === 'playing') {
      setTimeout(() => forceRegenerateInLive?.(), 100);
    }
  }, [isLiveMode, liveStatus, forceRegenerateInLive, haptic]);

  // Smart suggestions handlers
  const handleApplySuggestion = useCallback((suggestion: { action?: { channelType?: string; value?: string; setting?: Partial<typeof globalSettings> } }) => {
    if (!suggestion.action) return;
    
    haptic.success();
    
    if (suggestion.action.channelType && suggestion.action.value) {
      const channel = channels.find(c => c.type === suggestion.action!.channelType);
      if (channel) {
        updateChannel(channel.id, { value: suggestion.action.value, enabled: true, weight: 0.7 });
      }
    }
    
    if (suggestion.action.setting) {
      updateGlobalSettings(suggestion.action.setting);
    }
    
    toast.success('Рекомендация применена');
  }, [channels, updateChannel, updateGlobalSettings, haptic]);

  const handleDismissSuggestion = useCallback((id: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(id));
  }, []);

  // Apply quick preset from chips
  const applyPreset = useCallback((preset: typeof QUICK_PRESETS[0]) => {
    haptic.success();
    const appliedTypes = new Set<string>();
    Object.entries(preset.values).forEach(([type, value]) => {
      const channel = channels.find(c => c.type === type && !appliedTypes.has(c.id));
      if (channel) {
        appliedTypes.add(channel.id);
        updateChannel(channel.id, { value: value as string, enabled: true, weight: 1 });
      }
    });
    toast.success(`Пресет "${preset.label}" применён`);
  }, [channels, updateChannel, haptic]);

  // Apply quick start preset
  const handleApplyQuickStart = useCallback((preset: QuickStartPreset) => {
    haptic.success();
    // Apply channel settings
    Object.entries(preset.channels).forEach(([type, config]) => {
      const channel = channels.find(c => c.type === type);
      if (channel && config) {
        updateChannel(channel.id, { 
          value: config.value, 
          enabled: true, 
          weight: config.weight 
        });
      }
    });
    // Apply global settings
    updateGlobalSettings(preset.settings);
    toast.success(`Пресет "${preset.label}" применён`);
  }, [channels, updateChannel, updateGlobalSettings, haptic]);

  // Channel handlers
  const handleTypeChange = useCallback((channelId: string, newType: ChannelType) => {
    updateChannel(channelId, { type: newType, value: '' });
    setSelectedChannel(null);
  }, [updateChannel]);

  const handleSelectChannel = useCallback((id: string | null) => {
    setSelectedChannel(id);
  }, []);

  // Save track to cloud
  const handleSaveToCloud = useCallback(async (track: GeneratedTrack) => {
    if (!user) {
      toast.error('Авторизуйтесь для сохранения');
      return;
    }
    
    setSavingTrackId(track.id);
    
    try {
      const audio = new Audio(track.audioUrl);
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = resolve;
        audio.onerror = reject;
        setTimeout(reject, 5000);
      });
      
      const duration = audio.duration || 0;
      
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

  // Use as reference (unified system)
  const handleUseAsReference = useCallback((track: GeneratedTrack) => {
    import('@/services/audio-reference').then(({ ReferenceManager }) => {
      ReferenceManager.createFromCreativeTool('dj', {
        audioUrl: track.audioUrl,
        styleDescription: track.prompt,
        bpm: globalSettings.bpm,
      });
      toast.success('Трек добавлен как референс');
      navigate('/');
    });
  }, [navigate, globalSettings.bpm]);

  // Download track
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

  // Compute active state
  const isKnobsActive = useMemo(() => 
    isPlaying || isPreviewPlaying || isLiveMode, 
    [isPlaying, isPreviewPlaying, isLiveMode]
  );

  // Live status text
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

      {/* Quick Start Sheet */}
      <QuickStartSheet
        isOpen={showQuickStart}
        onClose={() => setShowQuickStart(false)}
        onApplyPreset={handleApplyQuickStart}
      />

      {/* Header with compact visualizer */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5 border border-border/30">
        {/* Compact visualizer - 40px height */}
        <CompactVisualizer
          analyzerNode={analyzerNode}
          isActive={isKnobsActive}
          className="absolute inset-x-0 top-0"
        />
        
        <div className="relative z-10 p-3 pt-12">
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
          
          {/* Quick presets row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 h-7 px-2.5 text-[11px] rounded-full bg-primary/20 hover:bg-primary/30 text-primary"
              onClick={() => setShowQuickStart(true)}
            >
              <Rocket className="w-3 h-3 mr-1" />
              Quick Start
            </Button>
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

          {/* Editable prompt preview */}
          <EditablePromptPreview
            prompt={currentPrompt}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Essentials Knob Grid (4 essential + expandable advanced) */}
      <EssentialsKnobGrid
        channels={channels}
        isActive={isKnobsActive}
        selectedChannel={selectedChannel}
        onSelect={handleSelectChannel}
        onUpdate={updateChannel}
        onTypeChange={handleTypeChange}
        onChangeStart={handleKnobChangeStart}
        onChangeEnd={handleKnobChangeEnd}
      />

      {/* Smart Suggestions */}
      <SmartSuggestions
        channels={channels}
        globalSettings={globalSettings}
        onApplySuggestion={handleApplySuggestion}
        onDismiss={handleDismissSuggestion}
        dismissedIds={dismissedSuggestions}
      />

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
            title="Превью с синтезатором"
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

          {/* Generate single track with progress */}
          <GenerateButton
            onClick={generateMusic}
            isGenerating={isGenerating}
            isLiveMode={isLiveMode}
            disabled={!currentPrompt}
            hasCachedResult={hasPrediction(currentPrompt)}
            estimatedTime={globalSettings.duration + 5}
          />
        </div>

        {/* BPM & Settings row */}
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

          {/* Help */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full"
            onClick={resetOnboarding}
            title="Справка"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>

          {/* Settings sheet */}
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

      {/* Generated tracks with waveform */}
      {generatedTracks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground px-1">
            История ({generatedTracks.length})
          </h4>
          
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {generatedTracks.map((track) => (
              <TrackHistoryItem
                key={track.id}
                track={track}
                isPlaying={isPlaying}
                isCurrent={currentTrack?.id === track.id}
                isSaving={savingTrackId === track.id}
                onPlay={() => playTrack(track)}
                onStop={stopPlayback}
                onSave={() => handleSaveToCloud(track)}
                onUseAsReference={() => handleUseAsReference(track)}
                onDownload={() => handleDownload(track)}
                onRemove={() => removeTrack(track.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Wrap with error boundary
export const PromptDJMixer = memo(function PromptDJMixer() {
  return (
    <PromptDJErrorBoundary>
      <PromptDJMixerInner />
    </PromptDJErrorBoundary>
  );
});
