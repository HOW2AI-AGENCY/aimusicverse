/**
 * TipsPanel - Contextual professional tips and guidance
 * Provides helpful information for using professional tools
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, X, ChevronRight, Sparkles, 
  Music, Scissors, FileMusic, Sliders, Guitar,
  CheckCircle, Info
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Tip {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'workflow' | 'tool' | 'optimization' | 'shortcut';
  level: 'beginner' | 'intermediate' | 'advanced';
  color: string;
}

interface TipsPanelProps {
  context?: 'studio' | 'creative' | 'midi' | 'general';
  variant?: 'carousel' | 'list';
  dismissible?: boolean;
  autoRotate?: boolean;
  className?: string;
}

const allTips: Tip[] = [
  {
    id: '1',
    title: 'Оптимальный порядок обработки',
    description: 'Сначала разделите трек на стемы, затем применяйте EQ и эффекты к каждому стему отдельно для лучшего контроля.',
    icon: Scissors,
    category: 'workflow',
    level: 'beginner',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: '2',
    title: 'MIDI транскрипция вокала',
    description: 'Для вокальных партий используйте модель MT3 - она даёт наиболее точный результат для мелодий.',
    icon: FileMusic,
    category: 'tool',
    level: 'intermediate',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: '3',
    title: 'Пресеты для жанров',
    description: 'Сохраняйте настройки EQ и компрессора как пресеты для разных жанров - это сэкономит время в будущем.',
    icon: Sliders,
    category: 'optimization',
    level: 'intermediate',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: '4',
    title: 'Chord Detection для композиции',
    description: 'Используйте реалтайм распознавание аккордов при игре на инструменте, чтобы сразу видеть прогрессию.',
    icon: Guitar,
    category: 'tool',
    level: 'beginner',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: '5',
    title: 'Экспорт в несколько форматов',
    description: 'Экспортируйте финальный микс сразу в WAV (для архива) и MP3 (для публикации) - это удобнее.',
    icon: Music,
    category: 'workflow',
    level: 'beginner',
    color: 'from-pink-500 to-purple-500',
  },
  {
    id: '6',
    title: 'Hotkeys для студии',
    description: 'Space - play/pause, M - mute, S - solo. Запомните эти хоткеи для быстрой работы.',
    icon: Sparkles,
    category: 'shortcut',
    level: 'advanced',
    color: 'from-indigo-500 to-purple-500',
  },
];

const categoryLabels = {
  workflow: 'Workflow',
  tool: 'Tool',
  optimization: 'Optimization',
  shortcut: 'Shortcut',
};

const levelBadgeVariants = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function TipsPanel({
  context = 'general',
  variant = 'carousel',
  dismissible = true,
  autoRotate = false,
  className,
}: TipsPanelProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [completedTips, setCompletedTips] = useState<Set<string>>(new Set());

  // Filter tips by context if needed
  const filteredTips = allTips; // Can add context filtering logic here

  const currentTip = filteredTips[currentTipIndex];
  const isCarousel = variant === 'carousel';

  const handleNext = () => {
    setCurrentTipIndex((prev) => (prev + 1) % filteredTips.length);
  };

  const handleMarkComplete = (tipId: string) => {
    setCompletedTips((prev) => new Set([...prev, tipId]));
  };

  if (isDismissed) return null;

  return (
    <Card className={cn('border-2 border-primary/20 overflow-hidden', className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Профессиональные советы</h3>
              <p className="text-[10px] text-muted-foreground">
                {currentTipIndex + 1} из {filteredTips.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {dismissible && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsDismissed(true)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Tips Content */}
        {isCarousel ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTip.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Tip Card */}
              <div className="relative">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border">
                  <motion.div
                    className={cn(
                      'p-2 rounded-lg shrink-0',
                      `bg-gradient-to-br ${currentTip.color}`
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <currentTip.icon className="w-5 h-5 text-white" />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm leading-tight">
                        {currentTip.title}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] px-1.5 py-0 h-5 shrink-0',
                          levelBadgeVariants[currentTip.level]
                        )}
                      >
                        {currentTip.level}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {currentTip.description}
                    </p>

                    {/* Category */}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        <Info className="w-3 h-3 mr-1" />
                        {categoryLabels[currentTip.category]}
                      </Badge>
                      {!completedTips.has(currentTip.id) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 text-[10px] px-2"
                          onClick={() => handleMarkComplete(currentTip.id)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Понятно
                        </Button>
                      )}
                      {completedTips.has(currentTip.id) && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-400" />
                          Изучено
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {filteredTips.map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        index === currentTipIndex
                          ? 'w-6 bg-primary'
                          : 'w-1.5 bg-muted hover:bg-muted-foreground/30'
                      )}
                      onClick={() => setCurrentTipIndex(index)}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={handleNext}
                >
                  Следующий совет
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          /* List View */
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredTips.map((tip, index) => {
              const Icon = tip.icon;
              const isCompleted = completedTips.has(tip.id);

              return (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-lg border transition-all cursor-pointer',
                      isCompleted
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-muted/30 border-border hover:bg-muted/50'
                    )}
                    onClick={() => handleMarkComplete(tip.id)}
                  >
                    <div className={cn('p-1.5 rounded-lg shrink-0', `bg-gradient-to-br ${tip.color}`)}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium leading-tight mb-0.5">
                        {tip.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                        {tip.description}
                      </div>
                    </div>
                    {isCompleted && (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Progress */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              Изучено советов
            </span>
            <span className="text-[10px] font-semibold">
              {completedTips.size}/{filteredTips.length}
            </span>
          </div>
          <div className="relative h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedTips.size / filteredTips.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
