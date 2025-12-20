/**
 * StemSeparationModeDialog - Dialog for choosing stem separation mode
 * Simple (2 stems) or Detailed (6+ stems)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Music, Mic2, Drum, Guitar, Piano, Waves, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

type SeparationMode = 'simple' | 'detailed';

interface StemSeparationModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mode: SeparationMode) => void;
  isProcessing?: boolean;
}

const MODES = {
  simple: {
    label: 'Простое разделение',
    description: '2 стема',
    stems: [
      { icon: Mic2, label: 'Вокал', color: 'text-pink-500' },
      { icon: Music, label: 'Инструментал', color: 'text-blue-500' },
    ],
    time: '~1 мин',
    bgGradient: 'from-pink-500/10 to-blue-500/10',
  },
  detailed: {
    label: 'Детальное разделение',
    description: '6+ стемов',
    stems: [
      { icon: Mic2, label: 'Вокал', color: 'text-pink-500' },
      { icon: Drum, label: 'Ударные', color: 'text-orange-500' },
      { icon: Waves, label: 'Бас', color: 'text-purple-500' },
      { icon: Piano, label: 'Пианино', color: 'text-emerald-500' },
      { icon: Guitar, label: 'Гитара', color: 'text-amber-500' },
      { icon: Music, label: 'Другое', color: 'text-cyan-500' },
    ],
    time: '~2-3 мин',
    bgGradient: 'from-purple-500/10 via-pink-500/5 to-emerald-500/10',
  },
} as const;

export function StemSeparationModeDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
}: StemSeparationModeDialogProps) {
  const [selectedMode, setSelectedMode] = useState<SeparationMode>('simple');
  const { tap, select } = useHapticFeedback();

  const handleModeSelect = (mode: SeparationMode) => {
    select();
    setSelectedMode(mode);
  };

  const handleConfirm = () => {
    tap();
    onConfirm(selectedMode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Разделение на стемы
          </DialogTitle>
          <DialogDescription>
            Выберите режим разделения аудио на отдельные дорожки
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {(Object.entries(MODES) as [SeparationMode, typeof MODES['simple']][]).map(([mode, config]) => {
            const isSelected = selectedMode === mode;
            
            return (
              <motion.button
                key={mode}
                onClick={() => handleModeSelect(mode)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition-all',
                  'bg-gradient-to-r',
                  config.bgGradient,
                  isSelected 
                    ? 'border-primary shadow-lg shadow-primary/10' 
                    : 'border-border hover:border-primary/50'
                )}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{config.label}</span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{config.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {config.time}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {config.stems.map((stem, idx) => (
                    <motion.div
                      key={idx}
                      initial={false}
                      animate={{ 
                        opacity: isSelected ? 1 : 0.7,
                        scale: isSelected ? 1 : 0.95,
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
                        'bg-background/50 border border-border/50'
                      )}
                    >
                      <stem.icon className={cn('w-3.5 h-3.5', stem.color)} />
                      <span className="text-foreground/80">{stem.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Запуск...
              </>
            ) : (
              <>
                <Music className="w-4 h-4" />
                Разделить
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
