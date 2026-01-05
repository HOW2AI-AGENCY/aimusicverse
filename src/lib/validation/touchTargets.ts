/**
 * T004: Touch Target Validation Utility
 * 
 * Validates touch target sizes according to mobile UX best practices:
 * - iOS HIG minimum: 44x44px
 * - Material Design minimum: 48x48px
 * - Recommended: 44-56px
 * - Minimum spacing: 8px between targets
 * 
 * Usage:
 * ```tsx
 * const result = validateTouchTarget(buttonWidth, buttonHeight);
 * if (!result.valid) {
 *   console.warn('Touch target too small:', result.errors);
 * }
 * ```
 */

export interface TouchTargetValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
  dimensions: {
    width: number;
    height: number;
    minDimension: number;
  };
  compliance: {
    ios: boolean;        // >= 44px
    material: boolean;   // >= 48px
    recommended: boolean; // >= 44px && <= 56px
  };
}

export interface TouchTargetOptions {
  /**
   * Minimum size in pixels (default: 44)
   */
  minSize?: number;
  
  /**
   * Recommended minimum size (default: 48)
   */
  recommendedSize?: number;
  
  /**
   * Maximum recommended size (default: 56)
   */
  maxRecommendedSize?: number;
  
  /**
   * Require square targets (width === height)
   */
  requireSquare?: boolean;
  
  /**
   * Context for better error messages
   */
  context?: string;
}

const DEFAULT_OPTIONS: Required<Omit<TouchTargetOptions, 'context'>> = {
  minSize: 44,
  recommendedSize: 48,
  maxRecommendedSize: 56,
  requireSquare: false,
};

/**
 * Validate touch target dimensions
 */
export function validateTouchTarget(
  width: number,
  height: number,
  options: TouchTargetOptions = {}
): TouchTargetValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const minDimension = Math.min(width, height);
  const context = options.context ? `${options.context}: ` : '';
  
  const result: TouchTargetValidationResult = {
    valid: true,
    warnings: [],
    errors: [],
    recommendations: [],
    dimensions: {
      width,
      height,
      minDimension,
    },
    compliance: {
      ios: minDimension >= 44,
      material: minDimension >= 48,
      recommended: minDimension >= opts.minSize && minDimension <= opts.maxRecommendedSize,
    },
  };
  
  // Critical errors (blocks usage)
  if (width < opts.minSize || height < opts.minSize) {
    result.valid = false;
    result.errors.push(
      `${context}Touch target too small: ${width}x${height}px. Minimum: ${opts.minSize}x${opts.minSize}px (iOS HIG standard)`
    );
  }
  
  if (opts.requireSquare && width !== height) {
    result.valid = false;
    result.errors.push(
      `${context}Touch target must be square: ${width}x${height}px. Use same width and height.`
    );
  }
  
  // Warnings (should be addressed but not critical)
  if (result.valid && minDimension < opts.recommendedSize) {
    result.warnings.push(
      `${context}Touch target below recommended size: ${width}x${height}px. Recommended: ${opts.recommendedSize}x${opts.recommendedSize}px (Material Design standard)`
    );
  }
  
  if (minDimension > opts.maxRecommendedSize) {
    result.warnings.push(
      `${context}Touch target larger than recommended: ${width}x${height}px. May cause layout issues. Max recommended: ${opts.maxRecommendedSize}px`
    );
  }
  
  if (width !== height && Math.abs(width - height) > 8) {
    result.warnings.push(
      `${context}Touch target not square: ${width}x${height}px. Square targets provide better UX consistency.`
    );
  }
  
  // Recommendations
  if (!result.compliance.material && result.compliance.ios) {
    result.recommendations.push(
      `Increase size to ${opts.recommendedSize}x${opts.recommendedSize}px for Material Design compliance`
    );
  }
  
  if (minDimension < 56 && result.valid) {
    result.recommendations.push(
      `Consider increasing to 56x56px for improved accessibility and easier tapping`
    );
  }
  
  return result;
}

/**
 * Validate spacing between touch targets
 */
