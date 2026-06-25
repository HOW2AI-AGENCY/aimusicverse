# UI Audit & Unification Map

Status: Phases 0, 1, 6, 7, 8 complete. Phases 3, 4 marked with `@deprecated`
JSDoc on every legacy file. Phases 5, 9, 10 remain (codemod sweeps + final
cleanup).

Source of truth for the multi-phase plan in `.lovable/plan.md`. Every row below
tells contributors which implementation is canonical and which paths must end
up as thin `@deprecated` re-exports before being deleted in Phase 10.

> Scope: presentation layer only. Stores, hooks, edge functions, and APIs are
> intentionally out of scope.

## Phase status

| Phase | Topic                                | Status |
| ----- | ------------------------------------ | ------ |
| 0     | Inventory                            | ✅ this document |
| 1     | Tokens + ESLint guardrails           | ✅ semantic surfaces, state, motion aliases added to `src/index.css` + `tailwind.config.ts`; `no-restricted-imports` already blocks `framer-motion` / `lucide-react` |
| 2     | Base atoms (Button/Card/Input)       | ⏳ canon = shadcn; legacy `Refined*`, `InteractiveCard`, `glass-card` marked `@deprecated` |
| 3     | EmptyState / Skeleton / Spinner      | ⏳ canon = `UnifiedEmptyState`; 3 legacy `EmptyState` + 3 legacy skeleton/loader files marked `@deprecated` |
| 4     | TrackCard                            | ⏳ canon = `UnifiedTrackCard`; `RefinedTrackCard` marked `@deprecated`; per-page inline cards still to migrate |
| 5     | Headers / layout                     | 🟡 canon = `UnifiedPageHeader` + `SectionHeader`; needs sweep of pages to drop ad-hoc `<h1>` |
| 6     | Overlays                             | ✅ `UnifiedDialog` exists, added `ResponsiveOverlay` wrapper + `useConfirm()` |
| 7     | Motion presets                       | ✅ `@/lib/motion-presets` shipped (re-exports `@/lib/motion`) |
| 8     | Toast adapter                        | ✅ `@/lib/toast` (`notify.{success/error/info/warning/progress/update}`) |
| 9     | A11y sweep                           | ⏳ |
| 10    | Hard delete + ESLint errors          | ⏳ |

## Legend

- **Canon** — the single file that survives.
- **Deprecate** — file kept temporarily as a re-export from the canon, then
  removed in Phase 10.
- **Delete** — file removed once no imports remain (codemod target).

---

## 1. Track cards

| Current file | Decision | Notes |
| --- | --- | --- |
| `src/components/track/track-card-new/UnifiedTrackCard.tsx` | **Canon** | Already supports `variant` + `size`. |
| `src/components/track/track-card-new/variants/*` | Keep | Internal variants. |
| `src/components/ui/RefinedTrackCard.tsx` | `@deprecated` → Delete | Replace with `UnifiedTrackCard variant="professional"`. |
| `src/components/track/variants/index.ts` | Delete | Empty barrel. |
| Inline cards in `src/components/home/*Section.tsx` | Refactor to `UnifiedTrackCard`. |

## 2. Empty states

| File | Decision |
| --- | --- |
| `src/components/ui/unified-empty-state.tsx` | **Canon** |
| `src/components/ui/empty-state.tsx` | `@deprecated` → Delete |
| `src/components/ui/EmptyState.tsx` | `@deprecated` → Delete |
| `src/components/common/EmptyState.tsx` | `@deprecated` → Delete |

## 3. Headers

| File | Decision |
| --- | --- |
| `src/components/common/UnifiedPageHeader.tsx` | **Canon** (page header) |
| `src/components/common/SectionHeader.tsx` | **Canon** (section header) |
| `src/components/mobile/MobileHeaderBar.tsx` | Keep — Telegram-aware wrapper |
| `src/components/ui/Heading.tsx` | **Canon** for raw `<h1..h3>` content |

## 4. Skeletons & loaders

