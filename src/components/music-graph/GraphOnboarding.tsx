import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Layers, Search, MousePointer, ZoomIn, 
  Filter, Copy, Lightbulb, ChevronRight, X, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GraphOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const STORAGE_KEY = 'musicverse_graph_onboarding_completed';

const steps = [
  {
    id: 'welcome',
    icon: Network,
    title: 'Добро пожаловать в Граф музыки!',
    description: 'Это интерактивная карта музыкальных связей: жанры, стили, теги и их взаимосвязи.',
    tip: 'Граф поможет найти идеальные теги для генерации музыки',
    color: 'hsl(var(--primary))',
  },
  {
    id: 'structure',
    icon: Layers,
    title: 'Структура графа',
    description: 'Граф содержит 4 типа узлов: жанры (основа), стили (подкатегории), теги (характеристики) и категории тегов.',
    tip: 'Каждый тип имеет свой цвет для быстрого распознавания',
    color: '#22c55e',
  },
  {
    id: 'navigation',
    icon: MousePointer,
    title: 'Навигация',
    description: 'На мобильном: выбирайте категории → группы → элементы. На десктопе: перетаскивайте граф и масштабируйте колесом мыши.',
    tip: 'Свайп вправо вернёт на предыдущий уровень',
    color: '#3b82f6',
  },
  {
    id: 'filters',
    icon: Filter,
    title: 'Фильтрация',
    description: 'Используйте фильтры для отображения только нужных типов узлов, жанров или категорий.',
    tip: 'Сузьте выбор до конкретного жанра для точных рекомендаций',
    color: '#f59e0b',
  },
  {
    id: 'connections',
    icon: Search,
    title: 'Связи и рекомендации',
    description: 'Нажмите на любой узел, чтобы увидеть связанные элементы. Система покажет совместимые теги и стили.',
    tip: 'Используйте связи для создания уникальных комбинаций',
    color: '#ec4899',
  },
  {
    id: 'usage',
    icon: Copy,
    title: 'Использование тегов',
    description: 'Найденные теги можно скопировать и использовать в генерации музыки для более точных результатов.',
    tip: 'Комбинируйте теги из разных категорий для уникального звучания',
    color: '#8b5cf6',
  },
  {
    id: 'analytics',
    icon: Sparkles,
    title: 'Аналитика и предсказания',
    description: 'Система анализирует популярность тегов и предсказывает успешные комбинации на основе данных генераций.',
    tip: 'Смотрите раздел "Рекомендации" для персональных советов',
    color: '#06b6d4',
  },
];

export function GraphOnboarding({ onComplete, onSkip }: GraphOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const Icon = step.icon;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY, 'true');
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onSkip();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Progress */}
        <div className="flex justify-center gap-1.5 mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === currentStep 
                  ? "w-8 bg-primary" 
                  : idx < currentStep 
                    ? "w-4 bg-primary/50" 
                    : "w-4 bg-muted"
              )}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          {/* Skip button */}
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="w-4 h-4 mr-1" />
              Пропустить
            </Button>
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: step.color + '20' }}
          >
            <Icon className="w-10 h-10" style={{ color: step.color }} />
          </motion.div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-3">{step.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              {step.description}
            </p>
            
            {/* Tip */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 text-left">
              <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-primary">{step.tip}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                Назад
              </Button>
            )}
            <Button 
              className="flex-1 gap-2"
              onClick={handleNext}
            >
              {isLast ? 'Начать' : 'Далее'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Step counter */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {currentStep + 1} из {steps.length}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function useGraphOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay to let page load first
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    setShowOnboarding,
    resetOnboarding,
  };
}
