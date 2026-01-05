/**
 * DetailSection - Unified section wrapper for detail views
 * 
 * Used in:
 * - TrackDetailsTab sections
 * - ProjectDetail sections  
 * - User profile sections
 * - Any detail view with icon + title + content
 */

import { memo, ReactNode, useState } from 'react';
import { LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DetailSectionProps {
  /** Icon from lucide-react */
  icon: LucideIcon;
  /** Icon color class */
  iconColor?: string;
  /** Section title */
  title: string;
  /** Content to display */
  children: ReactNode;
  /** Whether section can be collapsed */
  collapsible?: boolean;
  /** Default open state for collapsible sections */
  defaultOpen?: boolean;
  /** Action button/element on the right */
  action?: ReactNode;
  /** Visual variant */
  variant?: 'default' | 'card' | 'transparent';
  /** Size variant */
  size?: 'default' | 'compact' | 'large';
  /** Whether to show separator before section */
  showSeparator?: boolean;
  /** Additional className for wrapper */
  className?: string;
  /** Additional className for content */
  contentClassName?: string;
}

const SIZES = {
  default: {
    title: 'text-lg',
    icon: 'w-5 h-5',
    gap: 'gap-2',
    padding: 'py-0',
  },
  compact: {
    title: 'text-base',
    icon: 'w-4 h-4',
    gap: 'gap-1.5',
    padding: 'py-0',
  },
  large: {
    title: 'text-xl',
    icon: 'w-6 h-6',
    gap: 'gap-3',
    padding: 'py-1',
  },
};

export const DetailSection = memo(function DetailSection({
  icon: Icon,
  iconColor = 'text-primary',
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  action,
  variant = 'default',
  size = 'default',
  showSeparator = false,
  className,
  contentClassName,
}: DetailSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sizeConfig = SIZES[size];

  const headerContent = (
    <div className={cn("flex items-center justify-between", sizeConfig.padding)}>
      <h4 className={cn("font-semibold flex items-center", sizeConfig.gap, sizeConfig.title)}>
        <Icon className={cn(sizeConfig.icon, iconColor)} />
        {title}
      </h4>
      <div className="flex items-center gap-2">
        {action}
        {collapsible && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );

  const wrapperClasses = cn(
    'space-y-3',
    variant === 'card' && 'p-4 rounded-lg bg-muted/30 border border-border',
    variant === 'transparent' && 'bg-transparent',
    className
  );

  const content = collapsible ? (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("overflow-hidden", contentClassName)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  ) : (
    <div className={contentClassName}>{children}</div>
  );

  return (
    <>
      {showSeparator && (
        <div className="h-px bg-border my-4" />
      )}
      <div className={wrapperClasses}>
        {headerContent}
        {content}
      </div>
    </>
  );
});

export default DetailSection;
