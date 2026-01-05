/**
 * MobileProjectsToolbar - Compact mobile toolbar with expandable search and FAB
 */

import { memo, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, LayoutGrid, LayoutList, Plus } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';

interface MobileProjectsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onCreateClick: () => void;
}

export const MobileProjectsToolbar = memo(function MobileProjectsToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onCreateClick,
}: MobileProjectsToolbarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { patterns } = useHaptic();

  useEffect(() => {
    if (isSearchExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleSearchToggle = () => {
    patterns.tap();
    if (isSearchExpanded && searchQuery) {
      onSearchChange('');
    }
    setIsSearchExpanded(!isSearchExpanded);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    patterns.tap();
    onViewModeChange(mode);
  };

  const handleCreateClick = () => {
    patterns.success();
    onCreateClick();
  };

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {isSearchExpanded ? (
          <motion.div
            key="search-expanded"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Поиск проектов..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-10 h-11 text-base"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                onClick={handleSearchToggle}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="toolbar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center gap-2"
          >
            {/* Search button - 44x44 touch target */}
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={handleSearchToggle}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* View mode toggle - larger touch targets */}
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className={cn(
                  "h-10 w-10 transition-all",
                  viewMode === 'grid' && "shadow-sm"
                )}
                onClick={() => handleViewModeChange('grid')}
              >
                <LayoutGrid className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className={cn(
                  "h-10 w-10 transition-all",
                  viewMode === 'list' && "shadow-sm"
                )}
                onClick={() => handleViewModeChange('list')}
              >
                <LayoutList className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Create Button - always visible */}
      {!isSearchExpanded && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            className="h-11 w-11 rounded-xl shadow-lg"
            onClick={handleCreateClick}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
});

export default MobileProjectsToolbar;
