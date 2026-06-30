import { useCallback, useRef } from "react";
import { useLyricsWizardStore } from "@/stores/lyricsWizardStore";

/**
 * Debounced wrapper around lyricsWizardStore.updateSectionContent.
 * Use this in text inputs to avoid pushing every keystroke to history.
 */
export function useDebouncedSectionUpdate(delayMs = 600) {
  const updateSectionContent = useLyricsWizardStore((s) => s.updateSectionContent);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (sectionId: string, content: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        updateSectionContent(sectionId, content);
      }, delayMs);
    },
    [updateSectionContent, delayMs],
  );
}
