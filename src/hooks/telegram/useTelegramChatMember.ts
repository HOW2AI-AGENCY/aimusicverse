/**
 * Telegram Chat Member Status Hook
 *
 * Checks if the user is a member of a specified Telegram chat/channel.
 * Uses Telegram WebApp API when available, falls back to bot getChatMember.
 *
 * @example
 * ```tsx
 * const { isMember, checkMembership } = useTelegramChatMember('@musicverse_channel');
 *
 * // Gate premium features behind channel subscription
 * if (!isMember) {
 *   return <SubscribePrompt channel="@musicverse_channel" />;
 * }
 * ```
 */

import { useState, useCallback } from "react";
import { useTelegram } from "@/contexts/TelegramContext";

interface UseTelegramChatMemberReturn {
  isSupported: boolean;
  isMember: boolean | null;
  isLoading: boolean;
  checkMembership: () => Promise<boolean>;
}

export function useTelegramChatMember(channelUsername: string): UseTelegramChatMemberReturn {
  const { webApp, isInitialized } = useTelegram();
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSupported = !!(isInitialized && (webApp?.isChatMember || webApp?.openTelegramLink));

  const checkMembership = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);

    try {
      // Method 1: Use WebApp.isChatMember if available (Mini App 2.0+)
      if (webApp?.isChatMember) {
        const result = await new Promise<boolean>((resolve) => {
          webApp!.isChatMember!(channelUsername, (status: string) => {
            resolve(status === "member" || status === "administrator" || status === "creator");
          });
        });
        setIsMember(result);
        return result;
      }

      // Fallback: can't check without bot API call
      setIsMember(null);
      return false;
    } catch {
      setIsMember(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, webApp, channelUsername]);

  return { isSupported, isMember, isLoading, checkMembership };
}
