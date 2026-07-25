/**
 * CompactFilterBar - Unified search + filters in one compact row
 * Optimized for mobile with horizontal scrolling filters
 */

import { memo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ArrowUpDown, X, Music2, Mic, Volume2, Layers, CheckCircle2, AlertCircle } from "@/lib/icons";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { surface } from "@/lib/overlay-colors";

type FilterOption = "all" | "vocals" | "instrumental" | "stems";
type SortOption = "recent" | "popular" | "liked";
export type StatusFilter = "all" | "completed" | "failed";

interface CompactFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  statusFilter?: StatusFilter;
  onStatusFilterChange?: (status: StatusFilter) => void;
  counts?: {
    all: number;
    vocals: number;
    instrumental: number;
    stems: number;
  };
  failedCount?: number;
  className?: string;
}

const FILTERS: { id: FilterOption; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "Все", icon: <Music2 className="w-3 h-3" /> },
  { id: "vocals", label: "Вокал", icon: <Mic className="w-3 h-3" /> },
  { id: "instrumental", label: "Инстр", icon: <Volume2 className="w-3 h-3" /> },
  { id: "stems", label: "Стемы", icon: <Layers className="w-3 h-3" /> },
];

const SORTS: { id: SortOption; label: string }[] = [
  { id: "recent", label: "Новые" },
  { id: "popular", label: "Популярные" },
  { id: "liked", label: "Любимые" },
];

const STATUS_FILTERS: { id: StatusFilter; label: string; icon: React.ReactNode }[] = [
  { id: "completed", label: "Готовые", icon: <CheckCircle2 className="w-3 h-3" /> },
  { id: "failed", label: "С ошибками", icon: <AlertCircle className="w-3 h-3" /> },
];

export const CompactFilterBar = memo(function CompactFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  statusFilter = "all",
  onStatusFilterChange,
  counts,
  failedCount,
  className,
}: CompactFilterBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Search + Sort Row */}
      <div className="flex items-center gap-2">
        <div className={cn("relative flex-1 transition-all duration-200", isSearchFocused && "flex-[2]")}>
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
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={() => onSearchChange("")}
                aria-label="Очистить поиск"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Sort Menu — uses shadcn DropdownMenu for proper ARIA (role=menu/menuitem, roving tabindex, ESC) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 px-2.5 text-xs min-h-[44px] min-w-[44px]"
              aria-label={`Сортировка: ${SORTS.find((s) => s.id === sortBy)?.label || ""}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{SORTS.find((s) => s.id === sortBy)?.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {SORTS.map((sort) => (
              <DropdownMenuItem
                key={sort.id}
                onSelect={() => onSortChange(sort.id)}
                className={cn(
                  "min-h-[44px] cursor-pointer",
                  sortBy === sort.id && "bg-primary text-primary-foreground focus:bg-primary/90",
                )}
              >
                {sort.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filter Chips - Horizontal Scroll, unified pill style */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1.5">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.id;
          const count = counts?.[filter.id];

          return (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.95 }}
              className={cn("pill-chip flex-shrink-0 touch-manipulation min-h-[44px] md:min-h-[36px]")}
              data-active={isActive}
              onClick={() => onFilterChange(filter.id)}
              aria-label={`Фильтр: ${filter.label}`}
              aria-pressed={isActive}
            >
              {filter.icon}
              <span>{filter.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    "text-[0.625rem] px-1.5 py-0.5 rounded-full min-w-[18px] text-center tabular-nums",
                    isActive ? "bg-primary/25 text-foreground" : "bg-foreground/10 text-muted-foreground",
                  )}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </motion.button>
          );
        })}

        {/* Status Filter Chips */}
        {onStatusFilterChange &&
          STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.id;
            const count = filter.id === "failed" ? failedCount : undefined;
            const isFailed = filter.id === "failed";

            return (
              <motion.button
                key={filter.id}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "pill-chip flex-shrink-0 touch-manipulation min-h-[44px] md:min-h-[36px]",
                  isActive && isFailed && "!bg-destructive/15 !text-destructive !border-destructive/40",
                  isActive && !isFailed && "!bg-emerald-500/15 !text-emerald-400 !border-emerald-500/40",
                )}
                data-active={isActive}
                onClick={() => onStatusFilterChange(isActive ? "all" : filter.id)}
                aria-label={`Фильтр: ${filter.label}`}
                aria-pressed={isActive}
              >
                {filter.icon}
                <span>{filter.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={cn(
                      "text-[0.625rem] px-1.5 py-0.5 rounded-full min-w-[18px] text-center tabular-nums",
                      isActive ? "bg-destructive/25 text-destructive" : "bg-destructive/15 text-destructive",
                    )}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </motion.button>
            );
          })}
      </div>
    </div>
  );
});
