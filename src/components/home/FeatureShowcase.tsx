/**
 * FeatureShowcase - Showcase of platform capabilities
 * MIDI, Tabs, Stems, Sheet Music with info dialogs
 */

import { memo, useState } from 'react';
import { motion } from '@/lib/motion';
import { 
  Music, 
  Guitar, 
  Layers, 
  FileText,
  Download,
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FeatureShowcaseProps {
  className?: string;
}

interface FeatureInfo {
  id: string;
  icon: typeof Music;
  title: string;
  description: string;
  badge: string;
  color: string;
  bgColor: string;
  link: string;
  fullTitle: string;
  fullDescription: string;
  howToUse: string[];
  requirements: string[];
}

const FEATURES: FeatureInfo[] = [
  {
    id: 'midi',
    icon: Music,
    title: 'MIDI и ноты',
    description: 'Экспорт в DAW',
    badge: 'MIDI',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    link: '/music-lab',
    fullTitle: 'MIDI и нотная транскрипция',
    fullDescription: 'Конвертируйте аудио в MIDI-файлы для использования в любой DAW (Ableton, FL Studio, Logic Pro). Получите точную нотную запись вашей музыки.',
    howToUse: [
      'Запишите или загрузите аудиофайл',
      'Перейдите в Stem Studio и разделите на стемы',
      'Откройте Music Lab для транскрипции',
      'Экспортируйте в MIDI или MusicXML',
    ],
    requirements: [
      'Загруженное или записанное аудио',
      'Или отдельный стем (вокал, бас, и т.д.)',
    ],
  },
  {
    id: 'tabs',
    icon: Guitar,
    title: 'Табулатура',
    description: 'Guitar Pro (.gp5)',
    badge: 'TAB',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    link: '/guitar-studio',
    fullTitle: 'Гитарные табулатуры',
    fullDescription: 'Автоматическое создание табулатуры из аудиозаписи гитары. Экспорт в формат Guitar Pro (.gp5) для редактирования.',
    howToUse: [
      'Запишите гитарную партию в Guitar Studio',
      'Или загрузите аудио с гитарой',
      'AI распознает ноты и создаст табулатуру',
      'Скачайте .gp5 файл для Guitar Pro',
    ],
    requirements: [
      'Аудиозапись гитары',
      'Чистое звучание без сильной обработки',
    ],
  },
  {
    id: 'stems',
    icon: Layers,
    title: 'Стемы',
    description: 'Vocal / Drums / Bass',
    badge: 'STEMS',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    link: '/stem-studio',
    fullTitle: 'Разделение на стемы',
    fullDescription: 'Разделите любой трек на отдельные дорожки: вокал, барабаны, бас, и другие инструменты. Идеально для ремиксов и караоке.',
    howToUse: [
      'Загрузите аудиофайл или выберите трек',
      'Откройте Stem Studio',
      'Выберите режим разделения (2, 4 или 6 стемов)',
      'Скачайте отдельные дорожки',
    ],
    requirements: [
      'Любой аудиофайл (MP3, WAV, и т.д.)',
      'Или трек из вашей библиотеки',
    ],
  },
  {
    id: 'sheets',
    icon: FileText,
    title: 'PDF ноты',
    description: 'Для печати',
    badge: 'PDF',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    link: '/music-lab',
    fullTitle: 'Нотные листы PDF',
    fullDescription: 'Создайте профессиональные нотные листы для печати. Идеально для музыкантов, которые предпочитают читать ноты с бумаги.',
    howToUse: [
      'Транскрибируйте аудио в Music Lab',
      'Отредактируйте ноты при необходимости',
      'Выберите формат экспорта PDF',
      'Распечатайте или поделитесь',
    ],
    requirements: [
      'Транскрибированные ноты из Music Lab',
      'Или MIDI/MusicXML файл',
    ],
  },
];

export const FeatureShowcase = memo(function FeatureShowcase({
  className,
}: FeatureShowcaseProps) {
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState<FeatureInfo | null>(null);

  return (
    <section className={cn('space-y-3', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-generate/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-generate" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Что ты можешь создать
            </h2>
            <p className="text-xs text-muted-foreground">
              Профессиональные инструменты для музыкантов
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FEATURES.map((feature, index) => (
          <motion.button
            key={feature.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedFeature(feature)}
            className={cn(
              'relative overflow-hidden rounded-xl p-3 text-left',
              'bg-card/50 backdrop-blur-sm border border-border/50',
              'hover:border-primary/30 hover:bg-card/80',
              'transition-all duration-200 group'
            )}
          >
            {/* Badge */}
            <div className="absolute top-2 right-2">
              <span className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                feature.bgColor, feature.color
              )}>
                {feature.badge}
              </span>
            </div>

            {/* Icon */}
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center mb-2',
              'transition-transform duration-200 group-hover:scale-110',
              feature.bgColor
            )}>
              <feature.icon className={cn('w-5 h-5', feature.color)} />
            </div>

            {/* Content */}
            <h3 className="text-sm font-medium text-foreground mb-0.5">
              {feature.title}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Download className="w-3 h-3" />
              {feature.description}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Feature Info Dialog */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedFeature && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    selectedFeature.bgColor
                  )}>
                    <selectedFeature.icon className={cn('w-6 h-6', selectedFeature.color)} />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">
                      {selectedFeature.fullTitle}
                    </DialogTitle>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1',
                      selectedFeature.bgColor, selectedFeature.color
                    )}>
                      {selectedFeature.badge}
                    </span>
                  </div>
                </div>
                <DialogDescription className="text-sm text-muted-foreground">
                  {selectedFeature.fullDescription}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* How to use */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    Как использовать
                  </h4>
                  <ol className="space-y-2">
                    {selectedFeature.howToUse.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className={cn(
                          'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium',
                          selectedFeature.bgColor, selectedFeature.color
                        )}>
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Что нужно
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedFeature.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full mt-4"
                  onClick={() => {
                    setSelectedFeature(null);
                    navigate(selectedFeature.link);
                  }}
                >
                  Перейти в {selectedFeature.title}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
});
