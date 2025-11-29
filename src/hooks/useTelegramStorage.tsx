import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';

interface StorageOptions {
  fallbackToLocalStorage?: boolean;
}

export function useTelegramStorage<T>(
  key: string,
  initialValue: T,
  options: StorageOptions = { fallbackToLocalStorage: true }
) {
  const { webApp, isInitialized } = useTelegram();
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Check if CloudStorage is available
  const hasCloudStorage = isInitialized && (webApp as any)?.CloudStorage;

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        if (hasCloudStorage) {
          // Use Telegram CloudStorage
          (webApp as any).CloudStorage.getItem(key, (error, result) => {
            if (error) {
              console.error('CloudStorage getItem error:', error);
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
        console.error('Error loading from storage:', error);
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
  const saveValue = useCallback((newValue: T) => {
    setValue(newValue);

    if (hasCloudStorage) {
      // Save to Telegram CloudStorage
      const stringValue = typeof newValue === 'string' 
        ? newValue 
        : JSON.stringify(newValue);

      (webApp as any).CloudStorage.setItem(key, stringValue, (error) => {
        if (error) {
          console.error('CloudStorage setItem error:', error);
          if (options.fallbackToLocalStorage) {
            localStorage.setItem(`telegram_storage_${key}`, stringValue);
          }
        }
      });
    } else if (options.fallbackToLocalStorage) {
      // Fallback to localStorage
      const stringValue = typeof newValue === 'string' 
        ? newValue 
        : JSON.stringify(newValue);
      localStorage.setItem(`telegram_storage_${key}`, stringValue);
    }
  }, [key, hasCloudStorage, options.fallbackToLocalStorage, webApp]);

  // Remove value
  const removeValue = useCallback(() => {
    setValue(initialValue);

    if (hasCloudStorage) {
      (webApp as any).CloudStorage.removeItem(key, (error) => {
        if (error) {
          console.error('CloudStorage removeItem error:', error);
          if (options.fallbackToLocalStorage) {
            localStorage.removeItem(`telegram_storage_${key}`);
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
