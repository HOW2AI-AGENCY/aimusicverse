/**
 * Unified Form Input Configuration
 *
 * Validation and style configurations for the UnifiedFormInput component family
 */

export const FORM_INPUT_CONFIG = {
  validation: {
    // Show errors immediately on mount if error exists
    showInitialError: false,

    // Validate on change (default: false, validates on blur)
    validateOnChange: false,

    // Validate on blur (default: true)
    validateOnBlur: true,

    // Minimum delay before showing validation errors (ms)
    validationDelay: 200,
  },

  sizes: {
    sm: '32px', // Small input height
    md: '40px', // Medium input height (default)
    lg: '48px', // Large input height
  },

  touchTargets: {
    min: 44, // Minimum touch target in pixels (mobile)
    preferred: 48, // Preferred touch target in pixels
  },

  colors: {
    border: {
      default: '#e2e8f0',
      error: '#ef4444',
      success: '#22c55e',
      focus: '#3b82f6',
    },
    text: {
      default: '#1e293b',
      muted: '#64748b',
      error: '#ef4444',
      placeholder: '#94a3b8',
    },
    background: {
      default: '#ffffff',
      disabled: '#f1f5f9',
    },
  },
} as const;

/**
 * Form input validation presets
 */
export const FORM_VALIDATION_PRESETS = {
  required: {
    rule: (value: any) => !!value || 'This field is required',
    message: 'This field is required',
  },

  email: {
    rule: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address',
  },

  minLength: (min: number) => ({
    rule: (value: string) => value.length >= min,
    message: `Must be at least ${min} characters`,
  }),

  maxLength: (max: number) => ({
    rule: (value: string) => value.length <= max,
    message: `Must be no more than ${max} characters`,
  }),

  min: (min: number) => ({
    rule: (value: number) => value >= min,
    message: `Must be at least ${min}`,
  }),

  max: (max: number) => ({
    rule: (value: number) => value <= max,
    message: `Must be no more than ${max}`,
  }),
} as const;

/**
 * Form input size presets
 */
export const FORM_SIZE_PRESETS = {
  compact: {
    inputSize: 'sm' as const,
    labelSize: 'sm' as const,
    textSize: 'sm' as const,
  },

  default: {
    inputSize: 'md' as const,
    labelSize: 'md' as const,
    textSize: 'md' as const,
  },

  large: {
    inputSize: 'lg' as const,
    labelSize: 'lg' as const,
    textSize: 'lg' as const,
  },
} as const;
