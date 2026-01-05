# Research: UI Component Unification Phase 2

**Feature**: 002-ui-component-unification
**Date**: 2026-01-06
**Phase**: 0 - Research & Technical Decisions

## Overview

This document captures research findings, technical decisions, and rationale for the UI Component Unification Phase 2 feature. It builds on the successful patterns established in Feature 001 (UI Architecture Refactoring).

## Research Task 1: Audit Existing Component Patterns

### Methodology

Performed comprehensive codebase audit to identify duplicate component implementations:

1. **Dialog/Sheet Components**
   - Searched for: `dialog`, `sheet`, `modal`, `bottomsheet`, `popup`
   - Found multiple implementations:
     - `src/components/ui/dialog.tsx` (shadcn/ui base)
     - `src/components/ui/sheet.tsx` (shadcn/ui base)
     - `src/components/mobile/MobileBottomSheet.tsx` (Telegram-optimized)
     - Various inline modal implementations across pages
   - Duplication level: **HIGH** (4+ distinct patterns)
   - Usage frequency: **VERY HIGH** (used across 20+ pages)

2. **Skeleton/Loading Components**
   - Searched for: `skeleton`, `loading`, `spinner`, `shimmer`
   - Found multiple implementations:
     - `src/components/ui/skeleton.tsx` (shadcn/ui base)
     - Custom skeleton loaders in feature directories
     - Inline loading spinners in various components
     - Track card skeletons, playlist skeletons, etc.
   - Duplication level: **HIGH** (10+ variations)
   - Usage frequency: **VERY HIGH** (200+ loading states per constitution)

3. **Form Input Components**
   - Searched for: `input`, `textfield`, `textarea`, `select`, `checkbox`, `radio`
   - Found multiple implementations:
     - `src/components/ui/input.tsx` (shadcn/ui base)
     - `src/components/ui/textarea.tsx` (shashcn/ui base)
     - `src/components/ui/select.tsx` (shadcn/ui base)
     - Custom form inputs in generation form
     - Custom inputs in studio components
   - Duplication level: **MEDIUM** (base components exist, but custom variants proliferate)
   - Usage frequency: **HIGH** (15+ forms across the app)

4. **Action Menu Components**
   - Searched for: `menu`, `dropdown`, `actionsheet`, `contextmenu`, `popover`
   - Found multiple implementations:
     - `src/components/ui/dropdown-menu.tsx` (shadcn/ui base)
     - `src/components/mobile/MobileActionSheet.tsx` (Telegram-optimized)
     - Track action menus (duplicate implementations)
     - Share menus, export menus, etc.
   - Duplication level: **MEDIUM** (3-4 distinct patterns)
   - Usage frequency: **HIGH** (used across 15+ features)

### Impact Matrix

| Component Family | Duplication Level | Usage Frequency | Impact Score | Priority |
|-----------------|-------------------|-----------------|--------------|----------|
| Dialogs/Sheets | HIGH (4+) | VERY HIGH (20+ pages) | **80** | 1 |
| Skeletons | HIGH (10+) | VERY HIGH (200+ states) | **100** | 1 |
| Form Inputs | MEDIUM (5+) | HIGH (15+ forms) | **45** | 2 |
| Action Menus | MEDIUM (3-4) | HIGH (15+ features) | **36** | 3 |

**Decision**: Prioritize **Dialog/Sheet** and **Skeleton** families for Phase 2 (highest impact), plus **Form Inputs** as third family (medium-high impact). Action Menus will be deferred to Phase 3.

## Research Task 2: Prioritize Component Families for Consolidation

### Selected Families for Phase 2

#### Priority 1: Unified Dialog/Sheet Family
- **Rationale**: Highest usage frequency (20+ pages), moderate duplication (4 patterns), critical for UX consistency
- **Scope**: Consolidate Modal, BottomSheet, Alert dialogs into single unified component
- **Variants**:
  - `modal` - Full-screen overlay for desktop
  - `sheet` - Bottom sheet for mobile (swipe-to-dismiss)
  - `alert` - Confirmation dialogs (confirm/cancel)
- **Reference**: `src/components/mobile/MobileBottomSheet.tsx` (best-in-class Telegram integration)

#### Priority 2: Unified Skeleton Family
- **Rationale**: Highest duplication level (10+ variations), extremely high usage (200+ states), direct visual impact
- **Scope**: Consolidate all skeleton loaders into unified component family
- **Variants**:
  - `text` - Text placeholder with shimmer lines
  - `card` - Card placeholder with cover + text
  - `list` - List item placeholder (horizontal/vertical)
  - `image` - Image placeholder with shimmer
- **Reference**: `src/components/ui/skeleton.tsx` (shadcn/ui base)

