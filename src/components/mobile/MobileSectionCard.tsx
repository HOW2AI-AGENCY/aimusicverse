/**
 * MobileSectionCard - Collapsible section container
 * Used for grouping related content in mobile layouts
 */

import { memo, ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { motion, AnimatePresence } from '@/lib/motion';

interface MobileSectionCardProps {
  /** Section title */
  title: string;
  /** Title icon */
  icon?: ReactNode;
  /** Trailing badge or counter */
  badge?: ReactNode;
  /** Section content */
  children: ReactNode;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Collapsible */
  collapsible?: boolean;
  /** Additional className */
  className?: string;
  /** Title className */
  titleClassName?: string;
  /** Content className */
  contentClassName?: string;
}

export const MobileSectionCard = memo(function MobileSectionCard({
  title,
  icon,
  badge,
  children,
  defaultExpanded = true,
  collapsible = true,
  className,
  titleClassName,
  contentClassName,
}: MobileSectionCardProps) {
  const { patterns } = useHaptic();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (!collapsible) return;
    patterns.tap();
    setExpanded(!expanded);
  };

  return (
    <div className={cn(
      "rounded-xl bg-card border border-border/50 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-3 p-4 min-h-[56px]",
          collapsible && "cursor-pointer active:bg-accent/50 transition-colors touch-manipulation",
          titleClassName
        )}
      >
        {/* Icon */}
        {icon && (
          <div className="shrink-0 text-primary">
            {icon}
          </div>
        )}

        {/* Title */}
        <h3 className="flex-1 text-sm font-semibold">
          {title}
        </h3>

        {/* Badge */}
        {badge && (
          <div className="shrink-0">
            {badge}
          </div>
        )}

        {/* Expand/Collapse Icon */}
        {collapsible && (
          <div className="shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.2, ease: 'easeInOut' },
              opacity: { duration: 0.15, ease: 'easeInOut' },
            }}
            className="overflow-hidden"
          >
            <div className={cn(
              "p-4 pt-0 border-t border-border/30",
              contentClassName
            )}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MobileSectionCard;
