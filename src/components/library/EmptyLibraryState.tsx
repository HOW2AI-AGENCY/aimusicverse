import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Music2, Wand2, Upload, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyLibraryStateProps {
  searchQuery?: string;
  className?: string;
}

export function EmptyLibraryState({ searchQuery, className }: EmptyLibraryStateProps) {
  const navigate = useNavigate();

  if (searchQuery) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex flex-col items-center justify-center text-center p-8 sm:p-12",
          className
        )}
      >
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Music2 className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Ничего не найдено</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Попробуйте изменить поисковый запрос или проверьте фильтры
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl",
        "bg-gradient-to-br from-primary/5 via-transparent to-generate/5",
        "border border-dashed border-border/50",
        className
      )}
    >
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-generate/20 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        {/* Floating particles */}
        <motion.div
          animate={{ y: [-5, 5, -5], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-generate/30"
        />
        <motion.div
          animate={{ y: [5, -5, 5], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-primary/30"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-2 mb-6"
      >
        <h3 className="text-xl font-bold">Создайте свой первый трек</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Опишите музыку вашей мечты, и AI создаст уникальный трек за минуту
        </p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
      >
        <Button
          onClick={() => navigate('/', { state: { openGenerate: true } })}
          className="flex-1 h-12 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
        >
          <Wand2 className="w-4 h-4" />
          Создать трек
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/', { state: { openGenerate: true, mode: 'upload' } })}
          className="flex-1 h-12 gap-2"
        >
          <Upload className="w-4 h-4" />
          Загрузить аудио
        </Button>
      </motion.div>

      {/* Quick tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex flex-wrap justify-center gap-2"
      >
        {['Поп хит', 'Рок баллада', 'Lo-fi beats', 'Электронный'].map((tag, i) => (
          <button
            key={tag}
            onClick={() => navigate('/', { state: { openGenerate: true, prompt: tag } })}
            className="px-3 py-1.5 rounded-full text-xs bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {tag}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
