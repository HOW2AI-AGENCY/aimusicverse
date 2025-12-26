/**
 * Vocal Map Tool Panel
 * Generate vocal production instructions
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mic2, Headphones } from 'lucide-react';
import { ToolPanelProps } from '../types';

const VOCAL_TYPES = [
  { id: 'male', label: 'Мужской', icon: '👨' },
  { id: 'female', label: 'Женский', icon: '👩' },
  { id: 'duet', label: 'Дуэт', icon: '👫' },
  { id: 'any', label: 'Любой', icon: '🎤' },
];

export const VocalMapToolPanel: React.FC<ToolPanelProps> = ({
  context,
  onExecute,
  onClose,
  isLoading,
}) => {
  const [vocalType, setVocalType] = useState<string>('any');
  const hasLyrics = !!context.existingLyrics?.trim();

  const handleExecute = () => {
    onExecute({
      lyrics: context.existingLyrics,
      genre: context.genre,
      mood: context.mood,
      vocalType,
    });
  };

  if (!hasLyrics) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Mic2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Сначала напишите текст для вокальной карты</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mic2 className="w-4 h-4" />
        <span>Создаст карту вокала для каждой секции</span>
      </div>

      <div className="p-4 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
        <div className="flex items-start gap-3">
          <Headphones className="w-5 h-5 text-violet-500 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-medium">Для каждой секции:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Тип вокала (шёпот, мощный, фальцет)</li>
              <li>• Эффекты обработки</li>
              <li>• Бэк-вокалы и гармонии</li>
              <li>• Динамика и эмоции</li>
              <li>• Теги для Suno</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Vocal type selector */}
      <div className="space-y-2">
        <Label>Тип вокала</Label>
        <div className="grid grid-cols-4 gap-2">
          {VOCAL_TYPES.map((type) => (
            <Button
              key={type.id}
              variant={vocalType === type.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVocalType(type.id)}
              className="flex flex-col h-auto py-2"
            >
              <span className="text-lg">{type.icon}</span>
              <span className="text-xs">{type.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleExecute}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
      >
        <Mic2 className="w-4 h-4 mr-2" />
        {isLoading ? 'Создаю карту...' : 'Создать вокальную карту'}
      </Button>
    </div>
  );
};
