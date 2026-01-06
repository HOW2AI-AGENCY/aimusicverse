/**
 * FeatureShowcase - Showcase of platform capabilities
 * MIDI, Tabs, Stems, Sheet Music
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { 
  Music, 
  Guitar, 
  Layers, 
  FileText,
  Download,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureShowcaseProps {
  className?: string;
}

const FEATURES = [
  {
    id: 'midi',
    icon: Music,
    title: 'MIDI и ноты',
    description: 'Экспорт в DAW',
    badge: 'MIDI',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    link: '/music-lab',
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
  },
];

export const FeatureShowcase = memo(function FeatureShowcase({
  className,
}: FeatureShowcaseProps) {
  const navigate = useNavigate();

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
            onClick={() => navigate(feature.link)}
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
    </section>
  );
});
