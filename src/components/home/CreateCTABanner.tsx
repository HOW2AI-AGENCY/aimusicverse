import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Sparkles, ArrowRight, Music, Mic2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CreateCTABannerProps {
  onGenerateClick: () => void;
  variant?: 'primary' | 'minimal';
  className?: string;
}

export const CreateCTABanner = memo(function CreateCTABanner({
  onGenerateClick,
  variant = 'primary',
  className,
}: CreateCTABannerProps) {
  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center justify-between p-4 rounded-2xl",
          "bg-gradient-to-r from-primary/10 via-generate/5 to-primary/10",
          "border border-primary/20",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Создайте свой трек</p>
            <p className="text-xs text-muted-foreground">AI сгенерирует музыку за секунды</p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={onGenerateClick}
          className="gap-1.5"
        >
          Создать
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 sm:p-6",
        "bg-gradient-to-br from-primary/20 via-generate/10 to-primary/5",
        "border border-primary/20",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-generate/10 rounded-full blur-3xl" />
        <Music className="absolute top-4 right-4 w-20 h-20 text-primary/5" />
        <Mic2 className="absolute bottom-4 left-1/3 w-16 h-16 text-generate/5" />
        <Layers className="absolute top-1/2 right-1/4 w-12 h-12 text-primary/5" />
      </div>

      <div className="relative space-y-4">
        {/* Icon */}
        <motion.div 
          className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Sparkles className="w-7 h-7 text-primary" />
        </motion.div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-bold">
            Создайте свой первый трек
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Опишите музыку, которую хотите создать, и AI сгенерирует уникальный трек за считанные секунды
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {['Любой жанр', '174+ стилей', 'Текст песни', 'A/B версии'].map((feature) => (
            <span 
              key={feature}
              className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary/80"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Button 
          size="lg" 
          onClick={onGenerateClick}
          className="gap-2 mt-2"
        >
          <Sparkles className="w-4 h-4" />
          Создать трек
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
});
