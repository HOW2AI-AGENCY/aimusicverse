import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { toast } from 'sonner';
import { Loader2, Hammer } from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';

interface Version {
  id: string;
  version_label: string | null;
  audio_url: string;
  is_primary: boolean | null;
  source_type?: string | null;
}

interface InlineVersionToggleProps {
  trackId: string;
  activeVersionId?: string | null;
  versionCount?: number;
  onVersionChange?: (version: Version) => void;
  className?: string;
  /** Track owner ID - if provided, toggle only renders for owner */
  trackOwnerId?: string;
  /** Compact mode for mobile */
  compact?: boolean;
  /** Pre-fetched versions to avoid extra query */
  preloadedVersions?: Version[];
}

// Centralized version fetcher with caching
async function fetchVersions(trackId: string): Promise<Version[]> {
  const { data, error } = await supabase
    .from('track_versions')
    .select('id, version_label, audio_url, is_primary, source_type')
    .eq('track_id', trackId)
    .order('clip_index', { ascending: true });

  if (error) {
    logger.error('Error fetching versions', { error });
    return [];
  }

  return data || [];
}

export function InlineVersionToggle({
  trackId,
  activeVersionId,
  versionCount = 0,
  onVersionChange,
  className,
  trackOwnerId,
  compact = false,
  preloadedVersions,
}: InlineVersionToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localActiveId, setLocalActiveId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { activeTrack, playTrack } = usePlayerStore();
  const { user } = useAuth();

  // Check if current user is the owner
  const isOwner = !trackOwnerId || (user?.id === trackOwnerId);

  // Use React Query for cached versions - skip if preloaded
  const { data: fetchedVersions, isLoading } = useQuery({
    queryKey: ['inline-versions', trackId],
    queryFn: () => fetchVersions(trackId),
    enabled: !!trackId && versionCount > 1 && !preloadedVersions && isOwner,
    staleTime: 60 * 1000, // 1 minute - versions rarely change
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Use preloaded versions if available, otherwise use fetched
  const versions = useMemo(() => 
    preloadedVersions || fetchedVersions || [], 
    [preloadedVersions, fetchedVersions]
  );

  // Determine active version ID
  const activeId = useMemo(() => {
    if (localActiveId) return localActiveId;
    if (activeVersionId) return activeVersionId;
    const primary = versions.find(v => v.is_primary);
    return primary?.id || versions[0]?.id || null;
  }, [localActiveId, activeVersionId, versions]);

  const handleVersionClick = useCallback(async (e: React.MouseEvent, version: Version) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation?.();
    
    if (version.id === activeId || isUpdating) return;

    triggerHapticFeedback('light');
    setIsUpdating(true);
    setLocalActiveId(version.id); // Optimistic update

    try {
      // Fetch the full version data to get cover_url and duration
      const { data: fullVersion, error: fetchError } = await supabase
        .from('track_versions')
        .select('*')
        .eq('id', version.id)
        .single();

      if (fetchError) throw fetchError;

      // Update both active_version_id AND sync track fields for immediate UI update
      const { error } = await supabase
        .from('tracks')
        .update({ 
          active_version_id: version.id,
          audio_url: fullVersion.audio_url,
          cover_url: fullVersion.cover_url,
          duration_seconds: fullVersion.duration_seconds,
        })
        .eq('id', trackId);

      if (error) throw error;

      // Also update is_primary for consistency
      await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', trackId);
      
      await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', version.id);

      onVersionChange?.(version);
      
      // Update player if this track is currently playing
      if (activeTrack?.id === trackId) {
        const updatedTrack = {
          ...activeTrack,
          audio_url: fullVersion.audio_url,
          cover_url: fullVersion.cover_url,
          duration_seconds: fullVersion.duration_seconds,
          active_version_id: version.id,
        };
        playTrack(updatedTrack);
      }
      
      // Invalidate queries to refresh UI with new cover/duration
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
      queryClient.invalidateQueries({ queryKey: ['inline-versions', trackId] });
      
      toast.success(`Версия ${version.version_label || 'A'}`);
    } catch (error) {
      logger.error('Error switching version', { error });
      toast.error('Ошибка переключения');
      setLocalActiveId(null); // Revert optimistic update
    } finally {
      setIsUpdating(false);
    }
  }, [activeId, isUpdating, trackId, activeTrack, playTrack, queryClient, onVersionChange]);

  // Don't render if single version, not owner, or no versions
  if (!trackId || versionCount <= 1 || !isOwner) {
    return null;
  }

  // Show skeleton while loading (only if not preloaded)
  if (isLoading && !preloadedVersions) {
    return (
      <div className={cn(
        "flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-md p-0.5",
        compact ? "h-5" : "h-6",
        className
      )}>
        <div className={cn(
          "rounded bg-muted animate-pulse",
          compact ? "w-5 h-4" : "w-6 h-5"
        )} />
        <div className={cn(
          "rounded bg-muted animate-pulse",
          compact ? "w-5 h-4" : "w-6 h-5"
        )} />
      </div>
    );
  }

  if (versions.length <= 1) {
    return null;
  }

  return (
    <div 
      className={cn(
        "flex items-center gap-0.5 bg-background/90 backdrop-blur-sm rounded-md p-0.5 shadow-sm",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      style={{ touchAction: 'manipulation' }}
    >
      {versions.map((version) => {
        const isActive = version.id === activeId;
        const label = version.version_label || 'A';
        const isStudioVersion = version.source_type === 'studio';
        
        return (
          <button
            key={version.id}
            onClick={(e) => handleVersionClick(e, version)}
            disabled={isUpdating}
            className={cn(
              "font-semibold rounded transition-all flex items-center justify-center gap-0.5",
              "touch-manipulation active:scale-95",
              compact 
                ? "min-w-[20px] h-5 px-1 text-[10px]" 
                : "min-w-[24px] h-6 px-1.5 text-xs",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              isUpdating && !isActive && "opacity-50 cursor-wait"
            )}
            title={isStudioVersion ? `Версия ${label} (Студия)` : `Версия ${label}`}
          >
            {isStudioVersion ? (
              <Hammer className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            ) : (
              label
            )}
          </button>
        );
      })}
    </div>
  );
}
