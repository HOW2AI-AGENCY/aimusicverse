/**
 * Telegram-native Onboarding
 * 
 * Fullscreen onboarding with swipe navigation, 
 * dot indicators, and haptic feedback.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Music2, 
  Layers, 
  Waves, 
  FileMusic,
  Package,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { hapticImpact, hapticNotification } from '@/lib/haptic';
import { cn } from '@/lib/utils';

interface OnboardingSlide {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  features: string[];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'MusicVerse AI',
    subtitle: 'Создавай музыку с AI',
    description: 'От идеи до профессионального трека за минуты. Генерация, микширование, экспорт — всё в одном месте.',
    gradient: 'from-primary via-primary/80 to-primary/60',
    features: ['AI-генерация музыки', 'Профессиональное качество', 'Полный контроль']
  },
  {
    id: 'lyrics',
    icon: Music2,
    title: 'Начни с текста',
    subtitle: 'Визуальный редактор лирики',
    description: 'Создавай тексты песен с AI-помощником. Добавляй заметки, референсы и теги к каждой секции.',
    gradient: 'from-generate via-generate/80 to-generate/60',
    features: ['AI-генерация текстов', 'Секции с заметками', 'Аудио-референсы']
  },
  {
    id: 'generate',
    icon: Layers,
    title: 'A/B версии',
    subtitle: 'Выбирай лучшее',
    description: 'Получай 2 варианта каждого трека. Сравнивай, комбинируй, создавай под-версии.',
    gradient: 'from-library via-library/80 to-library/60',
    features: ['Мгновенное сравнение', 'Замена секций', 'Продление треков']
  },
  {
    id: 'stems',
    icon: Waves,
    title: 'Stem Studio',
    subtitle: 'Разделяй и властвуй',
    description: 'Разделяй треки на вокал, барабаны, бас и инструменты. Микшируй, применяй эффекты.',
    gradient: 'from-projects via-projects/80 to-projects/60',
    features: ['AI-разделение на стемы', 'Профессиональный миксер', 'Эффекты и обработка']
  },
  {
    id: 'transcription',
    icon: FileMusic,
    title: 'Транскрипция',
    subtitle: 'Ноты и MIDI',
    description: 'Преврати любой стем в ноты, табулатуры и MIDI. Guitar Pro, PDF, MusicXML.',
    gradient: 'from-warning via-warning/80 to-warning/60',
    features: ['MIDI транскрипция', 'Guitar Pro табы', 'PDF нотная запись']
  },
  {
    id: 'export',
    icon: Package,
    title: 'Про архив',
    subtitle: 'Всё в одном ZIP',
    description: 'Скачай полный пакет: трек, стемы, MIDI, ноты, лирика — готовый к продакшену архив.',
    gradient: 'from-success via-success/80 to-success/60',
    features: ['MP3 + WAV', 'Все стемы', 'MIDI + ноты + лирика']
  }
];

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 500;

export function TelegramOnboarding() {
  const navigate = useNavigate();
  const { isActive, skipOnboarding, completeOnboarding } = useOnboarding();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = SLIDES.length;
  const isLastSlide = currentSlide === totalSlides - 1;
  const slide = SLIDES[currentSlide];

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= totalSlides) return;
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    hapticImpact('light');
  }, [currentSlide, totalSlides]);

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    } else {
      hapticNotification('success');
      completeOnboarding();
      navigate('/');
    }
  }, [currentSlide, totalSlides, goToSlide, completeOnboarding, navigate]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  const handleSkip = useCallback(() => {
    hapticImpact('medium');
    skipOnboarding();
    navigate('/');
  }, [skipOnboarding, navigate]);

  const handleDragEnd = useCallback((
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > SWIPE_VELOCITY_THRESHOLD) {
      if (offset.x > 0 || velocity.x > SWIPE_VELOCITY_THRESHOLD) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
  }, [nextSlide, prevSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, handleSkip]);

  if (!isActive) return null;

  const SlideIcon = slide.icon;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background overflow-hidden"
    >
      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleSkip}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/50 backdrop-blur-sm border border-border/30 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-5 h-5" />
      </motion.button>

      {/* Slide content with swipe */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={slide.id}
          custom={direction}
          initial={{ opacity: 0, x: direction > 0 ? 300 : -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -300 : 300 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-32 pt-16 cursor-grab active:cursor-grabbing"
        >
          {/* Gradient background */}
          <div 
            className={cn(
              "absolute inset-0 opacity-10 bg-gradient-to-br",
              slide.gradient
            )}
          />

          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "w-24 h-24 rounded-3xl flex items-center justify-center mb-8",
              "bg-gradient-to-br shadow-xl",
              slide.gradient
            )}
          >
            <SlideIcon className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-bold mb-2">{slide.title}</h1>
            <p className={cn(
              "text-lg font-medium bg-gradient-to-r bg-clip-text text-transparent",
              slide.gradient
            )}>
              {slide.subtitle}
            </p>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-muted-foreground max-w-sm mb-8 leading-relaxed"
          >
            {slide.description}
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap justify-center gap-2 max-w-sm"
          >
            {slide.features.map((feature, i) => (
              <motion.span
                key={feature}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium",
                  "bg-gradient-to-r text-white shadow-md",
                  slide.gradient
                )}
              >
                {feature}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 safe-area-bottom">
        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentSlide 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Слайд ${index + 1}`}
            />
          ))}
        </div>

        {/* Action button */}
        <Button
          onClick={nextSlide}
          size="lg"
          className={cn(
            "w-full h-14 rounded-2xl text-lg font-semibold",
            "bg-gradient-to-r shadow-lg transition-all duration-300",
            slide.gradient,
            "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          {isLastSlide ? (
            <>
              Начать
              <Sparkles className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              Далее
              <ChevronRight className="w-5 h-5 ml-1" />
            </>
          )}
        </Button>

        {/* Swipe hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-xs text-muted-foreground/60 mt-4"
        >
          Свайп для навигации
        </motion.p>
      </div>
    </motion.div>
  );
}
