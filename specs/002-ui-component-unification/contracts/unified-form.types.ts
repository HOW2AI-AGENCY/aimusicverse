/**
 * Unified Form Input Component Family - Type Definitions
 *
 * Component: UnifiedFormInput
 * Variants: text, number, select, checkbox, radio
 * Purpose: Consistent form inputs with unified validation and error handling
 *
 * These are the TypeScript type definitions for the unified form input component.
 * Implementation files will import these types from src/components/form/unified-form-input.types.ts
 */

import type { ReactNode } from 'react';

/**
 * Base input properties shared across all variants
 */
export interface BaseInputProps {
  /** Input name (for form submission) */
  name: string;
  /** Optional label text */
  label?: string;
  /** Error message from validation */
  error?: string;
  /** Helper text for additional context */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
  /** Optional aria-describedby for accessibility */
  ariaDescribedBy?: string;
}

/**
 * Text input variant - Single-line text, email, password, URL
 *
 * Usage: Text input fields for names, emails, passwords, URLs,
 * phone numbers, and any single-line text input.
 */
export interface TextInputProps extends BaseInputProps {
  /** Discriminant: 'text' variant */
  variant: 'text';
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'url' | 'tel';
  /** Placeholder text */
  placeholder?: string;
  /** Maximum character length */
  maxLength?: number;
  /** Minimum character length */
  minLength?: number;
  /** Autocomplete attribute for form autofill */
  autoComplete?: string;
  /** Optional icon to display on the left */
  leftIcon?: ReactNode;
  /** Optional icon to display on the right */
  rightIcon?: ReactNode;
  /** Whether to show password toggle button (for password type) */
  showPasswordToggle?: boolean;
}

/**
 * Number input variant - Numeric values with min/max validation
 *
 * Usage: Number inputs for ages, quantities, durations, prices,
 * and any numeric input with validation.
 */
export interface NumberInputProps extends BaseInputProps {
  /** Discriminant: 'number' variant */
  variant: 'number';
  /** Placeholder text */
  placeholder?: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment/decrement */
  step?: number;
  /** Default value */
  defaultValue?: number;
  /** Optional icon to display on the left */
  leftIcon?: ReactNode;
  /** Optional icon to display on the right */
  rightIcon?: ReactNode;
  /** Show increment/decrement buttons */
  showSteppers?: boolean;
}

/**
 * Select input variant - Dropdown with options
 *
 * Usage: Dropdown selects for genres, moods, categories,
 * and any selection from a predefined list.
 */
export interface SelectInputProps extends BaseInputProps {
  /** Discriminant: 'select' variant */
  variant: 'select';
  /** Available options */
  options: Array<{
    /** Option label (display text) */
    label: string;
    /** Option value */
    value: string;
    /** Whether the option is disabled */
    disabled?: boolean;
    /** Optional icon for the option */
    icon?: ReactNode;
  }>;
  /** Placeholder text */
  placeholder?: string;
  /** Enable search/filter functionality */
  searchable?: boolean;
  /** Enable multiple selection */
  multiple?: boolean;
  /** Maximum number of selected items (for multiple select) */
  maxSelected?: number;
  /** Custom render function for options */
  renderOption?: (option: SelectOption) => ReactNode;
}

/**
 * Select option type
 */
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: ReactNode;
}

/**
 * Checkbox input variant - Boolean toggle with label
 *
 * Usage: Checkboxes for terms acceptance, newsletter subscription,
 * feature toggles, and any boolean choice.
 */
export interface CheckboxInputProps extends Omit<BaseInputProps, 'required'> {
  /** Discriminant: 'checkbox' variant */
  variant: 'checkbox';
  /** Checkbox label (required for checkbox) */
  label: string;
  /** Optional description below checkbox */
  description?: string;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Indeterminate state (for parent checkboxes) */
  indeterminate?: boolean;
  /** Checkbox size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Radio input variant - Single selection from radio group
 *
 * Usage: Radio groups for choosing one option from multiple
 * choices (mood, style, quality, etc.).
 */
export interface RadioInputProps extends BaseInputProps {
  /** Discriminant: 'radio' variant */
  variant: 'radio';
  /** Available radio options */
  options: Array<{
    /** Option label (display text) */
    label: string;
    /** Option value */
    value: string;
    /** Whether the option is disabled */
    disabled?: boolean;
    /** Optional description for the option */
    description?: string;
    /** Optional icon for the option */
    icon?: ReactNode;
  }>;
  /** Default selected value */
  defaultValue?: string;
  /** Radio group orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Custom render function for options */
  renderOption?: (option: RadioOption) => ReactNode;
}

/**
 * Radio option type
 */
export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
  description?: string;
  icon?: ReactNode;
}

/**
 * Unified Form Input Props - Discriminated Union
 *
 * The 'variant' property acts as the discriminant, allowing TypeScript
 * to narrow the type and provide accurate intellisense for each variant.
 */
export type UnifiedFormInputProps =
  | TextInputProps
  | NumberInputProps
  | SelectInputProps
  | CheckboxInputProps
  | RadioInputProps;

/**
 * Form validation error type
 */
export interface FormValidationError {
  /** Field name with error */
  field: string;
  /** Error message */
  message: string;
  /** Error type */
  type: 'required' | 'invalid' | 'min' | 'max' | 'custom';
}

/**
 * Form validation state
 */
export interface FormValidationState {
  /** Whether the form is currently validating */
  isValidating: boolean;
  /** Whether the form is valid */
  isValid: boolean;
  /** Validation errors by field name */
  errors: Record<string, string>;
  /** Touched fields (user has interacted with) */
  touched: Record<string, boolean>;
}

/**
 * Form input configuration
 */
export interface FormInputConfig {
  /** Validate on change (default: false, validates on blur) */
  validateOnChange?: boolean;
  /** Validate on blur (default: true) */
  validateOnBlur?: boolean;
  /** Show error immediately on mount if error exists */
  showInitialError?: boolean;
  /** Custom error message renderer */
  renderError?: (error: string) => ReactNode;
  /** Custom helper text renderer */
  renderHelperText?: (text: string) => ReactNode;
}

/**
 * Type guard for text variant
 */
export function isTextInputProps(
  props: UnifiedFormInputProps
): props is TextInputProps {
  return props.variant === 'text';
}

/**
 * Type guard for number variant
 */
export function isNumberInputProps(
  props: UnifiedFormInputProps
): props is NumberInputProps {
  return props.variant === 'number';
}

/**
 * Type guard for select variant
 */
export function isSelectInputProps(
  props: UnifiedFormInputProps
): props is SelectInputProps {
  return props.variant === 'select';
}

/**
 * Type guard for checkbox variant
 */
export function isCheckboxInputProps(
  props: UnifiedFormInputProps
): props is CheckboxInputProps {
  return props.variant === 'checkbox';
}

/**
 * Type guard for radio variant
 */
export function isRadioInputProps(
  props: UnifiedFormInputProps
): props is RadioInputProps {
  return props.variant === 'radio';
}
