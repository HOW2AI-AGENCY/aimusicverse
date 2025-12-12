/**
 * Navigation state management to prevent loops and track user journey
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NavigationEntry {
  route: string;
  timestamp: number;
  messageId?: number;
}

interface NavigationState {
  history: NavigationEntry[];
  currentRoute: string;
  previousRoute?: string;
}

// In-memory navigation state (per session)
const navigationStates = new Map<number, NavigationState>();

const MAX_HISTORY_LENGTH = 10;
const LOOP_DETECTION_WINDOW = 5000; // 5 seconds
const MAX_SAME_ROUTE_COUNT = 2;

/**
 * Get navigation state for a user
 */
export function getNavigationState(userId: number): NavigationState {
  if (!navigationStates.has(userId)) {
    navigationStates.set(userId, {
      history: [],
      currentRoute: 'main',
    });
  }
  return navigationStates.get(userId)!;
}

/**
 * Navigate to a new route
 */
export function navigateTo(userId: number, route: string, messageId?: number): boolean {
  const state = getNavigationState(userId);
  const now = Date.now();
  
  // Check for navigation loops
  const recentSameRoutes = state.history.filter(
    entry => entry.route === route && now - entry.timestamp < LOOP_DETECTION_WINDOW
  );
  
  if (recentSameRoutes.length >= MAX_SAME_ROUTE_COUNT) {
    console.warn(`Navigation loop detected for user ${userId}: ${route}`);
    return false;
  }
  
  // Update state
  state.previousRoute = state.currentRoute;
  state.currentRoute = route;
  
  // Add to history
  state.history.push({
    route,
    timestamp: now,
    messageId,
  });
  
  // Trim history
  if (state.history.length > MAX_HISTORY_LENGTH) {
    state.history = state.history.slice(-MAX_HISTORY_LENGTH);
  }
  
  return true;
}

/**
 * Get previous route for "back" navigation
 */
export function getPreviousRoute(userId: number): string {
  const state = getNavigationState(userId);
  
  // Find last different route
  for (let i = state.history.length - 2; i >= 0; i--) {
    if (state.history[i].route !== state.currentRoute) {
      return state.history[i].route;
    }
  }
  
  return 'main'; // Default to main menu
}

/**
 * Get breadcrumb for current location
 */
export function getBreadcrumb(userId: number): string {
  const state = getNavigationState(userId);
  
  const routeNames: Record<string, string> = {
    main: '🏠 Главная',
    library: '📚 Библиотека',
    projects: '📁 Проекты',
    generate: '🎼 Генератор',
    analyze: '🔬 Анализ',
    settings: '⚙️ Настройки',
    help: '📖 Справка',
    upload: '📤 Загрузка',
    midi: '🎹 MIDI',
    buy: '💎 Магазин',
  };
  
  return routeNames[state.currentRoute] || state.currentRoute;
}

/**
 * Clear navigation state for a user
 */
export function clearNavigationState(userId: number): void {
  navigationStates.delete(userId);
}

/**
 * Check if can navigate back
 */
export function canGoBack(userId: number): boolean {
  const state = getNavigationState(userId);
  return state.history.length > 1;
}
