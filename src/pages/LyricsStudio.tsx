/**
 * LyricsStudio — page entry point.
 *
 * Исходный 1092-LOC god-page декомпозирован в Sprint 042 на 5 sub-компонентов
 * (LyricsHeader, LyricsEditor, LyricsTagsPanels, LyricsAIPanel, LyricsFooter) +
 * утилиты (sections.ts, types.ts). Этот файл — тонкий re-export для
 * сохранения публичного API, на который ссылается src/App.tsx:154.
 */
export { default } from "./lyrics-studio/LyricsStudioPage";
