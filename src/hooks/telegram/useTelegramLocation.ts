/**
 * Telegram Location Hook
 *
 * Requests user's location via Telegram Mini App.
 * Available in Telegram Mini App 2.0+.
 *
 * @example
 * ```tsx
 * const { requestLocation, location, isLoading, error } = useTelegramLocation();
 *
 * // Request location
 * const coords = await requestLocation();
 * ```
 */

import { useState, useCallback } from "react";
import { useTelegram } from "@/contexts/TelegramContext";

interface LocationData {
  latitude: number;
  longitude: number;
  horizontalAccuracy?: number;
}

interface UseTelegramLocationReturn {
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  location: LocationData | null;
  requestLocation: () => Promise<LocationData | null>;
}

export function useTelegramLocation(): UseTelegramLocationReturn {
  const { webApp, isInitialized } = useTelegram();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);

  const isSupported = !!(isInitialized && webApp?.requestLocation);

  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!isSupported) {
      setError("Location not supported");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await new Promise<LocationData>((resolve, reject) => {
        webApp!.requestLocation((data: LocationData | null) => {
          if (data) {
            resolve(data);
          } else {
            reject(new Error("User denied location access"));
          }
        });
      });

      setLocation(result);
      return result;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Location request failed");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, webApp]);

  return { isSupported, isLoading, error, location, requestLocation };
}
