# UI Audit & Unification Map

Status: Phase 0 deliverable. Source of truth for the multi-phase UI unification
plan in `.lovable/plan.md`. Every row below tells contributors which
implementation is the canonical one and which paths must end up as thin
`@deprecated` re-exports before being deleted in Phase 10.

> Scope: presentation layer only. Stores, hooks, edge functions, and APIs are
> intentionally out of scope.

## Legend

- **Canon** — the single file that survives.
- **Deprecate** — file kept temporarily as a re-export from the canon, then
  removed in Phase 10.
- **Delete** — file removed once no imports remain (codemod target).
- **Action** — short description of the migration step.

---

## 1. Track cards

| Current file | Decision | Notes |
| --- | --- | --- |
| `src/components/track/track-card-new/UnifiedTrackCard.tsx` | **Canon** | Already supports `variant` + `size`. Becomes the only public entry. |
| `src/components/track/track-card-new/variants/*` | Keep | Internal variants used by the canon. |
| `src/components/ui/RefinedTrackCard.tsx` | Deprecate → Delete | Re-export `UnifiedTrackCard` with `variant="professional"`. |
| `src/components/track/variants/index.ts` | Delete | Empty barrel, no implementations. |
| Inline card markup inside `src/components/home/FeaturedSection.tsx`, `RecentTracksSection.tsx`, `TracksGridSection.tsx`, `TrackPresetsRow.tsx` | Refactor | Replace inline JSX with `UnifiedTrackCard` + appropriate `variant`. |

Skeleton: `src/components/ui/skeleton/TrackCardSkeleton.tsx` becomes canonical;
it must accept the same `variant` prop.

## 2. Empty states

| File | Decision |
| --- | --- |
| `src/components/ui/unified-empty-state.tsx` | **Canon** → rename to `src/components/ui/empty-state.tsx` after migration |
| `src/components/ui/empty-state.tsx` | Deprecate → Delete |
| `src/components/ui/EmptyState.tsx` | Deprecate → Delete |
| `src/components/common/EmptyState.tsx` | Deprecate → Delete |

Canonical API:

```ts
type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void } | ReactNode;
  className?: string;
};
```

## 3. Headers

| File | Decision | Notes |
| --- | --- | --- |
| `src/components/common/UnifiedPageHeader.tsx` | **Canon** | Will be re-exported from `src/components/ui/PageHeader.tsx`. |
| `src/components/common/SectionHeader.tsx` | **Canon** | Already standard (see `mem://ui/standardized-section-header-component-pattern`). |
| `src/components/mobile/MobileHeaderBar.tsx` | Keep | Telegram-aware wrapper over `PageHeader` (safe-area + back-button proxy). |
| `src/components/ui/Heading.tsx` | **Canon** | Used everywhere `<h1..h3>` would appear. |

Forbidden after Phase 5: ad-hoc `<h1 className="text-2xl ...">` blocks inside
pages or feature components.

## 4. Skeletons

| File | Decision |
| --- | --- |
| `src/components/ui/skeleton/` (PageSkeleton, ProfileSkeleton, ProjectCardSkeleton, TrackCardSkeleton) | **Canon** directory |
| `src/components/ui/skeletons/TrackListSkeleton.tsx` | Move into `ui/skeleton/` then delete the `skeletons/` dir |
| `src/components/ui/skeleton-loader.tsx` | Delete |
| `src/components/ui/skeleton-components.tsx` | Delete |
| `src/components/ui/ContentSkeleton.tsx` | Delete |

## 5. Loaders & progress

| File | Decision |
| --- | --- |
| `src/components/ui/LoadingSpinner.tsx` | **Canon** for inline spinner |
| `src/components/ui/LoadingOverlay.tsx` | **Canon** for blocking overlay |
| `src/components/ui/loading-state.tsx` | Deprecate → Delete (use `Spinner` + `EmptyState`) |
| `src/components/ui/ProgressSteps.tsx` | **Canon** for multi-step UX (Custom/Extend/Cover generation) |
| `src/components/GlobalGenerationIndicator.tsx` | Keep, refactor to use `ProgressSteps` internally |

