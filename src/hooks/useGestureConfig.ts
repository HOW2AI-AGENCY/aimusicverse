import { usePreferencesStore } from '@/stores/usePreferencesStore';

export function useGestureConfig() {
  const gestureConfig = usePreferencesStore((s) => s.gestureConfig);
  const setGestureConfig = usePreferencesStore((s) => s.setGestureConfig);

  return {
    ...gestureConfig,
    setGestureConfig,
    // Convenience getters
    swipeEnabled: gestureConfig.swipeEnabled,
    hapticEnabled: gestureConfig.hapticEnabled,
    hapticIntensity: gestureConfig.hapticIntensity,
  };
}
