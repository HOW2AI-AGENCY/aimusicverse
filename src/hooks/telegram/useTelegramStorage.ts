/**
 * Telegram Storage Hook
 * 
 * Provides unified access to CloudStorage, DeviceStorage, and SecureStorage
 * with Promise-based API for easier usage
 * 
 * Storage Types:
 * - CloudStorage: Synced across devices (up to 1024 keys, 4KB per value)
 * - DeviceStorage: Local only (~5 MB total)
 * - SecureStorage: Encrypted (up to 10 items, for sensitive data)
 * 
 * @example
 * ```tsx
 * const { cloud, device, secure } = useTelegramStorage();
 * 
 * // Cloud storage (synced)
 * await cloud.set('settings', JSON.stringify(settings));
 * const data = await cloud.get('settings');
 * 
 * // Secure storage (encrypted)
 * if (secure.isAvailable) {
 *   await secure.set('token', refreshToken);
 * }
 * ```
 */

import { useCallback } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TelegramStorage' });

interface StorageAPI {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<boolean>;
  remove: (key: string) => Promise<boolean>;
  getMultiple: (keys: string[]) => Promise<Record<string, string>>;
  removeMultiple: (keys: string[]) => Promise<boolean>;
  getKeys: () => Promise<string[]>;
  clear?: () => Promise<boolean>;
}

interface SecureStorageAPI {
  isAvailable: boolean;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<boolean>;
  remove: (key: string) => Promise<boolean>;
}

interface UseTelegramStorageReturn {
  cloud: StorageAPI;
  device: StorageAPI;
  secure: SecureStorageAPI;
  isCloudSupported: boolean;
  isDeviceSupported: boolean;
  isSecureSupported: boolean;
}

