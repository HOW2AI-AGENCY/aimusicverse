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
} from '@/lib/screenshotMockData';

/**
 * Hook to access mock data in screenshot mode
 * Returns null for all getters when not in screenshot mode
 */
export const useScreenshotData = () => {
  const { isScreenshotMode } = useGuestMode();

  const getMockProfile = () => (isScreenshotMode ? mockProfile : null);
  const getMockStats = () => (isScreenshotMode ? mockStats : null);
  const getMockCredits = () => (isScreenshotMode ? mockCredits : null);
  const getMockTracks = () => (isScreenshotMode ? mockTracks : null);
  const getMockProjects = () => (isScreenshotMode ? mockProjects : null);
  const getMockPlaylists = () => (isScreenshotMode ? mockPlaylists : null);
  const getMockArtists = () => (isScreenshotMode ? mockArtists : null);
  const getMockAchievements = () => (isScreenshotMode ? mockAchievements : null);
  const getMockGenerationFormData = () => (isScreenshotMode ? mockGenerationFormData : null);
  const getMockLyrics = () => (isScreenshotMode ? mockLyrics : null);

  return {
    isScreenshotMode,
    getMockProfile,
    getMockStats,
    getMockCredits,
    getMockTracks,
    getMockProjects,
    getMockPlaylists,
    getMockArtists,
    getMockAchievements,
    getMockGenerationFormData,
    getMockLyrics,
  };
};

/**
 * Utility to check if we should use mock data
 */
export const shouldUseMockData = (isScreenshotMode: boolean): boolean => {
  return isScreenshotMode;
};
