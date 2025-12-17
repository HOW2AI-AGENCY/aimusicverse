/**
 * PromptDJ Mixer - Professional AI music mixer
 * Russian UI, English prompts, genre mixing, multi-instruments
 */

import { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Play, Square, Loader2, Sparkles, 
  Download, Music, Trash2, Zap, Mic
} from 'lucide-react';
import { GenreCrossfader } from './GenreCrossfader';
import { InstrumentSelector } from './InstrumentSelector';
import { MoodStyleSelector } from './MoodStyleSelector';
import { GlobalControls } from './GlobalControls';
import { QuickMixPresets } from './QuickMixPresets';
import { LiveVisualizer } from './LiveVisualizer';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  GENRE_PRESETS, 
  INSTRUMENT_PRESETS, 
  MOOD_PRESETS, 
  STYLE_PRESETS,
  buildEnglishPrompt,
  getPresetById,
  QuickMixPreset,
} from '@/lib/prompt-dj-presets';
import { usePromptDJEnhanced } from '@/hooks/usePromptDJEnhanced';

export const PromptDJMixer = memo(function PromptDJMixer() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Genre mixing state
  const [genreAId, setGenreAId] = useState<string | null>('electronic');
  const [genreBId, setGenreBId] = useState<string | null>(null);
  const [crossfaderPosition, setCrossfaderPosition] = useState(0);
  
  // Instruments state (multi-select)
  const [instrumentIds, setInstrumentIds] = useState<string[]>(['synth', 'drums']);
  
  // Mood & Style state
  const [moodId, setMoodId] = useState<string | null>('energetic');
  const [styleId, setStyleId] = useState<string | null>(null);
  const [moodWeight, setMoodWeight] = useState(0.7);
  const [styleWeight, setStyleWeight] = useState(0.5);
  
  // Custom text (in English)
  const [customText, setCustomText] = useState('');
  
  // Global settings
  const [bpm, setBpm] = useState(120);
  const [keyValue, setKeyValue] = useState('C');
  const [scale, setScale] = useState('minor');
  const [density, setDensity] = useState(0.5);
  const [brightness, setBrightness] = useState(0.5);
  const [duration, setDuration] = useState(20);

  const {
    isGenerating,
    generatedTracks,
    generateMusic: generateMusicHook,
    previewWithSynth,
    stopPreview,
    isPreviewPlaying,
    isPlaying,
    currentTrack,
    playTrack,
    stopPlayback,
    analyzerNode,
    removeTrack,
    audioCache,
    updateGlobalSettings: updateHookSettings,
  } = usePromptDJEnhanced();

  // Build English prompt from current state
  const currentPrompt = useMemo(() => {
    const genreA = genreAId ? getPresetById(GENRE_PRESETS, genreAId) : null;
    const genreB = genreBId ? getPresetById(GENRE_PRESETS, genreBId) : null;
    const instruments = instrumentIds.map(id => getPresetById(INSTRUMENT_PRESETS, id)).filter(Boolean) as typeof INSTRUMENT_PRESETS;
    const mood = moodId ? getPresetById(MOOD_PRESETS, moodId) : null;
    const style = styleId ? getPresetById(STYLE_PRESETS, styleId) : null;

    return buildEnglishPrompt(
      genreA || null,
      genreB || null,
      crossfaderPosition,
      instruments,
      mood || null,
      style || null,
      customText,
      { bpm, key: keyValue, scale, density, brightness }
    );
  }, [genreAId, genreBId, crossfaderPosition, instrumentIds, moodId, styleId, moodWeight, styleWeight, customText, bpm, keyValue, scale, density, brightness]);

  // Sync settings to hook for preview
  useEffect(() => {
    updateHookSettings({ bpm, key: keyValue, scale, density, brightness, duration });
  }, [bpm, keyValue, scale, density, brightness, duration, updateHookSettings]);

  // Apply quick preset
  const applyQuickPreset = useCallback((preset: QuickMixPreset) => {
    setGenreAId(preset.genreA);
    setGenreBId(preset.genreB || null);
    setCrossfaderPosition(preset.crossfader || 0);
    setInstrumentIds(preset.instruments);
    setMoodId(preset.mood);
    setStyleId(preset.style);
    if (preset.bpm) setBpm(preset.bpm);
    if (preset.density !== undefined) setDensity(preset.density);
    if (preset.brightness !== undefined) setBrightness(preset.brightness);
    toast.success(`Применён пресет: ${preset.label}`);
  }, []);

  // Generate music
  const handleGenerate = useCallback(async () => {
    if (!currentPrompt.trim()) {
      toast.error('Настройте параметры для генерации');
      return;
    }
    await generateMusicHook();
  }, [currentPrompt, generateMusicHook]);

  // Use as audio reference
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
        const { description, bpm: drumBpm } = JSON.parse(drumData);
        setCustomText(description);
        if (drumBpm) setBpm(drumBpm);
        toast.success('Паттерн из драм-машины загружен');
        sessionStorage.removeItem('drumPatternForDJ');
      } catch {}
    }
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Header with visualizer */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/10 via-background to-blue-500/10 border border-border/30">
        <LiveVisualizer
          analyzerNode={analyzerNode}
          isActive={isPlaying || isPreviewPlaying}
          className="absolute inset-0 opacity-30"
        />
        
        <div className="relative z-10 p-3 space-y-2">
          {/* Quick presets */}
          <QuickMixPresets onApply={applyQuickPreset} disabled={isGenerating} />

          {/* Prompt preview */}
          <div className="px-3 py-2 rounded-lg bg-black/30 backdrop-blur-sm">
            <p className="text-[10px] text-muted-foreground mb-1">Промпт (англ.):</p>
            <p className="text-xs font-medium text-foreground/90 line-clamp-2 min-h-[2.5rem]">
              {currentPrompt || 'Настройте жанры и инструменты...'}
            </p>
          </div>
        </div>
      </div>

      {/* Genre Crossfader A/B */}
      <GenreCrossfader
        genreAId={genreAId}
        genreBId={genreBId}
        crossfaderPosition={crossfaderPosition}
        onGenreAChange={setGenreAId}
        onGenreBChange={setGenreBId}
        onCrossfaderChange={setCrossfaderPosition}
        disabled={isGenerating}
      />

      {/* Instruments multi-select */}
      <InstrumentSelector
        selectedIds={instrumentIds}
        onChange={setInstrumentIds}
        maxSelection={4}
        disabled={isGenerating}
      />

      {/* Mood & Style */}
      <MoodStyleSelector
        moodId={moodId}
        styleId={styleId}
        moodWeight={moodWeight}
        styleWeight={styleWeight}
        onMoodChange={setMoodId}
        onStyleChange={setStyleId}
        onMoodWeightChange={setMoodWeight}
        onStyleWeightChange={setStyleWeight}
        disabled={isGenerating}
      />

      {/* Custom text input */}
      <div className="p-3 rounded-xl bg-card/30 border border-border/30 space-y-2">
        <span className="text-xs font-medium text-violet-400">Дополнительно (англ.)</span>
        <Input
          placeholder="ambient textures, vinyl crackle, lo-fi..."
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          className="h-8 text-xs bg-violet-500/10 border-violet-500/30"
          disabled={isGenerating}
        />
      </div>

      {/* Global controls */}
      <GlobalControls
        bpm={bpm}
        keyValue={keyValue}
        scale={scale}
        density={density}
        brightness={brightness}
        duration={duration}
        onBpmChange={setBpm}
        onKeyChange={setKeyValue}
        onScaleChange={setScale}
        onDensityChange={setDensity}
        onBrightnessChange={setBrightness}
        onDurationChange={setDuration}
        disabled={isGenerating}
      />

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-card/30 border border-border/30">
        {/* Preview */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-11 w-11 rounded-full',
            isPreviewPlaying && 'bg-amber-500/20 border-amber-500'
          )}
          onClick={isPreviewPlaying ? stopPreview : previewWithSynth}
          disabled={isGenerating}
        >
          {isPreviewPlaying ? (
            <Square className="w-4 h-4" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
        </Button>

        {/* Generate */}
        <Button
          size="lg"
          className={cn(
            'h-14 w-14 rounded-full',
            'bg-gradient-to-br from-purple-500 to-blue-500',
            'hover:from-purple-600 hover:to-blue-600',
            'shadow-lg shadow-purple-500/30',
          )}
          onClick={handleGenerate}
          disabled={isGenerating || !currentPrompt}
        >
          {isGenerating ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Sparkles className="w-6 h-6" />
          )}
        </Button>

        {/* Stop playback */}
        {isPlaying && (
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={stopPlayback}
          >
            <Square className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Cache indicator */}
      {audioCache.size > 0 && (
        <div className="text-[10px] text-center text-muted-foreground">
          💾 {audioCache.size} треков в кэше
        </div>
      )}

      {/* Generated tracks */}
      {generatedTracks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground px-1">
            История ({generatedTracks.length})
          </h4>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {generatedTracks.map((track) => (
              <div
                key={track.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg',
                  'bg-card/40 border border-border/30',
                  currentTrack?.id === track.id && 'border-primary/50 bg-primary/5'
                )}
              >
                {/* Play/Stop button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => currentTrack?.id === track.id && isPlaying ? stopPlayback() : playTrack(track)}
                >
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Square className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </Button>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                    {track.prompt.slice(0, 50)}...
                  </p>
                  <p className="text-[9px] text-muted-foreground/60">
                    {track.createdAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleUseAsReference(track)}
                    title="Как референс"
                  >
                    <Music className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDownload(track)}
                    title="Скачать"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeTrack(track.id)}
                    title="Удалить"
                  >
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
