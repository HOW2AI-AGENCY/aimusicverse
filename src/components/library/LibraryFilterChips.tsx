import { cn } from '@/lib/utils';
import { Music2, Mic, Volume2, Layers } from 'lucide-react';
import { motion } from '@/lib/motion';

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

const filterOptions: { id: FilterOption; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'Все', icon: <Music2 className="w-3.5 h-3.5" />, color: 'primary' },
  { id: 'vocals', label: 'С вокалом', icon: <Mic className="w-3.5 h-3.5" />, color: 'generate' },
  { id: 'instrumental', label: 'Инструментал', icon: <Volume2 className="w-3.5 h-3.5" />, color: 'library' },
  { id: 'stems', label: 'Стемы', icon: <Layers className="w-3.5 h-3.5" />, color: 'success' },
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
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0",
              "text-sm font-medium touch-manipulation active:scale-95",
              isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border/50"
            )}
            onClick={() => onFilterChange(option.id)}
          >
            <span className={cn(
              "transition-colors",
              isActive && "text-primary-foreground"
            )}>
              {option.icon}
            </span>
            <span>{option.label}</span>
            {count !== undefined && count > 0 && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full tabular-nums font-semibold",
                isActive 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
                  : "bg-background/80 text-muted-foreground"
              )}>
                {count}
              </span>
            )}
            
            {/* Active indicator dot */}
            {isActive && (
              <motion.div
                layoutId="activeFilterIndicator"
                className="absolute inset-0 bg-primary rounded-full -z-10"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
