import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IconGridButtonProps {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  color?: 'pink' | 'purple' | 'green' | 'amber' | 'blue' | 'cyan' | 'orange' | 'red' | 'emerald' | 'sky' | 'muted';
  badge?: string | number;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  className?: string;
}

const colorStyles = {
  pink: {
    bg: 'bg-pink-500/10',
    hoverBg: 'hover:bg-pink-500/20',
    text: 'text-pink-500',
  },
  purple: {
    bg: 'bg-purple-500/10',
    hoverBg: 'hover:bg-purple-500/20',
    text: 'text-purple-500',
  },
  green: {
    bg: 'bg-green-500/10',
    hoverBg: 'hover:bg-green-500/20',
    text: 'text-green-500',
  },
  amber: {
    bg: 'bg-amber-500/10',
    hoverBg: 'hover:bg-amber-500/20',
    text: 'text-amber-500',
  },
  blue: {
    bg: 'bg-blue-500/10',
    hoverBg: 'hover:bg-blue-500/20',
    text: 'text-blue-500',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    hoverBg: 'hover:bg-cyan-500/20',
    text: 'text-cyan-500',
  },
  orange: {
    bg: 'bg-orange-500/10',
    hoverBg: 'hover:bg-orange-500/20',
    text: 'text-orange-500',
  },
  red: {
    bg: 'bg-red-500/10',
    hoverBg: 'hover:bg-red-500/20',
    text: 'text-red-500',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    hoverBg: 'hover:bg-emerald-500/20',
    text: 'text-emerald-500',
  },
  sky: {
    bg: 'bg-sky-500/10',
    hoverBg: 'hover:bg-sky-500/20',
    text: 'text-sky-500',
  },
  muted: {
    bg: 'bg-muted',
    hoverBg: 'hover:bg-muted/80',
    text: 'text-foreground',
  },
};

export const IconGridButton = forwardRef<HTMLButtonElement, IconGridButtonProps>(
  ({ icon: Icon, label, sublabel, color = 'muted', badge, disabled, loading, onClick, className }, ref) => {
    const styles = colorStyles[color];

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          'flex flex-col items-center justify-center gap-1',
          'p-2 min-h-[64px] rounded-xl',
          'transition-all duration-200',
          'active:scale-95',
          styles.hoverBg,
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {/* Icon container - 40x40 for good touch target */}
        <div
          className={cn(
            'relative w-10 h-10 rounded-lg flex items-center justify-center',
            'transition-colors',
            styles.bg
          )}
        >
          {loading ? (
            <Loader2 className={cn('w-5 h-5 animate-spin', styles.text)} />
          ) : (
            <Icon className={cn('w-5 h-5', styles.text)} />
          )}
          
          {/* Badge overlay */}
          {badge !== undefined && !loading && (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none"
            >
              {badge}
            </Badge>
          )}
        </div>

        {/* Label */}
        <span className="text-[11px] font-medium text-foreground/80 text-center leading-tight max-w-full truncate px-1">
          {label}
        </span>

        {/* Sublabel (optional) */}
        {sublabel && (
          <span className="text-[9px] text-muted-foreground leading-none -mt-0.5">
            {sublabel}
          </span>
        )}
      </button>
    );
  }
);

IconGridButton.displayName = 'IconGridButton';
