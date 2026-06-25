# Sprint: UI Unification

Owner: UI/UX
Status: 🟢 In progress (Phases 0, 1, 6, 7, 8 complete; Phase 3 EmptyState complete)
Tracker: `docs/UI_UNIFICATION_STATUS.md`
Plan: `.lovable/plan.md`
Map: `docs/UI_AUDIT.md`
Design tokens reference: `docs/DESIGN_TOKENS.md`

## Goal

Eliminate duplicated UI primitives (buttons, cards, empty states,
skeletons, overlays, toasts, motion presets) and converge each UI
concept on a single canonical component, **without touching business
logic, stores, hooks, edge functions, or APIs**.

## Phase ledger

| # | Phase | Status |
| - | ----- | ------ |
| 0 | Inventory (`docs/UI_AUDIT.md`) | ✅ |
| 1 | Design tokens (surfaces, state, motion, scrim) | ✅ |
| 2 | Atoms (Button/Card/Input) — legacy `@deprecated` | 🟡 import sweep in Phase 10 |
| 3 | Molecules: EmptyState / Skeleton / Spinner | 🟢 EmptyState shimmed; skeletons pending |
| 4 | TrackCard convergence | 🟡 canon picked, sweep pending |
| 5 | Headers / layout / SectionHeader | ⏳ |
| 6 | `ResponsiveOverlay` + `useConfirm` | ✅ |
| 7 | Motion presets (`@/lib/motion-presets`) | ✅ |
| 8 | Toast adapter (`@/lib/toast`) | ✅ |
| 9 | A11y sweep (axe-core on key routes) | ⏳ |
| 10 | Hard delete + ESLint `error` rules | ⏳ |

## Tasks

### Done

- [x] Create `docs/UI_AUDIT.md` inventory and decision map.
- [x] Add semantic tokens (`--surface-1/2/3`, `--state-*`, `--overlay-scrim`,
      `--ring-focus`, `--motion-fast/base/slow`) and Tailwind mappings.
- [x] Ship `src/lib/motion-presets.ts` (fadeIn / slideUp / listStagger / interactiveTap).
- [x] Ship `src/lib/toast.ts` (`notify.success/error/info/warning/progress/update`).
- [x] Ship `src/components/ui/ResponsiveOverlay.tsx` + `src/hooks/useConfirm.ts`.
- [x] Mark `RefinedButton`, `RefinedCard`, `InteractiveCard`, `glass-card`,
      `RefinedTrackCard`, legacy `EmptyState` (3 files), legacy loaders
      (`loading-state`, `skeleton-loader`, `ContentSkeleton`) as `@deprecated`.
- [x] Extend `UnifiedEmptyState` to accept `icon: LucideIcon | ReactNode`,
      `action` / `secondaryAction` object props, and `size` alias.
- [x] Convert `ui/EmptyState.tsx`, `ui/empty-state.tsx`,
      `common/EmptyState.tsx` into thin shims over `UnifiedEmptyState`
      (~550 LOC of duplicate JSX removed).
- [x] Convert `ui/FeedbackToast.tsx` into thin shim over `@/lib/toast`.
- [x] Drop dead `InlineEmpty` re-export from `ui/ux-components.ts`.

### Next up

- [ ] Phase 4 sweep: replace `RefinedTrackCard` and `components/track/variants/*`
      usages with `UnifiedTrackCard` (variant=professional).
- [ ] Phase 5 sweep: route `FeaturedSection`, `RecentTracksSection`,
      `TracksGridSection`, `TrackPresetsRow` through `SectionHeader` +
      `UnifiedTrackCard`.
- [ ] Phase 6 sweep: convert nine root-level `*Dialog.tsx` files to
      `ResponsiveOverlay`.
- [ ] Phase 3 (rest): consolidate skeleton/loader/spinner under
      `src/components/ui/skeleton/*` and delete legacy files.
- [ ] Phase 9: `axe-core` sweep over `/`, `/library`, `/studio-v2`, `/projects`.
- [ ] Phase 10: codemod imports, delete `@deprecated` files, lift
      `no-restricted-imports` (`framer-motion`, `lucide-react`) and
      hardcoded-color rules to `error`.

## Out of scope

- Visual redesign or new branding.
- Backend, RLS, edge functions, AI calls.
- Swapping shadcn/ui for another component library.
