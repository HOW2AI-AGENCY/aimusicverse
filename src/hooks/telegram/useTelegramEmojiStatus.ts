/**
 * Telegram Emoji Status Hook
 *
 * Allows setting the user's emoji status via Telegram Mini App.
 * Available in Telegram Mini App 2.0+ for Premium users.
 *
 * @example
 * ```tsx
 * const { setStatus, clearStatus, isSupported } = useTelegramEmojiStatus();
 *
 * // When user starts generation
 * setStatus('🎵', 3600); // 1 hour
 *
 * // When generation completes
 * clearStatus();
 * ```
 */

import { useCallback } from "react";
import { useTelegram } from "@/contexts/TelegramContext";

interface UseTelegramEmojiStatusReturn {
  isSupported: boolean;
  setStatus: (emojiId: string, duration?: number) => void;
  clearStatus: () => void;
}

const EMOJI_MAP: Record<string, string> = {
  generating: "5368417087582371478", // 🎵 music note
  listening: "5368417087582371479", // 🎧 headphones
  studio: "5368417087582371480", // 🎤 mic
};

export function useTelegramEmojiStatus(): UseTelegramEmojiStatusReturn {
  const { webApp, isInitialized } = useTelegram();

  const isSupported = !!(isInitialized && webApp?.setEmojiStatus);

  const setStatus = useCallback(
    (key: string, duration: number = 3600) => {
      if (!isSupported) return;
      try {
        const emojiId = EMOJI_MAP[key] || key;
        webApp!.setEmojiStatus(emojiId, { duration });
      } catch {
        // Premium-only feature, fail silently
      }
    },
    [isSupported, webApp],
  );

  const clearStatus = useCallback(() => {
    if (!isSupported) return;
    try {
      webApp!.setEmojiStatus("", { duration: 0 });
    } catch {
      // Fail silently
    }
  }, [isSupported, webApp]);

  return { isSupported, setStatus, clearStatus };
}