export function validateTouchTargetSpacing(
  target1: { x: number; y: number; width: number; height: number },
  target2: { x: number; y: number; width: number; height: number },
  options: { minSpacing?: number; context?: string } = {}
): { valid: boolean; spacing: number; errors: string[]; warnings: string[] } {
  const minSpacing = options.minSpacing ?? 8;
  const context = options.context ? `${options.context}: ` : '';
  
  // Calculate distance between edges (not centers)
  const horizontalSpacing = Math.abs(
    Math.max(target1.x, target2.x) - Math.min(target1.x + target1.width, target2.x + target2.width)
  );
  const verticalSpacing = Math.abs(
    Math.max(target1.y, target2.y) - Math.min(target1.y + target1.height, target2.y + target2.height)
  );
  
  const spacing = Math.min(horizontalSpacing, verticalSpacing);
  
  const result = {
    valid: spacing >= minSpacing,
    spacing,
    errors: [] as string[],
    warnings: [] as string[],
  };
  
  if (!result.valid) {
    result.errors.push(
      `${context}Touch targets too close: ${spacing}px spacing. Minimum: ${minSpacing}px for comfortable tapping`
    );
  } else if (spacing < 12) {
    result.warnings.push(
      `${context}Touch target spacing below recommended: ${spacing}px. Recommended: 12px or more for better UX`
    );
  }
  
  return result;
}

/**
 * Get CSS classes for enforcing touch target sizes
 */
export function getTouchTargetClasses(size: 44 | 48 | 56 = 48): string {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'touch-manipulation', // Disable double-tap zoom
    'select-none',        // Prevent text selection
  ];
  
  const sizeClasses = {
    44: ['min-w-[44px]', 'min-h-[44px]', 'w-11', 'h-11'],
    48: ['min-w-[48px]', 'min-h-[48px]', 'w-12', 'h-12'],
    56: ['min-w-[56px]', 'min-h-[56px]', 'w-14', 'h-14'],
  };
  
  return [...baseClasses, ...sizeClasses[size]].join(' ');
}

/**
 * React hook for validating touch targets in development
 */
export function useTouchTargetValidation(
  ref: React.RefObject<HTMLElement>,
  options: TouchTargetOptions = {}
) {
  if (import.meta.env.DEV) {
    // Only validate in development
    React.useEffect(() => {
      if (!ref.current) return;
      
      const element = ref.current;
      const rect = element.getBoundingClientRect();
      const result = validateTouchTarget(rect.width, rect.height, {
        ...options,
        context: element.tagName.toLowerCase(),
      });
      
      if (!result.valid) {
        console.error('❌ Touch Target Validation Failed:', result.errors);
      } else if (result.warnings.length > 0) {
        console.warn('⚠️  Touch Target Warnings:', result.warnings);
      }
      
      if (result.recommendations.length > 0) {
        console.info('💡 Touch Target Recommendations:', result.recommendations);
      }
    }, [ref, options]);
  }
}

/**
 * Validate all interactive elements on the page
 * Useful for auditing touch target compliance
 */
export function auditPageTouchTargets(): {
  total: number;
  compliant: number;
  nonCompliant: number;
  details: Array<{
    element: string;
    dimensions: { width: number; height: number };
    result: TouchTargetValidationResult;
  }>;
} {
  const interactiveSelectors = [
    'button',
    'a[href]',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="checkbox"]',
    'input[type="radio"]',
    '[role="button"]',
    '[role="link"]',
    '[onclick]',
  ];
  
  const elements = document.querySelectorAll(interactiveSelectors.join(', '));
  const details: Array<{
    element: string;
    dimensions: { width: number; height: number };
    result: TouchTargetValidationResult;
  }> = [];
  
  let compliant = 0;
  let nonCompliant = 0;
  
  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const result = validateTouchTarget(rect.width, rect.height, {
      context: `${element.tagName.toLowerCase()}${element.className ? `.${element.className.split(' ')[0]}` : ''}`,
    });
    
    details.push({
      element: element.tagName.toLowerCase(),
      dimensions: { width: rect.width, height: rect.height },
      result,
    });
    
    if (result.valid) {
      compliant++;
    } else {
      nonCompliant++;
    }
  });
  
  return {
    total: elements.length,
    compliant,
    nonCompliant,
    details,
  };
}

// React import for the hook
import React from 'react';
