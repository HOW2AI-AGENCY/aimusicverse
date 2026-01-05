import { useState, useEffect } from 'react';
import { Track } from '@/types/track';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { logger } from '@/lib/logger';
import { formatDuration } from '@/lib/player-utils';

interface VersionsSectionProps {
  track: Track;
  compact?: boolean;
}

interface TrackVersion {
  id: string;
  version_label: string | null;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  is_primary: boolean | null;
}

export function VersionsSection({ track, compact = false }: VersionsSectionProps) {
  const [versions, setVersions] = useState<TrackVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [isVersionSwitching, setIsVersionSwitching] = useState(false);

  useEffect(() => {
    if (!track?.id) return;

    const fetchVersions = async () => {
      const { data } = await supabase
        .from('track_versions')
        .select('id, version_label, audio_url, cover_url, duration_seconds, is_primary')
        .eq('track_id', track.id)
        .order('clip_index', { ascending: true });
      
      setVersions(data || []);
      setActiveVersionId((track as any).active_version_id || data?.[0]?.id || null);
    };

    fetchVersions();
  }, [track?.id]);

  const handleVersionSwitch = async (versionId: string) => {
    if (versionId === activeVersionId) return;
    
    triggerHapticFeedback('light');
    setIsVersionSwitching(true);
    
    try {
      await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', track.id);

      await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', versionId);

      const { error } = await supabase
        .from('tracks')
        .update({ active_version_id: versionId })
        .eq('id', track.id);
      
      if (error) throw error;
      
      setActiveVersionId(versionId);
      const version = versions.find(v => v.id === versionId);
      toast.success(`Переключено на версию ${version?.version_label || 'A'}`);
    } catch (error) {
      logger.error('Error switching version', error);
      toast.error('Ошибка переключения версии');
    } finally {
      setIsVersionSwitching(false);
    }
  };

  if (versions.length <= 1) return null;

  // Compact inline variant - just badges
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground mr-1">Версия:</span>
      {versions.map((version) => (
        <button
          key={version.id}
          onClick={() => handleVersionSwitch(version.id)}
          disabled={isVersionSwitching}
          className={cn(
            'min-w-8 h-8 px-2.5 rounded-lg text-sm font-medium',
            'transition-all duration-200 active:scale-95',
            version.id === activeVersionId
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}
        >
          {version.version_label || 'A'}
        </button>
      ))}
    </div>
  );
}
