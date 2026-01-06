/**
 * T003: Feature Flag System
 * 
 * Provides a centralized feature flag system for gradual rollout of unified interface changes.
 * Flags can be controlled via environment variables (.env.local) or runtime configuration.
 * 
 * Usage:
 * ```tsx
 * const { enabled, loading } = useFeatureFlag('unified-mobile-header');
 * if (enabled) {
 *   return <MobileHeaderBar />;
 * }
 * return <OldHeader />;
 * ```
 */

import { useState, useEffect } from 'react';

export type FeatureFlagName =
  // Sprint 1: Core Infrastructure
  | 'unified-interface-enabled'          // Master kill switch
  | 'bundle-monitoring'                   // Bundle size monitoring
  | 'touch-target-validation'             // Touch target validation
  
  // Sprint 2: User Story 1 - Navigation
  | 'unified-mobile-header'               // MobileHeaderBar component
  | 'unified-bottom-nav'                  // BottomNavigation improvements
  | 'unified-safe-areas'                  // Safe area handling
  
  // Sprint 3: User Story 2 - Track Lists
  | 'unified-track-virtualization'        // VirtualizedTrackList expansion
  | 'unified-track-cards'                 // TrackCard unification
  
  // Sprint 4: User Story 3 - Generation Form
  | 'unified-generation-form'             // Generation form improvements
  
  // Sprint 5: User Story 4 - Playlists/Projects
  | 'unified-playlist-cards'              // PlaylistCard unification
  | 'unified-project-cards'               // ProjectCard unification
  
  // Sprint 6: User Story 5 - Studio
  | 'unified-studio-mobile'               // Studio mobile improvements
  
  // Sprint 7: User Story 6 - Modals
  | 'unified-responsive-modals'           // ResponsiveModal component
  | 'unified-bottom-sheets'               // MobileBottomSheet migration
  
  // Sprint 8: User Story 7 - Theme Switching
  | 'unified-theme-sync'                  // Telegram theme synchronization
  
  // Sprint 9: User Story 8 - Share/Download
  | 'unified-share-actions'               // Share action improvements
  | 'unified-download-actions';           // Download action improvements

interface FeatureFlag {
  name: FeatureFlagName;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;  // For gradual rollout (0-100)
}

// Default feature flag configuration
const DEFAULT_FLAGS: Record<FeatureFlagName, FeatureFlag> = {
  // Master switches
  'unified-interface-enabled': {
    name: 'unified-interface-enabled',
    enabled: true,  // Master switch - set to false to disable all unified interface changes
    description: 'Master kill switch for unified interface rollout',
  },
  'bundle-monitoring': {
    name: 'bundle-monitoring',
    enabled: true,
    description: 'Enable bundle size monitoring and alerts',
  },
  'touch-target-validation': {
    name: 'touch-target-validation',
    enabled: true,
    description: 'Enable touch target size validation in development',
  },
  
  // Navigation
  'unified-mobile-header': {
    name: 'unified-mobile-header',
    enabled: true,  // Already implemented
    description: 'Use MobileHeaderBar component on all pages',
  },
  'unified-bottom-nav': {
    name: 'unified-bottom-nav',
    enabled: true,  // Already implemented
    description: 'Use unified BottomNavigation component',
  },
  'unified-safe-areas': {
    name: 'unified-safe-areas',
    enabled: false,  // To be implemented
    description: 'Enhanced safe area handling for all devices',
  },
  
  // Track Lists
  'unified-track-virtualization': {
    name: 'unified-track-virtualization',
    enabled: false,  // Partial implementation
    description: 'Expand VirtualizedTrackList to all lists >50 items',
    rolloutPercentage: 60,
  },
  'unified-track-cards': {
    name: 'unified-track-cards',
    enabled: false,
    description: 'Unified TrackCard component with variants',
  },
  
  // Generation Form
  'unified-generation-form': {
    name: 'unified-generation-form',
    enabled: false,
    description: 'Unified generation form with touch-optimized inputs',
  },
  
  // Playlists/Projects
  'unified-playlist-cards': {
    name: 'unified-playlist-cards',
    enabled: false,
    description: 'Unified PlaylistCard component',
  },
  'unified-project-cards': {
    name: 'unified-project-cards',
    enabled: false,
    description: 'Unified ProjectCard component',
  },
  
  // Studio
  'unified-studio-mobile': {
    name: 'unified-studio-mobile',
    enabled: true,  // Already implemented
    description: 'Unified Studio Mobile interface',
  },
  
  // Modals
  'unified-responsive-modals': {
    name: 'unified-responsive-modals',
    enabled: false,
    description: 'ResponsiveModal component (auto Dialog/BottomSheet)',
  },
  'unified-bottom-sheets': {
    name: 'unified-bottom-sheets',
    enabled: false,
    description: 'Migrate Dialogs to MobileBottomSheet on mobile',
  },
  
  // Theme
  'unified-theme-sync': {
    name: 'unified-theme-sync',
    enabled: false,
    description: 'Synchronize theme with Telegram theme',
  },
  
  // Share/Download
  'unified-share-actions': {
    name: 'unified-share-actions',
    enabled: false,
    description: 'Unified share actions with Telegram integration',
  },
  'unified-download-actions': {
    name: 'unified-download-actions',
    enabled: false,
    description: 'Unified download actions',
  },
};

