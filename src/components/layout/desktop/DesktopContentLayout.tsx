/**
 * DesktopContentLayout
 * 
 * Wide content layout with optional sidebar for filters/navigation.
 * Used for content-heavy pages that benefit from side filters.
 */

import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MAX_WIDTHS } from '@/lib/breakpoints';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

interface DesktopContentLayoutProps {
  /** Header section (full width) */
  header?: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Sidebar content (filters, navigation) */
  sidebar?: ReactNode;
  /** Sidebar position */
  sidebarPosition?: 'left' | 'right';
  /** Sidebar width class */
  sidebarWidth?: string;
  /** Max width preset */
  maxWidth?: keyof typeof MAX_WIDTHS;
  /** Custom className */
  className?: string;
  /** Show sidebar toggle button on mobile */
  showMobileSidebarToggle?: boolean;
  /** Mobile sidebar title */
  mobileSidebarTitle?: string;
}

export const DesktopContentLayout = memo(function DesktopContentLayout({
  header,
  children,
  sidebar,
  sidebarPosition = 'left',
  sidebarWidth = 'w-64',
  maxWidth = 'full',
  className,
  showMobileSidebarToggle = true,
  mobileSidebarTitle = 'Фильтры',
}: DesktopContentLayoutProps) {
  const isMobile = useIsMobile();

  // Mobile layout with bottom sheet for sidebar
  if (isMobile && sidebar) {
    return (
      <div className={cn('w-full min-h-screen', className)}>
        {/* Header with filter button */}
        {header && (
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex-1">{header}</div>
              {showMobileSidebarToggle && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-2">
                      <Filter className="w-4 h-4 mr-2" />
                      {mobileSidebarTitle}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[70vh]">
                    <div className="overflow-auto h-full pt-4">
                      {sidebar}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="px-3 py-3">
          {children}
        </div>
      </div>
    );
  }

  // Desktop layout with sidebar
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

      {/* Content with sidebar */}
      <div className="flex min-h-[calc(100vh-120px)]">
        {/* Left sidebar */}
        {sidebar && sidebarPosition === 'left' && (
          <aside className={cn(
            'shrink-0 border-r overflow-auto',
            sidebarWidth
          )}>
            <div className="p-4 lg:p-6 sticky top-0">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>

        {/* Right sidebar */}
        {sidebar && sidebarPosition === 'right' && (
          <aside className={cn(
            'shrink-0 border-l overflow-auto bg-muted/30',
            sidebarWidth
          )}>
            <div className="p-4 lg:p-6 sticky top-0">
              {sidebar}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
});

export default DesktopContentLayout;
