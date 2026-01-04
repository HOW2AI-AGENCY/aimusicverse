/**
 * useAppNavigate - SPA-friendly navigation utility
 * Replaces window.location.href with React Router navigation
 */

import { useNavigate, NavigateOptions } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * A hook that provides SPA-friendly navigation
 * - Internal paths use React Router (no page reload)
 * - External URLs open in new tab
 */
export function useAppNavigate() {
  const navigate = useNavigate();

  return useCallback((path: string, options?: NavigateOptions) => {
    // For external URLs - open in new tab
    if (path.startsWith('http://') || path.startsWith('https://')) {
      window.open(path, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // For internal paths - use SPA navigation
    navigate(path, options);
  }, [navigate]);
}

/**
 * Utility function to navigate from non-component context
 * This is for cases like error boundaries where hooks can't be used
 */
let globalNavigate: ((path: string, options?: NavigateOptions) => void) | null = null;

export function setGlobalNavigate(navigateFn: (path: string, options?: NavigateOptions) => void) {
  globalNavigate = navigateFn;
}

export function getGlobalNavigate() {
  return globalNavigate;
}

/**
 * Navigate using global navigate if available, fallback to window.location
 * Use this in class components or non-hook contexts
 */
export function navigateTo(path: string) {
  if (globalNavigate) {
    globalNavigate(path);
  } else {
    // Fallback for cases where global navigate isn't set
    window.location.href = path;
  }
}

/**
 * Force a page reload (use sparingly)
 */
export function forceReload() {
  window.location.reload();
}