// Load feature flags from environment variables
function loadFeatureFlagsFromEnv(): Record<FeatureFlagName, FeatureFlag> {
  const flags = { ...DEFAULT_FLAGS };
  
  // Check for environment variable overrides
  // Format: VITE_FEATURE_FLAG_<FLAG_NAME>=true|false
  Object.keys(flags).forEach((key) => {
    const envKey = `VITE_FEATURE_FLAG_${key.toUpperCase().replace(/-/g, '_')}`;
    const envValue = import.meta.env[envKey];
    
    if (envValue !== undefined) {
      flags[key as FeatureFlagName].enabled = envValue === 'true';
    }
  });
  
  // If master switch is off, disable all flags
  if (!flags['unified-interface-enabled'].enabled) {
    Object.keys(flags).forEach((key) => {
      if (key !== 'unified-interface-enabled') {
        flags[key as FeatureFlagName].enabled = false;
      }
    });
  }
  
  return flags;
}

// Global feature flags cache
let featureFlagsCache: Record<FeatureFlagName, FeatureFlag> | null = null;

/**
 * Get all feature flags
 */
export function getFeatureFlags(): Record<FeatureFlagName, FeatureFlag> {
  if (!featureFlagsCache) {
    featureFlagsCache = loadFeatureFlagsFromEnv();
  }
  return featureFlagsCache;
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagName: FeatureFlagName): boolean {
  const flags = getFeatureFlags();
  const flag = flags[flagName];
  
  if (!flag) {
    console.warn(`Feature flag "${flagName}" not found, defaulting to false`);
    return false;
  }
  
  // Check rollout percentage if specified
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    // Deterministic rollout based on user ID or session
    const userId = getUserIdForRollout();
    const hash = simpleHash(userId + flagName);
    const rolloutValue = hash % 100;
    
    if (rolloutValue >= flag.rolloutPercentage) {
      return false;
    }
  }
  
  return flag.enabled;
}

/**
 * React hook for using feature flags
 */
export function useFeatureFlag(flagName: FeatureFlagName) {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flagName));
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Re-evaluate flag on mount and when dependencies change
    const isEnabled = isFeatureEnabled(flagName);
    if (isEnabled !== enabled) {
      setEnabled(isEnabled);
    }
  }, [flagName, enabled]);
  
  return { enabled, loading };
}

/**
 * Get user ID for rollout calculation
 * In production, this would come from auth context
 */
function getUserIdForRollout(): string {
  // Try to get from localStorage or generate a stable session ID
  let userId = localStorage.getItem('feature-flag-user-id');
  if (!userId) {
    userId = `session-${Date.now()}-${Math.random()}`;
    localStorage.setItem('feature-flag-user-id', userId);
  }
  return userId;
}

/**
 * Simple hash function for deterministic rollout
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Development helper: Log all feature flags
 */
export function logFeatureFlags() {
  if (import.meta.env.DEV) {
    const flags = getFeatureFlags();
    console.group('🚩 Feature Flags');
    Object.values(flags).forEach((flag) => {
      console.log(
        `${flag.enabled ? '✅' : '❌'} ${flag.name}`,
        flag.rolloutPercentage ? `(${flag.rolloutPercentage}% rollout)` : '',
        `- ${flag.description}`
      );
    });
    console.groupEnd();
  }
}
