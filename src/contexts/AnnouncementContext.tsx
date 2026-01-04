/**
 * Unified Announcement System
 * - Shows only ONE announcement at a time
 * - Queue-based with priorities
 * - Coordinates between different notification types
 * - Auto-dismiss and "dismiss all" functionality
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { logger } from '@/lib/logger';

const announcementLogger = logger.child({ module: 'AnnouncementSystem' });

export type AnnouncementType = 'info' | 'warning' | 'success' | 'beta' | 'feature' | 'system';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  priority?: AnnouncementPriority;
  dismissible?: boolean;
  autoDismissMs?: number; // Auto dismiss after X ms
  expiresAt?: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

interface AnnouncementContextType {
  // Current announcement being shown
  currentAnnouncement: Announcement | null;
  // Queue of pending announcements
  queueLength: number;
  // Add announcement to queue
  addAnnouncement: (announcement: Announcement) => void;
  // Dismiss current announcement
  dismissCurrent: () => void;
  // Dismiss all announcements
  dismissAll: () => void;
  // Check if announcement was previously dismissed (by ID)
  wasDismissed: (id: string) => boolean;
  // Pause showing announcements (e.g., during onboarding)
  pauseAnnouncements: () => void;
  // Resume showing announcements
  resumeAnnouncements: () => void;
  // Is system paused
  isPaused: boolean;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

const DISMISSED_STORAGE_KEY = 'dismissed-announcements-v2';
const MAX_QUEUE_SIZE = 10;

// Priority weights for sorting
const PRIORITY_WEIGHT: Record<AnnouncementPriority, number> = {
  critical: 100,
  high: 75,
  normal: 50,
  low: 25,
};

function getDismissedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveDismissedId(id: string) {
  const dismissed = getDismissedIds();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    // Keep only last 100 dismissed IDs to prevent localStorage bloat
    const trimmed = dismissed.slice(-100);
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(trimmed));
  }
}

export function AnnouncementProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Announcement[]>([]);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [autoDismissTimer, setAutoDismissTimer] = useState<NodeJS.Timeout | null>(null);

  // Process queue - show next announcement if none is showing
  const processQueue = useCallback(() => {
    if (isPaused || currentAnnouncement) return;

    setQueue((prevQueue) => {
      if (prevQueue.length === 0) return prevQueue;

      // Sort by priority
      const sorted = [...prevQueue].sort((a, b) => {
        const weightA = PRIORITY_WEIGHT[a.priority || 'normal'];
        const weightB = PRIORITY_WEIGHT[b.priority || 'normal'];
        return weightB - weightA;
      });

      const [next, ...rest] = sorted;
      
      // Check if expired
      if (next.expiresAt && new Date() > next.expiresAt) {
        announcementLogger.debug('Announcement expired, skipping', { id: next.id });
        return rest;
      }

      // Show the announcement
      setCurrentAnnouncement(next);
      announcementLogger.info('Showing announcement', { id: next.id, title: next.title });

      // Set auto-dismiss timer if configured
      if (next.autoDismissMs) {
        const timer = setTimeout(() => {
          dismissCurrent();
        }, next.autoDismissMs);
        setAutoDismissTimer(timer);
      }

      return rest;
    });
  }, [isPaused, currentAnnouncement]);

  // Process queue when conditions change
  useEffect(() => {
    if (!isPaused && !currentAnnouncement && queue.length > 0) {
      // Small delay to prevent flickering
      const timer = setTimeout(processQueue, 300);
      return () => clearTimeout(timer);
    }
  }, [isPaused, currentAnnouncement, queue.length, processQueue]);

  // Cleanup auto-dismiss timer
  useEffect(() => {
    return () => {
      if (autoDismissTimer) {
        clearTimeout(autoDismissTimer);
      }
    };
  }, [autoDismissTimer]);

  const addAnnouncement = useCallback((announcement: Announcement) => {
    // Check if already dismissed
    if (getDismissedIds().includes(announcement.id)) {
      announcementLogger.debug('Announcement already dismissed', { id: announcement.id });
      return;
    }

    // Check if already in queue or currently showing
    setQueue((prev) => {
      const exists = prev.some((a) => a.id === announcement.id);
      if (exists) return prev;

      // Limit queue size
      if (prev.length >= MAX_QUEUE_SIZE) {
        announcementLogger.warn('Queue full, dropping oldest announcement');
        return [...prev.slice(1), announcement];
      }

      announcementLogger.debug('Added announcement to queue', { id: announcement.id });
      return [...prev, announcement];
    });
  }, []);

  const dismissCurrent = useCallback(() => {
    if (!currentAnnouncement) return;

    // Clear auto-dismiss timer
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      setAutoDismissTimer(null);
    }

    // Save as dismissed if dismissible
    if (currentAnnouncement.dismissible !== false) {
      saveDismissedId(currentAnnouncement.id);
    }

    // Call onDismiss callback if provided
    currentAnnouncement.onDismiss?.();

    announcementLogger.debug('Dismissed announcement', { id: currentAnnouncement.id });
    setCurrentAnnouncement(null);
  }, [currentAnnouncement, autoDismissTimer]);

  const dismissAll = useCallback(() => {
    // Dismiss current
    if (currentAnnouncement) {
      if (currentAnnouncement.dismissible !== false) {
        saveDismissedId(currentAnnouncement.id);
      }
      currentAnnouncement.onDismiss?.();
    }

    // Dismiss all in queue
    queue.forEach((announcement) => {
      if (announcement.dismissible !== false) {
        saveDismissedId(announcement.id);
      }
      announcement.onDismiss?.();
    });

    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      setAutoDismissTimer(null);
    }

    setCurrentAnnouncement(null);
    setQueue([]);
    announcementLogger.info('Dismissed all announcements');
  }, [currentAnnouncement, queue, autoDismissTimer]);

  const wasDismissed = useCallback((id: string) => {
    return getDismissedIds().includes(id);
  }, []);

  const pauseAnnouncements = useCallback(() => {
    setIsPaused(true);
    announcementLogger.debug('Announcements paused');
  }, []);

  const resumeAnnouncements = useCallback(() => {
    setIsPaused(false);
    announcementLogger.debug('Announcements resumed');
  }, []);

  return (
    <AnnouncementContext.Provider
      value={{
        currentAnnouncement,
        queueLength: queue.length,
        addAnnouncement,
        dismissCurrent,
        dismissAll,
        wasDismissed,
        pauseAnnouncements,
        resumeAnnouncements,
        isPaused,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements() {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within AnnouncementProvider');
  }
  return context;
}
