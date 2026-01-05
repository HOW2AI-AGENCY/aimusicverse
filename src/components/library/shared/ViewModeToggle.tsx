import { memo } from 'react';
import { Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/lib/mobile-utils';

interface ViewModeToggleProps {
  viewMode: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
  className?: string;
  /** Size variant */
  size?: 'sm' | 'default';
}

/**
 * ViewModeToggle - Reusable grid/list toggle button
 * 
 * Used in:
 * - Library page
 * - Community page
 * - Playlists
 */
export const ViewModeToggle = memo(function ViewModeToggle({
  viewMode,
  onChange,
  className,
  size = 'sm'
}: ViewModeToggleProps) {
  const handleToggle = () => {
    triggerHapticFeedback('light');
    onChange(viewMode === 'grid' ? 'list' : 'grid');
  };
  
  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'icon' : 'default'}
      onClick={handleToggle}
      className={cn(
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
        className
      )}
      aria-label={viewMode === 'grid' ? 'Переключить на список' : 'Переключить на сетку'}
    >
      {viewMode === 'grid' ? (
        <List className="h-4 w-4" />
      ) : (
        <Grid3x3 className="h-4 w-4" />
      )}
    </Button>
  );
});
