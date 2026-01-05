/**
 * useFormValidation Hook
 *
 * Integrates React Hook Form with Zod validation for form state management
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { UseFormValidationParams, FormValidationState } from '@/components/form/unified-form-input.types';

/**
 * Hook for form validation with React Hook Form + Zod
 *
 * @param params - Validation parameters including schema and submit handler
 * @returns Form control methods and state
 *
 * @example
 * ```tsx
 * const formSchema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Invalid email'),
 * });
 *
 * const { methods, handleSubmit, errors } = useFormValidation({
 *   schema: formSchema,
 *   defaultValues: { name: '', email: '' },
 *   onSubmit: async (data) => {
 *     await submitForm(data);
 *   },
 * });
 *
 * return (
 *   <form onSubmit={handleSubmit}>
 *     <UnifiedFormInput
 *       variant="text"
 *       name="name"
 *       control={methods.control}
 *       error={errors.name?.message}
 *     />
 *   </form>
 * );
 * ```
 */
export function useFormValidation<T extends Record<string, any>>({
  schema,
  defaultValues,
  onSubmit,
}: UseFormValidationParams<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema as z.ZodSchema<T>),
    defaultValues: defaultValues as Partial<T> || {},
    mode: 'onBlur', // Validate on blur by default
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const errors: Record<string, string> = {};
  for (const [field, error] of Object.entries(methods.formState.errors || {})) {
    errors[field] = error.message?.toString() || 'Invalid value';
  }

  const state: FormValidationState = {
    isValidating: methods.formState.isValidating,
    isValid: methods.formState.isValid,
    errors,
    touched: methods.formState.touchedFields || {},
  };

  return {
    methods,
    handleSubmit,
    errors: state.errors,
    isSubmitting: methods.formState.isSubmitting,
    isValid: state.isValid,
    ...state,
  };
}
