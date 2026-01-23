/**
 * AIResultCard - Enhanced result cards with color coding
 * Used for displaying AI-generated content with actions
 */

import { memo, ReactNode } from 'react';
import { motion } from '@/lib/motion';
import { 
  CheckCircle2, Copy, Download, ArrowRight,
  Sparkles, AlertTriangle, Info, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';

type ResultType = 'success' | 'warning' | 'info' | 'suggestion';

interface AIResultCardProps {
  type?: ResultType;
  title?: string;
  children: ReactNode;
  actions?: Array<{
    label: string;
    icon?: typeof Copy;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  }>;
  score?: number; // 0-100
  className?: string;
  copyable?: boolean;
  copyText?: string;
}

const TYPE_STYLES: Record<ResultType, { 
  bg: string; 
  border: string; 
  icon: typeof CheckCircle2;
  iconColor: string;
}> = {
  success: {
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
  },
  warning: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  info: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    icon: Info,
    iconColor: 'text-blue-400',
  },
  suggestion: {
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/20',
    icon: Lightbulb,
    iconColor: 'text-purple-400',
  },
};

export const AIResultCard = memo(function AIResultCard({
  type = 'info',
  title,
  children,
  actions,
  score,
  className,
  copyable = false,
  copyText,
}: AIResultCardProps) {
  const styles = TYPE_STYLES[type];
  const Icon = styles.icon;

  const handleCopy = async () => {
    if (!copyText) return;
    
    try {
      await navigator.clipboard.writeText(copyText);
      hapticImpact('light');
      toast.success('Скопировано');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-400';
    if (s >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl p-3 border",
        styles.bg,
        styles.border,
        className
      )}
    >
      {/* Header */}
      {(title || score !== undefined) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={cn("w-4 h-4", styles.iconColor)} />
            {title && <span className="text-sm font-medium">{title}</span>}
          </div>
          
          {score !== undefined && (
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-muted-foreground" />
              <span className={cn("text-sm font-bold tabular-nums", getScoreColor(score))}>
                {score}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="text-sm text-foreground/80">
        {children}
      </div>

      {/* Actions */}
      {(actions?.length || copyable) && (
        <div className="flex gap-2 mt-3 pt-2 border-t border-border/30">
          {copyable && copyText && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCopy}
            >
              <Copy className="w-3 h-3 mr-1" />
              Копировать
            </Button>
          )}
          
          {actions?.map((action, i) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={i}
                variant={action.variant === 'primary' ? 'default' : action.variant === 'ghost' ? 'ghost' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  hapticImpact('light');
                  action.onClick();
                }}
              >
                {ActionIcon && <ActionIcon className="w-3 h-3 mr-1" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
});

export default AIResultCard;
