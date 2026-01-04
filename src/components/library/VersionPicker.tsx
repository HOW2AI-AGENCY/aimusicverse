import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { logger } from '@/lib/logger';
import { formatDuration } from '@/lib/player-utils';

interface Version {
  id: string;
  version_label: string | null;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  is_primary: boolean | null;
  created_at: string | null;
}

interface VersionPickerProps {
  trackId: string;
  activeVersionId?: string | null;
  onVersionChange?: (version: Version) => void;
  className?: string;
}

export function VersionPicker({
  trackId,
  activeVersionId,
  onVersionChange,
  className,
}: VersionPickerProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeVersion, setActiveVersion] = useState<Version | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('track_versions')
        .select('id, version_label, audio_url, cover_url, duration_seconds, is_primary, created_at')
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
        const active = data?.find(v => v.id === activeVersionId);
        setActiveVersion(active || data?.[0] || null);
      } else {
        const primary = data?.find(v => v.is_primary);
        setActiveVersion(primary || data?.[0] || null);
      }
      
      setIsLoading(false);
    };

    fetchVersions();

    // Subscribe to version updates
    const channel = supabase
      .channel(`versions-${trackId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'track_versions',
          filter: `track_id=eq.${trackId}`,
        },
        () => fetchVersions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId, activeVersionId]);

  const handleVersionSelect = async (version: Version) => {
    if (version.id === activeVersion?.id) return;

    triggerHapticFeedback('light');
    setIsUpdating(true);

    try {
      // Update track's active_version_id
      const { error } = await supabase
        .from('tracks')
        .update({ active_version_id: version.id })
        .eq('id', trackId);

      if (error) throw error;

      setActiveVersion(version);
      onVersionChange?.(version);
      toast.success(`Переключено на версию ${version.version_label || 'A'}`);
    } catch (error) {
      logger.error('Error switching version', { error });
      toast.error('Ошибка переключения версии');
    } finally {
      setIsUpdating(false);
    }
  };


  if (isLoading) {
    return (
      <Badge variant="secondary" className={cn("animate-pulse", className)}>
        <Loader2 className="w-3 h-3 animate-spin" />
      </Badge>
    );
  }

  // Single version - don't show badge at all
  if (versions.length <= 1) {
    return null;
  }

  // Multiple versions - show dropdown
  const versionLabels = versions.map(v => v.version_label || 'A').join('/');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge 
          variant="default" 
          className={cn(
            "text-xs cursor-pointer hover:bg-primary/80 transition-colors",
            "min-h-[28px] px-2 gap-1",
            className
          )}
          onClick={(e) => {
            e.stopPropagation();
            triggerHapticFeedback('light');
          }}
        >
          {isUpdating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <span className="font-semibold">{activeVersion?.version_label || 'A'}</span>
              <span className="opacity-60">/{versionLabels.split('/').filter(l => l !== activeVersion?.version_label).join('/')}</span>
            </>
          )}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="min-w-[160px]"
        onClick={(e) => e.stopPropagation()}
      >
        {versions.map((version) => (
          <DropdownMenuItem
            key={version.id}
            onClick={() => handleVersionSelect(version)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">Версия {version.version_label || 'A'}</span>
              {version.duration_seconds && (
                <span className="text-xs text-muted-foreground">
                  ({formatDuration(version.duration_seconds)})
                </span>
              )}
            </div>
            {version.id === activeVersion?.id && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
