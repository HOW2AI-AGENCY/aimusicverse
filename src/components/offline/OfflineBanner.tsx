/**
 * OfflineBanner - Visual indicator for network connectivity issues
 * Shows when the app is offline and hides when online
 */

import { useOffline } from '@/hooks/useOffline';
import { WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999]",
        "bg-amber-500/95 backdrop-blur-md",
        "border-b border-amber-600/50",
        "px-4 py-2 sm:py-3",
        "flex items-center justify-center gap-2",
        "shadow-lg",
        // Safe area for notched devices
        "pt-[max(var(--tg-content-safe-area-inset-top,0px),env(safe-area-inset-top,0px))]"
      )}
    >
      <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
      <span className="text-sm sm:text-base font-medium text-white">
        Ожидание подключения...
      </span>
      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin flex-shrink-0" />
    </div>
  );
}

export default OfflineBanner;
