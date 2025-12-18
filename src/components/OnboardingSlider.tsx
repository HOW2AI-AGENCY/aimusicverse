import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Music, 
  Sparkles, 
  Mic, 
  GitBranch, 
  User, 
  Wand2,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { useTelegram } from '@/contexts/TelegramContext';
import { useTelegramMainButton } from '@/hooks/telegram';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  gradient: string;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Генерация треков с AI',
    description: 'Создавайте музыку из текстового описания',
    features: [
      'Описание стиля и настроения',
      'Генерация лирики на любом языке',
      'Загрузка референсного аудио',
      'Контроль над жанром и темпом'
    ],
    icon: Sparkles,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 2,
    title: 'Проекты и контекст',
    description: 'Создавайте альбомы с единым стилем',
    features: [
      'Группировка треков в проекты',
      'AI учитывает контекст проекта',
      'Единая стилистика всех треков',
      'Автоматическая категоризация'
    ],
    icon: GitBranch,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 3,
    title: 'Разделение на стемы',
    description: 'Работайте с отдельными дорожками',
    features: [
      'Извлечение вокала и инструментов',
      'Высокое качество разделения',
      'Экспорт отдельных стемов',
      'Идеально для ремиксов'
    ],
    icon: Music,
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    id: 4,
    title: 'Продвинутое редактирование',
    description: 'Полный контроль над треком',
    features: [
      'Замена отдельных секций',
      'Наложение вокала или инструментала',
      'Создание каверов треков',
      'Расширение и улучшение композиций'
    ],
    icon: Wand2,
    gradient: 'from-orange-500 to-red-500'
  },
  {
    id: 5,
    title: 'Персона артиста',
    description: 'Создайте свой уникальный стиль',
    features: [
      'AI анализирует ваши треки',
      'Создание персоны артиста',
      'Единый фирменный стиль',
      'Генерация в вашем стиле'
    ],
    icon: User,
    gradient: 'from-violet-500 to-purple-500'
  },
  {
    id: 6,
    title: 'Интеллектуальные теги',
    description: 'Улучшенный контроль генерации',
    features: [
      'Автоматическое обогащение лирики',
      'Умные теги для точности',
      'Контроль настроения и динамики',
      'Профессиональный результат'
    ],
    icon: Mic,
    gradient: 'from-yellow-500 to-orange-500'
  }
];

interface OnboardingSliderProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingSlider = ({ onComplete, onSkip }: OnboardingSliderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { hapticFeedback } = useTelegram();

  const isLastStep = currentStep === steps.length - 1;

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      hapticFeedback?.('light');
      setCurrentStep(currentStep + 1);
    } else {
      hapticFeedback?.('success');
      onComplete();
    }
  }, [currentStep, hapticFeedback, onComplete]);

  const prevStep = () => {
    if (currentStep > 0) {
      hapticFeedback?.('light');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    hapticFeedback?.('medium');
    onSkip();
  };

  // Main Button integration
  const { shouldShowUIButton } = useTelegramMainButton({
    text: isLastStep ? 'НАЧАТЬ' : 'ДАЛЕЕ',
    onClick: nextStep,
    enabled: true,
    visible: true,
  });

  const step = steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm safe-area-inset">
      <Card className="w-full max-w-2xl mx-4 glass-card overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted relative">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground">
              Шаг {currentStep + 1} из {steps.length}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Пропустить
            </Button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Icon */}
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto`}>
                <Icon className="w-10 h-10 text-white" />
              </div>

              {/* Title & Description */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {step.title}
                </h2>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {step.features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={shouldShowUIButton ? "flex-1" : "w-full"}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>

            {shouldShowUIButton && (
              <Button
                size="lg"
                onClick={nextStep}
                className={`flex-1 bg-gradient-to-r ${step.gradient} text-white border-0 hover:opacity-90`}
              >
                {isLastStep ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Начать
                  </>
                ) : (
                  <>
                    Далее
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  hapticFeedback?.('selection');
                  setCurrentStep(index);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
