/**
 * TranscriptionToGenerationBridge - Bridge between guitar transcription and music generation
 * Allows users to generate new music based on analyzed guitar patterns
 * Extracts style, tempo, key, and chord progressions to inform generation
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Music,
  ArrowRight,
  Copy,
  Check,
  Wand2,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { GuitarAnalysisResult } from '@/hooks/useGuitarAnalysis';

interface TranscriptionToGenerationBridgeProps {
  analysisResult: GuitarAnalysisResult;
  className?: string;
}

export function TranscriptionToGenerationBridge({
  analysisResult,
  className,
}: TranscriptionToGenerationBridgeProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Generate style description from analysis
  const generateStylePrompt = (): string => {
    const parts: string[] = [];

    // Add key and tempo
    if (analysisResult.key) {
      parts.push(`Key: ${analysisResult.key}`);
    }
    if (analysisResult.bpm) {
      parts.push(`Tempo: ${Math.round(analysisResult.bpm)} BPM`);
    }

    // Add time signature
    if (analysisResult.timeSignature) {
      parts.push(`Time: ${analysisResult.timeSignature}`);
    }

    // Add chord progression summary
    if (analysisResult.chords.length > 0) {
      const uniqueChords = [
        ...new Set(analysisResult.chords.map((c) => c.chord)),
      ].slice(0, 6);
      parts.push(`Chords: ${uniqueChords.join(', ')}`);
    }

    // Add style analysis if available
    if (analysisResult.style) {
      if (analysisResult.style.genre) {
        parts.push(`Genre: ${analysisResult.style.genre}`);
      }
      if (analysisResult.style.mood) {
        parts.push(`Mood: ${analysisResult.style.mood}`);
      }
      if (analysisResult.style.technique) {
        parts.push(`Technique: ${analysisResult.style.technique}`);
      }
    }

    // Add generated tags
    if (analysisResult.generatedTags && analysisResult.generatedTags.length > 0) {
      const tags = analysisResult.generatedTags.slice(0, 5).join(', ');
      parts.push(`Tags: ${tags}`);
    }

    return parts.join(' • ');
  };

  // Generate detailed prompt for music generation
  const generateDetailedPrompt = (): string => {
    const tempo = analysisResult.bpm
      ? analysisResult.bpm < 90
        ? 'slow'
        : analysisResult.bpm > 140
        ? 'fast'
        : 'moderate'
      : 'moderate';

    const key = analysisResult.key || 'C major';
    const timeSignature = analysisResult.timeSignature || '4/4';

    // Get mood from style or infer from chords
    const mood = analysisResult.style?.mood || 'energetic';

    // Create structured prompt
    const prompt = `Create a ${tempo} tempo song in ${key}, ${timeSignature} time. ` +
      `Style should be ${mood}. ` +
      `BPM: ${Math.round(analysisResult.bpm || 120)}. ` +
      (analysisResult.chords.length > 0
        ? `Use chord progression similar to: ${[...new Set(analysisResult.chords.slice(0, 8).map((c) => c.chord))].join(' → ')}. `
        : '') +
      (analysisResult.generatedTags && analysisResult.generatedTags.length > 0
        ? `Tags: ${analysisResult.generatedTags.slice(0, 5).join(', ')}.`
        : '');

    return prompt;
  };

  const stylePrompt = generateStylePrompt();
  const detailedPrompt = generateDetailedPrompt();

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(detailedPrompt);
    setCopied(true);
    toast.success('Промпт скопирован в буфер обмена');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateMusic = () => {
    // Store analysis-derived parameters in sessionStorage for generation form
    sessionStorage.setItem(
      'generationParams',
      JSON.stringify({
        bpm: Math.round(analysisResult.bpm || 120),
        key: analysisResult.key,
        timeSignature: analysisResult.timeSignature,
        chordProgression: [
          ...new Set(analysisResult.chords.slice(0, 8).map((c) => c.chord)),
        ].join(', '),
        style: analysisResult.style,
        tags: analysisResult.generatedTags,
        prompt: customPrompt || detailedPrompt,
      })
    );

    toast.success('Параметры сохранены', {
      description: 'Переход к форме генерации...',
    });

    // Navigate to generation page
    setTimeout(() => {
      navigate('/generate');
    }, 500);
  };

  // Extract key metrics
  const metrics = [
    {
      label: 'BPM',
      value: Math.round(analysisResult.bpm || 0),
      icon: TrendingUp,
      color: 'cyan',
    },
    {
      label: 'Тональность',
      value: analysisResult.key || 'N/A',
      icon: Music,
      color: 'purple',
    },
    {
      label: 'Аккордов',
      value: new Set(analysisResult.chords.map((c) => c.chord)).size,
      icon: Sparkles,
      color: 'pink',
    },
  ];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-6 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10">
            <Wand2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Генерация на основе анализа</h3>
            <p className="text-sm text-muted-foreground">
              Создайте новую музыку с похожим стилем
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-white/50 dark:bg-black/20 border border-border text-center"
              >
                <Icon
                  className={cn('w-5 h-5 mx-auto mb-2', `text-${metric.color}-400`)}
                />
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Style Summary */}
        <div className="mb-6">
          <Label className="text-xs font-medium mb-2 block">
            Извлечённый стиль
          </Label>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-mono">{stylePrompt}</p>
          </div>
        </div>

        {/* Generated Prompt */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium">
              Автоматический промпт для генерации
            </Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyPrompt}
              className="h-7 px-2"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Скопировано
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Копировать
                </>
              )}
            </Button>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20">
            <p className="text-sm">{detailedPrompt}</p>
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="mb-6">
          <Label htmlFor="custom-prompt" className="text-xs font-medium mb-2 block">
            Свой промпт (опционально)
          </Label>
          <Textarea
            id="custom-prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Введите свой промпт или оставьте пустым для использования автоматического..."
            className="min-h-[100px] resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Оставьте пустым для использования автоматического промпта
          </p>
        </div>

        {/* Tags */}
        {analysisResult.generatedTags && analysisResult.generatedTags.length > 0 && (
          <div className="mb-6">
            <Label className="text-xs font-medium mb-2 block">
              Извлечённые теги
            </Label>
            <div className="flex flex-wrap gap-2">
              {analysisResult.generatedTags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          size="lg"
          onClick={handleGenerateMusic}
          className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white shadow-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Генерировать музыку
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Info */}
        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground">
            💡 Параметры анализа будут автоматически применены в форме генерации.
            Вы сможете их дополнительно настроить перед генерацией.
          </p>
        </div>
      </div>
    </Card>
  );
}
