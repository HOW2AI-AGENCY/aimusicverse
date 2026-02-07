/**
 * Heading Component
 * Feature: 032-professional-ui
 * 
 * Unified heading component with consistent typography
 * Uses design system tokens from typography.css
 */

import { memo, forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from '@/lib/motion';

type HeadingLevel = 1 | 2 | 3 | 4 | 5;

interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> {
  level?: HeadingLevel;
  as?: `h${HeadingLevel}`;
  children: React.ReactNode;
  /** Apply gradient effect */
  gradient?: boolean;
  /** Muted color for secondary headings */
  muted?: boolean;
  /** Line truncation */
  truncate?: 1 | 2 | 3;
  /** Russian text optimization */
  ru?: boolean;
  /** Balance text wrapping */
  balance?: boolean;
  /** Animate entrance */
  animate?: boolean;
  /** Animation delay in ms */
  animationDelay?: number;
}

const levelStyles: Record<HeadingLevel, string> = {
  1: 'text-h1',
  2: 'text-h2',
  3: 'text-h3',
  4: 'text-h4',
  5: 'text-h5',
};

const truncateStyles: Record<1 | 2 | 3, string> = {
  1: 'truncate-1',
  2: 'truncate-2',
  3: 'truncate-3',
};

export const Heading = memo(forwardRef<HTMLHeadingElement, HeadingProps>(
  function Heading(
    {
      level = 2,
      as,
      children,
      className,
      gradient,
      muted,
      truncate,
      ru,
      balance = true,
      animate = false,
      animationDelay = 0,
      ...props
    },
    ref
  ) {
    const Tag = as || (`h${level}` as const);
    
    const classes = cn(
      levelStyles[level],
      'text-foreground',
      gradient && 'text-gradient',
      muted && 'text-muted-foreground',
      truncate && truncateStyles[truncate],
      ru && 'text-ru',
      balance && !ru && 'text-balance',
      className
    );

    if (animate) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.25, 
            delay: animationDelay / 1000,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <Tag ref={ref} className={classes} {...props}>
            {children}
          </Tag>
        </motion.div>
      );
    }

    return (
      <Tag ref={ref} className={classes} {...props}>
        {children}
      </Tag>
    );
  }
));

Heading.displayName = 'Heading';

/**
 * Display heading for hero sections
 */
interface DisplayHeadingProps extends Omit<HeadingProps, 'level'> {
  size?: 1 | 2;
}

export const DisplayHeading = memo(forwardRef<HTMLHeadingElement, DisplayHeadingProps>(
  function DisplayHeading({ size = 1, className, ...props }, ref) {
    return (
      <Heading
        ref={ref}
        level={1}
        as="h1"
        className={cn(
          size === 1 ? 'text-display-1' : 'text-display-2',
          className
        )}
        {...props}
      />
    );
  }
));

DisplayHeading.displayName = 'DisplayHeading';

/**
 * Section heading with optional icon
 */
interface SectionHeadingProps extends Omit<HeadingProps, 'level'> {
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionHeading = memo(forwardRef<HTMLHeadingElement, SectionHeadingProps>(
  function SectionHeading({ icon, action, children, className, ...props }, ref) {
    return (
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shrink-0">
              {icon}
            </div>
          )}
          <Heading
            ref={ref}
            level={3}
            as="h2"
            className={cn('font-semibold', className)}
            {...props}
          >
            {children}
          </Heading>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
));

SectionHeading.displayName = 'SectionHeading';

export default Heading;
