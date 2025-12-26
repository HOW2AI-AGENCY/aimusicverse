/**
 * Paraphrase Tool Panel
 * Generate text variations with different tones
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RefreshCw, Sparkles } from 'lucide-react';
import { ToolPanelProps } from '../types';

const TONE_OPTIONS = [
  { id: 'poetic', label: 'Поэтичнее', emoji: '🌸', desc: 'Больше метафор и образов' },
  { id: 'simple', label: 'Проще', emoji: '💬', desc: 'Разговорный стиль' },
  { id: 'aggressive', label: 'Агрессивнее', emoji: '🔥', desc: 'Резче и энергичнее' },
  { id: 'tender', label: 'Нежнее', emoji: '💕', desc: 'Мягче и интимнее' },
  { id: 'dramatic', label: 'Драматичнее', emoji: '🎭', desc: 'Больше контрастов' },
  { id: 'ironic', label: 'Ироничнее', emoji: '😏', desc: 'С долей сарказма' },
];

export const ParaphraseToolPanel: React.FC<ToolPanelProps> = ({
  context,
  onExecute,
  onClose,
  isLoading,
}) => {
  const [selectedTone, setSelectedTone] = useState<string>('poetic');
  const [customText, setCustomText] = useState('');
  const [variantsCount, setVariantsCount] = useState(3);

  // Use selected section or full lyrics
  const textToParaphrase = context.selectedSection?.content || customText || context.existingLyrics;
  const hasText = !!textToParaphrase?.trim();

  const handleExecute = () => {
    if (!hasText) return;

    const tone = TONE_OPTIONS.find(t => t.id === selectedTone);

    onExecute({
      targetTone: tone?.label || selectedTone,
      lyrics: textToParaphrase,
      variantsCount,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="w-4 h-4" />
        <span>Создаст {variantsCount} вариации с новым тоном</span>
      </div>

      {/* Text input if no context */}
      {!context.existingLyrics && !context.selectedSection && (
        <div className="space-y-2">
          <Label>Текст для перефразирования</Label>
          <Textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Вставьте строки или строфу..."
            rows={4}
          />
        </div>
      )}

      {/* Show what will be paraphrased */}
      {(context.selectedSection || context.existingLyrics) && (
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <p className="text-xs text-muted-foreground mb-1">
            {context.selectedSection ? 'Выбранная секция:' : 'Весь текст'}
          </p>
          <p className="line-clamp-3">
            {(context.selectedSection?.content || context.existingLyrics || '').slice(0, 150)}...
          </p>
        </div>
      )}

      {/* Tone selection */}
      <div className="space-y-2">
        <Label>Целевой тон</Label>
        <div className="grid grid-cols-2 gap-2">
          {TONE_OPTIONS.map((tone) => (
            <Button
              key={tone.id}
              variant={selectedTone === tone.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTone(tone.id)}
              className="flex items-center justify-start gap-2 h-auto py-2"
            >
              <span className="text-lg">{tone.emoji}</span>
              <div className="text-left">
                <div className="text-sm font-medium">{tone.label}</div>
                <div className="text-xs text-muted-foreground">{tone.desc}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Variants count */}
      <div className="flex items-center gap-3">
        <Label className="whitespace-nowrap">Вариантов:</Label>
        <div className="flex gap-1">
          {[2, 3, 5].map((count) => (
            <Button
              key={count}
              variant={variantsCount === count ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVariantsCount(count)}
              className="w-10"
            >
              {count}
            </Button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleExecute}
        disabled={isLoading || !hasText}
        className="w-full"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isLoading ? 'Создаю варианты...' : 'Перефразировать'}
      </Button>
    </div>
  );
};
