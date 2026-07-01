/**
 * Public API для декомпозированной LyricsStudio-страницы.
 *
 * Sprint 042: исходный `src/pages/LyricsStudio.tsx` (1092 → ... LOC) распущен
 * на 4 sub-компонента + helpers. Этот barrel — единственная точка импорта
 * для оркестратора.
 */

export { LyricsHeader } from "./LyricsHeader";
export { LyricsEditor } from "./LyricsEditor";
export { LyricsTagsPanels } from "./LyricsTagsPanels";
export { LyricsAIPanel } from "./LyricsAIPanel";
export { LyricsFooter } from "./LyricsFooter";
export { parseLyricsToSections, sectionsToLyrics } from "./sections";
export type { ProjectTrackForLyrics, ProjectDataForLyrics, TracklistItemForLyrics } from "./types";
