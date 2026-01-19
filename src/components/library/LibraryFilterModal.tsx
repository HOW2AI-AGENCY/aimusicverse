/**
 * LibraryFilterModal - Responsive filter modal for Library page
 * Uses ResponsiveModal (MobileBottomSheet on mobile, Dialog on desktop)
 */

import { useState } from 'react';
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Music2, Mic, Volume2, Layers, Clock, TrendingUp, Heart, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

type FilterOption = 'all' | 'vocals' | 'instrumental' | 'stems';
type SortOption = 'recent' | 'popular' | 'liked';
type StatusFilter = 'all' | 'completed' | 'failed';

interface LibraryFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

const FILTERS: { id: FilterOption; label: string; icon: typeof Music2 }[] = [
  { id: 'all', label: 'Все треки', icon: Music2 },
  { id: 'vocals', label: 'С вокалом', icon: Mic },
  { id: 'instrumental', label: 'Инструментальные', icon: Volume2 },
  { id: 'stems', label: 'Со стемами', icon: Layers },
];

const SORTS: { id: SortOption; label: string; icon: typeof Clock }[] = [
  { id: 'recent', label: 'Новые', icon: Clock },
  { id: 'popular', label: 'Популярные', icon: TrendingUp },
  { id: 'liked', label: 'Любимые', icon: Heart },
];

const STATUS_OPTIONS: { id: StatusFilter; label: string; icon: typeof CheckCircle2 }[] = [
  { id: 'all', label: 'Все статусы', icon: Music2 },
  { id: 'completed', label: 'Готовые', icon: CheckCircle2 },
  { id: 'failed', label: 'С ошибками', icon: AlertCircle },
];

export function LibraryFilterModal({
  open,
  onOpenChange,
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  statusFilter = 'all',
  onStatusFilterChange,
  counts,
  failedCount,
}: LibraryFilterModalProps) {
  const { hapticFeedback } = useTelegram();
  const [localFilter, setLocalFilter] = useState(activeFilter);
  const [localSort, setLocalSort] = useState(sortBy);
  const [localStatus, setLocalStatus] = useState(statusFilter);

  const handleApply = () => {
    hapticFeedback('light');
    onFilterChange(localFilter);
    onSortChange(localSort);
    onStatusFilterChange?.(localStatus);
    onOpenChange(false);
  };

  const handleReset = () => {
    hapticFeedback('light');
    setLocalFilter('all');
    setLocalSort('recent');
    setLocalStatus('all');
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0.6, 0.9]}
      defaultSnapPoint={0}
      showHandle={true}
    >
      <ResponsiveModalContent className="sm:max-w-md">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Фильтры и сортировка</ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="space-y-6 p-4 sm:p-0">
          {/* Filter Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Тип трека</Label>
            <RadioGroup
              value={localFilter}
              onValueChange={(value) => setLocalFilter(value as FilterOption)}
              className="space-y-2"
            >
              {FILTERS.map((filter) => {
                const Icon = filter.icon;
                const count = counts?.[filter.id];
                
                return (
                  <div
                    key={filter.id}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border-2 p-3 cursor-pointer transition-colors min-h-[56px]",
                      localFilter === filter.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setLocalFilter(filter.id)}
                  >
                    <RadioGroupItem value={filter.id} id={filter.id} className="flex-shrink-0" />
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      localFilter === filter.id ? "text-primary" : "text-muted-foreground"
                    )} />
                    <Label
                      htmlFor={filter.id}
                      className="flex-1 cursor-pointer font-medium text-sm"
                    >
                      {filter.label}
                    </Label>
                    {count !== undefined && count > 0 && (
                      <Badge variant={localFilter === filter.id ? "default" : "secondary"} className="ml-auto">
                        {count > 999 ? '999+' : count}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Sort Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Сортировка</Label>
            <RadioGroup
              value={localSort}
              onValueChange={(value) => setLocalSort(value as SortOption)}
              className="space-y-2"
            >
              {SORTS.map((sort) => {
                const Icon = sort.icon;
                
                return (
                  <div
                    key={sort.id}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border-2 p-3 cursor-pointer transition-colors min-h-[56px]",
                      localSort === sort.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setLocalSort(sort.id)}
                  >
                    <RadioGroupItem value={sort.id} id={sort.id} className="flex-shrink-0" />
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      localSort === sort.id ? "text-primary" : "text-muted-foreground"
                    )} />
                    <Label
                      htmlFor={sort.id}
                      className="flex-1 cursor-pointer font-medium text-sm"
                    >
                      {sort.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Status Section */}
          {onStatusFilterChange && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Статус</Label>
              <RadioGroup
                value={localStatus}
                onValueChange={(value) => setLocalStatus(value as StatusFilter)}
                className="space-y-2"
              >
                {STATUS_OPTIONS.map((status) => {
                  const Icon = status.icon;
                  const count = status.id === 'failed' ? failedCount : undefined;
                  
                  return (
                    <div
                      key={status.id}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg border-2 p-3 cursor-pointer transition-colors min-h-[56px]",
                        localStatus === status.id
                          ? status.id === 'failed' 
                            ? "border-destructive bg-destructive/10"
                            : "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setLocalStatus(status.id)}
                    >
                      <RadioGroupItem value={status.id} id={`status-${status.id}`} className="flex-shrink-0" />
                      <Icon className={cn(
                        "w-5 h-5 flex-shrink-0",
                        localStatus === status.id 
                          ? status.id === 'failed' ? "text-destructive" : "text-primary" 
                          : "text-muted-foreground"
                      )} />
                      <Label
                        htmlFor={`status-${status.id}`}
                        className="flex-1 cursor-pointer font-medium text-sm"
                      >
                        {status.label}
                      </Label>
                      {count !== undefined && count > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {count > 999 ? '999+' : count}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex-1 min-h-[44px]"
            >
              Сбросить
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              className="flex-1 min-h-[48px]"
            >
              Применить
            </Button>
          </div>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
