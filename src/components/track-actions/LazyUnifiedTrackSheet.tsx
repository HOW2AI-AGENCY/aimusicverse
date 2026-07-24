/**
 * LazyUnifiedTrackSheet
 *
 * Code-split wrapper around the full track-actions sheet. The heavy module
 * (dialogs portal, section icons, stems/versions data) is only fetched once
 * the sheet is actually opened, so the library grid and other callers pay
 * nothing on first render.
 *
 * Callers keep the same import path via `@/components/track-actions`.
 */
import { lazy, Suspense, type ComponentProps } from "react";

const InnerUnifiedTrackSheet = lazy(() =>
  import("./UnifiedTrackSheet").then((m) => ({ default: m.UnifiedTrackSheet })),
);

type Props = ComponentProps<typeof InnerUnifiedTrackSheet>;

export function UnifiedTrackSheet(props: Props) {
  // Don't pay the download cost until the user actually opens the sheet.
  if (!props.open) return null;

  return (
    <Suspense fallback={null}>
      <InnerUnifiedTrackSheet {...props} />
    </Suspense>
  );
}
