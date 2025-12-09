/**
 * VersionSwitcher Component
 * 
 * Quick A/B version switching directly in the player.
 * Shows version badges (A, B, etc.) for fast switching without opening versions tab.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Track } from '@/hooks/useTracksOptimized';
import { usePlayerStore } from '@/hooks/audio';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticImpact } from '@/lib/haptic';

interface VersionSwitcherProps {
  track: Track;
  size?: 'compact' | 'medium' | 'large';
  className?: string;
}

export function VersionSwitcher({ track, size = 'medium', className }: VersionSwitcherProps) {
  const { activeTrack, isPlaying, playTrack } = usePlayerStore();

  // Extract original track ID if current track is a version
  const originalTrackId = track.id?.includes('_v') 
    ? track.id.split('_v')[0] 
    : track.id;

  // Fetch versions for this track
  const { data: versions } = useQuery({
    queryKey: ['track-versions-switcher', originalTrackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_versions')
        .select('id, audio_url, cover_url, version_label, clip_index, is_primary')
        .eq('track_id', originalTrackId)
        .order('clip_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!originalTrackId,
    staleTime: 5 * 60 * 1000,
  });

  // Don't show if only one or no versions
  if (!versions || versions.length <= 1) {
    return null;
  }

  const handleVersionClick = (version: typeof versions[0]) => {
    hapticImpact('light');
    
    // Create track object for this version
    const versionTrack: Track = {
      ...track,
      id: version.id,
      audio_url: version.audio_url,
      cover_url: version.cover_url || track.cover_url,
    };

    playTrack(versionTrack);
  };

  const isVersionActive = (versionId: string) => {
    return activeTrack?.id === versionId;
  };

  const sizeClasses = {
    compact: 'h-6 w-6 text-xs',
    medium: 'h-8 w-8 text-sm',
    large: 'h-10 w-10 text-base',
  };

  const gapClasses = {
    compact: 'gap-1',
    medium: 'gap-1.5',
    large: 'gap-2',
  };

  return (
    <div className={cn('flex items-center', gapClasses[size], className)}>
      <AnimatePresence mode="popLayout">
        {versions.map((version, index) => {
          const label = version.version_label || String.fromCharCode(65 + index);
          const isActive = isVersionActive(version.id);
          const isCurrentlyPlaying = isActive && isPlaying;

          return (
            <motion.div
              key={version.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleVersionClick(version)}
                className={cn(
                  sizeClasses[size],
                  'rounded-full font-semibold transition-all',
                  isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                  isCurrentlyPlaying && 'animate-pulse',
                  !isActive && 'opacity-60 hover:opacity-100'
                )}
                title={`Версия ${label}${version.is_primary ? ' (мастер)' : ''}`}
              >
                {label}
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
