/**
 * Offline Indicator Component
 * 
 * Displays network status and audio cache information.
 * Shows when audio is available for offline playback.
 */

import { memo, useState, useEffect } from 'react';
import { Cloud, CloudOff, Download, HardDrive, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { getAudioCacheSize, precacheAudioUrls } from '@/lib/audioServiceWorker';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  audioUrls?: string[];
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const OfflineIndicator = memo(function OfflineIndicator({
  audioUrls = [],
  className,
}: OfflineIndicatorProps) {
  const { isOnline, isOfflineCapable, checkOfflineAvailability } = useOfflineStatus();
  const [cacheSize, setCacheSize] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isPrecaching, setIsPrecaching] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check cache size periodically
  useEffect(() => {
    const updateCacheSize = async () => {
      const size = await getAudioCacheSize();
      setCacheSize(size);
    };

    updateCacheSize();
    const interval = setInterval(updateCacheSize, 30000); // Every 30s

    return () => clearInterval(interval);
  }, []);

  // Check offline availability for provided URLs
  useEffect(() => {
    if (audioUrls.length === 0) return;

    const checkAvailability = async () => {
      const results = await checkOfflineAvailability(audioUrls);
      const availableCount = Array.from(results.values()).filter(Boolean).length;
      setOfflineCount(availableCount);
    };

    checkAvailability();
  }, [audioUrls, checkOfflineAvailability]);

  // Precache all audio URLs
  const handlePrecache = async () => {
    if (audioUrls.length === 0 || isPrecaching) return;

    setIsPrecaching(true);
    try {
      await precacheAudioUrls(audioUrls);
      setOfflineCount(audioUrls.length);
    } finally {
      setIsPrecaching(false);
    }
  };

  if (!isOfflineCapable) return null;

  const allCached = audioUrls.length > 0 && offlineCount === audioUrls.length;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Online/Offline status */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors cursor-default",
              isOnline 
                ? "text-muted-foreground" 
                : "bg-destructive/10 text-destructive"
            )}
          >
            {isOnline ? (
              <Cloud className="w-3.5 h-3.5" />
            ) : (
              <CloudOff className="w-3.5 h-3.5" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isOnline ? 'Онлайн' : 'Офлайн режим'}
        </TooltipContent>
      </Tooltip>

      {/* Cache status */}
      <AnimatePresence mode="wait">
        {cacheSize > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className="gap-1 h-6 px-2 cursor-pointer"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <HardDrive className="w-3 h-3" />
                  <span className="font-mono text-[10px]">
                    {formatBytes(cacheSize)}
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Аудио в кэше: {formatBytes(cacheSize)}
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline availability for current audio */}
      {audioUrls.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            {allCached ? (
              <Badge variant="outline" className="gap-1 h-6 px-2 text-primary border-primary/30">
                <Download className="w-3 h-3" />
                <span className="text-[10px]">Офлайн</span>
              </Badge>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrecache}
                disabled={isPrecaching}
                className="h-6 px-2 text-xs gap-1"
              >
                {isPrecaching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">
                  {offlineCount}/{audioUrls.length}
                </span>
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {allCached 
              ? 'Доступно офлайн' 
              : `Скачать для офлайн (${offlineCount}/${audioUrls.length})`
            }
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
});
