import { ReactNode, useEffect, useState, useRef } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { logger } from '@/lib/logger';
import { cleanupStaleData } from '@/lib/cleanupStaleData';
import { preloadCriticalRoutes } from '@/lib/route-preloader';

interface InitializationGuardProps {
  children: ReactNode;
}

const initLogger = logger.child({ module: 'InitializationGuard' });

// Boot logging helper
const bootLog = (msg: string) => {
  const entry = `[InitGuard] ${msg}`;
  console.log(entry);
  try {
    const existing = JSON.parse(sessionStorage.getItem('musicverse_boot_log') || '[]');
    existing.push(`[${new Date().toISOString()}] ${entry}`);
    sessionStorage.setItem('musicverse_boot_log', JSON.stringify(existing));
  } catch (e) {
    // Ignore storage errors
  }
};

// Run cleanup once on module load
let cleanupRun = false;

/**
 * InitializationGuard ensures that TelegramContext is fully initialized
 * before rendering children. This prevents black screen issues.
 * 
 * Uses a multi-level timeout strategy:
 * - Level 1 (1.5s): Quick timeout for fast connections
 * - Level 2 (3s): Standard timeout for slow connections  
 * - Level 3 (5s): Emergency fallback - always show content
 */
export const InitializationGuard = ({ children }: InitializationGuardProps) => {
  const { isInitialized } = useTelegram();
  const [showContent, setShowContent] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Загрузка MusicVerse...');
  const mountedRef = useRef(true);
  const hasShownRef = useRef(false);

  bootLog(`Component mounted, isInitialized=${isInitialized}`);

  useEffect(() => {
    // Run cleanup once on first mount
    if (!cleanupRun) {
      cleanupRun = true;
      bootLog('Running stale data cleanup');
      cleanupStaleData().catch(err => {
        initLogger.error('Failed to cleanup stale data', err);
        bootLog(`Cleanup error: ${err}`);
      });
    }
    
    initLogger.debug('InitializationGuard mounted', { isInitialized });
    bootLog(`useEffect started, isInitialized=${isInitialized}`);
    mountedRef.current = true;

    const showContentSafely = (reason: string) => {
      if (mountedRef.current && !hasShownRef.current) {
        hasShownRef.current = true;
        initLogger.info(`Showing content: ${reason}`);
        bootLog(`Showing content: ${reason}`);
        setShowContent(true);
      }
    };

    // If already initialized, show immediately
    if (isInitialized) {
      showContentSafely('already initialized');
      return;
    }

    // Multi-level timeout strategy with progress updates
    const timeout1 = setTimeout(() => {
      bootLog('Timeout 1 (1.5s) reached');
      if (!hasShownRef.current) {
        setLoadingMessage('Подключение...');
      }
      if (isInitialized) {
        showContentSafely('initialized within 1.5s');
      }
    }, 1500);

    const timeout2 = setTimeout(() => {
      bootLog('Timeout 2 (2.5s) reached');
      if (!hasShownRef.current) {
        setLoadingMessage('Загрузка занимает больше времени...');
      }
      initLogger.warn('Level 2 timeout (2.5s) - checking status');
      // In development mode, don't wait - show content immediately
      if (isInitialized || !hasShownRef.current) {
        showContentSafely('level 2 timeout reached');
      }
    }, 2500);

    // Emergency fallback - ALWAYS show content after 3 seconds (reduced from 4)
    const emergencyTimeout = setTimeout(() => {
      bootLog('EMERGENCY timeout (3s) - forcing display');
      initLogger.error('Emergency timeout (3s) - forcing content display');
      showContentSafely('emergency fallback');
    }, 3000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(emergencyTimeout);
    };
  }, [isInitialized]);

  // Also watch for isInitialized changes
  useEffect(() => {
    if (isInitialized && !hasShownRef.current) {
      hasShownRef.current = true;
      bootLog('isInitialized became true');
      initLogger.info('isInitialized became true - showing content');
      setTimeout(() => {
        setShowContent(true);
        // Preload critical routes after showing content
        preloadCriticalRoutes();
      }, 0);
    }
  }, [isInitialized]);

  // Show loading screen while initializing
  if (!showContent) {
    bootLog(`Rendering LoadingScreen: ${loadingMessage}`);
    return <LoadingScreen message={loadingMessage} />;
  }

  bootLog('Rendering children');
  return <>{children}</>;
};
