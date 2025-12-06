import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Music2, Mic, Volume2, Layers } from 'lucide-react';

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

const filterOptions: { id: FilterOption; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Все', icon: <Music2 className="w-3.5 h-3.5" /> },
  { id: 'vocals', label: 'С вокалом', icon: <Mic className="w-3.5 h-3.5" /> },
  { id: 'instrumental', label: 'Инструментал', icon: <Volume2 className="w-3.5 h-3.5" /> },
  { id: 'stems', label: 'Со стемами', icon: <Layers className="w-3.5 h-3.5" /> },
];

export function LibraryFilterChips({ activeFilter, onFilterChange, counts }: LibraryFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 sm:mx-0 sm:px-0">
      {filterOptions.map((option) => {
        const isActive = activeFilter === option.id;
        const count = counts?.[option.id];

        return (
          <Button
            key={option.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={cn(
              "gap-1.5 rounded-full whitespace-nowrap transition-all flex-shrink-0 h-9",
              isActive && "bg-primary shadow-md shadow-primary/20",
              !isActive && "bg-transparent hover:bg-muted"
            )}
            onClick={() => onFilterChange(option.id)}
          >
            {option.icon}
            <span>{option.label}</span>
            {count !== undefined && count > 0 && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                isActive ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
