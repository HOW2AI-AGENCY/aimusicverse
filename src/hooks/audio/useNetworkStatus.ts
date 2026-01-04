/**
 * Network Status Hook
 * 
 * Monitors network connectivity and quality for audio playback.
 * Provides real-time status updates and connection type information.
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export type NetworkStatus = 'online' | 'offline' | 'slow';
export type ConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'unknown';

interface NetworkInfo {
  status: NetworkStatus;
  connectionType: ConnectionType;
  effectiveType?: string;
  downlink?: number; // Mbps
  rtt?: number; // ms
  saveData?: boolean;
}

/**
 * Get connection type from navigator
 */
function getConnectionType(): ConnectionType {
  const nav = navigator as any;
  if (!nav.connection && !nav.mozConnection && !nav.webkitConnection) {
    return 'unknown';
  }

  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const effectiveType = connection.effectiveType;

  switch (effectiveType) {
    case '4g':
      return '4g';
    case '3g':
      return '3g';
    case '2g':
      return '2g';
    case 'slow-2g':
      return 'slow-2g';
    default:
      return 'unknown';
  }
}

/**
 * Get detailed network information
 */
function getNetworkInfo(): NetworkInfo {
  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  
  const online = navigator.onLine;
  let status: NetworkStatus = online ? 'online' : 'offline';
  
  // Check for slow connection
  if (online && connection) {
    const effectiveType = connection.effectiveType;
    const rtt = connection.rtt;
    
    // Consider connection slow if effective type is 2g/slow-2g or RTT > 500ms
    if (effectiveType === '2g' || effectiveType === 'slow-2g' || (rtt && rtt > 500)) {
      status = 'slow';
    }
  }

  return {
    status,
    connectionType: getConnectionType(),
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
    saveData: connection?.saveData,
  };
}

/**
 * Hook for monitoring network status
 */
export function useNetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(() => getNetworkInfo());

  /**
   * Update network information
   */
  const updateNetworkInfo = useCallback(() => {
    const info = getNetworkInfo();
    setNetworkInfo(info);
    
    logger.debug('Network status updated', {
      status: info.status,
      type: info.connectionType,
      effectiveType: info.effectiveType,
      downlink: info.downlink,
      rtt: info.rtt,
    });
  }, []);

  /**
   * Listen to network status changes
   */
  useEffect(() => {
    // Update on online/offline events
    const handleOnline = () => {
      logger.info('Network connection restored');
      updateNetworkInfo();
    };

    const handleOffline = () => {
      logger.warn('Network connection lost');
      updateNetworkInfo();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to connection changes if available
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    // Periodic check every 30 seconds
    const intervalId = setInterval(updateNetworkInfo, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
      
      clearInterval(intervalId);
    };
  }, [updateNetworkInfo]);

  /**
   * Check if network is suitable for audio streaming
   */
  const isSuitableForStreaming = useCallback((): boolean => {
    const { status, connectionType, saveData } = networkInfo;
    
    // Offline or save data mode - not suitable
    if (status === 'offline' || saveData) {
      return false;
    }
    
    // Slow connection - suitable but with warnings
    if (status === 'slow') {
      return true; // Still allow, but caller should handle appropriately
    }
    
    // Very slow connections - not recommended
    if (connectionType === 'slow-2g') {
      return false;
    }
    
    return true;
  }, [networkInfo]);

  /**
   * Get recommended audio quality based on network
   */
  const getRecommendedQuality = useCallback((): 'high' | 'medium' | 'low' => {
    const { connectionType, downlink, status } = networkInfo;
    
    if (status === 'offline' || status === 'slow') {
      return 'low';
    }
    
    // Based on connection type
    switch (connectionType) {
      case '4g':
      case 'wifi':
        return 'high';
      case '3g':
        return 'medium';
      case '2g':
      case 'slow-2g':
        return 'low';
      default:
        // Use downlink if available
        if (downlink) {
          if (downlink >= 5) return 'high';
          if (downlink >= 1.5) return 'medium';
          return 'low';
        }
        return 'medium'; // Default to medium
    }
  }, [networkInfo]);

  /**
   * Check if prefetching is recommended
   */
  const shouldPrefetch = useCallback((): boolean => {
    const { status, connectionType, saveData } = networkInfo;
    
    // Don't prefetch if offline, slow, or data saver is on
    if (status === 'offline' || status === 'slow' || saveData) {
      return false;
    }
    
    // Only prefetch on good connections
    return connectionType === '4g' || connectionType === 'wifi' || connectionType === '3g';
  }, [networkInfo]);

  return {
    networkInfo,
    isOnline: networkInfo.status !== 'offline',
    isSlowConnection: networkInfo.status === 'slow',
    connectionType: networkInfo.connectionType,
    isSuitableForStreaming: isSuitableForStreaming(),
    recommendedQuality: getRecommendedQuality(),
    shouldPrefetch: shouldPrefetch(),
    updateNetworkInfo,
  };
}
