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

    // Faster multi-level timeout strategy to prevent hanging
    const timeout1 = setTimeout(() => {
      // Show content after 800ms regardless - better UX than waiting
      showContentSafely('quick timeout (800ms)');
    }, 800);

    const timeout2 = setTimeout(() => {
      initLogger.warn('Level 2 timeout (1.5s) - forcing display');
      showContentSafely('level 2 timeout reached');
    }, 1500);

    // Emergency fallback - ALWAYS show content after 2.5 seconds
    const emergencyTimeout = setTimeout(() => {
      initLogger.error('Emergency timeout (2.5s) - forcing content display');
      showContentSafely('emergency fallback');
    }, 2500);

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
