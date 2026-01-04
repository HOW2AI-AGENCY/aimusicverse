/**
 * useCloudStorage - React hook for Telegram CloudStorage
 * Provides reactive state management with CloudStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { cloudStorage } from '@/lib/cloudStorage';

interface UseCloudStorageOptions<T> {
  /** Default value if key doesn't exist */
  defaultValue: T;
  /** Whether to sync across tabs (localStorage events) */
  syncTabs?: boolean;
}

interface UseCloudStorageReturn<T> {
  /** Current value */
  value: T;
  /** Set new value */
  setValue: (value: T | ((prev: T) => T)) => Promise<void>;
  /** Remove value */
  removeValue: () => Promise<void>;
  /** Whether initial load is complete */
  isLoading: boolean;
  /** Whether CloudStorage is available */
  isCloudStorage: boolean;
}

/**
 * Hook for persisting state in Telegram CloudStorage with localStorage fallback
 * 
 * @example
 * const { value: settings, setValue: setSettings } = useCloudStorage('user_settings', {
 *   defaultValue: { theme: 'dark', notifications: true }
 * });
 */
export function useCloudStorage<T>(
  key: string,
  options: UseCloudStorageOptions<T>
): UseCloudStorageReturn<T> {
  const { defaultValue, syncTabs = true } = options;
  const [value, setValueState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const isCloudStorage = cloudStorage.isAvailable();

  // Load initial value
  useEffect(() => {
    let mounted = true;

    const loadValue = async () => {
      try {
        const stored = await cloudStorage.getJSON<T>(key, defaultValue);
        if (mounted) {
          setValueState(stored);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadValue();

    return () => {
      mounted = false;
    };
  }, [key, defaultValue]);

  // Sync across tabs via localStorage events
  useEffect(() => {
    if (!syncTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `mvai_${key}` && e.newValue) {
        try {
          setValueState(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, syncTabs]);

  // Set value
  const setValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    const valueToSet = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(value)
      : newValue;
    
    setValueState(valueToSet);
    await cloudStorage.setJSON(key, valueToSet);
  }, [key, value]);

  // Remove value
  const removeValue = useCallback(async () => {
    setValueState(defaultValue);
    await cloudStorage.removeItem(key);
  }, [key, defaultValue]);

  return {
    value,
    setValue,
    removeValue,
    isLoading,
    isCloudStorage,
  };
}

/**
 * Simple hook for boolean flags
 */
export function useCloudStorageFlag(key: string, defaultValue = false) {
  const { value, setValue, isLoading } = useCloudStorage(key, { defaultValue });
  
  const toggle = useCallback(async () => {
    await setValue(!value);
  }, [value, setValue]);

  return { value, toggle, setValue, isLoading };
}
