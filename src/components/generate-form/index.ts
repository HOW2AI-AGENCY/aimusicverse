/**
 * Generate Form Components Export
 */

export { GenerateFormSimple } from './GenerateFormSimple';
export { GenerateFormCustom } from './GenerateFormCustom';
export { GenerateFormActions } from './GenerateFormActions';
export { GenerateFormReferences } from './GenerateFormReferences';
export { GenerationLoadingState } from './GenerationLoadingState';
export { CollapsibleFormHeader } from './CollapsibleFormHeader';
export { ValidationMessage, validation, checkArtistValidation } from './ValidationMessage';
export { PromptValidationAlert } from './PromptValidationAlert';
export { CreditBalanceWarning } from './CreditBalanceWarning';
export { CreditBalanceIndicator } from './CreditBalanceIndicator';
export { SmartPromptSuggestions } from './SmartPromptSuggestions';
export { FormSection, FormDivider } from './FormSection';
export { SectionLabel, SECTION_HINTS } from './SectionLabel';

// Smart Assistant exports
export {
  SmartAssistantPanel,
  SmartAssistantInline,
  SmartSuggestionCard,
} from './smart-assistant';
export type {
  SmartSuggestion,
  SmartAssistantState,
  SmartAssistantMode,
  UserGenerationContext,
  ProjectGenerationContext,
} from './smart-assistant';
