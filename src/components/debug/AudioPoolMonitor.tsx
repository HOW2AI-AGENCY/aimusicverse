/**
 * AudioPoolMonitor
 * 
 * Debug UI component to monitor AudioElementPool status
 * Shows active audio elements, pool capacity, and statistics
 * 
 * @example
 * ```tsx
 * // In development/admin mode
 * {isDev && <AudioPoolMonitor />}
 * ```
 */

import { useState, useEffect } from 'react';
import { audioElementPool, AudioPriority } from '@/lib/audioElementPool';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Activity, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AudioPoolMonitor() {
  const [stats, setStats] = useState(() => audioElementPool.getStats());
  const [activeElements, setActiveElements] = useState(() => audioElementPool.getActiveElements());

  // Update stats every second
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(audioElementPool.getStats());
      setActiveElements(audioElementPool.getActiveElements());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const utilizationPercent = Math.round((stats.active / stats.capacity) * 100);
  const isNearLimit = utilizationPercent >= 80;
  const isAtLimit = stats.active >= stats.capacity;

  const getPriorityLabel = (priority: AudioPriority): string => {
    switch (priority) {
      case AudioPriority.LOW:
        return 'Low';
      case AudioPriority.MEDIUM:
        return 'Medium';
      case AudioPriority.HIGH:
        return 'High';
      default:
        return 'Unknown';
    }
  };

  const getPriorityColor = (priority: AudioPriority): string => {
    switch (priority) {
      case AudioPriority.LOW:
        return 'bg-muted text-muted-foreground';
      case AudioPriority.MEDIUM:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case AudioPriority.HIGH:
        return 'bg-green-500/10 text-green-700 dark:text-green-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="fixed bottom-20 right-4 w-80 z-50 shadow-lg border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <CardTitle className="text-sm">Audio Pool Monitor</CardTitle>
          </div>
          {isAtLimit ? (
            <AlertCircle className="w-4 h-4 text-destructive" />
          ) : isNearLimit ? (
            <AlertCircle className="w-4 h-4 text-warning" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-success" />
          )}
        </div>
        <CardDescription className="text-xs">
          iOS Safari Limit: {stats.capacity} audio elements
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Utilization Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Utilization</span>
            <span className={cn(
              "font-mono",
              isAtLimit && "text-destructive",
              isNearLimit && !isAtLimit && "text-warning"
            )}>
              {stats.active}/{stats.capacity}
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 transition-all duration-300",
                isAtLimit ? "bg-destructive" : isNearLimit ? "bg-warning" : "bg-success"
              )}
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="text-lg font-bold">{stats.available}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-lg font-bold">{stats.active}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Acquired</p>
            <p className="text-sm font-mono">{stats.totalAcquired}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Rejected</p>
            <p className={cn(
              "text-sm font-mono",
              stats.totalRejected > 0 && "text-destructive"
            )}>
              {stats.totalRejected}
            </p>
          </div>
        </div>

        {/* Active Elements List */}
        {activeElements.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Active Elements ({activeElements.length})
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {activeElements.map(({ id, priority, age }) => (
                <div
                  key={id}
                  className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
                >
                  <span className="font-mono truncate flex-1 pr-2">{id}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px] px-1.5 py-0", getPriorityColor(priority))}
                    >
                      {getPriorityLabel(priority)}
                    </Badge>
                    <span className="text-muted-foreground">
                      {Math.round(age / 1000)}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Message */}
        {isAtLimit && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
            <p className="font-medium">⚠️ Pool Limit Reached</p>
            <p className="text-[10px] mt-1">
              Stop unused audio to free up resources
            </p>
          </div>
        )}

        {stats.totalRejected > 0 && (
          <div className="p-2 bg-warning/10 border border-warning/20 rounded text-xs text-warning">
            <p className="font-medium">⚠️ {stats.totalRejected} Requests Rejected</p>
            <p className="text-[10px] mt-1">
              Some audio couldn't play due to iOS limit
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for bottom bar
 */
export function AudioPoolStatusBadge() {
  const [stats, setStats] = useState(() => audioElementPool.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(audioElementPool.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isNearLimit = stats.active >= stats.capacity * 0.8;
  const isAtLimit = stats.active >= stats.capacity;

  return (
    <Badge
      variant={isAtLimit ? "destructive" : isNearLimit ? "default" : "secondary"}
      className="font-mono text-xs"
    >
      <Activity className="w-3 h-3 mr-1" />
      {stats.active}/{stats.capacity}
    </Badge>
  );
}
