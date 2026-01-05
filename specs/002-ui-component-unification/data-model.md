# Data Model: UI Component Unification Phase 2

**Feature**: 002-ui-component-unification
**Date**: 2026-01-06
**Phase**: 1 - Design & Contracts

## Overview

This document defines the data model for unified component families, including TypeScript interfaces, state management patterns, and component entity relationships. Unlike traditional data models (database schemas), this is a **component entity model** that describes the structure and relationships of React components.

## Component Entities

### 1. UnifiedDialog Family

#### Entity: UnifiedDialog

**Purpose**: Single entry point for all dialog/sheet/modal patterns in the application

**Type Definition**:
```typescript
// src/components/dialog/unified-dialog.types.ts
export type UnifiedDialogProps =
  | ModalDialogProps
  | SheetDialogProps
  | AlertDialogProps;

// Base dialog properties (shared across all variants)
export interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal variant (desktop-focused, full-screen overlay)
export interface ModalDialogProps extends BaseDialogProps {
  variant: 'modal';
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

// Sheet variant (mobile-focused, bottom sheet with swipe-to-dismiss)
export interface SheetDialogProps extends BaseDialogProps {
  variant: 'sheet';
  title: string;
  children: React.ReactNode;
  snapPoints?: number[];  // [0.25, 0.5, 0.9] of viewport height
  defaultSnapPoint?: number;
  closeOnDragDown?: boolean;
}

// Alert variant (confirmation dialog with confirm/cancel actions)
export interface AlertDialogProps extends BaseDialogProps {
  variant: 'alert';
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'info';
}
```

**State Management**:
```typescript
// src/hooks/dialog/use-dialog-state.ts
export interface UseDialogStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useDialogState(initialOpen = false): UseDialogStateReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
```

**Relationships**:
- **Uses**: `MobileBottomSheet` (reference implementation)
- **Extends**: Base dialog patterns from shadcn/ui
- **Consumed by**: All pages requiring modal/sheet interactions (20+ pages)

---

### 2. UnifiedSkeleton Family

#### Entity: UnifiedSkeleton

**Purpose**: Consistent loading states across the application with shimmer animations

**Type Definition**:
```typescript
// src/components/skeleton/unified-skeleton.types.ts
export type UnifiedSkeletonProps =
  | TextSkeletonProps
  | CardSkeletonProps
  | ListSkeletonProps
  | ImageSkeletonProps;

// Base skeleton properties
export interface BaseSkeletonProps {
  className?: string;
  animated?: boolean;
  speed?: 'slow' | 'normal' | 'fast';
}

// Text skeleton (placeholder for text content)
export interface TextSkeletonProps extends BaseSkeletonProps {
  variant: 'text';
  lines?: number;           // Default: 3
  lineHeight?: 'sm' | 'md' | 'lg';
  lastLineWidth?: number;   // Percentage, default: 60
}

// Card skeleton (placeholder for card content with cover + text)
export interface CardSkeletonProps extends BaseSkeletonProps {
  variant: 'card';
  showCover?: boolean;      // Default: true
  coverShape?: 'square' | 'circle';
  lines?: number;           // Default: 3
  aspectRatio?: '1:1' | '16:9' | '4:3';
}

// List skeleton (placeholder for list items)
export interface ListSkeletonProps extends BaseSkeletonProps {
  variant: 'list';
  count?: number;           // Default: 5
  layout?: 'horizontal' | 'vertical';
  showAvatar?: boolean;
}

// Image skeleton (placeholder for images)
export interface ImageSkeletonProps extends BaseSkeletonProps {
  variant: 'image';
  width: number | string;
  height: number | string;
  shape?: 'square' | 'circle' | 'rounded';
}
```

**Configuration**:
```typescript
// src/components/skeleton/unified-skeleton.config.ts
export const SKELETON_CONFIG = {
  animations: {
    shimmer: {
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    },
    pulse: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
  },
  speeds: {
    slow: '3s',
    normal: '1.5s',
    fast: '0.8s',
  },
  lineHeights: {
    sm: '1rem',
    md: '1.25rem',
    lg: '1.5rem',
  },
} as const;
```

**Relationships**:
- **Extends**: shadcn/ui Skeleton base component
- **Consumed by**: All pages with loading states (200+ uses per constitution)
- **Configured by**: `unified-skeleton.config.ts`

---

### 3. UnifiedFormInput Family

#### Entity: UnifiedFormInput

**Purpose**: Consistent form inputs with unified validation, error handling, and accessibility

