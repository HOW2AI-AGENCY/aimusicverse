import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProBadgeVariant = 'default' | 'premium' | 'elite';

interface ProBadgeProps {
  variant?: ProBadgeVariant;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantConfig = {
  default: {
    gradient: 'from-primary via-purple-500 to-pink-500',
    icon: Sparkles,
    text: 'PRO',
  },
  premium: {
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    icon: Zap,
    text: 'PREMIUM',
  },
  elite: {
    gradient: 'from-yellow-500 via-amber-500 to-orange-500',
    icon: Crown,
    text: 'ELITE',
  },
};

const sizeConfig = {
  sm: 'text-[9px] px-1.5 py-0 h-4',
  md: 'text-[10px] px-2 py-0.5 h-5',
  lg: 'text-xs px-2.5 py-1 h-6',
};

export function ProBadge({ 
  variant = 'default', 
  showIcon = false, 
  size = 'sm',
  className 
}: ProBadgeProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const sizeClass = sizeConfig[size];

  return (
    <Badge
      className={cn(
        'font-bold bg-gradient-to-r text-white border-0 shadow-sm',
        config.gradient,
        sizeClass,
        'flex items-center gap-1',
        className
      )}
    >
      {showIcon && <Icon className="w-2.5 h-2.5" />}
      {config.text}
    </Badge>
  );
}

export function ProFeatureIndicator({ 
  label, 
  variant = 'default',
  className 
}: { 
  label: string; 
  variant?: ProBadgeVariant;
  className?: string;
}) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
      "bg-gradient-to-r text-white shadow-sm",
      config.gradient,
      className
    )}>
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
}
