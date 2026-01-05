/**
 * CollapsibleSection - раскрывающаяся секция для действий с треком
 * Мобильно-оптимизированный дизайн с 44px touch targets
 */

import { memo, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

export interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  className?: string;
}

export const CollapsibleSection = memo(function CollapsibleSection({
  title,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  children,
  defaultOpen = false,
  badge,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => {
    hapticImpact('light');
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn("rounded-xl overflow-hidden", className)}>
      {/* Header - 44px minimum touch target */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "w-full flex items-center gap-3 p-3 min-h-[44px]",
          "bg-muted/50 hover:bg-muted/80 active:bg-muted",
          "transition-colors duration-200",
          "touch-manipulation"
        )}
      >
        {/* Icon container */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          iconBgColor
        )}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>

        {/* Title */}
        <span className="flex-1 text-sm font-medium text-left">{title}</span>

        {/* Badge */}
        {badge && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
            {badge}
          </span>
        )}

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-2 pt-1 space-y-0.5 bg-background/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
