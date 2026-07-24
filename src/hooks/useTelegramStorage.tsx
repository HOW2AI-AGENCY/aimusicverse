import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "@/contexts/TelegramContext";
import { logger } from "@/lib/logger";
import type { TelegramWebApp } from "@/types/telegram";

interface StorageOptions {
  fallbackToLocalStorage?: boolean;
}

type TelegramWithCloudStorage = TelegramWebApp & {
  CloudStorage?: {
    getItem: (key: string, callback: (error: Error | null, result: string | null) => void) => void;
    setItem: (key: string, value: string, callback?: (error: Error | null) => void) => void;
    removeItem: (key: string, callback?: (error: Error | null) => void) => void;
  };
};

export function useTelegramStorage<T>(
  key: string,
  initialValue: T,
  options: StorageOptions = { fallbackToLocalStorage: true },
) {
  const { webApp, isInitialized } = useTelegram();
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Check if CloudStorage is available (requires Telegram WebApp 6.9+)
  const cloudStorage = (webApp as TelegramWithCloudStorage | null)?.CloudStorage;
  const isVersionSupported =
    typeof webApp?.isVersionAtLeast === "function" ? webApp.isVersionAtLeast("6.9") : false;
  const hasCloudStorage = isInitialized && !!cloudStorage && isVersionSupported;

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        if (hasCloudStorage && cloudStorage) {
          // Use Telegram CloudStorage
          cloudStorage.getItem(key, (error: Error | null, result: string | null) => {
            if (error) {
              // WebAppMethodUnsupported and similar — fall back silently
              if (options.fallbackToLocalStorage) {
                loadFromLocalStorage();
              }
            } else if (result) {
              try {
                setValue(JSON.parse(result));
              } catch {
                setValue(result as T);
              }
            }
            setIsLoading(false);
          });
        } else if (options.fallbackToLocalStorage) {
          loadFromLocalStorage();
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        // Silent fallback — CloudStorage failures shouldn't surface as errors
        if (options.fallbackToLocalStorage) {
          try {
            loadFromLocalStorage();
          } catch {
            /* ignore */
          }
        }
        setIsLoading(false);
      }
    };

    const loadFromLocalStorage = () => {
      const stored = localStorage.getItem(`telegram_storage_${key}`);
      if (stored) {
        try {
          setValue(JSON.parse(stored));
        } catch {
          setValue(stored as T);
        }
      }
    };

    loadValue();
  }, [key, hasCloudStorage, options.fallbackToLocalStorage]);

  // Save value
  const saveValue = useCallback(
    (newValue: T) => {
      setValue(newValue);

      if (hasCloudStorage) {
        // Save to Telegram CloudStorage
        const stringValue = typeof newValue === "string" ? newValue : JSON.stringify(newValue);

        cloudStorage.setItem(key, stringValue, (error: Error | null) => {
          if (error) {
            // Silent fallback on unsupported WebApp versions
            if (options.fallbackToLocalStorage) {
              try {
                localStorage.setItem(`telegram_storage_${key}`, stringValue);
              } catch {
                /* ignore */
              }
            }
          }
        });
      } else if (options.fallbackToLocalStorage) {
        // Fallback to localStorage
        const stringValue = typeof newValue === "string" ? newValue : JSON.stringify(newValue);
        localStorage.setItem(`telegram_storage_${key}`, stringValue);
      }
    },
    [key, hasCloudStorage, options.fallbackToLocalStorage, webApp],
  );

  // Remove value
  const removeValue = useCallback(() => {
    setValue(initialValue);

    if (hasCloudStorage) {
      cloudStorage.removeItem(key, (error: Error | null) => {
        if (error) {
          if (options.fallbackToLocalStorage) {
            try {
              localStorage.removeItem(`telegram_storage_${key}`);
            } catch {
              /* ignore */
            }
          }
        }
      });
    } else if (options.fallbackToLocalStorage) {
      localStorage.removeItem(`telegram_storage_${key}`);
    }
  }, [key, hasCloudStorage, options.fallbackToLocalStorage, webApp, initialValue]);

  return {
    value,
    setValue: saveValue,
    removeValue,
    isLoading,
    isCloudStorage: hasCloudStorage,
  };
}
