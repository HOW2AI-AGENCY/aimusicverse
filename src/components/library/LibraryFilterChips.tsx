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
  { id: 'all', label: 'Все', icon: <Music2 className="w-3 h-3" />, gradient: 'from-primary to-primary/80' },
  { id: 'vocals', label: 'Вокал', icon: <Mic className="w-3 h-3" />, gradient: 'from-generate to-generate/80' },
  { id: 'instrumental', label: 'Инстр', icon: <Volume2 className="w-3 h-3" />, gradient: 'from-library to-library/80' },
  { id: 'stems', label: 'Стемы', icon: <Layers className="w-3 h-3" />, gradient: 'from-success to-success/80' },
];

export function LibraryFilterChips({ activeFilter, onFilterChange, counts }: LibraryFilterChipsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 sm:mx-0 sm:px-0">
      {filterOptions.map((option, index) => {
        const isActive = activeFilter === option.id;
        const count = counts?.[option.id];

        return (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative flex items-center gap-1 px-2.5 py-1.5 rounded-md whitespace-nowrap transition-all flex-shrink-0",
              "text-[11px] font-medium touch-manipulation min-h-[32px]",
              isActive 
                ? `bg-gradient-to-r ${option.gradient} text-primary-foreground shadow-sm` 
                : "bg-card/80 text-muted-foreground hover:text-foreground border border-border/50"
            )}
            onClick={() => onFilterChange(option.id)}
          >
            <span className={cn("transition-colors", isActive && "text-primary-foreground")}>
              {option.icon}
            </span>
            <span>{option.label}</span>
            
            <AnimatePresence>
              {count !== undefined && count > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={cn(
                    "text-[9px] px-1 rounded-full tabular-nums font-semibold min-w-[16px] text-center",
                    isActive ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground"
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
