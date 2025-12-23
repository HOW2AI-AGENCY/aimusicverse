import { useCallback } from 'react';
import { STORAGE_KEY, ALERT_COOLDOWNS } from './types';

interface ShownAlert {
  id: string;
  timestamp: number;
}

export function useAntiSpam() {
  const getShownAlerts = useCallback((): ShownAlert[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, []);

  const setShownAlerts = useCallback((alerts: ShownAlert[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    } catch {
      // Storage full or unavailable
    }
  }, []);

  const canShowAlert = useCallback((alertId: string): boolean => {
    const shownAlerts = getShownAlerts();
    const lastShown = shownAlerts.find(a => a.id === alertId);
    
    if (!lastShown) return true;
    
    const cooldown = ALERT_COOLDOWNS[alertId] || 24 * 60 * 60 * 1000; // Default 24h
    const timeSinceLastShown = Date.now() - lastShown.timestamp;
    
    return timeSinceLastShown >= cooldown;
  }, [getShownAlerts]);

  const markAlertShown = useCallback((alertId: string) => {
    const shownAlerts = getShownAlerts();
    const existingIndex = shownAlerts.findIndex(a => a.id === alertId);
    
    if (existingIndex >= 0) {
      shownAlerts[existingIndex].timestamp = Date.now();
    } else {
      shownAlerts.push({ id: alertId, timestamp: Date.now() });
    }
    
    // Cleanup old entries (older than 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const cleanedAlerts = shownAlerts.filter(a => a.timestamp > thirtyDaysAgo);
    
    setShownAlerts(cleanedAlerts);
  }, [getShownAlerts, setShownAlerts]);

  const resetAlert = useCallback((alertId: string) => {
    const shownAlerts = getShownAlerts();
    const filtered = shownAlerts.filter(a => a.id !== alertId);
    setShownAlerts(filtered);
  }, [getShownAlerts, setShownAlerts]);

  const resetAllAlerts = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    canShowAlert,
    markAlertShown,
    resetAlert,
    resetAllAlerts,
  };
}
