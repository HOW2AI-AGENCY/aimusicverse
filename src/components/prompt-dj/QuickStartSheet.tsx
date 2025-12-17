/**
 * QuickStartSheet - Quick presets for instant music generation
 * Shows on first visit or when clicking "Quick Start"
 */

import { memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Music, Zap, Moon, Sun, Flame, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromptChannel, GlobalSettings } from '@/hooks/usePromptDJEnhanced';

interface QuickStartPreset {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  channels: Partial<Record<string, { value: string; weight: number }>>;
  settings: Partial<GlobalSettings>;
  gradient: string;
}

const QUICK_START_PRESETS: QuickStartPreset[] = [
  {
    id: 'lofi-chill',
    label: 'Lo-Fi Chill',
    icon: <Moon className="w-5 h-5" />,
    description: 'Расслабляющий lo-fi для учёбы',
    channels: {
      genre: { value: 'Lo-Fi', weight: 1 },
      instrument: { value: 'Piano', weight: 0.8 },
      mood: { value: 'Calm', weight: 0.9 },
      texture: { value: 'Vintage', weight: 0.6 },
    },
    settings: { bpm: 85, density: 0.4, brightness: 0.3 },
    gradient: 'from-violet-500/20 to-indigo-500/20',
  },
  {
    id: 'edm-energy',
    label: 'EDM Energy',
    icon: <Zap className="w-5 h-5" />,
    description: 'Энергичный EDM для тренировки',
    channels: {
      genre: { value: 'EDM', weight: 1 },
      instrument: { value: 'Synth', weight: 0.9 },
      mood: { value: 'Energetic', weight: 1 },
      energy: { value: 'High', weight: 1 },
    },
    settings: { bpm: 128, density: 0.8, brightness: 0.8 },
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Эпичная музыка для видео',
    channels: {
      genre: { value: 'Classical', weight: 0.8 },
      instrument: { value: 'Strings', weight: 1 },
      mood: { value: 'Epic', weight: 1 },
      style: { value: 'Cinematic', weight: 0.9 },
    },
    settings: { bpm: 100, density: 0.7, brightness: 0.6 },
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    id: 'trap-dark',
    label: 'Dark Trap',
    icon: <Flame className="w-5 h-5" />,
    description: 'Тёмный trap с басами',
    channels: {
      genre: { value: 'Trap', weight: 1 },
      instrument: { value: 'Bass', weight: 0.9 },
      mood: { value: 'Dark', weight: 0.8 },
      energy: { value: 'Intense', weight: 0.7 },
    },
    settings: { bpm: 140, density: 0.6, brightness: 0.3 },
    gradient: 'from-red-500/20 to-rose-500/20',
  },
  {
    id: 'ambient',
    label: 'Ambient',
    icon: <Waves className="w-5 h-5" />,
    description: 'Атмосферный ambient для медитации',
    channels: {
      genre: { value: 'Ambient', weight: 1 },
      instrument: { value: 'Pads', weight: 0.9 },
      mood: { value: 'Dreamy', weight: 0.8 },
      texture: { value: 'Airy', weight: 0.7 },
    },
    settings: { bpm: 70, density: 0.2, brightness: 0.4 },
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    id: 'pop-upbeat',
    label: 'Pop Upbeat',
    icon: <Sun className="w-5 h-5" />,
    description: 'Позитивный поп для настроения',
    channels: {
      genre: { value: 'Pop', weight: 1 },
      instrument: { value: 'Guitar', weight: 0.7 },
      mood: { value: 'Happy', weight: 1 },
      energy: { value: 'Medium', weight: 0.6 },
    },
    settings: { bpm: 110, density: 0.5, brightness: 0.7 },
    gradient: 'from-yellow-500/20 to-orange-500/20',
  },
];

interface QuickStartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: QuickStartPreset) => void;
}

export const QuickStartSheet = memo(function QuickStartSheet({
  isOpen,
  onClose,
  onApplyPreset,
}: QuickStartSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-x-0 bottom-0 z-50 p-4 pb-safe"
        >
          <div className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl max-w-md mx-auto overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Быстрый старт</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Presets grid */}
            <div className="grid grid-cols-2 gap-2 p-4 max-h-[50vh] overflow-y-auto">
              {QUICK_START_PRESETS.map((preset) => (
                <motion.button
                  key={preset.id}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 rounded-xl',
                    'bg-gradient-to-br border border-border/30',
                    'hover:border-primary/50 transition-all',
                    preset.gradient
                  )}
                  onClick={() => {
                    onApplyPreset(preset);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2">
                    {preset.icon}
                    <span className="font-medium text-sm">{preset.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground text-left">
                    {preset.description}
                  </span>
                  <div className="flex gap-1 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-background/50">
                      {preset.settings.bpm} BPM
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Skip button */}
            <div className="p-4 pt-0">
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground text-sm"
                onClick={onClose}
              >
                Настроить вручную
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export type { QuickStartPreset };
