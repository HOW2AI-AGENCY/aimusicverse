import { useGuestMode } from '@/contexts/GuestModeContext';
import {
  mockProfile,
  mockStats,
  mockCredits,
  mockTracks,
  mockProjects,
  mockPlaylists,
  mockArtists,
  mockAchievements,
  mockGenerationFormData,
  mockLyrics,
  MockTrack,
} from '@/lib/screenshotMockData';
import { Profile } from '@/hooks/useProfile';

// Re-export types for consumers
export type { MockTrack } from '@/lib/screenshotMockData';

interface ScreenshotDataReturn {
  isScreenshotMode: boolean;
  getMockProfile: () => Profile | null;
  getMockStats: () => typeof mockStats | null;
  getMockCredits: () => typeof mockCredits | null;
  getMockTracks: () => MockTrack[] | null;
  getMockProjects: () => typeof mockProjects | null;
  getMockPlaylists: () => typeof mockPlaylists | null;
  getMockArtists: () => typeof mockArtists | null;
  getMockAchievements: () => typeof mockAchievements | null;
  getMockGenerationFormData: () => typeof mockGenerationFormData | null;
  getMockLyrics: () => string | null;
}

/**
 * Hook to access mock data in screenshot mode
 * Returns null for all getters when not in screenshot mode
 */
export const useScreenshotData = (): ScreenshotDataReturn => {
  const { isScreenshotMode } = useGuestMode();

  return {
    isScreenshotMode,
    getMockProfile: () => (isScreenshotMode ? mockProfile : null),
    getMockStats: () => (isScreenshotMode ? mockStats : null),
    getMockCredits: () => (isScreenshotMode ? mockCredits : null),
    getMockTracks: () => (isScreenshotMode ? mockTracks : null),
    getMockProjects: () => (isScreenshotMode ? mockProjects : null),
    getMockPlaylists: () => (isScreenshotMode ? mockPlaylists : null),
    getMockArtists: () => (isScreenshotMode ? mockArtists : null),
    getMockAchievements: () => (isScreenshotMode ? mockAchievements : null),
    getMockGenerationFormData: () => (isScreenshotMode ? mockGenerationFormData : null),
    getMockLyrics: () => (isScreenshotMode ? mockLyrics : null),
  };
};

/**
 * Utility to check if we should use mock data
 */
export const shouldUseMockData = (isScreenshotMode: boolean): boolean => {
  return isScreenshotMode;
};
