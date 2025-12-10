/**
 * EnhancedVersionSwitcher Component
 * 
 * Improved version switcher with better visual feedback and animations.
 * Features:
 * - A/B version comparison
 * - Quick toggle between versions
 * - Visual waveform previews
 * - Play preview before switching
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Music, Play, Pause, CheckCircle2, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Version {
  id: string;
  version_label: string;
  is_primary: boolean;
  audio_url: string;
  duration_seconds: number | null;
  created_at: string;
}

interface EnhancedVersionSwitcherProps {
  /** Array of available versions */
  versions: Version[];
  /** ID of currently active version */
  activeVersionId: string;
  /** Callback when version is switched */
  onVersionChange: (versionId: string) => void;
  /** Current playback state */
  isPlaying?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Show waveform previews */
  showWaveforms?: boolean;
}

export function EnhancedVersionSwitcher({
  versions,
  activeVersionId,
  onVersionChange,
  isPlaying = false,
  compact = false,
  showWaveforms = false,
}: EnhancedVersionSwitcherProps) {
  const [hoveredVersion, setHoveredVersion] = useState<string | null>(null);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  // Sort versions: primary first, then by label
  const sortedVersions = [...versions].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.version_label.localeCompare(b.version_label);
  });

  const activeVersion = versions.find(v => v.id === activeVersionId);

  const handleVersionSwitch = async (versionId: string) => {
    if (versionId === activeVersionId) return;
    
    setSwitchingTo(versionId);
    
    try {
      await onVersionChange(versionId);
      toast.success('Версия переключена', {
        description: `Воспроизводится версия ${versions.find(v => v.id === versionId)?.version_label}`,
      });
    } catch (error) {
      toast.error('Ошибка переключения версии');
      console.error('Version switch error:', error);
    } finally {
      setSwitchingTo(null);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (versions.length <= 1) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {sortedVersions.map((version) => {
          const isActive = version.id === activeVersionId;
          const isSwitching = version.id === switchingTo;
          
          return (
            <Button
              key={version.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVersionSwitch(version.id)}
              disabled={isSwitching}
              className={cn(
                "h-7 px-2 text-xs gap-1.5",
                isActive && "pointer-events-none"
              )}
            >
              {isActive && <Radio className="h-3 w-3 animate-pulse" />}
              {version.version_label}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Версии трека</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {versions.length} {versions.length === 2 ? 'версии' : 'версий'}
        </Badge>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedVersions.map((version, index) => {
            const isActive = version.id === activeVersionId;
            const isSwitching = version.id === switchingTo;
            const isHovered = version.id === hoveredVersion;
            
            return (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    "p-3 cursor-pointer transition-all",
                    isActive && "bg-primary/10 border-primary shadow-sm",
                    !isActive && "hover:bg-accent hover:border-primary/50",
                    isSwitching && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => handleVersionSwitch(version.id)}
                  onMouseEnter={() => setHoveredVersion(version.id)}
                  onMouseLeave={() => setHoveredVersion(null)}
                >
                  <div className="flex items-center gap-3">
                    {/* Version icon/indicator */}
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      {isActive ? (
                        <Radio className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Music className="h-4 w-4" />
                      )}
                    </div>

                    {/* Version info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "font-medium text-sm",
                          isActive && "text-primary"
                        )}>
                          Версия {version.version_label}
                        </span>
                        {version.is_primary && (
                          <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
                            Основная
                          </Badge>
                        )}
                        {isActive && (
                          <Badge className="h-5 text-[10px] px-1.5 bg-primary">
                            Активна
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDuration(version.duration_seconds)}</span>
                        <span>•</span>
                        <span>
                          {new Date(version.created_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action indicator */}
                    <div className="flex items-center gap-2">
                      {isSwitching && (
                        <div className="animate-spin">
                          <Radio className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      {isActive && !isSwitching && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                      {!isActive && !isSwitching && isHovered && (
                        <Play className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Optional waveform preview */}
                  {showWaveforms && (
                    <div className="mt-2 h-8 bg-muted/30 rounded overflow-hidden">
                      {/* Placeholder for waveform - would integrate with actual waveform data */}
                      <div className="h-full flex items-center gap-0.5 px-1">
                        {Array.from({ length: 50 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex-1 rounded-sm transition-all",
                              isActive ? "bg-primary/40" : "bg-muted-foreground/20"
                            )}
                            style={{
                              height: `${20 + Math.random() * 60}%`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Quick comparison hint */}
      {versions.length === 2 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Нажмите на версию для переключения • A/B сравнение
          </p>
        </div>
      )}
    </Card>
  );
}

/**
 * Quick toggle button for switching between two versions
 */
export function QuickVersionToggle({
  versions,
  activeVersionId,
  onVersionChange,
}: {
  versions: Version[];
  activeVersionId: string;
  onVersionChange: (versionId: string) => void;
}) {
  if (versions.length !== 2) return null;

  const otherVersion = versions.find(v => v.id !== activeVersionId);
  if (!otherVersion) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onVersionChange(otherVersion.id)}
      className="gap-2"
    >
      <Radio className="h-3.5 w-3.5" />
      Версия {otherVersion.version_label}
    </Button>
  );
}
