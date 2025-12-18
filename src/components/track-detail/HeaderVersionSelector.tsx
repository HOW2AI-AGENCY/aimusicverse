/**
 * Compact version selector for TrackDetailSheet header
 * Allows switching between track versions with immediate UI update
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface Version {
  id: string;
  version_label: string | null;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  is_primary: boolean | null;
  created_at: string | null;
}

interface HeaderVersionSelectorProps {
  trackId: string;
  activeVersionId?: string | null;
  onVersionChange?: (versionId: string) => void;
  className?: string;
}

export function HeaderVersionSelector({
  trackId,
  activeVersionId,
  onVersionChange,
  className,
}: HeaderVersionSelectorProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(activeVersionId || null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchVersions = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('track_versions')
        .select('id, version_label, audio_url, cover_url, duration_seconds, is_primary, created_at')
        .eq('track_id', trackId)
        .order('clip_index', { ascending: true });

      if (error) {
        logger.error('Error fetching versions for selector', { error });
        setIsLoading(false);
        return;
      }

      setVersions(data || []);
      
      if (activeVersionId) {
        setActiveId(activeVersionId);
      } else {
        const primary = data?.find(v => v.is_primary);
        setActiveId(primary?.id || data?.[0]?.id || null);
      }
      
      setIsLoading(false);
    };

    fetchVersions();
  }, [trackId, activeVersionId]);

  const handleVersionSelect = async (version: Version) => {
    if (version.id === activeId || isUpdating) return;

    triggerHapticFeedback('light');
    setIsUpdating(true);

    try {
      // Update track's active version and sync fields
      const { error } = await supabase
        .from('tracks')
        .update({ 
          active_version_id: version.id,
          audio_url: version.audio_url,
          cover_url: version.cover_url,
          duration_seconds: version.duration_seconds,
        })
        .eq('id', trackId);

      if (error) throw error;

      // Update is_primary flags
      await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', trackId);
      
      await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', version.id);

      setActiveId(version.id);
      onVersionChange?.(version.id);
      
      await queryClient.invalidateQueries({ queryKey: ['tracks'] });
      await queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
      
      toast.success(`Версия ${version.version_label || 'A'} выбрана`);
    } catch (error) {
      logger.error('Error switching version', { error });
      toast.error('Ошибка переключения версии');
    } finally {
      setIsUpdating(false);
    }
  };

  // Don't render if single version or less
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (versions.length <= 1) {
    return null;
  }

  const activeVersion = versions.find(v => v.id === activeId);
  const activeLabel = activeVersion?.version_label || 'A';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 gap-1.5 text-xs font-medium",
            isUpdating && "opacity-50",
            className
          )}
          disabled={isUpdating}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Версия {activeLabel}</span>
          {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {versions.map((version) => {
          const isActive = version.id === activeId;
          const label = version.version_label || 'A';
          
          return (
            <DropdownMenuItem
              key={version.id}
              onClick={() => handleVersionSelect(version)}
              className={cn(
                "flex items-center justify-between gap-2",
                isActive && "bg-primary/10 font-medium"
              )}
            >
              <span>Версия {label}</span>
              {isActive && (
                <span className="text-xs text-primary">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
