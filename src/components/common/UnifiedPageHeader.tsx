/**
 * UnifiedPageHeader - Universal Page Header Component
 * 
 * Variants:
 * - sticky: Sticky header with blur backdrop
 * - floating: Transparent floating over content
 * - transparent: No background, integrates with hero
 */

import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { touchTarget } from '@/lib/touch-target';
import { useTelegram } from '@/contexts/TelegramContext';
import { useIsMobile } from '@/hooks/use-mobile';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

export interface UnifiedPageHeaderProps {
  variant?: 'sticky' | 'floating' | 'transparent';
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  backHref?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  withSafeArea?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const UnifiedPageHeader = memo(function UnifiedPageHeader({
  variant = 'sticky',
  title,
  subtitle,
  showBackButton = true,
  onBack,
  backHref,
  leftAction,
  rightAction,
  breadcrumbs,
  withSafeArea = true,
  className,
  children,
}: UnifiedPageHeaderProps) {
  const navigate = useNavigate();
  const { webApp, isInitialized } = useTelegram();
  const isMobile = useIsMobile();
  const isTelegramAvailable = isInitialized && !!webApp;

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      navigate(backHref);
    } else {
      navigate(-1);
    }
  }, [onBack, backHref, navigate]);

  // Use Telegram BackButton when available
  React.useEffect(() => {
    if (isTelegramAvailable && showBackButton && webApp) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBack);
      
      return () => {
        webApp.BackButton.hide();
        webApp.BackButton.offClick(handleBack);
      };
    }
  }, [isTelegramAvailable, showBackButton, webApp, handleBack]);

  const safeAreaPadding = withSafeArea
    ? 'calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 0.5rem)'
    : '0.5rem';

  const variantClasses = {
    sticky: 'sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50',
    floating: 'absolute top-0 left-0 right-0 z-40',
    transparent: 'relative z-10',
  };

  const showNativeBackButton = showBackButton && !isTelegramAvailable;

  return (
    <header
      className={cn(
        'w-full',
        variantClasses[variant],
        className
      )}
      style={{ paddingTop: withSafeArea ? safeAreaPadding : undefined }}
    >
      <div className={cn(
        'flex items-center justify-between',
        isMobile ? 'px-3 py-2' : 'px-4 py-3'
      )}>
        {/* Left side */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showNativeBackButton && (
            <Button
              size="icon"
              variant={variant === 'floating' ? 'secondary' : 'ghost'}
              className={cn(
                touchTarget.icon,
                variant === 'floating' && 'bg-background/60 backdrop-blur-sm'
              )}
              onClick={handleBack}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          {leftAction}

          {/* Title section */}
          {(title || subtitle || breadcrumbs) && (
            <div className="min-w-0 flex-1">
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                  {breadcrumbs.map((item, index) => {
                    const BreadcrumbIcon = item.icon;
                    return (
                      <React.Fragment key={index}>
                        {index > 0 && <span>/</span>}
                        {item.href ? (
                          <button
                            onClick={() => navigate(item.href!)}
                            className="hover:text-foreground transition-colors"
                          >
                            {BreadcrumbIcon && <BreadcrumbIcon className="w-3 h-3 inline mr-0.5" />}
                            {item.label}
                          </button>
                        ) : (
                          <span className="text-foreground truncate">
                            {BreadcrumbIcon && <BreadcrumbIcon className="w-3 h-3 inline mr-0.5" />}
                            {item.label}
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </nav>
              )}

              {title && (
                <h1 className={cn(
                  'font-semibold truncate',
                  variant === 'floating' && 'text-white drop-shadow-md',
                  isMobile ? 'text-base' : 'text-lg'
                )}>
                  {title}
                </h1>
              )}
              
              {subtitle && (
                <p className={cn(
                  'text-xs truncate',
                  variant === 'floating' ? 'text-white/80' : 'text-muted-foreground'
                )}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 shrink-0">
          {rightAction}
        </div>
      </div>

      {/* Children slot for additional content like tabs */}
      {children}
    </header>
  );
});
