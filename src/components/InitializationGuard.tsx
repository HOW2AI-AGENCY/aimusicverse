import { ReactNode, useEffect, useState } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { logger } from '@/lib/logger';

interface InitializationGuardProps {
  children: ReactNode;
}

const initLogger = logger.child({ module: 'InitializationGuard' });

/**
 * InitializationGuard ensures that TelegramContext is fully initialized
 * before rendering children. This prevents black screen issues.
 */
export const InitializationGuard = ({ children }: InitializationGuardProps) => {
  const { isInitialized } = useTelegram();
  const [showContent, setShowContent] = useState(false);
  const [initTimeout, setInitTimeout] = useState(false);

  useEffect(() => {
    initLogger.debug('InitializationGuard mounted', { isInitialized });

    // Set a safety timeout to show content even if initialization is stuck
    const timeout = setTimeout(() => {
      initLogger.warn('Initialization timeout reached - showing content anyway');
      setInitTimeout(true);
      setShowContent(true);
    }, 3000);

    if (isInitialized) {
      initLogger.info('Initialization complete - showing content');
      clearTimeout(timeout);
      setShowContent(true);
    }

    return () => clearTimeout(timeout);
  }, [isInitialized]);

  // Show loading screen while initializing (unless timeout reached)
  if (!showContent && !initTimeout) {
    return <LoadingScreen message="Инициализация приложения..." />;
  }

  // Show content once initialized or timeout reached
  return <>{children}</>;
};
