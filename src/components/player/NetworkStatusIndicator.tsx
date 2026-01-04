/**
 * Network Status Indicator Component
 * 
 * Displays current network status and quality warnings
 * for audio playback. Provides user feedback on connectivity issues.
 */

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Signal, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useNetworkStatus } from '@/hooks/audio/useNetworkStatus';
import { cn } from '@/lib/utils';

interface NetworkStatusIndicatorProps {
  /**
   * Show always or only when there are issues
   */
  mode?: 'always' | 'issues-only';
  
  /**
   * Compact mode with icon only
   */
  compact?: boolean;
  
  /**
   * Custom className for styling
   */
  className?: string;
}

/**
 * Network status indicator for player
 */
export function NetworkStatusIndicator({
  mode = 'issues-only',
  compact = false,
  className,
}: NetworkStatusIndicatorProps) {
  const {
    isOnline,
    isSlowConnection,
    connectionType,
    isSuitableForStreaming,
    networkInfo,
  } = useNetworkStatus();

  const [showIndicator, setShowIndicator] = useState(false);

  // Determine if we should show the indicator
  useEffect(() => {
    if (mode === 'always') {
      setShowIndicator(true);
    } else {
      // Show only when there are issues
      setShowIndicator(!isOnline || isSlowConnection || !isSuitableForStreaming);
    }
  }, [mode, isOnline, isSlowConnection, isSuitableForStreaming]);

  // Don't render if not needed
  if (!showIndicator && mode === 'issues-only') {
    return null;
  }

  // Determine status and styling
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        label: 'Нет сети',
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        description: 'Воспроизведение приостановлено',
      };
    }

    if (isSlowConnection) {
      return {
        icon: Signal,
        label: 'Медленная сеть',
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        description: 'Возможны задержки при загрузке',
      };
    }

    if (!isSuitableForStreaming) {
      return {
        icon: AlertTriangle,
        label: 'Слабое соединение',
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        description: 'Не рекомендуется для потокового воспроизведения',
      };
    }

    // Good connection
    return {
      icon: Wifi,
      label: connectionType === '4g' || connectionType === 'wifi' ? 'Хорошая сеть' : 'Сеть в норме',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      description: `Соединение: ${connectionType.toUpperCase()}`,
    };
  };

  const statusConfig = getStatusConfig();
  const Icon = statusConfig.icon;

  // Compact mode - icon only
  if (compact) {
    return (
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              'flex items-center justify-center p-1.5 rounded-full',
              statusConfig.bg,
              className
            )}
            title={`${statusConfig.label}: ${statusConfig.description}`}
          >
            <Icon className={cn('w-4 h-4', statusConfig.color)} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Full mode with text
  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            statusConfig.bg,
            className
          )}
        >
          <Icon className={cn('w-4 h-4 flex-shrink-0', statusConfig.color)} />
          
          <div className="flex flex-col min-w-0">
            <span className={cn('font-medium', statusConfig.color)}>
              {statusConfig.label}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {statusConfig.description}
            </span>
          </div>

          {/* Additional metrics in non-compact mode */}
          {networkInfo.rtt !== undefined && networkInfo.downlink !== undefined && (
            <div className="flex gap-2 text-xs text-muted-foreground ml-auto">
              <span title="Задержка">{networkInfo.rtt}ms</span>
              <span title="Скорость">↓{networkInfo.downlink.toFixed(1)}Mbps</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Simple connection status badge for compact spaces
 */
export function ConnectionBadge({ className }: { className?: string }) {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null; // Don't show if everything is fine
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
        !isOnline ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-500',
        className
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Офлайн</span>
        </>
      ) : (
        <>
          <Signal className="w-3 h-3" />
          <span>Медленно</span>
        </>
      )}
    </div>
  );
}
