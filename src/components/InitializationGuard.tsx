import { ReactNode, useEffect, useState, useRef } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { logger } from '@/lib/logger';
import { cleanupStaleData } from '@/lib/cleanupStaleData';

interface InitializationGuardProps {
  children: ReactNode;
}

const initLogger = logger.child({ module: 'InitializationGuard' });

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
  const mountedRef = useRef(true);
  const hasShownRef = useRef(false);

  useEffect(() => {
    // Run cleanup once on first mount
    if (!cleanupRun) {
      cleanupRun = true;
      cleanupStaleData().catch(err => {
        initLogger.error('Failed to cleanup stale data', err);
      });
    }
    
    initLogger.debug('InitializationGuard mounted', { isInitialized });
    mountedRef.current = true;

    const showContentSafely = (reason: string) => {
      if (mountedRef.current && !hasShownRef.current) {
        hasShownRef.current = true;
        initLogger.info(`Showing content: ${reason}`);
        setShowContent(true);
      }
    };

    // If already initialized, show immediately
    if (isInitialized) {
      showContentSafely('already initialized');
      return;
    }

    // Multi-level timeout strategy
    const timeout1 = setTimeout(() => {
      if (isInitialized) {
        showContentSafely('initialized within 1.5s');
      }
    }, 1500);

    const timeout2 = setTimeout(() => {
      initLogger.warn('Level 2 timeout (3s) - checking status');
      if (isInitialized || !hasShownRef.current) {
        showContentSafely('level 2 timeout reached');
      }
    }, 3000);

    // Emergency fallback - ALWAYS show content after 5 seconds
    const emergencyTimeout = setTimeout(() => {
      initLogger.error('Emergency timeout (5s) - forcing content display');
      showContentSafely('emergency fallback');
    }, 5000);

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
      initLogger.info('isInitialized became true - showing content');
      // Use setTimeout to avoid synchronous state update
      setTimeout(() => {
        setShowContent(true);
      }, 0);
    }
  }, [isInitialized]);

  // Show loading screen while initializing
  if (!showContent) {
    return <LoadingScreen message="Загрузка MusicVerse..." />;
  }

  return <>{children}</>;
};