| File | Decision |
| --- | --- |
| `src/components/ui/skeleton/*` | **Canon** directory |
| `src/components/ui/skeleton-components.tsx` | Keep — unified skeletons live here |
| `src/components/ui/skeletons/TrackListSkeleton.tsx` | Move into `skeleton/` then delete |
| `src/components/ui/skeleton-loader.tsx` | `@deprecated` → Delete |
| `src/components/ui/ContentSkeleton.tsx` | `@deprecated` → Delete |
| `src/components/ui/loading-state.tsx` | `@deprecated` → Delete |
| `src/components/ui/LoadingSpinner.tsx` | **Canon** inline spinner |
| `src/components/ui/LoadingOverlay.tsx` | **Canon** blocking overlay |
| `src/components/ui/ProgressSteps.tsx` | **Canon** for multi-step UX |

## 5. Overlays

Rule: mobile → bottom sheet, desktop → modal. `UnifiedDialog` already routes
between `modal | sheet | alert`. New wrapper `ResponsiveOverlay` picks the
variant by viewport so callers don't branch.

| File | Decision |
| --- | --- |
| `src/components/dialog/unified-dialog.tsx` (`UnifiedDialog`) | **Canon** |
| `src/components/ui/ResponsiveOverlay.tsx` | **Canon** wrapper |
| `src/hooks/useConfirm.ts` + `ConfirmProvider` | **Canon** for confirm prompts |
| `src/components/ConfirmationDialog.tsx` | Keep — already a thin wrapper |
| Root-level `*Dialog.tsx` (AddInstrumental, AddVocals, AudioCover, AudioExtend, CreateArtist, ExtendTrack, NewArrangement, TrackDetail, TrackDetailSheet) | Migrate to `ResponsiveOverlay`; remove bespoke shells |

## 6. Buttons / cards / inputs

| Old | Decision |
| --- | --- |
| `src/components/ui/RefinedButton.tsx` | `@deprecated` → Delete |
| `src/components/ui/RefinedCard.tsx` | `@deprecated` → Delete |
| `src/components/ui/InteractiveCard.tsx` | `@deprecated` → Delete |
| `src/components/ui/glass-card.tsx` | `@deprecated` → Delete |
| `src/components/ui/FloatingInput.tsx` | Keep — specialised wrapper |
| `src/components/ui/ChipInput.tsx` | Keep — specialised wrapper |

## 7. Toasts & feedback

| File | Decision |
| --- | --- |
| `src/lib/toast.ts` (`notify`) | **Canon** — sonner adapter |
| `src/components/ui/FeedbackToast.tsx` | Delete after callers migrated |
| Ad-hoc `toast.loading` step chain in `useGenerateForm.ts` | Switch to `notify.progress` + `ProgressSteps` |

## 8. Motion & haptics

- Only motion import allowed: `from "@/lib/motion"`.
- Canonical variants: `@/lib/motion-presets` (`presets.fadeIn / slideUp /
  scaleIn / listStagger / listItem`, `transitions.fast/base/slow`,
  `interactiveTap`).
- Icons only from `@/lib/icons`.
- Haptics via the standardised `impact()` API
  (see `mem://ux/standardized-haptic-feedback`).
- Motion durations use the new CSS aliases `--motion-fast | --motion-base |
  --motion-slow`.

## 9. Tokens

Source of truth = `src/index.css` + `tailwind.config.ts` +
`src/lib/design-tokens.ts` + `src/lib/glass.ts`.

Phase 1 added the semantic surface, state, scrim, focus-ring and motion-alias
tokens. Forbidden classes anywhere in `src/components/` and `src/pages/`:

- `text-white`, `text-black`, `bg-white`, `bg-black`
- arbitrary hex literals: `bg-[#...]`, `text-[#...]`, `border-[#...]`
- direct `lucide-react` / `framer-motion` imports

These rules will be raised from ESLint `warn` to `error` in Phase 10.

---

## Success metrics

- `ls src/components/ui | wc -l` drops from 94 → ~60.
- One `UnifiedTrackCard` component used by all surfaces.
- Zero direct imports of `framer-motion` / `lucide-react` outside
  `src/lib/motion.ts` / `src/lib/icons.ts`.
- Zero hard-coded color classes in `src/components` and `src/pages`.
- Bundle size unchanged or smaller (target −30…−60 KB).

## Out of scope

- Visual redesign / new brand direction.
- Replacing `shadcn/ui`.
- Any backend, store, or hook behaviour change.
