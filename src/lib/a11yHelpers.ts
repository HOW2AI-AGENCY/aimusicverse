/**
 * Accessibility helper utilities
 * Feature: 033-mobile-ui-improvements
 *
 * Companion to src/lib/a11y.tsx — provides imperative helpers
 * for cases where React hooks are not suitable.
 */

export { announceToScreenReader } from "@/lib/a11y";

export function trapFocus(container: HTMLElement): () => void {
  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusable = container.querySelectorAll<HTMLElement>(focusableSelector);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };

  first?.focus();
  container.addEventListener("keydown", handleKeyDown);

  return () => container.removeEventListener("keydown", handleKeyDown);
}

export function handleKeyboardNavigation(
  e: React.KeyboardEvent,
  itemCount: number,
  currentIndex: number,
  onNavigate: (index: number) => void,
  options?: { loop?: boolean; orientation?: "horizontal" | "vertical" | "both" },
): number {
  const { loop = true, orientation = "vertical" } = options ?? {};
  const verticalKeys = ["ArrowUp", "ArrowDown"];
  const horizontalKeys = ["ArrowLeft", "ArrowRight"];
  const allowedKeys =
    orientation === "both"
      ? [...verticalKeys, ...horizontalKeys]
      : orientation === "vertical"
        ? verticalKeys
        : horizontalKeys;

  if (!allowedKeys.includes(e.key)) return currentIndex;

  e.preventDefault();
  const isNext = e.key === "ArrowDown" || e.key === "ArrowRight";
  const maxIndex = itemCount - 1;

  let newIndex: number;
  if (isNext) {
    newIndex = currentIndex >= maxIndex ? (loop ? 0 : maxIndex) : currentIndex + 1;
  } else {
    newIndex = currentIndex <= 0 ? (loop ? maxIndex : 0) : currentIndex - 1;
  }

  onNavigate(newIndex);
  return newIndex;
}
