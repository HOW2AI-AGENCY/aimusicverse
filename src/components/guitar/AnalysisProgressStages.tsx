/**
 * AnalysisProgressStages - Detailed stage-by-stage progress indicator
 * Shows real-time progress for klang.io analysis pipeline
 * Stages: Upload → Beat Tracking → Chord Recognition → Transcription → Complete
 */

import { motion, AnimatePresence } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Activity,
  Music,
  FileMusic,
  CheckCircle2,
  Loader2,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AnalysisStage =
  | 'idle'
  | 'uploading'
  | 'beat-tracking'
  | 'chord-recognition'
  | 'transcription'
  | 'processing'
  | 'complete'
  | 'error';

interface StageInfo {
  id: AnalysisStage;
  label: string;
  description: string;
  icon: any;
  color: string;
  estimatedTime: number; // seconds
}

const stages: StageInfo[] = [
  {
    id: 'uploading',
    label: 'Загрузка',
    description: 'Отправка аудио на сервер',
    icon: Upload,
    color: 'blue',
    estimatedTime: 5,
  },
  {
    id: 'beat-tracking',
    label: 'Beat Tracking',
    description: 'Определение темпа и ритма',
    icon: Activity,
    color: 'cyan',
    estimatedTime: 15,
  },
  {
    id: 'chord-recognition',
    label: 'Chord Recognition',
    description: 'Распознавание аккордов',
    icon: Music,
    color: 'purple',
    estimatedTime: 20,
  },
  {
    id: 'transcription',
    label: 'Transcription',
    description: 'Конвертация в ноты и MIDI',
    icon: FileMusic,
    color: 'pink',
    estimatedTime: 30,
  },
];

interface AnalysisProgressStagesProps {
  currentStage: AnalysisStage;
  progress?: number; // 0-100
  error?: string;
  className?: string;
}

export function AnalysisProgressStages({
  currentStage,
  progress = 0,
  error,
  className,
}: AnalysisProgressStagesProps) {
  const currentStageIndex = stages.findIndex((s) => s.id === currentStage);
  const completedStages = currentStageIndex;
  const totalStages = stages.length;

  // Calculate overall progress
  const overallProgress =
    currentStage === 'complete'
      ? 100
      : ((completedStages + progress / 100) / totalStages) * 100;

  // Calculate time remaining
  const timeRemaining =
    currentStageIndex >= 0
      ? stages.slice(currentStageIndex).reduce((sum, s) => sum + s.estimatedTime, 0)
      : 0;

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {currentStage === 'complete' ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="p-2 rounded-lg bg-green-500/10"
              >
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </motion.div>
            ) : error ? (
              <div className="p-2 rounded-lg bg-red-500/10">
                <Zap className="w-5 h-5 text-red-400" />
              </div>
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="p-2 rounded-lg bg-blue-500/10"
              >
                <Loader2 className="w-5 h-5 text-blue-400" />
              </motion.div>
            )}
            <div>
              <h3 className="font-semibold">
                {currentStage === 'complete'
                  ? 'Анализ завершён'
                  : error
                  ? 'Ошибка анализа'
                  : 'Анализ трека...'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {error ? error : `Примерно ${Math.ceil(timeRemaining / 60)} мин`}
              </p>
            </div>
          </div>
          <Badge
            variant={
              currentStage === 'complete'
                ? 'default'
                : error
                ? 'destructive'
                : 'secondary'
            }
            className="text-xs"
          >
            {currentStage === 'complete'
              ? '100%'
              : error
              ? 'Ошибка'
              : `${Math.round(overallProgress)}%`}
          </Badge>
        </div>

        {/* Overall Progress */}
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Stages */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isActive = currentStage === stage.id;
          const isCompleted = index < currentStageIndex;
          const isPending = index > currentStageIndex;

          const Icon = stage.icon;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border-2 transition-all',
                isActive &&
                  'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30',
                isCompleted &&
                  'bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20',
                isPending && 'bg-muted/30 border-muted-foreground/20'
              )}
            >
              {/* Icon */}
              <div className="relative">
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-3 rounded-full bg-green-500/10"
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </motion.div>
                ) : isActive ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={cn(
                      'p-3 rounded-full',
                      `bg-${stage.color}-500/10`
                    )}
                  >
                    <Icon
                      className={cn('w-6 h-6', `text-${stage.color}-400`)}
                    />
                  </motion.div>
                ) : (
                  <div className="p-3 rounded-full bg-muted">
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}

                {/* Connection line */}
                {index < stages.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4',
                      isCompleted ? 'bg-green-500' : 'bg-muted-foreground/20'
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className={cn(
                      'font-medium text-sm',
                      isActive && 'text-blue-400',
                      isCompleted && 'text-green-400',
                      isPending && 'text-muted-foreground'
                    )}
                  >
                    {stage.label}
                  </h4>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      В процессе
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge variant="secondary" className="text-xs bg-green-500/10">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-green-400" />
                      Готово
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    'text-xs',
                    isActive && 'text-foreground',
                    (isCompleted || isPending) && 'text-muted-foreground'
                  )}
                >
                  {stage.description}
                </p>

                {/* Stage progress */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2"
                  >
                    <Progress value={progress} className="h-1.5" />
                  </motion.div>
                )}
              </div>

              {/* Time estimate */}
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {isCompleted ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span>~{stage.estimatedTime}с</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Completion message */}
      <AnimatePresence>
        {currentStage === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-semibold text-sm text-green-400">
                  Анализ успешно завершён!
                </p>
                <p className="text-xs text-muted-foreground">
                  Результаты готовы к просмотру и экспорту
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/30"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-red-400" />
              <div>
                <p className="font-semibold text-sm text-red-400">Ошибка анализа</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
