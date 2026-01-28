/**
 * Session Management Service
 * Handles analytics session creation and management
 */

const SESSION_KEY = 'analytics_session_id';
const JOURNEY_SESSION_KEY = 'journey_session_id';
const SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create a session ID for analytics
 */
export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Get or create a journey session ID with expiry
 */
export function getOrCreateJourneySessionId(): string {
  const stored = sessionStorage.getItem(JOURNEY_SESSION_KEY);
  if (stored) {
    try {
      const { id, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp < SESSION_EXPIRY) {
        return id;
      }
    } catch {
      // Invalid data, create new session
    }
  }
  
  const newId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem(JOURNEY_SESSION_KEY, JSON.stringify({
    id: newId,
    timestamp: Date.now(),
  }));
  return newId;
}

/**
 * Refresh journey session timestamp
 */
export function refreshJourneySession(): void {
  const stored = sessionStorage.getItem(JOURNEY_SESSION_KEY);
  if (stored) {
    try {
      const { id } = JSON.parse(stored);
      sessionStorage.setItem(JOURNEY_SESSION_KEY, JSON.stringify({
        id,
        timestamp: Date.now(),
      }));
    } catch {
      // Invalid data, ignore
    }
  }
}

/**
 * Get current session ID without creating new one
 */
export function getCurrentSessionId(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

/**
 * Clear session data
 */
export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(JOURNEY_SESSION_KEY);
}
