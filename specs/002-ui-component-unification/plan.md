# Implementation Plan: UI Component Unification Phase 2

**Branch**: `002-ui-component-unification` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ui-component-unification/spec.md`

## Summary

Continue the UI component unification effort started in Feature 001 by identifying and consolidating duplicate component patterns throughout the MusicVerse AI codebase. Feature 001 successfully unified 5 duplicate track card implementations into a single component with 7 variants. Phase 2 will apply the same patterns (discriminated unions, variant systems, mobile-first design, extracted hooks) to other high-impact component families: dialogs/sheets, skeletons, forms, and action menus.

**Technical Approach**: Audit the codebase for duplicate component patterns, prioritize by impact (duplication level × usage frequency), create unified components with variant systems following Feature 001's UnifiedTrackCard pattern, maintain backward compatibility during gradual migration, and ensure 100% constitution compliance (bundle size <950KB, mobile-first, accessibility).

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2
**Primary Dependencies**: TanStack Query 5.90, Zustand 5.0, Radix UI, Framer Motion, @twa-dev/sdk 8.0.2
**Storage**: Supabase (PostgreSQL + Edge Functions + Storage)
**Testing**: Jest 30.2, React Testing Library, Playwright 1.57
**Target Platform**: Telegram Mini App (iOS Safari 15+, Chrome Android 100+, Telegram native clients)
**Project Type**: Web application (Telegram Mini App)
**Performance Goals**:
- Bundle size: <950 KB (hard limit, enforced by size-limit)
- Animations: 60 FPS on iPhone 12 / Pixel 5
- Initial render time: No increase from baseline (Lighthouse Performance score)
- Development time: 30% faster for new features using unified components
**Constraints**:
- Bundle size budget: 950 KB total gzip (enforced by pre-commit hook)
- Mobile-first: Portrait layout 375×667px to 430×932px, touch targets 44-56px
- Constitution compliance: 100% (all 10 principles)
- Backward compatibility: Cannot break existing functionality
- Timeline: Single sprint scope (2-3 weeks)
- Testing coverage: 80% minimum for new components
**Scale/Scope**:
- Consolidate at least 3 component families (dialogs, skeletons, forms, or menus)
- Reduce duplicate code by 1,000+ lines
- 890+ existing components in codebase
- 40+ pages with component usage patterns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Assessment

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Development | ✅ PASS | Feature explicitly requires mobile-first design with 44-56px touch targets (FR-009, SC-010) |
| II. Performance & Bundle Optimization | ✅ PASS | FR-011 and SC-003 maintain bundle size ≤950 KB, consolidation should reduce bundle by 25-50 KB |
| III. Audio Architecture | ⚪ N/A | Not applicable to this feature (no audio components) |
| IV. Component Architecture | ✅ PASS | FR-006 requires variant system, FR-007 requires discriminated unions, follows shadcn/ui patterns |
| V. State Management Strategy | ✅ PASS | FR-014 references Feature 001 patterns (TanStack Query, Zustand, React Hook Form) |
| VI. Security & Privacy | ⚪ N/A | No new security requirements (UI components only) |
| VII. Accessibility & UX Standards | ✅ PASS | FR-009 requires 44-56px touch targets, Quality Metrics require WCAG AA compliance |
| VIII. Unified Component Architecture | ✅ PASS | Builds on Feature 001 patterns, FR-006 requires variant system similar to UnifiedTrackCard |
| IX. Screen Development Patterns | ✅ PASS | FR-014 requires following established patterns (lazy loading, TanStack Query, Framer Motion) |
| X. Performance Budget Enforcement | ✅ PASS | SC-003 sets target ≤950 KB, ideally reduce by 25-50 KB through consolidation |

### Gate Status: ✅ **PASS** (8/8 applicable principles)

**No violations detected.** Feature aligns with all applicable constitution principles. Re-check after Phase 1 design to ensure implementation details maintain compliance.

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-component-unification/
├── spec.md              # Feature specification (COMPLETE)
├── plan.md              # This file - implementation plan (IN PROGRESS)
├── research.md          # Phase 0 output - technical research
├── data-model.md        # Phase 1 output - component entities and types
├── quickstart.md        # Phase 1 output - developer onboarding guide
├── contracts/           # Phase 1 output - TypeScript type definitions
│   ├── unified-dialog.types.ts
│   ├── unified-skeleton.types.ts
│   ├── unified-form.types.ts
│   └── unified-menu.types.ts
└── tasks.md             # Phase 2 output - detailed task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
# Web application structure (existing, will be extended)
src/
├── components/
│   ├── ui/                          # Base shadcn/ui components (existing)
│   │   ├── dialog.tsx               # [EXISTING - will be deprecated/replaced]
│   │   ├── sheet.tsx                # [EXISTING - will be deprecated/replaced]
│   │   └── ... (other base components)
│   ├── mobile/                      # Mobile-specific components (existing)
│   │   ├── MobileBottomSheet.tsx    # [EXISTING - reference for unified dialog]
│   │   ├── MobileActionSheet.tsx    # [EXISTING - reference for unified menu]
│   │   └── ... (other mobile components)
│   ├── track/                       # Track components (Feature 001 reference)
│   │   ├── track-card.tsx           # [REFERENCE - unified component pattern]
│   │   ├── track-card.types.ts      # [REFERENCE - discriminated union pattern]
│   │   └── variants/                # [REFERENCE - variant implementations]
│   ├── dialog/                      # [NEW - unified dialog family]
│   │   ├── unified-dialog.tsx       # Main unified dialog component
│   │   ├── unified-dialog.types.ts  # Discriminated union types
│   │   ├── unified-dialog.config.ts # Variant configurations
│   │   └── variants/                # Variant implementations
│   │       ├── modal.tsx
│   │       ├── sheet.tsx
│   │       └── alert.tsx
│   ├── skeleton/                    # [NEW - unified skeleton family]
│   │   ├── unified-skeleton.tsx
│   │   ├── unified-skeleton.types.ts
│   │   └── variants/
│   │       ├── text.tsx
│   │       ├── card.tsx
│   │       ├── list.tsx
│   │       └── image.tsx
│   ├── form/                        # [NEW - unified form input family]
│   │   ├── unified-form-input.tsx
│   │   ├── unified-form-input.types.ts
│   │   └── variants/
│   │       ├── text.tsx
│   │       ├── number.tsx
│   │       ├── select.tsx
│   │       ├── checkbox.tsx
│   │       └── radio.tsx
│   └── menu/                        # [NEW - unified action menu family]
│       ├── unified-menu.tsx
│       ├── unified-menu.types.ts
│       └── variants/
│           ├── dropdown.tsx
│           └── popover.tsx
├── hooks/
│   ├── dialog/                      # [NEW - dialog-specific hooks]
│   │   ├── use-dialog-state.ts
│   │   └── use-dialog-gesture.ts
│   ├── form/                        # [NEW - form-specific hooks]
│   │   └── use-form-validation.ts
│   └── ... (existing hooks)
├── lib/
│   └── motion-variants.ts           # [EXISTING - will be extended with new variants]
└── types/
    └── component-registry.ts        # [NEW - unified component type registry]

tests/
├── unit/
│   ├── components/
│   │   ├── dialog/                  # [NEW - unified dialog tests]
│   │   ├── skeleton/                # [NEW - unified skeleton tests]
│   │   ├── form/                    # [NEW - unified form tests]
│   │   └── menu/                    # [NEW - unified menu tests]
│   └── hooks/
│       ├── dialog/                  # [NEW - dialog hook tests]
│       └── form/                    # [NEW - form hook tests]
└── integration/
    └── unified-components/          # [NEW - integration tests]
```