export function useTelegramStorage(): UseTelegramStorageReturn {
  const { webApp } = useTelegram();

  const isCloudSupported = !!webApp?.CloudStorage;
  const isDeviceSupported = !!webApp?.DeviceStorage;
  const isSecureSupported = !!(webApp?.SecureStorage && webApp.SecureStorage.isAvailable);

  // Cloud Storage API
  const cloud: StorageAPI = {
    get: useCallback(
      (key: string): Promise<string | null> => {
        if (!webApp?.CloudStorage) {
          return Promise.resolve(null);
        }

        return new Promise((resolve) => {
          try {
            webApp.CloudStorage.getItem(key, (error, value) => {
              if (error) {
                log.error('CloudStorage get error', { key, error });
                resolve(null);
              } else {
                resolve(value || null);
              }
            });
          } catch (error) {
            log.error('CloudStorage get exception', error);
            resolve(null);
          }
        });
      },
      [webApp]
    ),

    set: useCallback(
      (key: string, value: string): Promise<boolean> => {
        if (!webApp?.CloudStorage) {
          return Promise.resolve(false);
        }

        return new Promise((resolve) => {
          try {
            webApp.CloudStorage.setItem(key, value, (error, success) => {
              if (error) {
                log.error('CloudStorage set error', { key, error });
                resolve(false);
              } else {
                resolve(success);
              }
            });
          } catch (error) {
            log.error('CloudStorage set exception', error);
            resolve(false);
          }
        });
      },
      [webApp]
    ),

    remove: useCallback(
      (key: string): Promise<boolean> => {
        if (!webApp?.CloudStorage) {
          return Promise.resolve(false);
        }

        return new Promise((resolve) => {
          try {
            webApp.CloudStorage.removeItem(key, (error, success) => {
              if (error) {
                log.error('CloudStorage remove error', { key, error });
                resolve(false);
              } else {
                resolve(success);
              }
            });
          } catch (error) {
            log.error('CloudStorage remove exception', error);
            resolve(false);
          }
        });
      },
      [webApp]
    ),

    getMultiple: useCallback(
      (keys: string[]): Promise<Record<string, string>> => {
        if (!webApp?.CloudStorage) {
          return Promise.resolve({});
        }

        return new Promise((resolve) => {
          try {
            webApp.CloudStorage.getItems(keys, (error, values) => {
              if (error) {
                log.error('CloudStorage getMultiple error', { keys, error });
                resolve({});
              } else {
                resolve(values);
              }
            });
          } catch (error) {
            log.error('CloudStorage getMultiple exception', error);
            resolve({});
          }
        });
      },
      [webApp]
    ),

    removeMultiple: useCallback(
      (keys: string[]): Promise<boolean> => {
        if (!webApp?.CloudStorage) {
          return Promise.resolve(false);
        }

        return new Promise((resolve) => {
          try {
            webApp.CloudStorage.removeItems(keys, (error, success) => {
              if (error) {
                log.error('CloudStorage removeMultiple error', { keys, error });
                resolve(false);
              } else {
                resolve(success);
              }
            });
          } catch (error) {
            log.error('CloudStorage removeMultiple exception', error);
            resolve(false);
          }
        });
      },
      [webApp]
    ),

    getKeys: useCallback((): Promise<string[]> => {
      if (!webApp?.CloudStorage) {
        return Promise.resolve([]);
      }

      return new Promise((resolve) => {
        try {
          webApp.CloudStorage.getKeys((error, keys) => {
            if (error) {
              log.error('CloudStorage getKeys error', error);
              resolve([]);
            } else {
              resolve(keys);
            }
          });
        } catch (error) {
          log.error('CloudStorage getKeys exception', error);
          resolve([]);
        }
      });
    }, [webApp]),
  };

  // Device Storage API (same structure as Cloud)
  const device: StorageAPI = {
    get: useCallback(
      (key: string): Promise<string | null> => {
        if (!webApp?.DeviceStorage) {
          return Promise.resolve(null);
        }

        return new Promise((resolve) => {
          try {
            webApp.DeviceStorage!.getItem(key, (error, value) => {
              if (error) {
                log.error('DeviceStorage get error', { key, error });
                resolve(null);
              } else {
                resolve(value || null);
              }
            });
          } catch (error) {
            log.error('DeviceStorage get exception', error);
            resolve(null);
          }
        });
      },
      [webApp]
    ),

    set: useCallback(
      (key: string, value: string): Promise<boolean> => {
        if (!webApp?.DeviceStorage) {
          return Promise.resolve(false);
        }

        return new Promise((resolve) => {
          try {
            webApp.DeviceStorage!.setItem(key, value, (error, success) => {
              if (error) {
                log.error('DeviceStorage set error', { key, error });
                resolve(false);
              } else {
                resolve(success);
              }
            });
          } catch (error) {
            log.error('DeviceStorage set exception', error);
            resolve(false);
          }
        });
      },
      [webApp]
    ),

    remove: useCallback(
      (key: string): Promise<boolean> => {
        if (!webApp?.DeviceStorage) {
          return Promise.resolve(false);
        }

        return new Promise((resolve) => {
          try {
            webApp.DeviceStorage!.removeItem(key, (error, success) => {
              if (error) {
                log.error('DeviceStorage remove error', { key, error });
                resolve(false);
              } else {
                resolve(success);
              }
            });
          } catch (error) {
            log.error('DeviceStorage remove exception', error);
            resolve(false);
          }
        });
      },
      [webApp]
    ),

    getMultiple: useCallback(
      (keys: string[]): Promise<Record<string, string>> => {
        if (!webApp?.DeviceStorage) {
          return Promise.resolve({});
        }

        return new Promise((resolve) => {
          try {
            webApp.DeviceStorage!.getItems(keys, (error, values) => {
              if (error) {
                log.error('DeviceStorage getMultiple error', { keys, error });
                resolve({});
              } else {
                resolve(values);
              }
            });
          } catch (error) {
            log.error('DeviceStorage getMultiple exception', error);
            resolve({});
          }
        });
      },
      [webApp]
    ),

    removeMultiple: useCallback(
      (keys: string[]): Promise<boolean> => {
        if (!webApp?.DeviceStorage) {
          return Promise.resolve(false);
        }

        return new Promise((resolve) => {
          try {
            webApp.DeviceStorage!.removeItems(keys, (error, success) => {
              if (error) {
                log.error('DeviceStorage removeMultiple error', { keys, error });
                resolve(false);
              } else {
                resolve(success);
              }
            });
          } catch (error) {
            log.error('DeviceStorage removeMultiple exception', error);
            resolve(false);
          }
        });
      },
      [webApp]
    ),

    getKeys: useCallback((): Promise<string[]> => {
      if (!webApp?.DeviceStorage) {
        return Promise.resolve([]);
      }

      return new Promise((resolve) => {
        try {
          webApp.DeviceStorage!.getKeys((error, keys) => {
            if (error) {
              log.error('DeviceStorage getKeys error', error);
              resolve([]);
            } else {
              resolve(keys);
            }
          });
        } catch (error) {
          log.error('DeviceStorage getKeys exception', error);
          resolve([]);
        }
      });
    }, [webApp]),
  };

  // Secure Storage API
  const secure: SecureStorageAPI = {
    isAvailable: isSecureSupported,

    get: useCallback(
      (key: string): Promise<string | null> => {
        if (!webApp?.SecureStorage?.isAvailable) {
          return Promise.resolve(null);
        }

        return new Promise((resolve) => {
          try {
            webApp.SecureStorage!.getItem(key, (error, value) => {
              if (error) {
                log.error('SecureStorage get error', { key, error });
                resolve(null);
              } else {
                resolve(value || null);
              }
            });
          } catch (error) {
            log.error('SecureStorage get exception', error);
            resolve(null);
          }
        });
      },
      [webApp]
    ),

    set: useCallback(
      (key: string, value: string): Promise<boolean> => {
        if (!webApp?.SecureStorage?.isAvailable) {
          return Promise.resolve(false);
        }

        return new Promise((resolve) => {
          try {
            webApp.SecureStorage!.setItem(key, value, (error) => {
              if (error) {
                log.error('SecureStorage set error', { key, error });
                resolve(false);
              } else {
                resolve(true);
              }
            });
          } catch (error) {
            log.error('SecureStorage set exception', error);
            resolve(false);
          }
        });
      },
      [webApp]
    ),

    remove: useCallback(
      (key: string): Promise<boolean> => {
        if (!webApp?.SecureStorage?.isAvailable) {
          return Promise.resolve(false);
        }

        return new Promise((resolve) => {
          try {
            webApp.SecureStorage!.removeItem(key, (error) => {
              if (error) {
                log.error('SecureStorage remove error', { key, error });
                resolve(false);
              } else {
                resolve(true);
              }
            });
          } catch (error) {
            log.error('SecureStorage remove exception', error);
            resolve(false);
          }
        });
      },
      [webApp]
    ),
  };

  return {
    cloud,
    device,
    secure,
    isCloudSupported,
    isDeviceSupported,
    isSecureSupported,
  };
}
