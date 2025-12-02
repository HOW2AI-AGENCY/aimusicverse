// Task: T013 - Assistant form state interface
// Client-side form state management for AI Assistant mode

/**
 * Generation modes supported by the AI Assistant
 */
export type GenerationMode = 
  | 'prompt'          // Single prompt generation
  | 'style-lyrics'    // Separate style + lyrics input
  | 'cover'           // Cover creation from reference
  | 'extend'          // Audio extension
  | 'project'         // Project-based generation
  | 'persona';        // Persona-based generation

/**
 * Reference type for cover/extend modes
 */
export interface GenerationReference {
  type: 'audio' | 'track' | 'project' | 'persona';
  id: string;
  url?: string;
  title?: string;
}

/**
 * Generation options
 */
export interface GenerationOptions {
  instrumental: boolean;
  duration: number | null;          // Duration in seconds (null = auto)
  custom_mode: boolean;             // Enable advanced options
  make_instrumental: boolean;       // Generate instrumental version
  style_weight?: number;            // Weight for style influence (0-1)
  seed?: number;                    // Seed for reproducibility
}

/**
 * Assistant form state for multi-step guided generation
 */
export interface AssistantFormState {
  // Progress tracking
  step: number;
  totalSteps: number;
  
  // Mode selection
  mode: GenerationMode;
  
  // Form data
  prompt: string;
  style: string;
  lyrics: string;
  
  // References (for cover/extend modes)
  reference: GenerationReference | null;
  
  // Generation options
  options: GenerationOptions;
  
  // Metadata
  metadata: Record<string, any>;
  
  // Validation state
  isValid: boolean;
  errors: Record<string, string>;
  
  // Persistence
  savedAt: number;                  // Timestamp of last save
  expiresAt: number;                // Expiration timestamp
}

/**
 * Form helper data for providing context-aware guidance
 */
export interface FormHelperData {
  tips: string[];
  examples: string[];
  recommendations: string[];
  warnings?: string[];
}

/**
 * Step configuration for the wizard
 */
export interface WizardStep {
  id: number;
  title: string;
  description: string;
  optional: boolean;
  fields: string[];                 // Fields required in this step
  helper?: FormHelperData;
}

/**
 * Form actions for state management
 */
export interface AssistantFormActions {
  setMode: (mode: GenerationMode) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateField: (field: string, value: any) => void;
  updateOptions: (options: Partial<GenerationOptions>) => void;
  setReference: (reference: GenerationReference | null) => void;
  validateStep: (step: number) => boolean;
  validateForm: () => boolean;
  reset: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

/**
 * Combined form store type
 */
export type AssistantFormStore = AssistantFormState & AssistantFormActions;
