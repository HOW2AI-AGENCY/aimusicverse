/**
 * UnifiedFormInput Component
 *
 * Consistent form inputs with unified validation and error handling
 *
 * @example
 * ```tsx
 * const { control } = useForm();
 *
 * <UnifiedFormInput
 *   variant="text"
 *   name="email"
 *   label="Email"
 *   control={control}
 *   error={errors.email?.message}
 *   required
 * />
 * ```
 */

import { Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';
import type { UnifiedFormInputProps } from './unified-form-input.types';
import { FORM_INPUT_CONFIG } from './unified-form-input.config';
import { isTextInputProps, isNumberInputProps, isSelectInputProps, isCheckboxInputProps, isRadioInputProps } from '@/lib/type-guards';

// Lazy load variants
const TextVariant = React.lazy(() => import('./variants/text'));
const NumberVariant = React.lazy(() => import('./variants/number'));
const SelectVariant = React.lazy(() => import('./variants/select'));
const CheckboxVariant = React.lazy(() => import('./variants/checkbox'));
const RadioVariant = React.lazy(() => import('./variants/radio'));

/**
 * Unified Form Input Component
 *
 * Routes to appropriate variant based on discriminant
 */
export function UnifiedFormInput(props: UnifiedFormInputProps) {
  // Extract common props
  const { name, label, error, helperText, required, disabled, className } = props;

  if (isTextInputProps(props)) {
    return <TextVariant {...props} />;
  }

  if (isNumberInputProps(props)) {
    return <NumberVariant {...props} />;
  }

  if (isSelectInputProps(props)) {
    return <SelectVariant {...props} />;
  }

  if (isCheckboxInputProps(props)) {
    return <CheckboxVariant {...props} />;
  }

  if (isRadioInputProps(props)) {
    return <RadioVariant {...props} />;
  }

  return null;
}

/**
 * Base label component
 */
export function FormLabel({
  label,
  required,
  disabled,
}: {
  label?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  if (!label) return null;

  return (
    <label className={cn(
      'block text-sm font-medium mb-1.5',
      disabled && 'opacity-50 cursor-not-allowed'
    )}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

/**
 * Base error message component
 */
export function FormError({ error }: { error?: string }) {
  if (!error) return null;

  return (
    <p className="text-sm text-red-500 mt-1.5" role="alert">
      {error}
    </p>
  );
}

/**
 * Base helper text component
 */
export function FormHelperText({ helperText }: { helperText?: string }) {
  if (!helperText) return null;

  return (
    <p className="text-sm text-muted-foreground mt-1.5">
      {helperText}
    </p>
  );
}