#### Priority 3: Unified Form Input Family
- **Rationale**: Medium duplication (5+ patterns), high usage (15+ forms), important for data quality
- **Scope**: Consolidate form inputs with unified validation and error handling
- **Variants**:
  - `text` - Text input with label, error, helper text
  - `number` - Number input with min/max validation
  - `select` - Dropdown select with search
  - `checkbox` - Checkbox with label
  - `radio` - Radio group with label
- **Reference**: React Hook Form + Zod patterns from generation form

### Deferred to Phase 3

- **Action Menus**: Lower impact score (36), can be addressed after Dialog/Sheet patterns are established

## Research Task 3: Design Unified Component Architecture

### Pattern Reference: Feature 001 UnifiedTrackCard

From [Feature 001 implementation](../../src/components/track/track-card.tsx):

```typescript
// Discriminated union types
export type UnifiedTrackCardProps =
  | EnhancedUnifiedTrackCardProps
  | ProfessionalUnifiedTrackCardProps
  | StandardUnifiedTrackCardProps;

// Variant-specific props with discriminant
export interface EnhancedUnifiedTrackCardProps {
  variant: 'enhanced';
  track: Track;
  onPlay: (track: Track) => void;
  onFollow: (userId: string) => void;
  onShare: (trackId: string) => void;
}

// Main component with variant routing
export function UnifiedTrackCard(props: UnifiedTrackCardProps) {
  switch (props.variant) {
    case 'enhanced':
      return <EnhancedVariant {...props} />;
    // ...
  }
}
```

### Architecture Design for Unified Families

#### 1. UnifiedDialog Component

**File Structure**:
```
src/components/dialog/
├── unified-dialog.tsx              # Main component
├── unified-dialog.types.ts         # Discriminated union types
├── unified-dialog.config.ts        # Variant configs
└── variants/
    ├── modal.tsx                   # Full-screen modal (desktop)
    ├── sheet.tsx                   # Bottom sheet (mobile)
    └── alert.tsx                   # Confirmation dialog
```

**Type Design**:
```typescript
// Discriminated union with variant as discriminant
export type UnifiedDialogProps =
  | ModalDialogProps
  | SheetDialogProps
  | AlertDialogProps;

export interface ModalDialogProps {
  variant: 'modal';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export interface SheetDialogProps {
  variant: 'sheet';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  snapPoints?: number[];  // [0.25, 0.5, 0.9]
}

export interface AlertDialogProps {
  variant: 'alert';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}
```

**Variant Routing**:
```typescript
export function UnifiedDialog(props: UnifiedDialogProps) {
  // Mobile-first: use sheet on mobile, modal on desktop
  if (props.variant === 'modal' && isMobile()) {
    return <SheetVariant {...props} variant="sheet" />;
  }

  switch (props.variant) {
    case 'modal':
      return <ModalVariant {...props} />;
    case 'sheet':
      return <SheetVariant {...props} />;
    case 'alert':
      return <AlertVariant {...props} />;
  }
}
```

#### 2. UnifiedSkeleton Component

**File Structure**:
```
src/components/skeleton/
├── unified-skeleton.tsx
├── unified-skeleton.types.ts
├── unified-skeleton.config.ts
└── variants/
    ├── text.tsx
    ├── card.tsx
    ├── list.tsx
    └── image.tsx
```

**Type Design**:
```typescript
export type UnifiedSkeletonProps =
  | TextSkeletonProps
  | CardSkeletonProps
  | ListSkeletonProps
  | ImageSkeletonProps;

export interface TextSkeletonProps {
  variant: 'text';
  lines?: number;           // Default: 3
  className?: string;
}

export interface CardSkeletonProps {
  variant: 'card';
  showCover?: boolean;      // Default: true
  lines?: number;           // Default: 3
  className?: string;
}

export interface ListSkeletonProps {
  variant: 'list';
  count?: number;           // Default: 5
  layout?: 'horizontal' | 'vertical';
  className?: string;
}
```

#### 3. UnifiedFormInput Component

**File Structure**:
```
src/components/form/
├── unified-form-input.tsx
├── unified-form-input.types.ts
├── unified-form-input.config.ts
└── variants/
    ├── text.tsx
    ├── number.tsx
    ├── select.tsx
    ├── checkbox.tsx
    └── radio.tsx
```

**Type Design**:
```typescript
export type UnifiedFormInputProps =
  | TextInputProps
  | NumberInputProps
  | SelectInputProps
  | CheckboxInputProps
  | RadioInputProps;

export interface BaseInputProps {
  name: string;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface TextInputProps extends BaseInputProps {
  variant: 'text';
  type?: 'text' | 'email' | 'password' | 'url';
  placeholder?: string;
  maxLength?: number;
}

export interface SelectInputProps extends BaseInputProps {
  variant: 'select';
  options: { label: string; value: string }[];
  placeholder?: string;
  searchable?: boolean;
}
```

