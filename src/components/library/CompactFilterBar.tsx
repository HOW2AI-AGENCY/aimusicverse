/**
 * CompactFilterBar - Unified search + filters in one compact row
 * Optimized for mobile with horizontal scrolling filters
 */

import { memo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X, Music2, Mic, Volume2, Layers } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { LibraryFilterModal } from './LibraryFilterModal';

type FilterOption = 'all' | 'vocals' | 'instrumental' | 'stems';
type SortOption = 'recent' | 'popular' | 'liked';

interface CompactFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  counts?: {
    all: number;
    vocals: number;
    instrumental: number;
    stems: number;
  };
  className?: string;
}

const FILTERS: { id: FilterOption; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Все', icon: <Music2 className="w-3 h-3" /> },
  { id: 'vocals', label: 'Вокал', icon: <Mic className="w-3 h-3" /> },
  { id: 'instrumental', label: 'Инстр', icon: <Volume2 className="w-3 h-3" /> },
  { id: 'stems', label: 'Стемы', icon: <Layers className="w-3 h-3" /> },
];

const SORTS: { id: SortOption; label: string }[] = [
  { id: 'recent', label: 'Новые' },
  { id: 'popular', label: 'Популярные' },
  { id: 'liked', label: 'Любимые' },
];

export const CompactFilterBar = memo(function CompactFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  counts,
  className,
}: CompactFilterBarProps) {
  const isMobile = useIsMobile();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Search + Sort Row */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "relative flex-1 transition-all duration-200",
          isSearchFocused && "flex-[2]"
        )}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="pl-8 pr-8 h-9 text-sm rounded-lg bg-card/50 min-h-[44px] md:min-h-[36px]"
            aria-label="Поиск треков"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full min-w-[28px] min-h-[28px] flex items-center justify-center"
                onClick={() => onSearchChange('')}
                aria-label="Очистить поиск"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Sort Button */}
        {isMobile ? (
          /* On mobile: Open filter modal with both filter and sort options */
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 px-2.5 text-xs min-h-[44px] min-w-[44px]"
            onClick={() => setShowFilterModal(true)}
            aria-label="Фильтры и сортировка"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="sr-only">Фильтры</span>
          </Button>
        ) : (
          /* On desktop: Keep existing dropdown behavior */
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 px-2.5 text-xs"
              onClick={() => setShowSortMenu(!showSortMenu)}
              aria-label="Сортировка"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {SORTS.find(s => s.id === sortBy)?.label}
              </span>
            </Button>

            <AnimatePresence>
              {showSortMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-lg shadow-lg p-1 min-w-[120px]"
                  >
                    {SORTS.map((sort) => (
                      <button
                        key={sort.id}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs rounded-md transition-colors",
                          sortBy === sort.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                        onClick={() => {
                          onSortChange(sort.id);
                          setShowSortMenu(false);
                        }}
                      >
                        {sort.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Filter Chips - Horizontal Scroll with improved touch targets */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1.5">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.id;
          const count = counts?.[filter.id];

          return (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap text-xs font-medium transition-all flex-shrink-0 min-h-[44px] md:min-h-[36px] touch-manipulation",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/50"
              )}
              onClick={() => onFilterChange(filter.id)}
              aria-label={`Фильтр: ${filter.label}`}
              aria-pressed={isActive}
            >
              {filter.icon}
              <span>{filter.label}</span>
              {count !== undefined && count > 0 && (
                <span className={cn(
                  "text-[10px] px-1 rounded-full min-w-[16px] text-center tabular-nums",
                  isActive ? "bg-white/20" : "bg-muted"
                )}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Filter Modal for Mobile */}
      <LibraryFilterModal
        open={showFilterModal}
        onOpenChange={setShowFilterModal}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        counts={counts}
      />
    </div>
  );
});
