/**
 * Telegram Sensors Hook
 * 
 * Provides access to device sensors (Accelerometer, Gyroscope, DeviceOrientation)
 * Available in Telegram Mini App 2.0+
 * 
 * Features:
 * - Accelerometer for motion detection
 * - Gyroscope for rotation tracking
 * - Device orientation for tilt detection
 * - Automatic cleanup on unmount
 * - Graceful fallback for unsupported devices
 * 
 * @example
 * ```tsx
 * const { accelerometer, gyroscope, orientation, isSupported } = useTelegramSensors({
 *   enableAccelerometer: true,
 *   enableGyroscope: true,
 *   refreshRate: 60
 * });
 * 
 * // Use sensor data
 * if (accelerometer) {
 *   const tilt = Math.atan2(accelerometer.y, accelerometer.x) * 180 / Math.PI;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TelegramSensors' });

interface SensorData {
  x: number;
  y: number;
  z: number;
}

interface OrientationData {
  alpha: number;
  beta: number;
  gamma: number;
  absolute: boolean;
}

interface UseTelegramSensorsOptions {
  enableAccelerometer?: boolean;
  enableGyroscope?: boolean;
  enableOrientation?: boolean;
  refreshRate?: number; // Hz, default 60
  needAbsoluteOrientation?: boolean;
}

interface UseTelegramSensorsReturn {
  // Sensor data
  accelerometer: SensorData | null;
  gyroscope: SensorData | null;
  orientation: OrientationData | null;
  
  // Status
  isSupported: boolean;
  isAccelerometerActive: boolean;
  isGyroscopeActive: boolean;
  isOrientationActive: boolean;
  
  // Controls
  startAccelerometer: () => Promise<boolean>;
  stopAccelerometer: () => void;
  startGyroscope: () => Promise<boolean>;
  stopGyroscope: () => void;
  startOrientation: () => Promise<boolean>;
  stopOrientation: () => void;
}

export function useTelegramSensors(options: UseTelegramSensorsOptions = {}): UseTelegramSensorsReturn {
  const {
    enableAccelerometer = false,
    enableGyroscope = false,
    enableOrientation = false,
    refreshRate = 60,
    needAbsoluteOrientation = false,
  } = options;

  const { webApp } = useTelegram();
  
  const [accelerometer, setAccelerometer] = useState<SensorData | null>(null);
  const [gyroscope, setGyroscope] = useState<SensorData | null>(null);
  const [orientation, setOrientation] = useState<OrientationData | null>(null);
  
  const [isAccelerometerActive, setIsAccelerometerActive] = useState(false);
  const [isGyroscopeActive, setIsGyroscopeActive] = useState(false);
  const [isOrientationActive, setIsOrientationActive] = useState(false);

  // Check if sensors are supported
  const isSupported = !!(
    webApp?.Accelerometer ||
    webApp?.Gyroscope ||
    webApp?.DeviceOrientation
  );

  // Accelerometer
  const startAccelerometer = useCallback(async (): Promise<boolean> => {
    if (!webApp?.Accelerometer) {
      log.warn('Accelerometer not supported');
      return false;
    }

    return new Promise((resolve) => {
      try {
        webApp.Accelerometer!.start(refreshRate, (started) => {
          if (started) {
            setIsAccelerometerActive(true);
            log.info('Accelerometer started', { refreshRate });
            resolve(true);
          } else {
            log.warn('Failed to start accelerometer');
            resolve(false);
          }
        });
      } catch (error) {
        log.error('Error starting accelerometer', error);
        resolve(false);
      }
    });
  }, [webApp, refreshRate]);

  const stopAccelerometer = useCallback(() => {
    if (!webApp?.Accelerometer) return;
    
    try {
      webApp.Accelerometer.stop(() => {
        setIsAccelerometerActive(false);
        setAccelerometer(null);
        log.info('Accelerometer stopped');
      });
    } catch (error) {
      log.error('Error stopping accelerometer', error);
    }
  }, [webApp]);

  // Gyroscope
  const startGyroscope = useCallback(async (): Promise<boolean> => {
    if (!webApp?.Gyroscope) {
      log.warn('Gyroscope not supported');
      return false;
    }

    return new Promise((resolve) => {
      try {
        webApp.Gyroscope!.start(refreshRate, (started) => {
          if (started) {
            setIsGyroscopeActive(true);
            log.info('Gyroscope started', { refreshRate });
            resolve(true);
          } else {
            log.warn('Failed to start gyroscope');
            resolve(false);
          }
        });
      } catch (error) {
        log.error('Error starting gyroscope', error);
        resolve(false);
      }
    });
  }, [webApp, refreshRate]);

  const stopGyroscope = useCallback(() => {
    if (!webApp?.Gyroscope) return;
    
    try {
      webApp.Gyroscope.stop(() => {
        setIsGyroscopeActive(false);
        setGyroscope(null);
        log.info('Gyroscope stopped');
      });
    } catch (error) {
      log.error('Error stopping gyroscope', error);
    }
  }, [webApp]);

  // Device Orientation
  const startOrientation = useCallback(async (): Promise<boolean> => {
    if (!webApp?.DeviceOrientation) {
      log.warn('DeviceOrientation not supported');
      return false;
    }

    return new Promise((resolve) => {
      try {
        webApp.DeviceOrientation!.start(needAbsoluteOrientation, (started) => {
          if (started) {
            setIsOrientationActive(true);
            log.info('DeviceOrientation started', { needAbsolute: needAbsoluteOrientation });
            resolve(true);
          } else {
            log.warn('Failed to start device orientation');
            resolve(false);
          }
        });
      } catch (error) {
        log.error('Error starting device orientation', error);
        resolve(false);
      }
    });
  }, [webApp, needAbsoluteOrientation]);

  const stopOrientation = useCallback(() => {
    if (!webApp?.DeviceOrientation) return;
    
    try {
      webApp.DeviceOrientation.stop(() => {
        setIsOrientationActive(false);
        setOrientation(null);
        log.info('DeviceOrientation stopped');
      });
    } catch (error) {
      log.error('Error stopping device orientation', error);
    }
  }, [webApp]);

  // Auto-start sensors based on options
  useEffect(() => {
    if (enableAccelerometer && !isAccelerometerActive) {
      startAccelerometer();
    }
    if (enableGyroscope && !isGyroscopeActive) {
      startGyroscope();
    }
    if (enableOrientation && !isOrientationActive) {
      startOrientation();
    }

    // Cleanup on unmount
    return () => {
      if (isAccelerometerActive) stopAccelerometer();
      if (isGyroscopeActive) stopGyroscope();
      if (isOrientationActive) stopOrientation();
    };
  }, [
    enableAccelerometer,
    enableGyroscope,
    enableOrientation,
    isAccelerometerActive,
    isGyroscopeActive,
    isOrientationActive,
    startAccelerometer,
    startGyroscope,
    startOrientation,
    stopAccelerometer,
    stopGyroscope,
    stopOrientation,
  ]);

  // Update sensor data from events
  useEffect(() => {
    if (!webApp) return;

    const handleAccelerometerChanged = (data: any) => {
      if (webApp.Accelerometer) {
        setAccelerometer({
          x: webApp.Accelerometer.x,
          y: webApp.Accelerometer.y,
          z: webApp.Accelerometer.z,
        });
      }
    };

    const handleGyroscopeChanged = (data: any) => {
      if (webApp.Gyroscope) {
        setGyroscope({
          x: webApp.Gyroscope.x,
          y: webApp.Gyroscope.y,
          z: webApp.Gyroscope.z,
        });
      }
    };

    const handleOrientationChanged = (data: any) => {
      if (webApp.DeviceOrientation) {
        setOrientation({
          alpha: webApp.DeviceOrientation.alpha,
          beta: webApp.DeviceOrientation.beta,
          gamma: webApp.DeviceOrientation.gamma,
          absolute: webApp.DeviceOrientation.absolute,
        });
      }
    };

    webApp.onEvent?.('accelerometerChanged', handleAccelerometerChanged);
    webApp.onEvent?.('gyroscopeChanged', handleGyroscopeChanged);
    webApp.onEvent?.('deviceOrientationChanged', handleOrientationChanged);

    return () => {
      webApp.offEvent?.('accelerometerChanged', handleAccelerometerChanged);
      webApp.offEvent?.('gyroscopeChanged', handleGyroscopeChanged);
      webApp.offEvent?.('deviceOrientationChanged', handleOrientationChanged);
    };
  }, [webApp]);

  return {
    accelerometer,
    gyroscope,
    orientation,
    isSupported,
    isAccelerometerActive,
    isGyroscopeActive,
    isOrientationActive,
    startAccelerometer,
    stopAccelerometer,
    startGyroscope,
    stopGyroscope,
    startOrientation,
    stopOrientation,
  };
}
