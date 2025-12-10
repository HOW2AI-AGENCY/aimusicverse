/**
 * WorkflowVisualizer - Visual representation of professional workflows
 * Shows step-by-step process with real-time status updates
 */

import { motion, AnimatePresence } from '@/lib/motion';
import { 
  ArrowRight, Check, Clock, Zap, Sparkles,
  Music, Scissors, FileMusic, Guitar, Sliders, Download
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'pending' | 'error';
  estimatedTime?: string;
  completedAt?: string;
  description?: string;
}

interface WorkflowVisualizerProps {
  title: string;
  steps: WorkflowStep[];
  currentStep: number;
  totalProgress: number;
  variant?: 'horizontal' | 'vertical';
  onStepClick?: (stepIndex: number) => void;
  showTimeline?: boolean;
  compact?: boolean;
}

const statusColors = {
  completed: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/40',
    text: 'text-green-400',
    icon: 'text-green-400',
  },
  active: {
    bg: 'bg-primary/20',
    border: 'border-primary/60',
    text: 'text-primary',
    icon: 'text-primary',
  },
  pending: {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
    icon: 'text-muted-foreground',
  },
  error: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    text: 'text-red-400',
    icon: 'text-red-400',
  },
};

export function WorkflowVisualizer({
  title,
  steps,
  currentStep,
  totalProgress,
  variant = 'horizontal',
  onStepClick,
  showTimeline = true,
  compact = false,
}: WorkflowVisualizerProps) {
  
  const isHorizontal = variant === 'horizontal';
  
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalProgress}%
          </Badge>
        </div>

        {/* Progress Bar */}
        {showTimeline && (
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            {/* Animated shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>
        )}

        {/* Workflow Steps */}
        <div
          className={cn(
            'flex gap-2',
            isHorizontal ? 'flex-row items-center overflow-x-auto' : 'flex-col'
          )}
        >
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const colors = statusColors[step.status];
            const isLast = index === steps.length - 1;
            const isActive = step.status === 'active';
            const isClickable = !!onStepClick;

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-2',
                  isHorizontal ? 'flex-row' : 'flex-col',
                  isClickable && 'cursor-pointer'
                )}
                onClick={() => onStepClick?.(index)}
              >
                {/* Step Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'relative group transition-all',
                    isHorizontal && compact ? 'w-20' : 'w-full min-w-[140px]'
                  )}
                >
                  <div
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all',
                      colors.bg,
                      colors.border,
                      isClickable && 'hover:shadow-md',
                      isActive && 'shadow-lg animate-pulse'
                    )}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {/* Icon */}
                      <motion.div
                        className={cn(
                          'p-2 rounded-lg',
                          step.status === 'completed' && 'bg-green-500/20',
                          step.status === 'active' && 'bg-primary/20',
                          step.status === 'pending' && 'bg-muted',
                          step.status === 'error' && 'bg-red-500/20'
                        )}
                        animate={isActive ? {
                          scale: [1, 1.1, 1],
                        } : {}}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        {step.status === 'completed' ? (
                          <Check className={cn('w-5 h-5', colors.icon)} />
                        ) : (
                          <StepIcon className={cn('w-5 h-5', colors.icon)} />
                        )}
                      </motion.div>

                      {/* Title & Subtitle */}
                      <div className="text-center space-y-0.5">
                        <div className={cn('text-sm font-medium', colors.text)}>
                          {step.title}
                        </div>
                        {!compact && (
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            {step.subtitle}
                          </div>
                        )}
                      </div>

                      {/* Time Info */}
                      {step.status === 'active' && step.estimatedTime && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-5 flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          {step.estimatedTime}
                        </Badge>
                      )}

                      {/* Completed Time */}
                      {step.status === 'completed' && step.completedAt && !compact && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {step.completedAt}
                        </div>
                      )}

                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div
                          className="flex items-center gap-1 text-[10px] text-primary"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Zap className="w-3 h-3" />
                          <span>В процессе...</span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Tooltip on hover */}
                  {step.description && !compact && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-lg bg-popover border border-border shadow-lg z-10 w-48 hidden group-hover:block"
                      >
                        <p className="text-xs text-muted-foreground">
                          {step.description}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </motion.div>

                {/* Connector Arrow */}
                {!isLast && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.05 }}
                    className={cn(
                      'shrink-0',
                      isHorizontal ? 'mx-1' : 'my-1'
                    )}
                  >
                    <ArrowRight
                      className={cn(
                        'w-5 h-5',
                        step.status === 'completed' ? 'text-green-400' :
                        step.status === 'active' ? 'text-primary' :
                        'text-muted-foreground'
                      )}
                    />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step Description */}
        {!compact && steps[currentStep] && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-muted/30 border border-border"
          >
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">
                  {steps[currentStep].title}
                </div>
                {steps[currentStep].description && (
                  <p className="text-xs text-muted-foreground">
                    {steps[currentStep].description}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Preset workflow configurations
export const workflowPresets = {
  musicCreation: {
    title: 'Создание музыки',
    steps: [
      {
        id: 'generate',
        title: 'Генерация',
        subtitle: 'AI создание трека',
        icon: Sparkles,
        status: 'completed' as const,
        completedAt: '2 мин назад',
        description: 'Трек сгенерирован с помощью Suno AI v5',
      },
      {
        id: 'stems',
        title: 'Стемы',
        subtitle: 'Разделение дорожек',
        icon: Scissors,
        status: 'active' as const,
        estimatedTime: '1-2 мин',
        description: 'Разделение на vocals, drums, bass, guitar, piano, other',
      },
      {
        id: 'mix',
        title: 'Микширование',
        subtitle: 'EQ, эффекты',
        icon: Sliders,
        status: 'pending' as const,
        description: 'Профессиональное микширование с эффектами',
      },
      {
        id: 'export',
        title: 'Экспорт',
        subtitle: 'WAV/MP3',
        icon: Download,
        status: 'pending' as const,
        description: 'Экспорт финального трека в различных форматах',
      },
    ],
  },
  midiWorkflow: {
    title: 'MIDI Pipeline',
    steps: [
      {
        id: 'audio',
        title: 'Аудио',
        subtitle: 'Исходный трек',
        icon: Music,
        status: 'completed' as const,
        completedAt: '5 мин назад',
        description: 'Загружен исходный аудио файл',
      },
      {
        id: 'transcribe',
        title: 'Транскрипция',
        subtitle: 'Audio → MIDI',
        icon: FileMusic,
        status: 'active' as const,
        estimatedTime: '30-60 сек',
        description: 'Конвертация аудио в MIDI с использованием MT3',
      },
      {
        id: 'sheets',
        title: 'Ноты',
        subtitle: 'Sheet Music',
        icon: FileMusic,
        status: 'pending' as const,
        description: 'Генерация нотных листов из MIDI',
      },
      {
        id: 'tabs',
        title: 'Табулатуры',
        subtitle: 'Guitar Tabs',
        icon: Guitar,
        status: 'pending' as const,
        description: 'Создание гитарных табулатур',
      },
    ],
  },
};
