/**
 * Custom events for cross-component communication
 * Used for actions like opening sheets/dialogs from components that don't have direct access
 */

export const OPEN_GENERATE_SHEET_EVENT = "open-generate-sheet";

export function dispatchOpenGenerateSheet(): void {
  window.dispatchEvent(new CustomEvent(OPEN_GENERATE_SHEET_EVENT));
}

export function listenOpenGenerateSheet(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(OPEN_GENERATE_SHEET_EVENT, handler);
  return () => window.removeEventListener(OPEN_GENERATE_SHEET_EVENT, handler);
}
