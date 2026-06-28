import type { LucideIcon } from "@/lib/icons";

export interface NotificationItem {
  id: string;
  type: "generation-complete" | "error" | "success" | "info";
  title: string;
  message: string;
  action?: {
    label: string;
    callback: () => void;
    icon?: LucideIcon;
  };
  timestamp: number;
  duration?: number;
  priority: "low" | "normal" | "high";
}

export interface NotificationHistoryEntry {
  id: string;
  type: string;
  timestamp: number;
  dismissed: boolean;
}

export interface NotificationState {
  pending: NotificationItem[];
  history: NotificationHistoryEntry[];
  preferences: {
    inAppEnabled: boolean;
    pushEnabled: boolean;
    soundEnabled: boolean;
    hapticEnabled: boolean;
  };
}