**Structure Decision**: This is a web application (Telegram Mini App) following the established structure from Feature 001. The new unified component families will be organized in parallel to the existing track components, following the same pattern: main component file, types file with discriminated unions, config file, and variants subdirectory. Legacy components will remain during migration period (backward compatibility requirement FR-005).

## Complexity Tracking

> **No complexity violations.** Constitution Check passed all applicable principles. This section is not required.

## Phase 0: Research & Technical Decisions

### Research Tasks

1. **Audit existing component patterns** - Identify all duplicate component implementations across the codebase
   - Search for multiple dialog/sheet implementations
   - Search for multiple skeleton/loading implementations
   - Search for multiple form input implementations
   - Search for multiple action menu implementations
   - Measure duplication level (lines of code, file count, usage frequency)

2. **Prioritize component families for consolidation** - Apply impact = duplication level × usage frequency
   - Create matrix of component families vs. impact scores
   - Select top 3 families for Phase 2 implementation
   - Document rationale for prioritization

3. **Design unified component architecture** - Extend Feature 001 patterns
   - Reference [UnifiedTrackCard implementation](../../src/components/track/track-card.tsx)
   - Reference [discriminated union types](../../src/components/track/track-card.types.ts)
   - Design variant system for each component family
   - Design extension hooks for 80/20 rule (80% out-of-box, 20% custom)

