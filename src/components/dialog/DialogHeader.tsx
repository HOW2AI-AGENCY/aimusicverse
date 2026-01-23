/**
 * DialogHeader - Unified header for all dialogs and sheets
 * Close button always on the RIGHT, consistent 44px touch targets
 */

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogHeaderProps {
  title: ReactNode;
  subtitle?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
  titleClassName?: string;
  /** Optional icon or element before title */
  icon?: ReactNode;
  /** Center the title */
  centered?: boolean;
}

export function DialogHeader({
  title,
  subtitle,
  onClose,
  showCloseButton = true,
  className,
  titleClassName,
  icon,
  centered = false,
}: DialogHeaderProps) {
  return (
    <div 
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0",
        centered && "justify-center",
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="shrink-0">{icon}</div>
      )}
      
      {/* Title & Subtitle */}
      <div className={cn("flex-1 min-w-0", centered && "text-center")}>
        <h2 className={cn(
          "text-base font-semibold leading-tight truncate",
          titleClassName
        )}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Close button - ALWAYS on the right, 44x44 touch target */}
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className={cn(
            "shrink-0 flex items-center justify-center",
            "w-11 h-11 min-w-[44px] min-h-[44px]",
            "rounded-full hover:bg-accent active:bg-accent/80",
            "transition-colors touch-manipulation",
            "-mr-2" // Compensate for visual alignment
          )}
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default DialogHeader;