### Extension Hooks for 80/20 Rule

For the 20% of use cases not covered out-of-box:

```typescript
// useDialogExtension - Custom dialog content/behavior
export function useDialogExtension(config: {
  renderCustomHeader?: () => React.ReactNode;
  renderCustomFooter?: () => React.ReactNode;
  onBeforeClose?: () => boolean;
}) { /* ... */ }

// useSkeletonExtension - Custom shimmer patterns
export function useSkeletonExtension(config: {
  shimmerVariant?: 'default' | 'pulse' | 'wave';
  customAnimation?: AnimationControls;
}) { /* ... */ }

// useFormInputExtension - Custom validation/logic
export function useFormInputExtension<T>(config: {
  customValidator?: (value: T) => string | null;
  transformOnBlur?: (value: T) => T;
}) { /* ... */ }
```

## Research Task 4: Plan Migration Strategy

### Backward Compatibility Approach

**Principle**: Legacy components remain functional during migration period (FR-005)

**Strategy**:

1. **Phase 1: Creation (Sprint 1)**
   - Create unified components alongside legacy components
   - Add deprecation warnings to legacy components:
     ```typescript
     if (process.env.NODE_ENV === 'development') {
       console.warn(
         '[DEPRECATED] MobileBottomSheet is deprecated. Use UnifiedDialog with variant="sheet" instead. Migration guide: [link]'
       );
     }
     ```
   - No breaking changes to existing code

2. **Phase 2: Gradual Migration (Sprint 2-3)**
   - Migrate by feature area (one feature per PR)
   - Migration priority:
     1. Highest traffic pages (Home, Library, Generate)
     2. Medium traffic pages (Studio, Profile, Settings)
     3. Low traffic pages (About, Help)
   - Each migration PR includes:
     - Replace legacy imports with unified imports
     - Update component props to unified API
     - Verify functionality (manual + automated tests)
     - Update documentation

3. **Phase 3: Cleanup (Sprint 4)**
   - Remove deprecated legacy components
   - Remove deprecation warnings
   - Update imports across remaining files
   - Final validation

### Feature Flag Approach (Optional)

For gradual rollout without breaking changes:

```typescript
// src/config/featureFlags.ts
export const FEATURE_FLAGS = {
  UNIFIED_DIALOGS: process.env.FEATURE_UNIFIED_DIALOGS === 'true',
  UNIFIED_SKELETONS: process.env.FEATURE_UNIFIED_SKELETONS === 'true',
  UNIFIED_FORMS: process.env.FEATURE_UNIFIED_FORMS === 'true',
};

// Usage in components
const Dialog = FEATURE_FLAGS.UNIFIED_DIALOGS
  ? UnifiedDialog
  : LegacyDialog;
```

### Migration Effort Estimates

| Component Family | Pages to Migrate | Est. Time per Page | Total Effort |
|-----------------|------------------|-------------------|--------------|
| Dialogs/Sheets | 20+ | 30-60 min | 10-20 hours |
| Skeletons | 50+ | 15-30 min | 12-25 hours |
| Form Inputs | 15+ | 45-90 min | 11-22 hours |
| **Total** | **85+** | - | **33-67 hours** |

**Estimate**: 1-2 sprints for complete migration (assuming parallel work on multiple features)

## Technical Decisions

### Decision 1: Discriminated Unions for Variant System

**Decision**: Use TypeScript discriminated union types (as in Feature 001) rather than enum-based or string-based variants.

**Rationale**:
- Type safety: TypeScript can narrow types based on `variant` discriminant
- IDE support: Auto-completion shows only valid props for selected variant
- Compile-time checking: Invalid prop combinations caught at build time
- Proven pattern: Successfully used in Feature 001 UnifiedTrackCard

**Alternatives Considered**:
- **String-based variants**: Rejected due to lack of type safety
- **Enum-based variants**: Rejected due to worse IDE experience
- **Separate components**: Rejected due to code duplication

### Decision 2: Mobile-First Responsive Variants

**Decision**: Default to mobile variants (sheet vs modal) with responsive enhancements for desktop.

**Rationale**:
- Constitution Principle I: Mobile-first is non-negotiable for Telegram Mini App
- 95% of users are on mobile devices
- Unified components should "just work" on mobile without configuration
- Desktop enhancements are additive (larger touch targets, hover states)

**Alternatives Considered**:
- **Desktop-first**: Rejected (violates constitution)
- **Separate mobile/desktop components**: Rejected (defeats unification goal)

### Decision 3: Shadcn/UI as Base, Telegram-Optimized for Mobile

**Decision**: Extend shadcn/ui base components for desktop, create Telegram-optimized variants for mobile.

**Rationale**:
- Shadcn/ui provides excellent base components (accessibility, keyboard navigation)
- Telegram SDK integration needed for mobile (haptics, gestures, safe areas)
- Reuse existing MobileBottomSheet as reference implementation
- Avoid reinventing well-solved accessibility problems

