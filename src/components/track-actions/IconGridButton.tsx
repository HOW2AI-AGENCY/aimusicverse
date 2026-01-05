/**
 * IconGridButton - Ultra compact icon button for action grids
 * 56px height, no sublabel, minimalist design
 * Includes haptic feedback support
 */

import { forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Loader2 } from 'lucide-react';
import { hapticImpact } from '@/lib/haptic';

interface IconGridButtonProps {
  icon: LucideIcon;
  label: string;
  color?: 'pink' | 'purple' | 'green' | 'amber' | 'blue' | 'cyan' | 'orange' | 'red' | 'emerald' | 'sky' | 'muted';
  badge?: string | number;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  className?: string;
  /** Enable haptic feedback on click (default: true) */
  haptic?: boolean;
}

const colorStyles = {
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  green: { bg: 'bg-green-500/10', text: 'text-green-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
  red: { bg: 'bg-red-500/10', text: 'text-red-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-500' },
  muted: { bg: 'bg-muted', text: 'text-foreground' },
};

export const IconGridButton = forwardRef<HTMLButtonElement, IconGridButtonProps>(
  ({ icon: Icon, label, color = 'muted', badge, disabled, loading, onClick, className, haptic = true }, ref) => {
    const styles = colorStyles[color];

    const handleClick = useCallback(() => {
      if (haptic) {
        hapticImpact('light');
      }
      onClick();
    }, [haptic, onClick]);

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5',
          'p-1.5 min-h-[56px] rounded-xl',
          'transition-all active:scale-95',
          'touch-manipulation',
          'hover:bg-muted/50',
          disabled && 'opacity-40 pointer-events-none',
          className
        )}
      >
        {/* Icon container - 36x36 */}
        <div
          className={cn(
            'relative w-9 h-9 rounded-lg flex items-center justify-center',
            styles.bg
          )}
        >
          {loading ? (
            <Loader2 className={cn('w-4 h-4 animate-spin', styles.text)} />
          ) : (
            <Icon className={cn('w-4 h-4', styles.text)} />
          )}
          
          {/* Badge overlay */}
          {badge !== undefined && !loading && (
            <span className="absolute -top-1 -right-1 h-3.5 min-w-3.5 px-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center leading-none">
              {badge}
            </span>
          )}
        </div>

        {/* Label */}
        <span className="text-[10px] font-medium text-foreground/70 text-center leading-tight truncate max-w-full px-0.5">
          {label}
        </span>
      </button>
    );
  }
);

IconGridButton.displayName = 'IconGridButton';
