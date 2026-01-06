/**
 * UnifiedListRow - Universal List Row Component
 * 
 * Variants:
 * - default: Standard row with cover, title, actions
 * - compact: Compact version for queues
 * - draggable: With drag-and-drop support
 */

import React, { memo } from 'react';
import { LucideIcon, GripVertical, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { touchTarget } from '@/lib/touch-target';
import { useIsMobile } from '@/hooks/use-mobile';

export interface RowBadge {
  id: string;
  label: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  icon?: LucideIcon;
}

export interface RowAction {
  id: string;
  icon: LucideIcon;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  variant?: 'ghost' | 'outline' | 'destructive';
  label?: string;
  hideOnMobile?: boolean;
}

export interface RowStatus {
  icon: LucideIcon;
  color: string;
  label?: string;
  pulse?: boolean;
}

export interface UnifiedListRowProps {
  variant?: 'default' | 'compact' | 'draggable';
  cover?: string | null;
  coverFallbackIcon?: LucideIcon;
  title: string;
  subtitle?: string;
  badges?: RowBadge[];
  actions?: RowAction[];
  status?: RowStatus;
  position?: number;
  isActive?: boolean;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const UnifiedListRow = memo(function UnifiedListRow({
  variant = 'default',
  cover,
  coverFallbackIcon: CoverFallbackIcon = Music,
  title,
  subtitle,
  badges = [],
  actions = [],
  status,
  position,
  isActive = false,
  isDragging = false,
  dragHandleProps,
  onClick,
  onDoubleClick,
  className,
  children,
}: UnifiedListRowProps) {
  const isMobile = useIsMobile();
  const isCompact = variant === 'compact';
  const isDraggable = variant === 'draggable';

  const coverSize = isCompact ? 'w-10 h-10' : isMobile ? 'w-12 h-12' : 'w-11 h-11';
  const StatusIcon = status?.icon;

  return (
    <motion.div
      layout
      initial={false}
      animate={{ 
        scale: isDragging ? 1.02 : 1,
        opacity: isDragging ? 0.9 : 1,
        boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.15)' : 'none'
      }}
      className={cn(
        'group flex items-center gap-2 rounded-lg transition-colors',
        isCompact ? 'p-1.5' : isMobile ? 'p-2' : 'p-2.5',
        isActive && 'bg-primary/10 ring-1 ring-primary/20',
        !isActive && 'hover:bg-muted/50',
        isDragging && 'bg-background z-50',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Drag handle */}
      {isDraggable && dragHandleProps && (
        <div
          {...dragHandleProps}
          className={cn(
            'touch-manipulation cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground',
            isMobile ? 'p-1.5' : 'p-0.5'
          )}
        >
          <GripVertical className={cn(isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5')} />
        </div>
      )}

      {/* Position number */}
      {typeof position === 'number' && (
        <span className={cn(
          'font-mono text-muted-foreground/60 shrink-0',
          isCompact ? 'text-[10px] w-4' : 'text-xs w-5'
        )}>
          {position}
        </span>
      )}

      {/* Cover image */}
      <div className={cn(
        'relative shrink-0 rounded-md overflow-hidden bg-muted',
        coverSize
      )}>
        {cover ? (
          <img
            src={cover}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CoverFallbackIcon className="w-1/2 h-1/2 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Status indicator overlay */}
        {status && StatusIcon && (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center bg-black/40',
            status.pulse && 'animate-pulse'
          )}>
            <StatusIcon className={cn('w-4 h-4', status.color)} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className={cn(
            'font-medium truncate',
            isCompact ? 'text-xs' : 'text-sm'
          )}>
            {title}
          </h4>
          
          {/* Badges */}
          {badges.length > 0 && !isCompact && (
            <div className="flex items-center gap-1 shrink-0">
              {badges.slice(0, isMobile ? 1 : 2).map(badge => {
                const BadgeIcon = badge.icon;
                return (
                  <Badge
                    key={badge.id}
                    variant={badge.variant || 'secondary'}
                    className="text-[9px] px-1 py-0 h-4"
                  >
                    {BadgeIcon && <BadgeIcon className="w-2.5 h-2.5 mr-0.5" />}
                    {badge.label}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
        
        {subtitle && !isCompact && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {subtitle}
          </p>
        )}

        {/* Children slot for custom content */}
        {children}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className={cn(
          'flex items-center shrink-0',
          isCompact ? 'gap-0.5' : 'gap-1'
        )}>
          {actions
            .filter(action => !(isMobile && action.hideOnMobile))
            .map(action => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={action.id}
                  size="icon"
                  variant={action.variant || 'ghost'}
                  className={cn(
                    'shrink-0',
                    isMobile ? touchTarget.icon : 'h-8 w-8'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(e);
                  }}
                  disabled={action.disabled}
                  title={action.label}
                >
                  <ActionIcon className={cn(isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5')} />
                </Button>
              );
            })}
        </div>
      )}
    </motion.div>
  );
});
