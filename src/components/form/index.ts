/**
 * Unified Form Input Component Family - Exports
 */

// Main component
export { UnifiedFormInput, FormLabel, FormError, FormHelperText } from './unified-form-input';

// Types
export type {
  UnifiedFormInputProps,
  TextInputProps,
  NumberInputProps,
  SelectInputProps,
  CheckboxInputProps,
  RadioInputProps,
  BaseInputProps,
  SelectOption,
  RadioOption,
  FormValidationError,
  FormValidationState,
} from './unified-form-input.types';

// Type guards
export {
  isTextInputProps,
  isNumberInputProps,
  isSelectInputProps,
  isCheckboxInputProps,
  isRadioInputProps,
} from './unified-form-input.types';

// Config
export { FORM_INPUT_CONFIG, FORM_VALIDATION_PRESETS, FORM_SIZE_PRESETS } from './unified-form-input.config';
