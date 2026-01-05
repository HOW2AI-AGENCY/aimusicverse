/**
 * ActionCategory - Styled category header for action groups
 * With icon and subtle gradient background
 */

import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ActionCategoryProps {
  icon: LucideIcon;
  title: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
  className?: string;
}

const colorClasses = {
  default: 'from-muted/50 to-transparent text-muted-foreground',
  primary: 'from-primary/10 to-transparent text-primary',
  success: 'from-green-500/10 to-transparent text-green-600',
  warning: 'from-amber-500/10 to-transparent text-amber-600',
  danger: 'from-red-500/10 to-transparent text-red-500',
  info: 'from-blue-500/10 to-transparent text-blue-500',
};

const iconColorClasses = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  success: 'text-green-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  info: 'text-blue-500',
};

export const ActionCategory = memo(function ActionCategory({
  icon: Icon,
  title,
  color = 'default',
  children,
  className,
}: ActionCategoryProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {/* Category Header */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 -mx-2 rounded-lg",
        "bg-gradient-to-r",
        colorClasses[color]
      )}>
        <Icon className={cn("w-4 h-4", iconColorClasses[color])} />
        <span className="text-xs font-medium uppercase tracking-wide">
          {title}
        </span>
      </div>
      
      {/* Actions */}
      <div className="space-y-0.5 pl-1">
        {children}
      </div>
    </div>
  );
});
