/**
 * GenerationResultSheet Component
 * 
 * Shows generation results with A/B version selection after track creation.
 * Provides immediate access to versions without navigating to library first.
 */

import { memo, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Play, 
  Pause, 
  Check, 
  Sliders, 
  Library, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface TrackVersion {
  id: string;
  label: string;
  audioUrl: string;
  duration?: number;
  isPrimary: boolean;
}

interface GenerationResultSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string | null;
  trackTitle?: string;
}

export const GenerationResultSheet = memo(function GenerationResultSheet({
  open,
  onOpenChange,
  trackId,
  trackTitle,
}: GenerationResultSheetProps) {
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  
  const [versions, setVersions] = useState<TrackVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [playingVersionId, setPlayingVersionId] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState(false);

  // Fetch track versions when trackId changes
  useEffect(() => {
    if (!open || !trackId) {
      setVersions([]);
      setLoading(true);
      return;
    }

    const fetchVersions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('track_versions')
          .select('id, version_label, audio_url, duration_seconds, is_primary')
          .eq('track_id', trackId)
          .order('version_label', { ascending: true });

        if (error) throw error;

        const mappedVersions: TrackVersion[] = (data || []).map(v => ({
          id: v.id,
          label: v.version_label || 'A',
          audioUrl: v.audio_url,
          duration: v.duration_seconds ?? undefined,
          isPrimary: v.is_primary || false,
        }));

        setVersions(mappedVersions);
        
        // Pre-select the primary version
        const primary = mappedVersions.find(v => v.isPrimary);
        if (primary) {
          setSelectedVersion(primary.id);
        } else if (mappedVersions.length > 0) {
          setSelectedVersion(mappedVersions[0].id);
        }
      } catch (error) {
        logger.error('Failed to fetch track versions', error);
        toast.error('Не удалось загрузить версии');
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [open, trackId]);

  // Handle version preview (play/pause)
  const handlePreview = useCallback((version: TrackVersion) => {
    haptic.tap();
    
    if (playingVersionId === version.id && isPlaying) {
      pauseTrack();
      setPlayingVersionId(null);
    } else {
      // Create a minimal track object for playback - cast to Track for player compatibility
      playTrack({
        id: trackId!,
        title: trackTitle || 'Новый трек',
        audio_url: version.audioUrl,
        duration: version.duration || 0,
        cover_url: null,
        user_id: '',
        created_at: new Date().toISOString(),
      } as any);
      setPlayingVersionId(version.id);
    }
  }, [playingVersionId, isPlaying, pauseTrack, playTrack, trackId, trackTitle, haptic]);

  // Handle version selection
  const handleSelect = useCallback((versionId: string) => {
    haptic.select();
    setSelectedVersion(versionId);
  }, [haptic]);

  // Set selected version as primary
  const handleSetPrimary = useCallback(async () => {
    if (!selectedVersion || !trackId) return;
    
    haptic.impact('medium');
    setSettingPrimary(true);
    
    try {
      // Deactivate all versions first
      await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', trackId);

      // Activate selected version
      const { error } = await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', selectedVersion);

      if (error) throw error;

      // Update local state
      setVersions(prev => prev.map(v => ({
        ...v,
        isPrimary: v.id === selectedVersion,
      })));

      const selectedLabel = versions.find(v => v.id === selectedVersion)?.label;
      toast.success(`Версия ${selectedLabel} установлена как основная`);
    } catch (error) {
      logger.error('Failed to set primary version', error);
      toast.error('Не удалось установить версию');
    } finally {
      setSettingPrimary(false);
    }
  }, [selectedVersion, trackId, versions, haptic]);

  // Navigate to studio
  const handleGoToStudio = useCallback(() => {
    haptic.impact('medium');
    pauseTrack();
    onOpenChange(false);
    navigate(`/studio-v2?trackId=${trackId}`);
  }, [trackId, navigate, onOpenChange, pauseTrack, haptic]);

  // Navigate to library
  const handleGoToLibrary = useCallback(() => {
    haptic.tap();
    pauseTrack();
    onOpenChange(false);
    navigate(`/library?track=${trackId}`);
  }, [trackId, navigate, onOpenChange, pauseTrack, haptic]);

  const selectedVersionData = versions.find(v => v.id === selectedVersion);
  const hasMultipleVersions = versions.length > 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[80dvh] flex flex-col frost-sheet p-0"
        hideCloseButton={false}
      >
        <SheetTitle className="sr-only">Результат генерации</SheetTitle>
        
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">
              {trackTitle || 'Трек готов!'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasMultipleVersions 
                ? `${versions.length} версии • выберите основную`
                : 'Трек успешно создан'
              }
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {versions.map((version, index) => {
                const isSelected = version.id === selectedVersion;
                const isCurrentlyPlaying = playingVersionId === version.id && isPlaying;
                
                return (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={cn(
                        "p-4 cursor-pointer transition-all border-2",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-transparent hover:border-muted-foreground/20"
                      )}
                      onClick={() => handleSelect(version.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Play button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-12 w-12 rounded-full shrink-0",
                            isCurrentlyPlaying && "bg-primary text-primary-foreground"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(version);
                          }}
                        >
                          {isCurrentlyPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5 ml-0.5" />
                          )}
                        </Button>

                        {/* Version info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lg">
                              Версия {version.label}
                            </span>
                            {version.isPrimary && (
                              <Badge variant="secondary" className="text-xs">
                                Основная
                              </Badge>
                            )}
                          </div>
                          {version.duration && (
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(version.duration / 60)}:{String(Math.floor(version.duration % 60)).padStart(2, '0')}
                            </span>
                          )}
                        </div>

                        {/* Selection indicator */}
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                          isSelected 
                            ? "border-primary bg-primary text-primary-foreground" 
                            : "border-muted-foreground/30"
                        )}>
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Waveform hint when playing */}
                      {isCurrentlyPlaying && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 flex items-center gap-2 text-sm text-primary"
                        >
                          <Volume2 className="w-4 h-4 animate-pulse" />
                          <span>Воспроизведение...</span>
                        </motion.div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border/50 space-y-3 bg-background/80 backdrop-blur-sm">
          {/* Set primary button - only show if selection differs from current primary */}
          {hasMultipleVersions && selectedVersionData && !selectedVersionData.isPrimary && (
            <Button
              className="w-full"
              onClick={handleSetPrimary}
              disabled={settingPrimary}
            >
              {settingPrimary ? (
                <>Сохранение...</>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Сделать версию {selectedVersionData.label} основной
                </>
              )}
            </Button>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleGoToLibrary}
            >
              <Library className="w-4 h-4 mr-2" />
              В библиотеку
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={handleGoToStudio}
            >
              <Sliders className="w-4 h-4 mr-2" />
              Открыть студию
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});
