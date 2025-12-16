import { cn } from '@/lib/utils';
import { Music2, Mic, Volume2, Layers, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Badge } from '@/components/ui/badge';

type FilterOption = 'all' | 'vocals' | 'instrumental' | 'stems';

interface LibraryFilterChipsProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  counts?: {
    all: number;
    vocals: number;
    instrumental: number;
    stems: number;
  };
}

const filterOptions: { id: FilterOption; label: string; icon: React.ReactNode; gradient: string }[] = [
  { id: 'all', label: 'Все', icon: <Music2 className="w-3.5 h-3.5" />, gradient: 'from-primary to-primary/80' },
  { id: 'vocals', label: 'С вокалом', icon: <Mic className="w-3.5 h-3.5" />, gradient: 'from-generate to-generate/80' },
  { id: 'instrumental', label: 'Инструментал', icon: <Volume2 className="w-3.5 h-3.5" />, gradient: 'from-library to-library/80' },
  { id: 'stems', label: 'Стемы', icon: <Layers className="w-3.5 h-3.5" />, gradient: 'from-success to-success/80' },
];

export function LibraryFilterChips({ activeFilter, onFilterChange, counts }: LibraryFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 sm:mx-0 sm:px-0">
      {filterOptions.map((option, index) => {
        const isActive = activeFilter === option.id;
        const count = counts?.[option.id];

        return (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex-shrink-0",
              "text-sm font-medium touch-manipulation overflow-hidden",
              isActive 
                ? `bg-gradient-to-r ${option.gradient} text-primary-foreground shadow-lg` 
                : "bg-card/80 text-muted-foreground hover:text-foreground border border-border/50 hover:border-border"
            )}
            onClick={() => onFilterChange(option.id)}
          >
            {/* Background glow for active */}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -z-10"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              />
            )}
            
            <motion.span 
              className={cn(
                "transition-colors",
                isActive && "text-primary-foreground"
              )}
              animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              {option.icon}
            </motion.span>
            <span>{option.label}</span>
            
            <AnimatePresence>
              {count !== undefined && count > 0 && (
                <motion.span 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full tabular-nums font-bold min-w-[20px] text-center",
                    isActive 
                      ? "bg-white/25 text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count > 99 ? '99+' : count}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
