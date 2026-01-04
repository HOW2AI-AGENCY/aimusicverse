/**
 * Version Comparison Component
 * 
 * Side-by-side A/B comparison of track versions
 * Features:
 * - Visual waveform comparison
 * - Quick switch between versions
 * - Metadata diff display
 * - Synchronized playback option
 */

import { useState, useCallback, useMemo } from 'react';
import { Play, Pause, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTrackVersions } from '@/hooks/useTrackVersions';
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { hapticImpact } from '@/lib/haptic';
import { formatTime } from '@/lib/player-utils';

interface VersionComparisonProps {
  trackId: string;
  activeVersionId?: string;
  onClose?: () => void;
}

interface VersionMetadata {
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  format?: string;
  size?: number;
}

export function VersionComparison({
  trackId,
  activeVersionId,
  onClose,
}: VersionComparisonProps) {
  const [selectedVersions, setSelectedVersions] = useState<[string | null, string | null]>([
    activeVersionId || null,
    null,
  ]);
  const [playingVersion, setPlayingVersion] = useState<string | null>(null);

  const { data: versions, isLoading } = useTrackVersions(trackId);
  const { setPrimaryVersion, isSettingPrimary } = useVersionSwitcher();

  /**
   * Get version by ID
   */
  const getVersion = useCallback(
    (versionId: string | null) => {
      if (!versionId || !versions) return null;
      return versions.find(v => v.id === versionId) || null;
    },
    [versions]
  );

  /**
   * Parse version metadata
   */
  const getVersionMetadata = useCallback((versionId: string | null): VersionMetadata => {
    const version = getVersion(versionId);
    if (!version) return {};

    const metadata = version.metadata as Record<string, unknown> | null;
    
    return {
      duration: version.duration_seconds || undefined,
      bitrate: metadata?.bitrate as number | undefined,
      sampleRate: metadata?.sample_rate as number | undefined,
      format: metadata?.format as string | undefined,
      size: metadata?.size as number | undefined,
    };
  }, [getVersion]);

  /**
   * Compare two versions and highlight differences
   */
  const versionDiff = useMemo(() => {
    const [versionA, versionB] = selectedVersions;
    const metaA = getVersionMetadata(versionA);
    const metaB = getVersionMetadata(versionB);

    const diffs: Array<{
      field: string;
      valueA: string;
      valueB: string;
      isDifferent: boolean;
    }> = [];

    // Duration
    if (metaA.duration || metaB.duration) {
      const durA = metaA.duration ? formatTime(metaA.duration) : '-';
      const durB = metaB.duration ? formatTime(metaB.duration) : '-';
      diffs.push({
        field: 'Длительность',
        valueA: durA,
        valueB: durB,
        isDifferent: durA !== durB,
      });
    }

    // Bitrate
    if (metaA.bitrate || metaB.bitrate) {
      const bitrateA = metaA.bitrate ? `${metaA.bitrate} kbps` : '-';
      const bitrateB = metaB.bitrate ? `${metaB.bitrate} kbps` : '-';
      diffs.push({
        field: 'Битрейт',
        valueA: bitrateA,
        valueB: bitrateB,
        isDifferent: bitrateA !== bitrateB,
      });
    }

    // Sample Rate
    if (metaA.sampleRate || metaB.sampleRate) {
      const srA = metaA.sampleRate ? `${metaA.sampleRate} Hz` : '-';
      const srB = metaB.sampleRate ? `${metaB.sampleRate} Hz` : '-';
      diffs.push({
        field: 'Частота',
        valueA: srA,
        valueB: srB,
        isDifferent: srA !== srB,
      });
    }

    return diffs;
  }, [selectedVersions, getVersionMetadata]);

  /**
   * Handle version selection
   */
  const handleSelectVersion = useCallback((position: 0 | 1, versionId: string) => {
    hapticImpact('light');
    setSelectedVersions(prev => {
      const newSelection: [string | null, string | null] = [...prev];
      newSelection[position] = versionId;
      return newSelection;
    });
  }, []);

  /**
   * Handle play version - play through player store
   */
  const { playTrack, pauseTrack, isPlaying, activeTrack } = usePlayerStore();
  
  const handlePlayVersion = useCallback((versionId: string) => {
    hapticImpact('medium');
    const version = getVersion(versionId);
    if (!version) return;

    // Check if this version is currently playing
    const isCurrentlyPlaying = activeTrack?.id === versionId && isPlaying;
    
    if (isCurrentlyPlaying) {
      pauseTrack();
      setPlayingVersion(null);
    } else {
      // Create a track-like object from the version for playback
      const versionTrack = {
        id: version.id,
        title: version.version_label || 'Версия',
        audio_url: version.audio_url,
        cover_url: version.cover_url,
        duration_seconds: version.duration_seconds,
        user_id: '', // Not needed for playback
        prompt: '',
        created_at: version.created_at,
      } as any;
      
      playTrack(versionTrack);
      setPlayingVersion(versionId);
    }
  }, [getVersion, playTrack, pauseTrack, activeTrack, isPlaying]);

  /**
   * Handle set as primary
   */
  const handleSetPrimary = useCallback((versionId: string) => {
    hapticImpact('medium');
    setPrimaryVersion({ trackId, versionId });
  }, [trackId, setPrimaryVersion]);

  if (isLoading || !versions || versions.length < 2) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          {isLoading ? 'Загрузка версий...' : 'Недостаточно версий для сравнения'}
        </div>
      </Card>
    );
  }

  const versionA = getVersion(selectedVersions[0]);
  const versionB = getVersion(selectedVersions[1]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Version Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Version A */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Версия A</h3>
          <Tabs
            value={selectedVersions[0] || ''}
            onValueChange={(v) => handleSelectVersion(0, v)}
          >
            <TabsList className="w-full grid grid-cols-2">
              {versions.map((version) => (
                <TabsTrigger key={version.id} value={version.id} className="text-xs">
                  {version.version_label || 'Версия'}
                  {version.is_primary && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      Primary
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {versionA && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant={playingVersion === versionA.id ? 'default' : 'outline'}
                  onClick={() => handlePlayVersion(versionA.id)}
                >
                  {playingVersion === versionA.id ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {playingVersion === versionA.id ? 'Пауза' : 'Прослушать'}
                </Button>
                
                {!versionA.is_primary && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSetPrimary(versionA.id)}
                    disabled={isSettingPrimary}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Сделать основной
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                {versionDiff.map((diff, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{diff.field}:</span>
                    <span className={cn(
                      'font-mono',
                      diff.isDifferent && 'text-primary font-medium'
                    )}>
                      {diff.valueA}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Version B */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Версия B</h3>
          <Tabs
            value={selectedVersions[1] || ''}
            onValueChange={(v) => handleSelectVersion(1, v)}
          >
            <TabsList className="w-full grid grid-cols-2">
              {versions.map((version) => (
                <TabsTrigger key={version.id} value={version.id} className="text-xs">
                  {version.version_label || 'Версия'}
                  {version.is_primary && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      Primary
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {versionB && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant={playingVersion === versionB.id ? 'default' : 'outline'}
                  onClick={() => handlePlayVersion(versionB.id)}
                >
                  {playingVersion === versionB.id ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {playingVersion === versionB.id ? 'Пауза' : 'Прослушать'}
                </Button>
                
                {!versionB.is_primary && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSetPrimary(versionB.id)}
                    disabled={isSettingPrimary}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Сделать основной
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                {versionDiff.map((diff, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{diff.field}:</span>
                    <span className={cn(
                      'font-mono',
                      diff.isDifferent && 'text-primary font-medium'
                    )}>
                      {diff.valueB}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Differences Summary */}
      {versionA && versionB && versionDiff.some(d => d.isDifferent) && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-primary" />
            <div className="text-sm space-y-1">
              <p className="font-medium">Обнаружены различия</p>
              <p className="text-xs text-muted-foreground">
                {versionDiff.filter(d => d.isDifferent).length} параметр(ов) отличаются между версиями
              </p>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
