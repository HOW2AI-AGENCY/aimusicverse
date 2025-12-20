/**
 * StemSeparationProgress - Visual progress indicator for stem separation
 */

import { memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Loader2, Check, AlertCircle, Music, Mic2, Drum, Waves, Piano, Guitar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SeparationProgress } from '@/hooks/useStemSeparationRealtime';

interface StemSeparationProgressProps {
  task: SeparationProgress | null;
  progress: number;
  className?: string;
}

const STEM_ICONS = {
  vocals: { icon: Mic2, color: 'text-pink-500', label: 'Вокал' },
  drums: { icon: Drum, color: 'text-orange-500', label: 'Ударные' },
  bass: { icon: Waves, color: 'text-purple-500', label: 'Бас' },
  piano: { icon: Piano, color: 'text-emerald-500', label: 'Пианино' },
  guitar: { icon: Guitar, color: 'text-amber-500', label: 'Гитара' },
  other: { icon: Music, color: 'text-cyan-500', label: 'Другое' },
  instrumental: { icon: Music, color: 'text-blue-500', label: 'Инструментал' },
};

export const StemSeparationProgress = memo(function StemSeparationProgress({
  task,
  progress,
  className,
}: StemSeparationProgressProps) {
  if (!task) return null;

  const isCompleted = task.status === 'completed';
  const isFailed = task.status === 'failed';
  const isProcessing = task.status === 'processing';

  const stemTypes = task.mode === 'detailed' 
    ? ['vocals', 'drums', 'bass', 'piano', 'guitar', 'other']
    : ['vocals', 'instrumental'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "p-4 rounded-xl border",
          isCompleted 
            ? "bg-success/10 border-success/30" 
            : isFailed 
              ? "bg-destructive/10 border-destructive/30"
              : "bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isProcessing && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
            {isCompleted && <Check className="w-4 h-4 text-success" />}
            {isFailed && <AlertCircle className="w-4 h-4 text-destructive" />}
            
            <span className="text-sm font-medium">
              {isProcessing && 'Разделение на стемы...'}
              {isCompleted && 'Стемы готовы!'}
              {isFailed && 'Ошибка разделения'}
            </span>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            {task.mode === 'detailed' ? '6+ стемов' : '2 стема'}
          </Badge>
        </div>

        {/* Progress bar */}
        {isProcessing && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                {task.receivedStems} из {task.expectedStems}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Stem indicators */}
        <div className="flex flex-wrap gap-2">
          {stemTypes.map((stemType, idx) => {
            const config = STEM_ICONS[stemType as keyof typeof STEM_ICONS];
            const isReady = idx < task.receivedStems;
            const Icon = config?.icon || Music;
            
            return (
              <motion.div
                key={stemType}
                initial={{ opacity: 0.5, scale: 0.9 }}
                animate={{ 
                  opacity: isReady || isCompleted ? 1 : 0.5,
                  scale: isReady || isCompleted ? 1 : 0.9,
                }}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs',
                  'border transition-all',
                  isReady || isCompleted
                    ? 'bg-background border-border'
                    : 'bg-muted/30 border-transparent'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', config?.color || 'text-muted-foreground')} />
                <span className={isReady || isCompleted ? 'text-foreground' : 'text-muted-foreground'}>
                  {config?.label || stemType}
                </span>
                {(isReady || isCompleted) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className="w-3 h-3 text-success" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