**Alternatives Considered**:
- **Build from scratch**: Rejected (high effort, accessibility risk)
- **Use only shadcn/ui**: Rejected (missing Telegram features)

### Decision 4: Gradual Migration with Deprecation Warnings

**Decision**: Keep legacy components functional during transition, add deprecation warnings, migrate incrementally.

**Rationale**:
- FR-005 requires backward compatibility
- Big-bang rewrite is too risky (regressions, merge conflicts)
- Allows testing unified components in production before full migration
- Developers can migrate at their own pace

**Alternatives Considered**:
- **Big-bang rewrite**: Rejected (high risk, violates FR-005)
- **Feature flags**: Rejected (adds complexity, deprecation warnings sufficient)

## Alternatives Considered Summary

| Decision | Chosen Approach | Alternatives Rejected | Reason for Rejection |
|----------|----------------|----------------------|---------------------|
| Variant system | Discriminated unions | String-based, enum-based, separate components | Type safety, IDE support, proven pattern |
| Responsive design | Mobile-first | Desktop-first, separate components | Constitution compliance, 95% mobile users |
| Base components | Shadcn/UI + Telegram | Build from scratch, shadcn-only | Accessibility + Telegram features |
| Migration strategy | Gradual with warnings | Big-bang, feature flags | Backward compatibility, lower risk |

## Performance Considerations

### Bundle Size Impact

**Goal**: Reduce bundle size by 25-50 KB through consolidation (SC-003)

**Analysis**:
- Current duplicate implementations: ~150 KB (estimated)
- Unified implementations: ~80 KB (estimated, shared code)
- Net reduction: ~70 KB (conservative estimate)

**Mitigation**:
- Code-split heavy variants (lazy load)
- Share common logic via hooks
- Tree-shake unused variants
- Monitor with `npm run size` pre-commit hook

### Runtime Performance

**Goal**: Maintain 60 FPS animations (Quality Metrics)

**Considerations**:
- Use CSS transforms for animations (GPU-accelerated)
- Avoid animating width/height (use scale instead)
- Respect `prefers-reduced-motion` media query
- Lazy load heavy components (dialogs, sheets)

**Monitoring**:
- Lighthouse Performance score in CI
- Manual testing on iPhone 12 / Pixel 5
- Frame rate metrics during animations

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

**Target**: 80% code coverage (FR-012)

**Coverage Areas**:
- Variant routing logic (discriminant handling)
- Props validation (type checking)
- Mobile/desktop responsive behavior
- Accessibility attributes (ARIA, keyboard)
- Gesture handling (swipe, long-press)

### Integration Tests (React Testing Library)

**Scenarios**:
- Dialog open/close state management
- Form validation and error handling
- Skeleton loading states
- Menu dropdown/popover interactions

### E2E Tests (Playwright)

**Critical Flows**:
- Open dialog, interact with content, close
- Fill form, submit validation, show errors
- Navigate between skeleton states
- Trigger menu, select action, verify outcome

### Accessibility Tests (axe-core)

**Automated Checks**:
- Touch target size (44-56px minimum)
- ARIA labels and roles
- Keyboard navigation (Tab, Enter, Esc)
- Focus management (trap focus in modals)
- Color contrast (WCAG AA)

## Security Considerations

### Input Validation (Form Components)

- Use Zod for runtime validation (FR-003)
- Sanitize user input (DOMPurify for HTML)
- Prevent XSS attacks (escape output)

### Data Privacy

- No PII in component props
- No logging of sensitive form data
- Respect Telegram data retention policies

## Compliance Checklist

- [x] Constitution Principle I: Mobile-First Development (44-56px touch targets)
- [x] Constitution Principle II: Performance & Bundle Optimization (<950 KB)
- [x] Constitution Principle IV: Component Architecture (shadcn/ui patterns)
- [x] Constitution Principle VII: Accessibility & UX Standards (WCAG AA)
- [x] Constitution Principle VIII: Unified Component Architecture
- [x] Constitution Principle IX: Screen Development Patterns (lazy loading)
- [x] Constitution Principle X: Performance Budget Enforcement

**All applicable principles satisfied.** ✅

## Open Questions

**None** - All technical decisions resolved through research and constitution analysis.

## Next Steps

1. ✅ **COMPLETE** - Research findings documented
2. ⏳ **IN PROGRESS** - Create data-model.md with entity definitions
3. ⏳ **PENDING** - Create contracts/ with TypeScript type definitions
4. ⏳ **PENDING** - Create quickstart.md with migration guide
5. ⏳ **PENDING** - Re-check constitution after Phase 1 design

---

**Research Complete**: All unknowns resolved, ready for Phase 1 design.
