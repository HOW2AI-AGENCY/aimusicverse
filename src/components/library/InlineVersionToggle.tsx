import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { logger } from '@/lib/logger';

interface Version {
  id: string;
  version_label: string | null;
  audio_url: string;
  is_primary: boolean | null;
}

interface InlineVersionToggleProps {
  trackId: string;
  activeVersionId?: string | null;
  versionCount?: number;
  onVersionChange?: (version: Version) => void;
  className?: string;
}

export function InlineVersionToggle({
  trackId,
  activeVersionId,
  versionCount = 0,
  onVersionChange,
  className,
}: InlineVersionToggleProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(activeVersionId || null);
  const queryClient = useQueryClient();
  const { activeTrack, playTrack, isPlaying } = usePlayerStore();

  useEffect(() => {
    // Skip fetch if we know there's only 1 or 0 versions
    if (versionCount <= 1) {
      setIsLoading(false);
      return;
    }

    const fetchVersions = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('track_versions')
        .select('id, version_label, audio_url, is_primary')
        .eq('track_id', trackId)
        .order('clip_index', { ascending: true });

      if (error) {
        logger.error('Error fetching versions', { error });
        setIsLoading(false);
        return;
      }

      setVersions(data || []);
      
      // Set active version
      if (activeVersionId) {
        setActiveId(activeVersionId);
      } else {
        const primary = data?.find(v => v.is_primary);
        setActiveId(primary?.id || data?.[0]?.id || null);
      }
      
      setIsLoading(false);
    };

    fetchVersions();
  }, [trackId, activeVersionId, versionCount]);

  const handleVersionClick = async (e: React.MouseEvent, version: Version) => {
    e.stopPropagation();
    
    if (version.id === activeId || isUpdating) return;

    triggerHapticFeedback('light');
    setIsUpdating(true);

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

      setActiveId(version.id);
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
        // Play with updated audio URL
        playTrack(updatedTrack);
      }
      
      // Invalidate queries to refresh UI with new cover/duration
      await queryClient.invalidateQueries({ queryKey: ['tracks'] });
      await queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
      
      toast.success(`Версия ${version.version_label || 'A'}`);
    } catch (error) {
      logger.error('Error switching version', { error });
      toast.error('Ошибка переключения');
    } finally {
      setIsUpdating(false);
    }
  };

  // Don't render if single version or loading with known single version
  if (versionCount <= 1 || (isLoading && versionCount <= 1)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-md p-0.5", className)}>
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
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
      onClick={(e) => e.stopPropagation()}
    >
      {versions.map((version) => {
        const isActive = version.id === activeId;
        const label = version.version_label || 'A';
        
        return (
          <button
            key={version.id}
            onClick={(e) => handleVersionClick(e, version)}
            disabled={isUpdating}
            className={cn(
              "min-w-[24px] h-6 px-1.5 text-xs font-semibold rounded transition-all",
              "touch-manipulation active:scale-95",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              isUpdating && "opacity-50 cursor-wait"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