## 6. Overlays (Dialog / Sheet / Drawer / ActionSheet)

Rule: mobile → `MobileBottomSheet` (vaul). Desktop → `Dialog`. Pick automatically
via a new helper `src/components/ui/ResponsiveOverlay.tsx`.

Files to migrate onto `ResponsiveOverlay` (and lose their bespoke dialog shells):

- `src/components/AddInstrumentalDialog.tsx`
- `src/components/AddVocalsDialog.tsx`
- `src/components/AudioCoverDialog.tsx`
- `src/components/AudioExtendDialog.tsx`
- `src/components/ConfirmationDialog.tsx` → becomes thin wrapper exposed via `useConfirm()`
- `src/components/CreateArtistDialog.tsx`
- `src/components/ExtendTrackDialog.tsx`
- `src/components/NewArrangementDialog.tsx`
- `src/components/TrackDetailDialog.tsx` + `TrackDetailSheet.tsx` → collapse into one
- `src/components/ui/ActionSheet.tsx` → keep as preset (mobile bottom action list)

## 7. Buttons, cards, inputs

| Old | Decision |
| --- | --- |
| `src/components/ui/RefinedButton.tsx` | Deprecate → Delete; expose `variant="premium"` on `button.tsx` |
| `src/components/ui/RefinedCard.tsx` | Deprecate → Delete; expose `variant="surface"` on `card.tsx` |
| `src/components/ui/InteractiveCard.tsx` | Deprecate → Delete; expose `variant="interactive"` on `card.tsx` |
| `src/components/ui/glass-card.tsx` | Deprecate → Delete; expose `variant="glass"` on `card.tsx` |
| `src/components/ui/FloatingInput.tsx` | Keep as specialised wrapper over `input.tsx` |
| `src/components/ui/ChipInput.tsx` | Keep as specialised wrapper |

## 8. Toasts & feedback

| File | Decision |
| --- | --- |
| `src/components/ui/FeedbackToast.tsx` | Delete |
| `src/lib/toast.ts` (new) | **Canon** thin adapter over `sonner` with `success / error / info / progress` |
| Ad-hoc `toast.loading` step chain in `src/hooks/generation/useGenerateForm.ts` | Replace with `ProgressSteps` mounted in the generate sheet, keep `toast.progress` as fallback |

## 9. Effects (motion, haptics)

- Only allowed motion import: `from "@/lib/motion"`. Codemod replaces
  `from "framer-motion"`.
- Only allowed icon import: `from "@/lib/icons"`. Codemod replaces
  `from "lucide-react"`.
- New `src/lib/motion-presets.ts` exposes `fadeIn / slideUp / scaleIn /
  listStagger`. All ad-hoc `whileHover={{ ... }}` inline configs must use these.
- Haptics only via the standardised `impact()` API (see `mem://ux/standardized-haptic-feedback`).
- Motion durations come from CSS variables `--motion-fast | --motion-base | --motion-slow`.

## 10. Tokens

Single source of truth = `src/index.css` + `tailwind.config.ts` +
`src/lib/design-tokens.ts` + `src/lib/glass.ts`. Phase 1 reconciles them and
adds the missing semantic tokens (`--surface-1/2/3`, `--overlay-scrim`,
`--ring-focus`, `--state-success|warning|danger`, `--motion-*`).

Forbidden classes anywhere in `src/components/` and `src/pages/`:

- `text-white`, `text-black`
- `bg-white`, `bg-black`
- `bg-[#...]`, `text-[#...]` (any arbitrary hex)
- Direct `lucide-react` / `framer-motion` imports

These rules ship as ESLint `warn` in Phase 1, get raised to `error` in Phase 10.

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
- Replacing `shadcn/ui` with another library.
- Any backend, store, or hook behaviour change.
