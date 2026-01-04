/**
 * WriteToolPanel - Enhanced panel for full lyrics generation
 * Adds reference lyrics, language selection, creativity slider
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { 
  PenLine, Sparkles, X, Music2, Target, ListMusic, Info, 
  Languages, Sliders, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { ToolPanelProps } from '../types';
import { MOOD_OPTIONS, GENRE_OPTIONS, STRUCTURE_OPTIONS } from '../constants';

const LANGUAGE_OPTIONS = [
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'mixed', label: 'Смешанный', flag: '🌐' },
];

export function WriteToolPanel({ context, onExecute, onClose, isLoading }: ToolPanelProps) {
  const hasProjectContext = !!(context.projectContext || context.trackContext);
  
  // For project mode, use context values
  const projectGenre = context.projectContext?.genre || context.genre;
  const projectMood = context.projectContext?.mood || context.mood;
  const trackNotes = context.trackContext?.notes;
  const trackTitle = context.trackContext?.title || context.title;
  const projectConcept = context.projectContext?.concept;
  const recommendedStructure = context.trackContext?.recommendedStructure;
  
  // State for form
  const [theme, setTheme] = useState(trackNotes || '');
  const [selectedMood, setSelectedMood] = useState(projectMood || 'romantic');
  const [selectedGenre, setSelectedGenre] = useState(projectGenre || 'pop');
  const [selectedStructure, setSelectedStructure] = useState(recommendedStructure || 'full');
  const [selectedLanguage, setSelectedLanguage] = useState(context.projectContext?.language || 'ru');
  const [referenceLyrics, setReferenceLyrics] = useState('');
  const [creativity, setCreativity] = useState([70]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleExecute = (structureOverride?: string) => {
    hapticImpact('medium');
    onExecute({
      theme: theme || trackNotes || projectConcept || 'любовь и надежда',
      mood: selectedMood,
      genre: selectedGenre,
      structure: STRUCTURE_OPTIONS.find(s => s.value === (structureOverride || selectedStructure))?.desc || (structureOverride || selectedStructure),
      language: selectedLanguage,
      referenceLyrics: referenceLyrics || undefined,
      creativity: creativity[0],
      // Pass project context to AI
      projectTitle: context.projectContext?.projectTitle,
      trackTitle: trackTitle,
      trackPosition: context.trackContext?.position,
      concept: projectConcept,
      targetAudience: context.projectContext?.targetAudience,
      referenceArtists: context.projectContext?.referenceArtists,
      tracklist: context.tracklist,
    });
  };

  // Project context mode - show context and structure options
  if (hasProjectContext) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="border-b border-border/50 bg-blue-500/5 max-h-[60vh] overflow-y-auto overscroll-contain"
      >
        <div className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <PenLine className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Написать текст</h3>
                <p className="text-[10px] text-muted-foreground">Контекст проекта загружен</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Project Context Display */}
          <Card className="p-3 bg-muted/30 border-primary/20">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Music2 className="w-3.5 h-3.5" />
                <span>Контекст проекта</span>
              </div>
              
              <div className="space-y-1.5">
                {context.projectContext?.projectTitle && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Проект:</span>
                    <span className="text-xs font-medium">{context.projectContext.projectTitle}</span>
                  </div>
                )}
                
                {trackTitle && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Трек:</span>
                    <span className="text-xs font-medium">
                      {context.trackContext?.position !== undefined && `#${context.trackContext.position + 1} `}
                      {trackTitle}
                    </span>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {projectGenre && (
                    <Badge variant="outline" className="text-xs">
                      {GENRE_OPTIONS.find(g => g.value === projectGenre)?.emoji || '🎵'} {projectGenre}
                    </Badge>
                  )}
                  {projectMood && (
                    <Badge variant="outline" className="text-xs">
                      {MOOD_OPTIONS.find(m => m.value === projectMood)?.emoji || '🎭'} {projectMood}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Language selection */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5" />
              Язык текста
            </Label>
            <div className="flex gap-1.5 flex-wrap">
              {LANGUAGE_OPTIONS.map((lang) => (
                <Badge
                  key={lang.value}
                  variant={selectedLanguage === lang.value ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all text-xs",
                    selectedLanguage === lang.value && "bg-primary"
                  )}
                  onClick={() => setSelectedLanguage(lang.value)}
                >
                  {lang.flag} {lang.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Structure Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">Выберите структуру</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {STRUCTURE_OPTIONS.map((structure) => (
                <button
                  key={structure.value}
                  onClick={() => setSelectedStructure(structure.value)}
                  className={cn(
                    "p-2.5 rounded-lg border text-left transition-all",
                    selectedStructure === structure.value 
                      ? "border-primary bg-primary/10" 
                      : "border-border/50 hover:bg-muted/50"
                  )}
                >
                  <p className="text-xs font-medium">{structure.label}</p>
                  <p className="text-[10px] text-muted-foreground">{structure.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced options toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showAdvanced ? 'Скрыть дополнительные настройки' : 'Показать дополнительные настройки'}
          </button>

          {/* Advanced options */}
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/30"
            >
              {/* Creativity slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Креативность</Label>
                  <span className="text-xs font-mono text-muted-foreground">{creativity[0]}%</span>
                </div>
                <Slider
                  value={creativity}
                  onValueChange={setCreativity}
                  min={20}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <p className="text-[10px] text-muted-foreground">
                  {creativity[0] <= 40 ? 'Строго по теме' : creativity[0] <= 70 ? 'Баланс' : 'Максимальная свобода'}
                </p>
              </div>

              {/* Reference lyrics */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Референс (опционально)
                </Label>
                <Textarea
                  placeholder="Вставьте текст похожей песни для вдохновения..."
                  value={referenceLyrics}
                  onChange={(e) => setReferenceLyrics(e.target.value)}
                  className="h-16 text-xs resize-none"
                />
              </div>
            </motion.div>
          )}

          {/* Quick Generate Buttons */}
          <div className="space-y-2 pt-1">
            <Button
              onClick={() => handleExecute()}
              disabled={isLoading}
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Сгенерировать текст
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExecute('verse-chorus')}
                disabled={isLoading}
                className="text-xs"
              >
                Быстро: Verse-Chorus
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExecute('full')}
                disabled={isLoading}
                className="text-xs"
              >
                Быстро: Полная
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Non-project mode - show full input form
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border/50 bg-blue-500/5 max-h-[55vh] overflow-y-auto overscroll-contain"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <PenLine className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Написать текст</h3>
              <p className="text-[10px] text-muted-foreground">Полная генерация с нуля</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Theme Input */}
        <div className="space-y-1.5">
          <Label className="text-xs">Тема песни</Label>
          <Input
            placeholder="О чём песня? Например: расставание, мечты, ночной город..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Language selection */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5" />
            Язык
          </Label>
          <div className="flex gap-1.5 flex-wrap">
            {LANGUAGE_OPTIONS.map((lang) => (
              <Badge
                key={lang.value}
                variant={selectedLanguage === lang.value ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all text-xs",
                  selectedLanguage === lang.value && "bg-primary"
                )}
                onClick={() => setSelectedLanguage(lang.value)}
              >
                {lang.flag} {lang.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Mood Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs">Настроение</Label>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_OPTIONS.map((mood) => (
              <Badge
                key={mood.value}
                variant={selectedMood === mood.value ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all text-xs",
                  selectedMood === mood.value && "bg-primary"
                )}
                onClick={() => setSelectedMood(mood.value)}
              >
                {mood.emoji} {mood.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Genre Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs">Жанр</Label>
          <div className="flex flex-wrap gap-1.5">
            {GENRE_OPTIONS.slice(0, 8).map((genre) => (
              <Badge
                key={genre.value}
                variant={selectedGenre === genre.value ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all text-xs",
                  selectedGenre === genre.value && "bg-primary"
                )}
                onClick={() => setSelectedGenre(genre.value)}
              >
                {genre.emoji} {genre.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Structure Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs">Структура</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {STRUCTURE_OPTIONS.map((structure) => (
              <button
                key={structure.value}
                onClick={() => setSelectedStructure(structure.value)}
                className={cn(
                  "p-2 rounded-lg border text-left transition-all",
                  selectedStructure === structure.value 
                    ? "border-primary bg-primary/10" 
                    : "border-border/50 hover:bg-muted/50"
                )}
              >
                <p className="text-xs font-medium">{structure.label}</p>
                <p className="text-[10px] text-muted-foreground">{structure.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Execute Button */}
        <Button
          onClick={() => handleExecute()}
          disabled={isLoading}
          className="w-full gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Сгенерировать текст
        </Button>
      </div>
    </motion.div>
  );
}
