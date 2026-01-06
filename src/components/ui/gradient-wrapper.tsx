/**
 * Gradient Wrapper Component
 * Feature: 032-professional-ui
 *
 * Provides consistent gradient backgrounds following the design system.
 * Supports all gradient variants with proper contrast handling.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type GradientVariant = 'primary' | 'success' | 'player' | 'fab';

export interface GradientWrapperProps {
  variant?: GradientVariant;
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

/**
 * GradientWrapper Component
 *
 * Applies gradient backgrounds to child elements.
 * Handles light/dark mode contrast automatically.
 *
 * Usage:
 *   <GradientWrapper variant="primary">
 *     <Button>Primary Action</Button>
 *   </GradientWrapper>
 *
 *   <GradientWrapper variant="success">
 *     <div>Success message</div>
 *   </GradientWrapper>
 */
export const GradientWrapper: React.FC<GradientWrapperProps> = ({
  variant = 'primary',
  className,
  children,
  as: Component = 'div',
}) => {
  const gradientStyles = {
    primary: 'bg-gradient-primary text-white',
    success: 'bg-gradient-success text-white',
    player: 'bg-gradient-player text-foreground',
    fab: 'bg-gradient-primary text-white',
  };

  return (
    <Component className={cn(gradientStyles[variant], className)}>
      {children}
    </Component>
  );
};

/**
 * GradientText Component
 *
 * Applies gradient to text only using background-clip.
 *
 * Usage:
 *   <GradientText variant="primary">Heading</GradientText>
 */
export interface GradientTextProps {
  variant?: GradientVariant;
  className?: string;
  children: React.ReactNode;
}

export const GradientText: React.FC<GradientTextProps> = ({
  variant = 'primary',
  className,
  children,
}) => {
  const gradients = {
    primary: 'text-transparent bg-clip-text bg-gradient-primary',
    success: 'text-transparent bg-clip-text bg-gradient-success',
    player: 'text-transparent bg-clip-text bg-gradient-player',
    fab: 'text-transparent bg-clip-text bg-gradient-primary',
  };

  return (
    <span className={cn('font-semibold', gradients[variant], className)}>
      {children}
    </span>
  );
};

/**
 * GradientBorder Component
 *
 * Creates a border with gradient effect.
 *
 * Usage:
 *   <GradientBorder variant="primary">
 *     <div>Content with gradient border</div>
 *   </GradientBorder>
 */
export interface GradientBorderProps {
  variant?: GradientVariant;
  className?: string;
  children: React.ReactNode;
  borderWidth?: number;
}

export const GradientBorder: React.FC<GradientBorderProps> = ({
  variant = 'primary',
  className,
  children,
  borderWidth = 2,
}) => {
  const gradients = {
    primary: 'bg-gradient-primary',
    success: 'bg-gradient-success',
    player: 'bg-gradient-player',
    fab: 'bg-gradient-primary',
  };

  return (
    <div className={cn('relative p-[1px] rounded-lg', gradients[variant], className)}>
      <div className="bg-background rounded-lg" style={{ padding: `${borderWidth}px` }}>
        {children}
      </div>
    </div>
  );
};

export default {
  GradientWrapper,
  GradientText,
  GradientBorder,
};