**Type Definition**:
```typescript
// src/components/form/unified-form-input.types.ts
export type UnifiedFormInputProps =
  | TextInputProps
  | NumberInputProps
  | SelectInputProps
  | CheckboxInputProps
  | RadioInputProps;

// Base input properties (shared across all variants)
export interface BaseInputProps {
  name: string;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Text input (single-line text, email, password, URL)
export interface TextInputProps extends BaseInputProps {
  variant: 'text';
  type?: 'text' | 'email' | 'password' | 'url' | 'tel';
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  autoComplete?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Number input (numeric values with min/max validation)
export interface NumberInputProps extends BaseInputProps {
  variant: 'number';
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Select input (dropdown with options)
export interface SelectInputProps extends BaseInputProps {
  variant: 'select';
  options: Array<{
    label: string;
    value: string;
    disabled?: boolean;
  }>;
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  maxSelected?: number;
}

// Checkbox input (boolean toggle with label)
export interface CheckboxInputProps extends Omit<BaseInputProps, 'required'> {
  variant: 'checkbox';
  label: string;  // Required for checkbox
  description?: string;
  defaultChecked?: boolean;
  indeterminate?: boolean;
}

// Radio input (single selection from radio group)
export interface RadioInputProps extends BaseInputProps {
  variant: 'radio';
  options: Array<{
    label: string;
    value: string;
    disabled?: boolean;
  }>;
  defaultValue?: string;
  orientation?: 'horizontal' | 'vertical';
}
```

**Validation Schema** (Zod):
```typescript
// src/components/form/validation-schemas.ts
import { z } from 'zod';

export const textInputSchema = z.string().min(1, 'Required field');
export const emailInputSchema = z.string().email('Invalid email address');
export const passwordInputSchema = z.string().min(8, 'Password must be at least 8 characters');
export const numberInputSchema = z.number();
export const selectInputSchema = z.string();

export function createFormValidationSchema<T extends Record<string, z.ZodTypeAny>>(
  schema: T
) {
  return z.object(schema);
}
```

**State Management** (React Hook Form + Zod):
```typescript
// src/hooks/form/use-form-validation.ts
export interface UseFormValidationParams<T> {
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
}

export function useFormValidation<T>({
  schema,
  defaultValues,
  onSubmit,
}: UseFormValidationParams<T>) {
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return {
    methods,
    handleSubmit,
    errors: methods.formState.errors,
    isSubmitting: methods.formState.isSubmitting,
  };
}
```

**Relationships**:
- **Extends**: shadcn/ui input components
- **Validates by**: Zod schemas (runtime validation)
- **Integrates with**: React Hook Form (form state)
- **Consumed by**: All forms across the app (15+ forms)

---

## Component Registry

### Type Registry

Centralized type registry for all unified components:

```typescript
// src/types/component-registry.ts
export interface ComponentRegistry {
  Dialog: UnifiedDialogProps;
  Skeleton: UnifiedSkeletonProps;
  FormInput: UnifiedFormInputProps;
}

// Type guards for variant detection
export function isDialogVariant(
  props: UnifiedDialogProps,
  variant: UnifiedDialogProps['variant']
): props is Extract<UnifiedDialogProps, { variant: typeof variant }> {
  return props.variant === variant;
}

export function isSkeletonVariant(
  props: UnifiedSkeletonProps,
  variant: UnifiedSkeletonProps['variant']
): props is Extract<UnifiedSkeletonProps, { variant: typeof variant }> {
  return props.variant === variant;
}

export function isFormInputVariant(
  props: UnifiedFormInputProps,
  variant: UnifiedFormInputProps['variant']
): props is Extract<UnifiedFormInputProps, { variant: typeof variant }> {
  return props.variant === variant;
}
```

---

## State Management Patterns

### 1. Dialog State

**Hook**: `useDialogState`
**Storage**: React state (useState)
**Scope**: Component-level (each dialog instance manages its own state)

```typescript
const { isOpen, open, close, toggle } = useDialogState();
```

### 2. Form State

**Hook**: `useFormValidation` (wraps React Hook Form)
**Storage**: React Hook Form (useForm)
**Scope**: Form-level (all inputs in a form share state)

```typescript
const { methods, handleSubmit, errors, isSubmitting } = useFormValidation({
  schema: formSchema,
  defaultValues: { name: '', email: '' },
  onSubmit: async (data) => { /* submit to server */ },
});
```

### 3. Skeleton State

