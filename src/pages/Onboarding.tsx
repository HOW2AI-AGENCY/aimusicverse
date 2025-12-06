import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { 
  Sparkles, 
  Music, 
  Mic2, 
  Library, 
  Layers, 
  Users, 
  FolderOpen,
  ListMusic,
  Wand2,
  ChevronRight,
  ChevronLeft,
  Check,
  Rocket
} from "lucide-react";

interface OnboardingStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  action?: {
    label: string;
    path: string;
  };
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    icon: Rocket,
    title: "Добро пожаловать в MusicVerse!",
    description: "Создавайте уникальную музыку с помощью искусственного интеллекта",
    features: [
      "Генерация полноценных треков за минуты",
      "AI-лирика на любом языке",
      "Профессиональное качество звука"
    ]
  },
  {
    id: "generate",
    icon: Sparkles,
    title: "Генерация музыки",
    description: "Опишите свою идею — AI создаст трек",
    features: [
      "Простой и кастомный режимы генерации",
      "Выбор жанра, настроения и стиля",
      "A/B версии для сравнения вариантов"
    ],
    action: { label: "Попробовать", path: "/generate" }
  },
  {
    id: "lyrics",
    icon: Mic2,
    title: "AI Лирика",
    description: "Мастер создания текстов песен с ИИ",
    features: [
      "Генерация куплетов и припевов",
      "Поддержка русского и английского",
      "Редактирование по секциям"
    ],
    action: { label: "Создать текст", path: "/generate" }
  },
  {
    id: "library",
    icon: Library,
    title: "Ваша библиотека",
    description: "Все ваши треки в одном месте",
    features: [
      "Быстрый доступ ко всем генерациям",
      "Переключение версий A/B",
      "Swipe-действия на мобильных"
    ],
    action: { label: "Открыть библиотеку", path: "/library" }
  },
  {
    id: "versions",
    icon: Layers,
    title: "Версии треков",
    description: "AI создаёт 2 варианта каждого трека",
    features: [
      "Мгновенное переключение A↔B",
      "Сравнение версий в плеере",
      "Выбор лучшего варианта"
    ],
    action: { label: "В библиотеку", path: "/library" }
  },
  {
    id: "stems",
    icon: Wand2,
    title: "Stem Studio",
    description: "Разделяйте треки на отдельные дорожки",
    features: [
      "Вокал, ударные, бас, инструменты",
      "Микширование и экспорт",
      "Создание ремиксов"
    ],
    action: { label: "В студию", path: "/library" }
  },
  {
    id: "artists",
    icon: Users,
    title: "AI Артисты",
    description: "Создавайте уникальных виртуальных артистов",
    features: [
      "Генерация портретов с AI",
      "Персональный стиль и жанр",
      "Публикация в сообществе"
    ],
    action: { label: "Создать артиста", path: "/actors" }
  },
  {
    id: "projects",
    icon: FolderOpen,
    title: "Музыкальные проекты",
    description: "Организуйте работу над альбомами и EP",
    features: [
      "Планирование треклиста",
      "Единый стиль проекта",
      "Быстрая генерация по плану"
    ],
    action: { label: "Создать проект", path: "/projects" }
  },
  {
    id: "playlists",
    icon: ListMusic,
    title: "Плейлисты",
    description: "Собирайте и делитесь коллекциями",
    features: [
      "Drag-and-drop сортировка",
      "AI-обложки для плейлистов",
      "Шеринг в Telegram"
    ],
    action: { label: "К плейлистам", path: "/playlists" }
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const [currentStep, setCurrentStep] = useState(0);

  const step = ONBOARDING_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;
  const Icon = step.icon;

  const handleNext = () => {
    hapticFeedback('light');
    if (isLast) {
      navigate('/');
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    hapticFeedback('light');
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleAction = () => {
    hapticFeedback('medium');
    if (step.action) {
      navigate(step.action.path);
    }
  };

  const handleSkip = () => {
    hapticFeedback('light');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col pb-24">
      <div className="container max-w-lg mx-auto px-4 py-6 flex-1 flex flex-col">
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1.5">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-primary"
                    : index < currentStep
                    ? "w-4 bg-primary/50"
                    : "w-4 bg-muted"
                }`}
              />
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Пропустить
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Card className="p-6 glass-card border-primary/20">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {step.features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {step.action && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAction}
                  >
                    {step.action.label}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {!isFirst && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePrev}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Назад
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={handleNext}
          >
            {isLast ? (
              <>
                Начать
                <Sparkles className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Далее
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
