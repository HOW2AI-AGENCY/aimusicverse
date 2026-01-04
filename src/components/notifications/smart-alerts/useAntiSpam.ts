import { useCallback, useRef } from 'react';
import { 
  STORAGE_KEY, 
  ALERT_COOLDOWNS, 
  SESSION_KEY, 
  LAST_ALERT_KEY,
  MIN_ALERT_INTERVAL,
  MAX_ALERTS_PER_SESSION,
} from './types';

interface ShownAlert {
  id: string;
  timestamp: number;
}

interface SessionData {
  count: number;
  startTime: number;
}

export function useAntiSpam() {
  const sessionStartTime = useRef(Date.now());

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

  const getSessionData = useCallback((): SessionData => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) {
        return { count: 0, startTime: sessionStartTime.current };
      }
      return JSON.parse(stored);
    } catch {
      return { count: 0, startTime: sessionStartTime.current };
    }
  }, []);

  const updateSessionData = useCallback((data: SessionData) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch {
      // Storage unavailable
    }
  }, []);

  const getLastAlertTime = useCallback((): number => {
    try {
      const stored = sessionStorage.getItem(LAST_ALERT_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }, []);

  const setLastAlertTime = useCallback((time: number) => {
    try {
      sessionStorage.setItem(LAST_ALERT_KEY, time.toString());
    } catch {
      // Storage unavailable
    }
  }, []);

  const canShowAlert = useCallback((alertId: string): boolean => {
    // Check minimum interval between alerts
    const lastAlertTime = getLastAlertTime();
    const timeSinceLastAlert = Date.now() - lastAlertTime;
    if (lastAlertTime > 0 && timeSinceLastAlert < MIN_ALERT_INTERVAL) {
      return false;
    }

    // Check session limit
    const sessionData = getSessionData();
    if (sessionData.count >= MAX_ALERTS_PER_SESSION) {
      return false;
    }

    // Check cooldown for this specific alert
    const shownAlerts = getShownAlerts();
    const lastShown = shownAlerts.find(a => a.id === alertId);
    
    if (!lastShown) return true;
    
    const cooldown = ALERT_COOLDOWNS[alertId] || 24 * 60 * 60 * 1000; // Default 24h
    const timeSinceLastShown = Date.now() - lastShown.timestamp;
    
    return timeSinceLastShown >= cooldown;
  }, [getShownAlerts, getLastAlertTime, getSessionData]);

  const markAlertShown = useCallback((alertId: string) => {
    const now = Date.now();
    
    // Update shown alerts
    const shownAlerts = getShownAlerts();
    const existingIndex = shownAlerts.findIndex(a => a.id === alertId);
    
    if (existingIndex >= 0) {
      shownAlerts[existingIndex].timestamp = now;
    } else {
      shownAlerts.push({ id: alertId, timestamp: now });
    }
    
    // Cleanup old entries (older than 30 days)
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const cleanedAlerts = shownAlerts.filter(a => a.timestamp > thirtyDaysAgo);
    
    setShownAlerts(cleanedAlerts);

    // Update session data
    const sessionData = getSessionData();
    updateSessionData({
      count: sessionData.count + 1,
      startTime: sessionData.startTime,
    });

    // Update last alert time
    setLastAlertTime(now);
  }, [getShownAlerts, setShownAlerts, getSessionData, updateSessionData, setLastAlertTime]);

  const resetAlert = useCallback((alertId: string) => {
    const shownAlerts = getShownAlerts();
    const filtered = shownAlerts.filter(a => a.id !== alertId);
    setShownAlerts(filtered);
  }, [getShownAlerts, setShownAlerts]);

  const resetAllAlerts = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(LAST_ALERT_KEY);
  }, []);

  const getSessionCount = useCallback((): number => {
    return getSessionData().count;
  }, [getSessionData]);

  return {
    canShowAlert,
    markAlertShown,
    resetAlert,
    resetAllAlerts,
    getSessionCount,
    getLastAlertTime,
  };
}
