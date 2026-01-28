/**
 * FeatureTutorialDialog - Modal tutorial for feature discovery
 * Shows slide-based tutorials for different features
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles, 
  Music2, 
  Scissors, 
  Wand2, 
  PenTool,
  Guitar,
  Mic2,
  Play,
  Check,
} from 'lucide-react';
import { typographyClass } from '@/lib/design-tokens';
import { useTelegram } from '@/contexts/TelegramContext';

export type TutorialType = 
  | 'style' 
  | 'extend' 
  | 'cover' 
  | 'stems' 
  | 'lyrics'
  | 'track'
  | 'riff';

interface TutorialSlide {
  title: string;
  description: string;
  tip?: string;
  icon: React.ReactNode;
  illustration?: string;
}

interface TutorialData {
  title: string;
  slides: TutorialSlide[];
  actionLabel: string;
  actionRoute?: string;
}

const TUTORIALS: Record<TutorialType, TutorialData> = {
  style: {
    title: 'Детализированные описания',
    actionLabel: 'Создать трек',
    slides: [
      {
        title: 'Опиши стиль подробно',
        description: 'Чем точнее ты опишешь желаемый звук, тем лучше будет результат.',
        tip: '"energetic pop with synth arpeggios and driving drums"',
        icon: <Sparkles className="w-8 h-8 text-primary" />,
      },
      {
        title: 'Добавь детали',
        description: 'Укажи темп, настроение, инструменты и вокальный стиль.',
        tip: '"slow melancholic piano ballad with soft female vocals"',
        icon: <Music2 className="w-8 h-8 text-primary" />,
      },
      {
        title: 'Экспериментируй',
        description: 'Смешивай жанры и стили для уникального звучания.',
        tip: '"jazz-infused hip-hop with brass section and vinyl crackle"',
        icon: <Wand2 className="w-8 h-8 text-primary" />,
      },
    ],
  },
  extend: {
    title: 'Расширение трека',
    actionLabel: 'Открыть библиотеку',
    actionRoute: '/library',
    slides: [
      {
        title: 'Продли свой трек',
        description: 'Добавь новые куплеты, припевы или инструментальные части к существующему треку.',
        icon: <Music2 className="w-8 h-8 text-emerald-400" />,
      },
      {
        title: 'Как это работает',
        description: 'Выбери трек в библиотеке, нажми меню (⋮) и выбери "Расширить".',
        tip: 'AI продолжит композицию, сохраняя стиль и атмосферу',
        icon: <Play className="w-8 h-8 text-emerald-400" />,
      },
      {
        title: 'До 4 минут',
        description: 'Расширяй трек несколько раз, создавая полноценную песню.',
        icon: <Check className="w-8 h-8 text-emerald-400" />,
      },
    ],
  },
  cover: {
    title: 'AI-каверы',
    actionLabel: 'Создать кавер',
    slides: [
      {
        title: 'Трансформируй любой трек',
        description: 'Загрузи аудио или используй трек из библиотеки для создания кавера в новом стиле.',
        icon: <Wand2 className="w-8 h-8 text-purple-400" />,
      },
      {
        title: 'Меняй жанр полностью',
        description: 'Рок → джаз, поп → метал, классика → электроника — возможно всё!',
        tip: 'Укажи желаемый стиль в описании',
        icon: <Mic2 className="w-8 h-8 text-purple-400" />,
      },
      {
        title: 'Сохрани мелодию',
        description: 'AI сохранит оригинальную мелодию, но изменит аранжировку и звучание.',
        icon: <Music2 className="w-8 h-8 text-purple-400" />,
      },
    ],
  },
  stems: {
    title: 'Разделение на стемы',
    actionLabel: 'Открыть библиотеку',
    actionRoute: '/library',
    slides: [
      {
        title: 'Разложи трек на части',
        description: 'Получи отдельные дорожки: вокал, барабаны, бас, другие инструменты.',
        icon: <Scissors className="w-8 h-8 text-amber-400" />,
      },
      {
        title: 'Идеально для ремиксов',
        description: 'Используй отдельные стемы для создания ремиксов и мэшапов.',
        tip: 'Каждый стем можно скачать отдельно',
        icon: <Music2 className="w-8 h-8 text-amber-400" />,
      },
      {
        title: 'Как использовать',
        description: 'В меню трека выбери "Разделить на стемы" — процесс займёт ~30 секунд.',
        icon: <Play className="w-8 h-8 text-amber-400" />,
      },
    ],
  },
  lyrics: {
    title: 'AI-тексты песен',
    actionLabel: 'Lyrics Studio',
    actionRoute: '/lyrics-studio',
    slides: [
      {
        title: 'Тексты за секунды',
        description: 'AI напишет текст под любой жанр и настроение.',
        icon: <PenTool className="w-8 h-8 text-pink-400" />,
      },
      {
        title: 'Настрой под себя',
        description: 'Укажи тему, язык, структуру (куплеты, припевы) и стиль.',
        tip: 'Поддерживается 15+ языков',
        icon: <Sparkles className="w-8 h-8 text-pink-400" />,
      },
      {
        title: 'Редактируй результат',
        description: 'Меняй отдельные строки или генерируй альтернативы для любой секции.',
        icon: <Check className="w-8 h-8 text-pink-400" />,
      },
    ],
  },
  track: {
    title: 'Создание трека',
    actionLabel: 'Создать',
    slides: [
      {
        title: 'Полноценный трек',
        description: 'Создай готовую песню с вокалом, инструментами и структурой.',
        icon: <Music2 className="w-8 h-8 text-primary" />,
      },
      {
        title: 'Опиши идею',
        description: 'Напиши промпт с описанием стиля, настроения и текста песни.',
        tip: '"upbeat pop song about summer adventures with catchy chorus"',
        icon: <Sparkles className="w-8 h-8 text-primary" />,
      },
      {
        title: '2 варианта',
        description: 'AI сгенерирует 2 версии — выбери лучшую или сохрани обе.',
        icon: <Check className="w-8 h-8 text-primary" />,
      },
    ],
  },
  riff: {
    title: 'Инструментальные риффы',
    actionLabel: 'Создать',
    slides: [
      {
        title: 'Только инструментал',
        description: 'Создай музыкальную основу без вокала для своих проектов.',
        icon: <Guitar className="w-8 h-8 text-generate" />,
      },
      {
        title: 'Идеи и сэмплы',
        description: 'Генерируй риффы для использования в других DAW или как источник вдохновения.',
        tip: 'Отлично для битмейкеров и продюсеров',
        icon: <Music2 className="w-8 h-8 text-generate" />,
      },
      {
        title: 'Быстрый результат',
        description: 'Получи готовый инструментал за 30-60 секунд.',
        icon: <Play className="w-8 h-8 text-generate" />,
      },
    ],
  },
};

interface FeatureTutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TutorialType;
  onAction?: () => void;
}

export const FeatureTutorialDialog = memo(function FeatureTutorialDialog({
  open,
  onOpenChange,
  type,
  onAction,
}: FeatureTutorialDialogProps) {
  const { hapticFeedback } = useTelegram();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const tutorial = TUTORIALS[type];
  const slides = tutorial.slides;
  const isLastSlide = currentSlide === slides.length - 1;
  const isFirstSlide = currentSlide === 0;

  const handleNext = useCallback(() => {
    hapticFeedback('light');
    if (isLastSlide) {
      onAction?.();
      onOpenChange(false);
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  }, [hapticFeedback, isLastSlide, onAction, onOpenChange]);

  const handlePrev = useCallback(() => {
    hapticFeedback('light');
    setCurrentSlide(prev => Math.max(0, prev - 1));
  }, [hapticFeedback]);

  const handleClose = useCallback(() => {
    hapticFeedback('light');
    setCurrentSlide(0);
    onOpenChange(false);
  }, [hapticFeedback, onOpenChange]);

  const currentSlideData = slides[currentSlide];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-card border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <DialogTitle className={cn(typographyClass.body.md, "font-semibold")}>
            {tutorial.title}
          </DialogTitle>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <DialogDescription className="sr-only">
          Туториал по функции {tutorial.title}
        </DialogDescription>

        {/* Slide content */}
        <div className="relative min-h-[280px] p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon */}
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-accent/50 flex items-center justify-center mb-4"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {currentSlideData.icon}
              </motion.div>

              {/* Title */}
              <h3 className={cn(typographyClass.heading.h4, "mb-2")}>
                {currentSlideData.title}
              </h3>

              {/* Description */}
              <p className={cn(typographyClass.body.sm, "text-muted-foreground mb-4 max-w-sm")}>
                {currentSlideData.description}
              </p>

              {/* Tip */}
              {currentSlideData.tip && (
                <div className="bg-accent/30 rounded-lg px-4 py-2 border border-border/30">
                  <p className={cn(typographyClass.caption, "italic text-muted-foreground")}>
                    {currentSlideData.tip}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                hapticFeedback('light');
                setCurrentSlide(idx);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                idx === currentSlide 
                  ? "bg-primary w-6" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Слайд ${idx + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 p-4 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={isFirstSlide}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Назад
          </Button>
          <Button
            size="sm"
            onClick={handleNext}
            className="flex-1"
          >
            {isLastSlide ? tutorial.actionLabel : 'Далее'}
            {!isLastSlide && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
