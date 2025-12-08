import { useState, useEffect } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { GitBranch, ChevronDown, Check, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

interface VersionsSectionProps {
  track: Track;
}

interface TrackVersion {
  id: string;
  version_label: string | null;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  is_primary: boolean | null;
}

export function VersionsSection({ track }: VersionsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
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
      // Update both is_primary and active_version_id for consistency
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (versions.length <= 1) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between gap-3 h-12"
        >
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5" />
            <span>Версии</span>
            <Badge variant="secondary" className="ml-1">
              {versions.length}
            </Badge>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 space-y-1">
        {versions.map((version, index) => (
          <motion.div
            key={version.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
          >
            <Button
              variant={version.id === activeVersionId ? 'secondary' : 'ghost'}
              className={`w-full justify-between gap-3 h-11 transition-all duration-300 ${
                version.id === activeVersionId 
                  ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                  : ''
              }`}
              onClick={() => handleVersionSwitch(version.id)}
              disabled={isVersionSwitching}
            >
              <div className="flex items-center gap-2">
                <motion.span 
                  className="font-medium"
                  animate={{ 
                    scale: version.id === activeVersionId ? 1.02 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  Версия {version.version_label || 'A'}
                </motion.span>
                {version.duration_seconds && (
                  <span className="text-xs text-muted-foreground">
                    ({formatDuration(version.duration_seconds)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {version.is_primary && (
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                )}
                <AnimatePresence mode="wait">
                  {version.id === activeVersionId && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 15 
                      }}
                    >
                      <Check className="w-4 h-4 text-primary" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Button>
          </motion.div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
