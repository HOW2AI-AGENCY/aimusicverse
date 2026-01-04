/**
 * EpicBuilderToolPanel - Specialized panel for Epic/Cinematic lyrics generation
 * Supports Cyberpunk, Orchestral, Power Metal with transformations and complex tags
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { Crown, X, Sparkles, Layers, Zap, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ToolPanelProps } from '../types';

const EPIC_STYLES = [
  { value: 'cyberpunk', label: 'Cyberpunk', emoji: '🤖', desc: 'Дистопия, неон, синты' },
  { value: 'orchestral', label: 'Orchestral Epic', emoji: '🎻', desc: 'Хор, оркестр, кинематограф' },
  { value: 'power-metal', label: 'Power Metal', emoji: '⚔️', desc: 'Эпик, гитары, героика' },
  { value: 'dark-synthwave', label: 'Dark Synthwave', emoji: '🌃', desc: 'Ретро-футуризм, драйв' },
  { value: 'industrial', label: 'Industrial', emoji: '🏭', desc: 'Механика, агрессия, глитч' },
  { value: 'gothic', label: 'Gothic Rock', emoji: '🦇', desc: 'Мрачность, романтика, орган' },
];

const EMOTIONAL_ARCS = [
  { value: 'rise', label: 'Восхождение', desc: 'Soft → Epic', emoji: '📈' },
  { value: 'fall', label: 'Падение', desc: 'Epic → Dark', emoji: '📉' },
  { value: 'phoenix', label: 'Феникс', desc: 'Dark → Powerful → Triumphant', emoji: '🔥' },
  { value: 'storm', label: 'Буря', desc: 'Calm → Chaos → Calm', emoji: '⛈️' },
];

const TRANSFORMATION_TAGS = [
  { value: 'Soft -> Explosive', label: 'Мягко → Взрыв' },
  { value: 'Whisper -> Shout', label: 'Шёпот → Крик' },
  { value: 'Slow -> Fast', label: 'Медленно → Быстро' },
  { value: 'Sad -> Hopeful', label: 'Грусть → Надежда' },
  { value: 'Dark -> Light', label: 'Тьма → Свет' },
  { value: 'Solo -> Full Choir', label: 'Соло → Хор' },
];

const EPIC_INSTRUMENTS = [
  { value: 'choir', label: 'Хор', emoji: '👼' },
  { value: 'strings', label: 'Струнные', emoji: '🎻' },
  { value: 'brass', label: 'Духовые', emoji: '🎺' },
  { value: 'synth-lead', label: 'Synth Lead', emoji: '🎹' },
  { value: 'distorted-guitar', label: 'Dist Guitar', emoji: '🎸' },
  { value: 'timpani', label: 'Timpani', emoji: '🥁' },
];

export function EpicBuilderToolPanel({ context, onExecute, onClose, isLoading }: ToolPanelProps) {
  const [style, setStyle] = useState('cyberpunk');
  const [emotionalArc, setEmotionalArc] = useState('rise');
  const [theme, setTheme] = useState('');
  const [selectedTransformations, setSelectedTransformations] = useState<string[]>(['Soft -> Explosive']);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(['choir', 'synth-lead']);
  const [includeInstrumentalSolo, setIncludeInstrumentalSolo] = useState(true);
  const [includeSilenceBreak, setIncludeSilenceBreak] = useState(true);
  const [epicScale, setEpicScale] = useState<'medium' | 'large' | 'massive'>('large');

  const toggleTransformation = (transform: string) => {
    setSelectedTransformations(prev => 
      prev.includes(transform) 
        ? prev.filter(t => t !== transform)
        : [...prev, transform]
    );
  };

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments(prev => 
      prev.includes(instrument) 
        ? prev.filter(i => i !== instrument)
        : [...prev, instrument]
    );
  };

  const handleExecute = () => {
    const selectedStyle = EPIC_STYLES.find(s => s.value === style);
    const selectedArc = EMOTIONAL_ARCS.find(a => a.value === emotionalArc);

    onExecute({
      style: style,
      styleDescription: selectedStyle?.desc,
      emotionalArc: selectedArc?.desc,
      theme: theme || 'битва, судьба, восхождение',
      transformations: selectedTransformations,
      instruments: selectedInstruments.map(i => EPIC_INSTRUMENTS.find(inst => inst.value === i)?.label).filter(Boolean),
      includeInstrumentalSolo,
      includeSilenceBreak,
      epicScale,
      existingLyrics: context.existingLyrics,
      language: context.language || 'ru',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border/50 bg-purple-500/5 max-h-[70vh] overflow-y-auto overscroll-contain"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Crown className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Epic Builder</h3>
              <p className="text-[10px] text-muted-foreground">Кинематографические, эпические треки</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Style Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Music2 className="w-3.5 h-3.5" />
            Стиль
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            {EPIC_STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={cn(
                  "p-2 rounded-lg border text-left transition-all",
                  style === s.value 
                    ? "border-purple-500 bg-purple-500/10" 
                    : "border-border/50 hover:bg-muted/50"
                )}
              >
                <p className="text-xs font-medium">{s.emoji} {s.label}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Emotional Arc */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Эмоциональная дуга
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            {EMOTIONAL_ARCS.map((arc) => (
              <button
                key={arc.value}
                onClick={() => setEmotionalArc(arc.value)}
                className={cn(
                  "p-2 rounded-lg border text-left transition-all",
                  emotionalArc === arc.value 
                    ? "border-purple-500 bg-purple-500/10" 
                    : "border-border/50 hover:bg-muted/50"
                )}
              >
                <p className="text-xs font-medium">{arc.emoji} {arc.label}</p>
                <p className="text-[10px] text-muted-foreground">{arc.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Transformations */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Трансформации (A → B)
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {TRANSFORMATION_TAGS.map((transform) => (
              <Badge
                key={transform.value}
                variant={selectedTransformations.includes(transform.value) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all text-xs",
                  selectedTransformations.includes(transform.value) && "bg-purple-500"
                )}
                onClick={() => toggleTransformation(transform.value)}
              >
                {transform.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Instruments */}
        <div className="space-y-1.5">
          <Label className="text-xs">Инструменты</Label>
          <div className="flex flex-wrap gap-1.5">
            {EPIC_INSTRUMENTS.map((inst) => (
              <Badge
                key={inst.value}
                variant={selectedInstruments.includes(inst.value) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all text-xs",
                  selectedInstruments.includes(inst.value) && "bg-purple-500/80"
                )}
                onClick={() => toggleInstrument(inst.value)}
              >
                {inst.emoji} {inst.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="space-y-1.5">
          <Label className="text-xs">Тема</Label>
          <Textarea
            placeholder="Битва за свободу, путь героя, апокалипсис..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="min-h-[60px] text-xs resize-none"
          />
        </div>

        {/* Epic Scale */}
        <div className="space-y-1.5">
          <Label className="text-xs">Масштаб</Label>
          <div className="flex gap-2">
            {(['medium', 'large', 'massive'] as const).map((scale) => (
              <Badge
                key={scale}
                variant={epicScale === scale ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all text-xs flex-1 justify-center",
                  epicScale === scale && "bg-purple-500"
                )}
                onClick={() => setEpicScale(scale)}
              >
                {scale === 'medium' && '🎭 Средний'}
                {scale === 'large' && '🏛️ Большой'}
                {scale === 'massive' && '🌌 Эпический'}
              </Badge>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
          <Label className="text-xs text-muted-foreground">Спецэффекты</Label>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={includeInstrumentalSolo ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setIncludeInstrumentalSolo(!includeInstrumentalSolo)}
            >
              🎸 Инструментальное соло
            </Badge>
            <Badge
              variant={includeSilenceBreak ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setIncludeSilenceBreak(!includeSilenceBreak)}
            >
              ⏸️ [Stop] перед кульминацией
            </Badge>
          </div>
        </div>

        {/* Preview */}
        <div className="p-2 bg-background/50 rounded-lg border border-border/30">
          <p className="text-[10px] text-muted-foreground mb-1">Структура с трансформациями:</p>
          <p className="text-xs font-mono text-purple-400">
            [Intro | Ethereal | !build_up] → [Verse | {selectedTransformations[0] || 'Building'}] → 
            {includeSilenceBreak && ' [Stop] →'}
            [Chorus | {epicScale === 'massive' ? 'MASSIVE' : 'Epic'} | Stacked Harmonies] →
            {includeInstrumentalSolo && ' [Solo: Orchestral] →'}
            [Final Chorus | !double_volume] → [End]
          </p>
        </div>

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={isLoading}
          className="w-full gap-2 bg-purple-500 hover:bg-purple-600"
        >
          <Sparkles className="w-4 h-4" />
          Создать Эпический трек
        </Button>
      </div>
    </motion.div>
  );
}
