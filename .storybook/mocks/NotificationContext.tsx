/**
 * Storybook mock — NotificationContext
 *
 * Provides minimal notification context so components that use
 * useNotificationHub / useUnreadCount render without error.
 */
import React, { createContext, useContext, useMemo } from "react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useMemo<NotificationContextType>(
    () => ({
      notifications: [],
      unreadCount: 0,
      markAsRead: async () => {},
      markAllAsRead: async () => {},
    }),
    [],
  );
  return React.createElement(NotificationContext.Provider, { value }, children);
};

export const useNotificationHub = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (ctx) return ctx;
  return { notifications: [], unreadCount: 0, markAsRead: async () => {}, markAllAsRead: async () => {} };
};
