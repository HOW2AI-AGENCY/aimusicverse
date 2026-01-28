/**
 * Typography Utility Component
 * Feature: 032-professional-ui
 *
 * Provides consistent typography components following the design system.
 * Uses CSS classes from src/styles/typography.css for consistency.
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';
export type TextVariant = 'body' | 'bodySm' | 'caption' | 'tiny' | 'label' | 'mono';

// ============================================================================
// HEADING COMPONENT
// ============================================================================

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
  /** Apply gradient text effect */
  gradient?: boolean;
  /** Truncate to single line */
  truncate?: boolean;
}

/**
 * Heading Component - Maps to CSS typography classes
 *
 * @example
 * <Heading level="h1">Page Title</Heading>
 * <Heading level="h2" gradient>Gradient Header</Heading>
 */
export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level, gradient, truncate, className, children, ...props }, ref) => {
    const Tag = level;
    
    return (
      <Tag
        ref={ref}
        className={cn(
          `text-${level}`,
          gradient && 'text-gradient',
          truncate && 'truncate-1',
          className
        )}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);
Heading.displayName = 'Heading';

// ============================================================================
// TEXT COMPONENT
// ============================================================================

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant;
  /** Apply muted foreground color */
  muted?: boolean;
  /** Apply gradient text effect */
  gradient?: boolean;
  /** Truncate lines (1, 2, or 3) */
  truncate?: 1 | 2 | 3;
  /** Use span instead of p */
  as?: 'p' | 'span' | 'div';
}

const variantClasses: Record<TextVariant, string> = {
  body: 'text-body',
  bodySm: 'text-body-sm',
  caption: 'text-caption',
  tiny: 'text-tiny',
  label: 'text-label',
  mono: 'text-mono',
};

/**
 * Text Component - Flexible typography for body content
 *
 * @example
 * <Text>Standard body text</Text>
 * <Text variant="caption" muted>Metadata</Text>
 * <Text variant="label">FORM LABEL</Text>
 */
export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant = 'body', muted, gradient, truncate, as = 'p', className, children, ...props }, ref) => {
    const Tag = as;
    
    return (
      <Tag
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={cn(
          variantClasses[variant],
          muted && 'text-muted-foreground',
          gradient && 'text-gradient',
          truncate && `truncate-${truncate}`,
          className
        )}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);
Text.displayName = 'Text';

// ============================================================================
// DISPLAY COMPONENT
// ============================================================================

export interface DisplayProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Apply gradient text effect */
  gradient?: boolean;
}

/**
 * Display Component - For hero sections and large titles
 *
 * @example
 * <Display>Hero Title</Display>
 * <Display gradient>Gradient Hero</Display>
 */
export const Display = React.forwardRef<HTMLHeadingElement, DisplayProps>(
  ({ gradient, className, children, ...props }, ref) => {
    return (
      <h1
        ref={ref}
        className={cn(
          'text-4xl sm:text-5xl font-bold leading-tight tracking-tight',
          gradient && 'text-gradient',
          className
        )}
        {...props}
      >
        {children}
      </h1>
    );
  }
);
Display.displayName = 'Display';

// ============================================================================
// PROSE COMPONENT
// ============================================================================

export interface ProseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Limit width for readability */
  focus?: boolean;
}

/**
 * Prose Component - For long-form content
 *
 * @example
 * <Prose focus>{longContent}</Prose>
 */
export const Prose = React.forwardRef<HTMLDivElement, ProseProps>(
  ({ focus, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'text-body leading-relaxed space-y-4',
          focus && 'prose-focus',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Prose.displayName = 'Prose';

// ============================================================================
// EXPORTS
// ============================================================================

export default { Heading, Text, Display, Prose };