**Hook**: None (controlled by parent component's loading state)
**Storage**: Parent component's TanStack Query loading state
**Scope**: Query-level (each query has its own loading state)

```typescript
const { data, isLoading } = useQuery({ queryKey: ['tracks'], queryFn: fetchTracks });
return isLoading ? <UnifiedSkeleton variant="list" /> : <TrackList tracks={data} />;
```

---

## Component Relationships

### Dependency Graph

```
UnifiedDialog
├── Uses: MobileBottomSheet (reference implementation)
├── Extends: shadcn/ui Dialog, Sheet
├── Managed by: useDialogState hook
└── Consumed by: 20+ pages (Home, Library, Generate, Studio, etc.)

UnifiedSkeleton
├── Extends: shadcn/ui Skeleton
├── Configured by: unified-skeleton.config.ts
├── Managed by: Parent component loading state (TanStack Query)
└── Consumed by: 200+ loading states across the app

UnifiedFormInput
├── Extends: shadcn/ui Input, Select, Checkbox, Radio
├── Validated by: Zod schemas
├── Managed by: useFormValidation hook (React Hook Form)
└── Consumed by: 15+ forms (generation form, settings, auth, etc.)
```

### Migration Paths

```
Legacy Components → Unified Components
├── MobileBottomSheet.tsx → UnifiedDialog (variant="sheet")
├── dialog.tsx → UnifiedDialog (variant="modal")
├── sheet.tsx → UnifiedDialog (variant="sheet")
├── skeleton.tsx → UnifiedSkeleton (variant="text")
├── input.tsx → UnifiedFormInput (variant="text")
├── select.tsx → UnifiedFormInput (variant="select")
└── ... (other legacy components)
```

---

## Validation Rules

### Type Safety

- **Discriminated Unions**: All component props use discriminated unions with `variant` as discriminant
- **Type Guards**: Type guards provided for variant detection
- **Exhaustive Checks**: TypeScript forces exhaustive handling of all variants

### Runtime Validation

- **Form Inputs**: Zod schemas validate form data at runtime
- **Props Validation**: React PropTypes or TypeScript type assertions
- **Accessibility**: axe-core automated checks in tests

### State Validation

- **Dialog State**: Boolean validation (open/close)
- **Form State**: Schema validation on submit, validation on change
- **Skeleton State**: Loading state validation (boolean)

---

## Lifecycle & State Transitions

### Dialog Lifecycle

```
Closed → Opening → Open → Closing → Closed
  ↑         ↓        ↓        ↓
  └─────────┴────────┴────────┘
      (user can close at any point)

States:
- Closed: isOpen = false, not rendered (or unmounted)
- Opening: isOpen = true, animating in (transition)
- Open: isOpen = true, fully rendered, interactive
- Closing: isOpen = false, animating out (transition)
```

### Form Input Lifecycle

```
Idle → Focused → Changed → Blurred → Validated → (Error | Success)
  ↑       ↓        ↓        ↓         ↓           ↓
  └────────┴────────┴────────┴─────────┴───────────┘
                     (user can re-edit at any point)

States:
- Idle: Initial state, not touched
- Focused: User is typing
- Changed: Value has changed (dirty)
- Blurred: User left field
- Validated: Validation run against schema
- Error: Validation failed
- Success: Validation passed
```

### Skeleton Lifecycle

```
Not Loading → Loading → Loaded (skeleton removed)
  ↓            ↓
Error → Loading → Retry

States:
- Not Loading: Data present, skeleton not shown
- Loading: Data fetching, skeleton shown
- Loaded: Data present, skeleton removed
- Error: Error state shown with retry option
```

---

## Data Flow Diagrams

### Dialog Data Flow

```
User Action → onOpenChange → State Update → Re-render
   ↓                             ↓              ↓
Click "Open" → setIsOpen(true) → isOpen=true → Show Dialog
Click "Close" → setIsOpen(false) → isOpen=false → Hide Dialog
```

### Form Data Flow

```
User Input → onChange → Form State → Validation → Submit
   ↓            ↓          ↓            ↓            ↓
Type text → Update value → methods.setValue → zod.parse → onSubmit(data)
   ↓                                                          ↓
Error (if invalid) ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

### Skeleton Data Flow

```
Query Start → isLoading=true → Show Skeleton
   ↓                              ↓
Data fetching ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
   ↓
Query Success → isLoading=false → Hide Skeleton, Show Data
   ↓
Query Error → isError=true → Show Error State
```

---

## Extension Points

### Custom Dialog Content

```typescript
// Extension hook for custom dialog behavior
export function useDialogExtension(config: {
  renderCustomHeader?: () => React.ReactNode;
  renderCustomFooter?: () => React.ReactNode;
  onBeforeClose?: () => boolean | Promise<boolean>;
}) {
  return {
    Header: config.renderCustomHeader,
    Footer: config.renderCustomFooter,
    shouldClose: config.onBeforeClose ?? (() => true),
  };
}
```

### Custom Skeleton Animations

```typescript
// Extension hook for custom shimmer patterns
export function useSkeletonExtension(config: {
  shimmerVariant?: 'default' | 'pulse' | 'wave';
  customAnimation?: AnimationControls;
}) {
  return {
    animationClass: config.shimmerVariant ?? 'default',
    customAnimation: config.customAnimation,
  };
}
```

### Custom Form Validation

```typescript
// Extension hook for custom validation logic
export function useFormInputExtension<T>(config: {
  customValidator?: (value: T) => string | null;
  transformOnBlur?: (value: T) => T;
}) {
  return {
    validate: config.customValidator ?? ((value: T) => null),
    transform: config.transformOnBlur ?? ((value: T) => value),
  };
}
```

---

## Summary

**Component Entities**: 3 unified families
- UnifiedDialog (3 variants: modal, sheet, alert)
- UnifiedSkeleton (4 variants: text, card, list, image)
- UnifiedFormInput (5 variants: text, number, select, checkbox, radio)

**State Management**:
- Dialog: React state (useDialogState hook)
- Form: React Hook Form + Zod (useFormValidation hook)
- Skeleton: TanStack Query loading state (parent-managed)

**Type Safety**: Discriminated unions with `variant` as discriminant, type guards, exhaustive checks

**Validation**: Zod for runtime validation, TypeScript for compile-time checking

**Extension Hooks**: useDialogExtension, useSkeletonExtension, useFormInputExtension for 20% custom use cases

---

**Data Model Complete**: Ready for contract generation (TypeScript definition files).
