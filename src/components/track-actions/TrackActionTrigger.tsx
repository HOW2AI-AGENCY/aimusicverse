/**
 * TrackActionTrigger - Smart trigger for track actions
 * 
 * Automatically shows:
 * - Sheet on mobile
 * - Dropdown menu on desktop
 * 
 * Simplifies track card implementations by encapsulating this logic.
 */

import { memo, useState, useCallback } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnifiedTrackMenu } from './UnifiedTrackMenu';
import { UnifiedTrackSheet } from './UnifiedTrackSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { cn } from '@/lib/utils';
import type { Track } from '@/types/track';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';

interface TrackActionTriggerProps {
  track: Track | PublicTrackWithCreator;
  onDelete?: () => void;
  onDownload?: () => void;
  /** Custom trigger button - if not provided, uses default MoreHorizontal button */
  children?: React.ReactNode;
  /** Variant for default button styling */
  variant?: 'default' | 'ghost' | 'overlay';
  /** Additional class for default button */
  className?: string;
  /** Size for default button */
  size?: 'sm' | 'md';
}

export const TrackActionTrigger = memo(function TrackActionTrigger({
  track,
  onDelete,
  onDownload,
  children,
  variant = 'ghost',
  className,
  size = 'md',
}: TrackActionTriggerProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleOpen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHapticFeedback('light');
    setSheetOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
  };

  const variantClasses = {
    default: 'bg-background/80 backdrop-blur-sm hover:bg-background',
    ghost: 'hover:bg-muted/50',
    overlay: 'bg-black/50 hover:bg-black/70 text-white border-0',
  };

  const defaultTrigger = (
    <Button
      size="icon"
      variant={variant === 'overlay' ? 'secondary' : 'ghost'}
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        'rounded-full transition-all',
        className
      )}
      onClick={handleOpen}
      aria-label="Меню трека"
    >
      <MoreHorizontal className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
    </Button>
  );

  // On mobile, always use sheet
  if (isMobile) {
    return (
      <>
        {children ? (
          <div onClick={handleOpen}>{children}</div>
        ) : (
          defaultTrigger
        )}
        
        <UnifiedTrackSheet
          track={track as Track}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      </>
    );
  }

  // On desktop, use dropdown menu
  return (
    <UnifiedTrackMenu
      track={track as Track}
      onDelete={onDelete}
      onDownload={onDownload}
      trigger={children || defaultTrigger}
    />
  );
});
