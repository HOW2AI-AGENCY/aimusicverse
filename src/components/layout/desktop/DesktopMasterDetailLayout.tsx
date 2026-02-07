/**
 * DesktopMasterDetailLayout
 * 
 * Master-detail layout for list+preview pages like Projects, Playlists, Artists.
 * Shows list on left, detail panel on right. Collapses to single view on mobile.
 */

import { memo, ReactNode, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { LAYOUT_RATIOS, MAX_WIDTHS } from '@/lib/breakpoints';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';

interface DesktopMasterDetailLayoutProps {
  /** Header section (full width) */
  header?: ReactNode;
  /** Master list content */
  masterContent: ReactNode;
  /** Detail panel content (shown when item selected) */
  detailContent?: ReactNode;
  /** Whether an item is selected (controls detail panel visibility) */
  hasSelection?: boolean;
  /** Callback when detail panel close is requested */
  onCloseDetail?: () => void;
  /** Layout ratio preset */
  ratio?: keyof typeof LAYOUT_RATIOS;
  /** Max width preset */
  maxWidth?: keyof typeof MAX_WIDTHS;
  /** Empty state for detail panel when nothing selected */
  emptyDetailState?: ReactNode;
  /** Custom className */
  className?: string;
  /** Detail panel title for mobile header */
  detailTitle?: string;
}

export const DesktopMasterDetailLayout = memo(function DesktopMasterDetailLayout({
  header,
  masterContent,
  detailContent,
  hasSelection = false,
  onCloseDetail,
  ratio = 'default',
  maxWidth = 'full',
  emptyDetailState,
  className,
  detailTitle,
}: DesktopMasterDetailLayoutProps) {
  const isMobile = useIsMobile();
  const layoutRatio = LAYOUT_RATIOS[ratio];

  // On mobile, show detail as overlay when selected
  if (isMobile) {
    return (
      <div className={cn('w-full min-h-screen', className)}>
        {/* Header */}
        {header && (
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
            {header}
          </div>
        )}

        {/* Master list */}
        <div className="px-3 py-3">
          {masterContent}
        </div>

        {/* Mobile detail overlay */}
        <AnimatePresence>
          {hasSelection && detailContent && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 bg-background"
            >
              {/* Mobile detail header */}
              <div className="sticky top-0 z-10 flex items-center gap-3 px-3 py-3 border-b bg-background/95 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCloseDetail}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                {detailTitle && (
                  <h2 className="text-lg font-semibold truncate">{detailTitle}</h2>
                )}
              </div>
              
              {/* Detail content */}
              <div className="overflow-auto" style={{ height: 'calc(100vh - 56px)' }}>
                {detailContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop: side-by-side layout
  return (
    <div className={cn(
      'w-full mx-auto',
      MAX_WIDTHS[maxWidth],
      className
    )}>
      {/* Header */}
      {header && (
        <div className="px-4 lg:px-6 py-4 border-b">
          {header}
        </div>
      )}

      {/* Master-Detail container */}
      <div className="flex min-h-[calc(100vh-120px)]">
        {/* Master list */}
        <div className={cn(
          'border-r overflow-auto',
          layoutRatio.master
        )}>
          <div className="p-4 lg:p-6">
            {masterContent}
          </div>
        </div>

        {/* Detail panel */}
        <div className={cn(
          'overflow-auto bg-muted/30',
          layoutRatio.detail
        )}>
          {hasSelection && detailContent ? (
            <div className="p-4 lg:p-6 relative">
              {/* Close button */}
              {onCloseDetail && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCloseDetail}
                  className="absolute top-4 right-4 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              {detailContent}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              {emptyDetailState || (
                <p className="text-muted-foreground text-center">
                  Выберите элемент для просмотра
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default DesktopMasterDetailLayout;
