/**
 * Typography Utility Component
 * Feature: 032-professional-ui
 *
 * Provides consistent typography components that follow the design system.
 * All components map to design tokens and support responsive design.
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Heading variants mapped to design tokens
export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';
export type TextVariant = 'bodyLarge' | 'body' | 'caption';

export interface TypographyProps {
  variant?: HeadingLevel | TextVariant | 'p';
  className?: string;
  children: React.ReactNode;
}

/**
 * Heading Component
 *
 * Usage:
 *   <Heading level="h1">Page Title</Heading>
 *   <Heading level="h2">Section Header</Heading>
 */
export interface HeadingProps {
  level: HeadingLevel;
  className?: string;
  children: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({ level, className, children }) => {
  const baseStyles = 'font-semibold tracking-tight';

  const levelStyles = {
    h1: 'text-3xl font-bold leading-tight',      // 28px, tight
    h2: 'text-2xl font-semibold leading-normal',  // 24px, normal
    h3: 'text-xl font-semibold leading-normal',   // 20px, normal
    h4: 'text-lg font-medium leading-comfortable', // 18px, comfortable
  };

  const Tag = level;

  return (
    <Tag className={cn(baseStyles, levelStyles[level], className)}>
      {children}
    </Tag>
  );
};

/**
 * Text Component
 *
 * Usage:
 *   <Text variant="bodyLarge">Primary content</Text>
 *   <Text variant="body">Standard text</Text>
 *   <Text variant="caption">Metadata</Text>
 */
export interface TextProps {
  variant?: TextVariant;
  className?: string;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({ variant = 'body', className, children }) => {
  const baseStyles = 'text-foreground';

  const variantStyles = {
    bodyLarge: 'text-base leading-comfortable',   // 16px
    body: 'text-sm leading-comfortable',          // 14px
    caption: 'text-xs leading-normal text-secondary-foreground', // 12px
  };

  return (
    <p className={cn(baseStyles, variantStyles[variant], className)}>
      {children}
    </p>
  );
};

/**
 * Label Component (for form labels, buttons, etc.)
 *
 * Usage:
 *   <Label>Field Label</Label>
 */
export interface LabelProps {
  className?: string;
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ className, children }) => {
  return (
    <label className={cn('text-sm font-medium text-foreground', className)}>
      {children}
    </label>
  );
};

/**
 * Display Typography Component (hero, large titles)
 *
 * Usage:
 *   <Display>Hero Title</Display>
 */
export interface DisplayProps {
  className?: string;
  children: React.ReactNode;
}

export const Display: React.FC<DisplayProps> = ({ className, children }) => {
  return (
    <h1 className={cn('text-4xl font-bold leading-tight tracking-tight', className)}>
      {children}
    </h1>
  );
};

// Export all components
export default {
  Heading,
  Text,
  Label,
  Display,
};
