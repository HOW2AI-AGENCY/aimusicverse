import React, { createContext, useContext, useMemo } from "react";

// ── Types (matches @/contexts/telegram/types.ts) ───────────────────
export type TelegramWebApp = any;
export interface TelegramUser { telegram_id: number; first_name: string; last_name?: string; username?: string; language_code?: string; photo_url?: string; }
export interface MainButtonOptions { color?: string; textColor?: string; isActive?: boolean; isVisible?: boolean; }
export interface SecondaryButtonOptions { color?: string; textColor?: string; position?: "left" | "right"; }
export interface PopupParams { title?: string; message: string; buttons?: Array<{ id: string; type: string; text: string }>; }
export interface ShareToStoryOptions { media_url: string; text?: string; link?: string; widget_link?: { url: string; name?: string }; }
export type HapticType = "light" | "medium" | "heavy" | "rigid" | "soft";
export interface SafeAreaInsets { top: number; bottom: number; left: number; right: number; }

export interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  platform: string;
  initData: string;
  isInitialized: boolean;
  isDevelopmentMode: boolean;
  showMainButton: (text: string, onClick: () => void, options?: MainButtonOptions) => void;
  hideMainButton: () => void;
  showSecondaryButton: (text: string, onClick: () => void, options?: SecondaryButtonOptions) => void;
  hideSecondaryButton: () => void;
  showPopup: (params: PopupParams) => void;
  shareToStory: (options: ShareToStoryOptions) => void;
  haptic: { impact: (type?: HapticType) => void; notification: (type?: string) => void; selection: () => void };
  isDarkMode: boolean;
}

// ── Context ────────────────────────────────────────────────────────
const TelegramContext = createContext<TelegramContextType | null>(null);

const mockTelegram: TelegramContextType = {
  webApp: {
    initData: "", initDataUnsafe: {}, version: "8.0", platform: "tdesktop",
    colorScheme: "dark", themeParams: {}, isExpanded: true,
    viewportHeight: 800, viewportStableHeight: 800,
    headerColor: "#1a1a2e", backgroundColor: "#0f0f23",
    MainButton: { show() {}, hide() {}, setText() {}, onClick() {} },
    BackButton: { show() {}, hide() {}, onClick() {} },
    HapticFeedback: { impactOccurred: () => {}, notificationOccurred: () => {}, selectionChanged: () => {} },
    openTelegramLink() {}, openLink() {}, showPopup() {}, showAlert() {},
    ready() {}, expand() {}, close() {},
  },
  user: { telegram_id: 123456789, first_name: "Story", last_name: "User", username: "storyuser", language_code: "ru" },
  platform: "tdesktop", initData: "mock-init-data", isInitialized: true, isDevelopmentMode: true,
  showMainButton() {}, hideMainButton() {},
  showSecondaryButton() {}, hideSecondaryButton() {},
  showPopup() {}, shareToStory() {},
  haptic: { impact() {}, notification() {}, selection() {} },
  isDarkMode: true,
};

// ── Exports ────────────────────────────────────────────────────────
export const TelegramProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useMemo(() => mockTelegram, []);
  return React.createElement(TelegramContext.Provider, { value }, children);
};

export const useTelegram = (): TelegramContextType => {
  return useContext(TelegramContext) ?? mockTelegram;
};

export const DeepLinkHandler = () => null;
export const useTelegramInit = () => ({ isDevelopmentMode: true, isInitialized: true });
export const useTelegramActions = () => ({
  showMainButton() {}, hideMainButton() {},
  showSecondaryButton() {}, hideSecondaryButton() {},
  showPopup() {}, shareToStory() {},
  haptic: { impact() {}, notification() {}, selection() {} },
});
export const createMockWebApp = () => ({});