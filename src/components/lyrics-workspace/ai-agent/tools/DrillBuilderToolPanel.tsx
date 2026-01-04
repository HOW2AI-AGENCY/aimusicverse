/**
 * DrillBuilderToolPanel - Specialized panel for Drill/Trap lyrics generation
 * Supports UK Drill, Trap, Phonk with presets and advanced Suno V5 tags
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { Zap, X, Sparkles, Volume2, Music, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ToolPanelProps } from '../types';

const DRILL_SUBGENRES = [
  { value: 'uk-drill', label: 'UK Drill', emoji: '🇬🇧', desc: '140 BPM, sliding 808, glockenspiel' },
  { value: 'ny-drill', label: 'NY Drill', emoji: '🗽', desc: 'Aggressive, darker melodies' },
  { value: 'chicago-drill', label: 'Chicago Drill', emoji: '🏙️', desc: 'Original drill, raw energy' },
  { value: 'trap', label: 'Trap', emoji: '💎', desc: 'Hi-hats, 808 bass, autotune' },
  { value: 'phonk', label: 'Phonk', emoji: '👻', desc: 'Memphis samples, cowbell, dark' },
  { value: 'dark-trap', label: 'Dark Trap', emoji: '🖤', desc: 'Minor keys, ominous, heavy' },
];

const VOCAL_STYLES = [
  { value: 'grit', label: 'Grit Vocal', emoji: '🔥' },
  { value: 'aggressive', label: 'Aggressive', emoji: '😤' },
  { value: 'melodic', label: 'Melodic Flow', emoji: '🎵' },
  { value: 'autotune', label: 'Autotune', emoji: '🎤' },
  { value: 'whisper', label: 'Whisper Rap', emoji: '🤫' },
];

const LOCATION_VIBES = [
  { value: 'street', label: 'Улица', emoji: '🌃' },
  { value: 'club', label: 'Клуб', emoji: '🪩' },
  { value: 'night-city', label: 'Ночной город', emoji: '🌆' },
  { value: 'tropical', label: 'Тропики', emoji: '🌴' },
  { value: 'underground', label: 'Андеграунд', emoji: '🚇' },
  { value: 'luxury', label: 'Люкс', emoji: '💰' },
];

const ADLIB_PRESETS = [
  '(yuh, yuh!)',
  '(gang gang!)',
  '(drill!)',
  '(skrrt!)',
  '(эй! эхо)',
  '(шёпот)',
];

export function DrillBuilderToolPanel({ context, onExecute, onClose, isLoading }: ToolPanelProps) {
  const [subgenre, setSubgenre] = useState('uk-drill');
  const [vocalStyle, setVocalStyle] = useState('grit');
  const [location, setLocation] = useState('street');
  const [theme, setTheme] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [selectedAdlibs, setSelectedAdlibs] = useState<string[]>(['(yuh, yuh!)', '(gang gang!)']);
  const [includeRussianFlow, setIncludeRussianFlow] = useState(true);
  const [includeDrop, setIncludeDrop] = useState(true);
  const [includeInstrumentalBreak, setIncludeInstrumentalBreak] = useState(true);

  const toggleAdlib = (adlib: string) => {
    setSelectedAdlibs(prev => 
      prev.includes(adlib) 
        ? prev.filter(a => a !== adlib)
        : [...prev, adlib]
    );
  };

  const handleExecute = () => {
    const selectedSubgenre = DRILL_SUBGENRES.find(s => s.value === subgenre);
    const selectedVocal = VOCAL_STYLES.find(v => v.value === vocalStyle);
    const selectedLocation = LOCATION_VIBES.find(l => l.value === location);

    onExecute({
      subgenre: subgenre,
      subgenreDescription: selectedSubgenre?.desc,
      vocalStyle: selectedVocal?.label,
      location: customLocation || selectedLocation?.label,
      theme: theme || 'уличная жизнь, деньги, успех',
      adlibs: selectedAdlibs,
      includeRussianFlow,
      includeDrop,
      includeInstrumentalBreak,
      // Pass existing context
      existingLyrics: context.existingLyrics,
      language: context.language || 'ru',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border/50 bg-orange-500/5 max-h-[70vh] overflow-y-auto overscroll-contain"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Drill Builder</h3>
              <p className="text-[10px] text-muted-foreground">UK Drill, Trap, Phonk с профессиональными тегами</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Subgenre Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5" />
            Поджанр
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            {DRILL_SUBGENRES.map((genre) => (
              <button
                key={genre.value}
                onClick={() => setSubgenre(genre.value)}
                className={cn(
                  "p-2 rounded-lg border text-left transition-all",
                  subgenre === genre.value 
                    ? "border-orange-500 bg-orange-500/10" 
                    : "border-border/50 hover:bg-muted/50"
                )}
              >
                <p className="text-xs font-medium">{genre.emoji} {genre.label}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{genre.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Vocal Style */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            Стиль вокала
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {VOCAL_STYLES.map((vocal) => (
              <Badge
                key={vocal.value}
                variant={vocalStyle === vocal.value ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all text-xs",
                  vocalStyle === vocal.value && "bg-orange-500"
                )}
                onClick={() => setVocalStyle(vocal.value)}
              >
                {vocal.emoji} {vocal.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Location/Vibe */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Локация / Вайб
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {LOCATION_VIBES.map((loc) => (
              <Badge
                key={loc.value}
                variant={location === loc.value ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all text-xs",
                  location === loc.value && "bg-orange-500"
                )}
                onClick={() => setLocation(loc.value)}
              >
                {loc.emoji} {loc.label}
              </Badge>
            ))}
          </div>
          <Input
            placeholder="Или своя локация: Пхукет, Москва, Дубай..."
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            className="h-8 text-xs mt-1"
          />
        </div>

        {/* Theme */}
        <div className="space-y-1.5">
          <Label className="text-xs">Тема</Label>
          <Textarea
            placeholder="О чём трек? Улицы, деньги, успех, враги..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="min-h-[60px] text-xs resize-none"
          />
        </div>

        {/* Adlibs Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs">Адлибы (бэк-вокал)</Label>
          <div className="flex flex-wrap gap-1.5">
            {ADLIB_PRESETS.map((adlib) => (
              <Badge
                key={adlib}
                variant={selectedAdlibs.includes(adlib) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all text-xs",
                  selectedAdlibs.includes(adlib) && "bg-orange-500/80"
                )}
                onClick={() => toggleAdlib(adlib)}
              >
                {adlib}
              </Badge>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
          <Label className="text-xs text-muted-foreground">Опции</Label>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={includeRussianFlow ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setIncludeRussianFlow(!includeRussianFlow)}
            >
              🇷🇺 Russian Flow
            </Badge>
            <Badge
              variant={includeDrop ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setIncludeDrop(!includeDrop)}
            >
              💥 Explosive Drop
            </Badge>
            <Badge
              variant={includeInstrumentalBreak ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setIncludeInstrumentalBreak(!includeInstrumentalBreak)}
            >
              🎸 Instrumental Break
            </Badge>
          </div>
        </div>

        {/* Preview of Structure */}
        <div className="p-2 bg-background/50 rounded-lg border border-border/30">
          <p className="text-[10px] text-muted-foreground mb-1">Структура:</p>
          <p className="text-xs font-mono text-orange-400">
            [Intro | Dark Synth | !fade_in] → [Verse | {VOCAL_STYLES.find(v => v.value === vocalStyle)?.label} | 808 Bass] → 
            {includeDrop && ' [Chorus | !drop | Anthemic] →'}
            {includeInstrumentalBreak && ' [Bridge | Instrumental | 8 bars] →'}
            [Outro | !fade_out] → [End]
          </p>
        </div>

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={isLoading}
          className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
        >
          <Sparkles className="w-4 h-4" />
          Сгенерировать Drill трек
        </Button>
      </div>
    </motion.div>
  );
}
