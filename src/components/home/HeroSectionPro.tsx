/**
 * HeroSectionPro - Premium hero section with animated background and 3 CTAs
 * Record / Upload / Create entry points
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Mic, Upload, Sparkles, Music, Guitar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroSectionProProps {
  onRecord: () => void;
  onUpload: () => void;
  onCreate: () => void;
  className?: string;
}

const VALUE_PROPS = [
  {
    icon: Guitar,
    title: 'Играй на гитаре',
    description: 'AI распознает аккорды и создаст табы',
  },
  {
    icon: Mic,
    title: 'Записывай голос',
    description: 'Превращай идеи в полноценные треки',
  },
  {
    icon: FileText,
    title: 'Создавай тексты',
    description: 'AI помощник для написания лирики',
  },
];

export const HeroSectionPro = memo(function HeroSectionPro({
  onRecord,
  onUpload,
  onCreate,
  className,
}: HeroSectionProProps) {
  return (
    <section className={cn('relative overflow-hidden rounded-2xl', className)}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-generate/15">
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/30"
              initial={{ 
                x: `${20 + i * 15}%`, 
                y: '100%',
                opacity: 0.3,
              }}
              animate={{ 
                y: '-20%',
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ 
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 1.5,
              }}
            />
          ))}
        </div>
        
        {/* Waveform decoration */}
        <svg 
          className="absolute bottom-0 left-0 right-0 h-16 text-primary/10"
          viewBox="0 0 1200 100"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50 L1200,100 L0,100 Z"
            fill="currentColor"
            initial={{ d: "M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50 L1200,100 L0,100 Z" }}
            animate={{ 
              d: [
                "M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50 L1200,100 L0,100 Z",
                "M0,50 Q150,80 300,50 T600,50 T900,50 T1200,50 L1200,100 L0,100 Z",
                "M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50 L1200,100 L0,100 Z",
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 px-3 py-6 sm:px-6 sm:py-12">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-3 sm:mb-4"
        >
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-primary/15 text-primary text-[11px] sm:text-xs font-medium border border-primary/20">
            <Sparkles className="w-3 h-3" />
            AI-платформа для создания музыки
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 sm:mb-3"
        >
          <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Твоя музыка начинается здесь
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xs sm:text-base text-muted-foreground text-center max-w-lg mx-auto mb-4 sm:mb-6 px-2"
        >
          Записывай, загружай или описывай — AI превратит твои идеи в профессиональные треки
        </motion.p>

        {/* Value Props - compact on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-4 sm:mb-6 max-w-xl mx-auto"
        >
          {VALUE_PROPS.map((prop, i) => (
            <div 
              key={i}
              className="flex flex-col items-center text-center p-1.5 sm:p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50"
            >
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-1 sm:mb-2">
                <prop.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="text-[10px] sm:text-sm font-medium text-foreground line-clamp-1">
                {prop.title}
              </span>
              <span className="text-[9px] sm:text-xs text-muted-foreground line-clamp-2 hidden sm:block">
                {prop.description}
              </span>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons - stack on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center max-w-md mx-auto"
        >
          <Button
            onClick={onRecord}
            size="lg"
            className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 h-11 sm:h-12 text-sm"
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            Записать
          </Button>
          <Button
            onClick={onUpload}
            size="lg"
            variant="outline"
            className="flex-1 gap-2 h-11 sm:h-12 border-primary/30 hover:bg-primary/10 text-sm"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            Загрузить
          </Button>
          <Button
            onClick={onCreate}
            size="lg"
            className="flex-1 bg-generate hover:bg-generate/90 text-white gap-2 h-11 sm:h-12 text-sm"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            Создать с AI
          </Button>
        </motion.div>
      </div>
    </section>
  );
});
