/**
 * UnifiedVersionSelector
 * 
 * A unified component for A/B version selection across the app.
 * Replaces: InlineVersionToggle, VersionSwitcher, VersionsSection, StudioVersionSelector
 * 
 * Variants:
 * - inline: Compact A/B buttons for track cards
 * - compact: Minimal toggle for player bar  
 * - sheet: Detailed list in bottom sheet for action menus
 * 
 * @example
 * <UnifiedVersionSelector trackId="..." variant="inline" />
 */

import { memo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Star, Play, Pause, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface TrackVersion {
  id: string;
  label: string;
  audioUrl: string;
  coverUrl?: string | null;
  duration?: number;
  isPrimary: boolean;
  versionType?: string;
  createdAt?: string;
}

interface UnifiedVersionSelectorProps {
  trackId: string;
  /** Display variant */
  variant?: 'inline' | 'compact' | 'sheet';
  /** Callback when version changes */
  onVersionChange?: (version: TrackVersion) => void;
  /** Show labels (A, B, C...) */
  showLabels?: boolean;
  /** Controlled open state for sheet variant */
  sheetOpen?: boolean;
  /** Controlled open change for sheet variant */
  onSheetOpenChange?: (open: boolean) => void;
  /** Disable interaction */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

export const UnifiedVersionSelector = memo(function UnifiedVersionSelector({
  trackId,
  variant = 'inline',
  onVersionChange,
  showLabels = true,
  sheetOpen,
  onSheetOpenChange,
  disabled = false,
  className,
}: UnifiedVersionSelectorProps) {
  const queryClient = useQueryClient();
  const haptic = useHapticFeedback();
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();

  const [versions, setVersions] = useState<TrackVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Lazy fetch versions - only when needed
  const fetchVersions = useCallback(async () => {
    if (!trackId || hasFetched) return;
    
    setIsLoading(true);
    setHasFetched(true);
    
    try {
      const { data, error } = await supabase
        .from('track_versions')
        .select('id, version_label, audio_url, cover_url, duration_seconds, is_primary, version_type, created_at')
        .eq('track_id', trackId)
        .order('clip_index', { ascending: true });

      if (error) throw error;

      const mappedVersions: TrackVersion[] = (data || []).map((v, index) => ({
        id: v.id,
        label: v.version_label || String.fromCharCode(65 + index),
        audioUrl: v.audio_url,
        coverUrl: v.cover_url,
        duration: v.duration_seconds ?? undefined,
        isPrimary: v.is_primary || false,
        versionType: v.version_type ?? undefined,
        createdAt: v.created_at ?? undefined,
      }));

      setVersions(mappedVersions);
      
      const primary = mappedVersions.find(v => v.isPrimary);
      setActiveVersionId(primary?.id || mappedVersions[0]?.id || null);
    } catch (error) {
      logger.error('Failed to fetch versions', error);
    } finally {
      setIsLoading(false);
    }
  }, [trackId, hasFetched]);

  // Reset when trackId changes
  useEffect(() => {
    setHasFetched(false);
    setVersions([]);
    setActiveVersionId(null);
  }, [trackId]);

  // Handle version switch
  const handleSwitch = useCallback(async (version: TrackVersion) => {
    if (disabled || isSwitching || version.id === activeVersionId) return;

    haptic.select();
    setIsSwitching(true);
    
    // Optimistic update
    const previousActiveId = activeVersionId;
    setActiveVersionId(version.id);
    setVersions(prev => prev.map(v => ({
      ...v,
      isPrimary: v.id === version.id,
    })));

    try {
      // Update is_primary on all versions
      await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', trackId);

      await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', version.id);

      // Update track's active_version_id and audio_url
      const { error } = await supabase
        .from('tracks')
        .update({
          active_version_id: version.id,
          audio_url: version.audioUrl,
          cover_url: version.coverUrl,
          duration_seconds: version.duration,
        })
        .eq('id', trackId);

      if (error) throw error;

      // Update player if this track is currently playing
      if (activeTrack?.id === trackId) {
        playTrack({
          ...activeTrack,
          audio_url: version.audioUrl,
          cover_url: version.coverUrl || activeTrack.cover_url,
        } as any);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });

      onVersionChange?.(version);
      toast.success(`Версия ${version.label} активна`);
    } catch (error) {
      // Rollback on error
      setActiveVersionId(previousActiveId);
      setVersions(prev => prev.map(v => ({
        ...v,
        isPrimary: v.id === previousActiveId,
      })));
      logger.error('Failed to switch version', error);
      toast.error('Ошибка переключения версии');
    } finally {
      setIsSwitching(false);
    }
  }, [trackId, activeVersionId, disabled, isSwitching, haptic, activeTrack, playTrack, queryClient, onVersionChange]);

  // Handle preview play
  const handlePreview = useCallback((version: TrackVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.tap();

    if (previewingId === version.id && isPlaying) {
      pauseTrack();
      setPreviewingId(null);
    } else {
      playTrack({
        id: trackId,
        title: `Version ${version.label}`,
        audio_url: version.audioUrl,
        cover_url: version.coverUrl,
        duration: version.duration || 0,
      } as any);
      setPreviewingId(version.id);
    }
  }, [trackId, previewingId, isPlaying, haptic, playTrack, pauseTrack]);

  // Don't render if no trackId
  if (!trackId) return null;

  // INLINE variant - compact A/B buttons with lazy loading
  if (variant === 'inline') {
    // If not fetched yet, show placeholder that triggers fetch on hover/click
    if (!hasFetched) {
      return (
        <div 
          className={cn("flex items-center gap-1", className)}
          onMouseEnter={fetchVersions}
          onClick={(e) => {
            e.stopPropagation();
            fetchVersions();
          }}
        >
          <div className="h-7 min-w-[28px] px-1.5 rounded-md font-mono text-xs font-bold bg-muted/30 text-muted-foreground flex items-center justify-center">
            A
          </div>
          <div className="h-7 min-w-[28px] px-1.5 rounded-md font-mono text-xs font-bold bg-muted/30 text-muted-foreground flex items-center justify-center">
            B
          </div>
        </div>
      );
    }

    // Don't render if only one version after fetch
    if (!isLoading && versions.length <= 1) return null;

    return (
      <div className={cn("flex items-center gap-1", className)}>
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </>
        ) : (
          versions.slice(0, 4).map((version) => {
            const isActive = version.id === activeVersionId;
            return (
              <button
                key={version.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwitch(version);
                }}
                disabled={disabled || isSwitching}
                className={cn(
                  "relative h-7 min-w-[28px] px-1.5 rounded-md font-mono text-xs font-bold",
                  "transition-all touch-manipulation active:scale-95",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  (disabled || isSwitching) && "opacity-50 cursor-not-allowed"
                )}
              >
                {showLabels ? version.label : version.label.charAt(0)}
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border border-background" />
                )}
              </button>
            );
          })
        )}
        {isSwitching && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
      </div>
    );
  }

  // COMPACT variant - minimal for player bar (fetch on first interaction)
  if (variant === 'compact') {
    if (!hasFetched) {
      fetchVersions(); // Auto-fetch for compact since it's in player
    }
    
    if (!hasFetched || versions.length <= 1) return null;

    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        {versions.slice(0, 2).map((version) => {
          const isActive = version.id === activeVersionId;
          return (
            <button
              key={version.id}
              onClick={() => handleSwitch(version)}
              disabled={disabled || isSwitching}
              className={cn(
                "h-6 w-6 rounded text-xs font-bold transition-colors",
                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground",
                (disabled || isSwitching) && "opacity-50"
              )}
            >
              {version.label}
            </button>
          );
        })}
      </div>
    );
  }

  // SHEET variant - detailed list in bottom sheet
  return (
    <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[60vh]">
        <SheetHeader>
          <SheetTitle>Выберите версию</SheetTitle>
        </SheetHeader>

        <div className="space-y-2 mt-4 overflow-auto max-h-[calc(60vh-80px)]">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : (
            <AnimatePresence>
              {versions.map((version) => {
                const isActive = version.id === activeVersionId;
                const isPreviewing = previewingId === version.id && isPlaying;

                return (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                      isActive 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:bg-accent/50"
                    )}
                    onClick={() => handleSwitch(version)}
                  >
                    {/* Preview button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-full"
                      onClick={(e) => handlePreview(version, e)}
                    >
                      {isPreviewing ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </Button>

                    {/* Version info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold">Версия {version.label}</span>
                        {version.versionType && (
                          <Badge variant="outline" className="text-xs">
                            {version.versionType}
                          </Badge>
                        )}
                        {version.isPrimary && (
                          <Badge variant="default" className="gap-1 text-xs">
                            <Star className="h-3 w-3 fill-current" />
                            Основная
                          </Badge>
                        )}
                      </div>
                      {version.duration && (
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(version.duration / 60)}:{String(Math.floor(version.duration % 60)).padStart(2, '0')}
                        </p>
                      )}
                    </div>

                    {/* Selection indicator */}
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                      isActive 
                        ? "border-primary bg-primary text-primary-foreground" 
                        : "border-muted-foreground/30"
                    )}>
                      {isActive && <Check className="w-4 h-4" />}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});

export type { TrackVersion, UnifiedVersionSelectorProps };
