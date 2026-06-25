/**
 * DesktopContentHubLayout - Desktop master-detail layout for Projects/Lyrics
 * Shows list on left, preview on right
 */

import { memo, useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LAYOUT_RATIOS, MAX_WIDTHS } from "@/lib/breakpoints";
import { Button } from "@/components/ui/button";
import { X, FolderOpen } from "lucide-react";

interface DesktopContentHubLayoutProps {
  /** Main content (tabs with lists) */
  children: ReactNode;
  /** Detail panel content */
  detailContent?: ReactNode;
  /** Whether detail panel is visible */
  hasSelection?: boolean;
  /** Close detail panel callback */
  onCloseDetail?: () => void;
  /** Title for detail panel */
  detailTitle?: string;
  /** Custom className */
  className?: string;
}

export const DesktopContentHubLayout = memo(function DesktopContentHubLayout({
  children,
  detailContent,
  hasSelection = false,
  onCloseDetail,
  detailTitle,
  className,
}: DesktopContentHubLayoutProps) {
  const layoutRatio = LAYOUT_RATIOS.default;

  return (
    <div className={cn("w-full mx-auto", MAX_WIDTHS.full, className)}>
      {/* Master-Detail container */}
      <div className="flex min-h-[calc(100vh-180px)]">
        {/* Master list */}
        <div className={cn("overflow-auto transition-all duration-300", hasSelection ? layoutRatio.master : "w-full")}>
          <div className="py-4">{children}</div>
        </div>

        {/* Detail panel */}
        {hasSelection && detailContent && (
          <div className={cn("border-l bg-muted/30 overflow-auto transition-all duration-300", "lg:block lg:w-[40%]")}>
            <div className="p-4 lg:p-6 relative">
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-4">
                {detailTitle && <h3 className="font-semibold text-lg">{detailTitle}</h3>}
                {onCloseDetail && (
                  <Button variant="ghost" size="icon" onClick={onCloseDetail} className="h-8 w-8 ml-auto">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {detailContent}
            </div>
          </div>
        )}

        {/* Empty state when nothing selected */}
        {!hasSelection && (
          <div className="hidden lg:flex lg:w-[40%] border-l bg-muted/30 items-center justify-center">
            <div className="text-center p-6">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">Выберите проект для просмотра</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default DesktopContentHubLayout;
