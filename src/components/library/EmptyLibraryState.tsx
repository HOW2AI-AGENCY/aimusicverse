import { motion } from '@/lib/motion';
import { Sparkles, Music2, Wand2, Upload, ArrowRight, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EmptyLibraryStateProps {
  searchQuery?: string;
  className?: string;
  navigate?: (path: string, options?: { state?: Record<string, any> }) => void;
}

export function EmptyLibraryState({ searchQuery, className, navigate }: EmptyLibraryStateProps) {
  // Fallback if navigate is not provided
  const handleNavigate = (path: string, options?: { state?: Record<string, any> }) => {
    if (navigate) {
      navigate(path, options);
    } else {
      // Fallback to window.location if navigate function is not available
      window.location.href = path;
    }
  };

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
        <motion.div 
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center mb-5 shadow-lg"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Music2 className="w-10 h-10 text-muted-foreground/50" />
        </motion.div>
        <h3 className="text-xl font-bold mb-2">Ничего не найдено</h3>
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
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl relative overflow-hidden",
        "bg-gradient-to-br from-primary/5 via-generate/5 to-background",
        "border border-dashed border-primary/30",
        className
      )}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-generate/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="relative mb-8"
      >
        <motion.div 
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/30 to-generate/20 flex items-center justify-center shadow-2xl border border-primary/20"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-12 h-12 text-primary" />
          </motion.div>
        </motion.div>
        
        {/* Floating particles */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "absolute w-3 h-3 rounded-full",
              i % 2 === 0 ? "bg-generate/40" : "bg-primary/40"
            )}
            style={{
              top: `${20 + (i % 2) * 60}%`,
              left: i < 2 ? '-10%' : '110%',
            }}
            animate={{ 
              y: [-10, 10, -10], 
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 2 + i * 0.5, repeat: Infinity }}
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 mb-8 relative"
      >
        <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Создайте свой первый трек
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
          Опишите музыку вашей мечты, и AI создаст уникальный трек за минуту
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <Zap className="w-3 h-3 text-generate" />
            Быстрая генерация
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Star className="w-3 h-3 text-primary" />
            Высокое качество
          </Badge>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md relative"
      >
        <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => handleNavigate('/', { state: { openGenerate: true } })}
            className="w-full h-14 gap-2 bg-gradient-to-r from-primary via-primary to-generate hover:from-primary/90 hover:to-generate/90 shadow-xl shadow-primary/25 text-base font-semibold rounded-2xl"
          >
            <Wand2 className="w-5 h-5" />
            Создать трек
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
        <motion.div className="flex-1 sm:flex-none" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            onClick={() => handleNavigate('/', { state: { openGenerate: true, mode: 'upload' } })}
            className="w-full sm:w-auto h-14 gap-2 text-base rounded-2xl border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            <Upload className="w-5 h-5" />
            Загрузить
          </Button>
        </motion.div>
      </motion.div>

      {/* Quick tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10 flex flex-wrap justify-center gap-2 relative"
      >
        <p className="w-full text-xs text-muted-foreground mb-2">Попробуйте:</p>
        {['Поп хит 🎤', 'Рок баллада 🎸', 'Lo-fi beats 🎧', 'Электронный 🎹', 'R&B 🎵'].map((tag, i) => (
          <motion.button
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigate('/', { state: { openGenerate: true, prompt: tag.replace(/[^\w\s]/g, '').trim() } })}
            className="px-4 py-2 rounded-full text-sm bg-card hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-all border border-border/50 hover:border-primary/30 shadow-sm"
          >
            {tag}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}