4. **Plan migration strategy** - Ensure backward compatibility (FR-005)
   - Design deprecation warnings for legacy components
   - Design feature flags or page-level opt-in approach
   - Document incremental migration process by feature area
   - Estimate migration effort per component family

### Research Output

See [research.md](./research.md) for detailed findings, decisions, and alternatives considered.

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md) for component entity definitions, TypeScript interfaces, and state management patterns.

### API Contracts

See [contracts/](./contracts/) directory for TypeScript type definitions:
- `unified-dialog.types.ts` - Dialog component variant types
- `unified-skeleton.types.ts` - Skeleton component variant types
- `unified-form.types.ts` - Form input component variant types
- `unified-menu.types.ts` - Menu component variant types

### Developer Onboarding

See [quickstart.md](./quickstart.md) for:
- Quick start guide for using unified components
- Migration guide from legacy components
- Common patterns and best practices
- Troubleshooting and FAQ

### Agent Context Update

After Phase 1 design, run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude` to update Claude's context with:
- New unified component patterns
- Discriminated union type conventions
- Variant system architecture
- Migration strategy from legacy components

## Phase 2: Implementation Planning (NEXT STEP)

**Note**: This phase is handled by the `/speckit.tasks` command, which will create [tasks.md](./tasks.md) with detailed, actionable tasks broken down by:

1. **Audit & Preparation** - Codebase analysis, baseline measurements
2. **Component Family 1 Implementation** - (e.g., Dialog/Sheet family)
3. **Component Family 2 Implementation** - (e.g., Skeleton family)
4. **Component Family 3 Implementation** - (e.g., Form Input family)
5. **Testing & Documentation** - Unit tests, integration tests, migration guides
6. **Migration & Validation** - Incremental migration, bundle size validation

Each task will have:
- Clear acceptance criteria
- Dependencies on other tasks
- Estimated complexity (simple/medium/complex)
- Constitution compliance checks
- Bundle size impact assessment

## Constitution Re-Check (Post-Design)

*To be completed after Phase 1 design artifacts are generated.*

**Status**: ⏳ **PENDING** (awaiting Phase 1 completion)

**Expected Outcome**: ✅ **PASS** - All design decisions align with constitution principles. Will verify after data-model.md and contracts are created.

## Success Metrics

From feature spec [Success Criteria](./spec.md#success-criteria):

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Component families consolidated | ≥3 | Count of unified families delivered |
| Duplicate code reduction | ≥1,000 lines | Before/after codebase metrics |
| Bundle size | ≤950 KB (target -25 to -50 KB) | `npm run size` pre-commit hook |
| Test coverage | ≥80% | Jest coverage reports |
| Development time improvement | ≥30% | Developer surveys or task timing |
| Visual consistency | 95% | Design system audit or manual review |
| Constitution compliance | 100% | All 10 applicable principles |
| Migration guide completeness | <1 hour adoption | Time to adopt per feature area |
| Zero regressions | 100% E2E pass rate | Playwright E2E tests |
| Touch target compliance | 100% | All elements 44×44px minimum |

## Next Steps

1. ✅ **COMPLETE** - Feature specification created ([spec.md](./spec.md))
2. ✅ **COMPLETE** - Specification validated ([checklists/requirements.md](./checklists/requirements.md))
3. ✅ **COMPLETE** - Clarification session completed (0 questions needed)
4. ✅ **COMPLETE** - Implementation plan started (this file)
5. ⏳ **IN PROGRESS** - Phase 0: Research & Technical Decisions → [research.md](./research.md)
6. ⏳ **PENDING** - Phase 1: Design & Contracts → [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)
7. ⏳ **PENDING** - Agent context update
8. ⏳ **PENDING** - Constitution re-check (post-design)
9. ⏳ **PENDING** - Phase 2: `/speckit.tasks` command to create detailed task breakdown

---

**Command**: This plan is generated by `/speckit.plan`. Execute `/speckit.tasks` to create the detailed task breakdown.
