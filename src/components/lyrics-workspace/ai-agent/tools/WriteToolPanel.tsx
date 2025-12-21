/**
 * WriteToolPanel - Panel for full lyrics generation
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { PenLine, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ToolPanelProps } from '../types';
import { MOOD_OPTIONS, GENRE_OPTIONS, STRUCTURE_OPTIONS } from '../constants';

export function WriteToolPanel({ context, onExecute, onClose, isLoading }: ToolPanelProps) {
  const [theme, setTheme] = useState('');
  const [selectedMood, setSelectedMood] = useState(context.mood || 'romantic');
  const [selectedGenre, setSelectedGenre] = useState(context.genre || 'pop');
  const [selectedStructure, setSelectedStructure] = useState('full');

  const handleExecute = () => {
    onExecute({
      theme: theme || 'любовь и надежда',
      mood: selectedMood,
      genre: selectedGenre,
      structure: STRUCTURE_OPTIONS.find(s => s.value === selectedStructure)?.desc || selectedStructure,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border/50 bg-blue-500/5"
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
            {GENRE_OPTIONS.map((genre) => (
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
          onClick={handleExecute}
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
