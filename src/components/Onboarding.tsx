import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Sparkles, Download, Share2, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Music,
    title: 'MusicVerse',
    description: 'Платформа для создания и редактирования музыки с помощью искусственного интеллекта',
    gradient: 'from-purple-500/20 to-blue-500/20',
  },
  {
    icon: Sparkles,
    title: 'Генерация музыки',
    description: 'Создавайте уникальные треки с помощью передовых AI моделей. Просто опишите желаемый результат.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    icon: Download,
    title: 'Экспорт в MIDI',
    description: 'Конвертируйте аудио в MIDI, разделяйте стемы и редактируйте каждый элемент композиции отдельно.',
    gradient: 'from-cyan-500/20 to-teal-500/20',
  },
  {
    icon: Share2,
    title: 'Делитесь творчеством',
    description: 'Сохраняйте проекты, делитесь с друзьями и создавайте музыку прямо в Telegram.',
    gradient: 'from-teal-500/20 to-purple-500/20',
  },
];

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  };

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md glass-card border-primary/20 overflow-hidden">
        <div className="p-8">
          {/* Progress indicators */}
          <div className="flex gap-2 mb-8 justify-center">
            {slides.map((_, index) => (
              <motion.div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-primary'
                    : 'w-1 bg-muted-foreground/30'
                }`}
                initial={false}
                animate={{
                  width: index === currentSlide ? 32 : 4,
                }}
              />
            ))}
          </div>

          {/* Animated slides */}
          <div className="relative h-[400px] mb-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
              >
                {/* Icon with gradient background */}
                <div
                  className={`relative mb-8 p-8 rounded-3xl bg-gradient-to-br ${currentSlideData.gradient}`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1,
                    }}
                  >
                    <Icon className="w-16 h-16 text-primary" />
                  </motion.div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl -z-10" />
                </div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                >
                  {currentSlideData.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground text-lg leading-relaxed"
                >
                  {currentSlideData.description}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {currentSlide > 0 && (
              <Button
                variant="outline"
                size="lg"
                onClick={prevSlide}
                className="flex-1 glass border-primary/20"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            )}

            {currentSlide < slides.length - 1 ? (
              <Button
                size="lg"
                onClick={nextSlide}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Далее
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={onComplete}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Начать
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Skip button */}
          {currentSlide < slides.length - 1 && (
            <button
              onClick={onComplete}
              className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Пропустить
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};
