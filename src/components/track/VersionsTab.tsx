import { useState } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Play, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface TrackVersion {
  id: string;
  track_id: string;
  version_number: number;
  audio_url: string;
  is_master: boolean;
  file_size_bytes: number | null;
  created_at: string;
  notes: string | null;
}

interface VersionsTabProps {
  track: Track;
}

export function VersionsTab({ track }: VersionsTabProps) {
  const queryClient = useQueryClient();
  const [optimisticMasterId, setOptimisticMasterId] = useState<string | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['track-versions', track.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', track.id)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data as TrackVersion[];
    },
  });

  const setMasterMutation = useMutation({
    mutationFn: async (versionId: string) => {
      // Optimistically update
      setOptimisticMasterId(versionId);

      const { error } = await supabase.rpc('set_master_version', {
        p_version_id: versionId,
        p_track_id: track.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['track-versions', track.id] });
      toast.success('Master version updated');
      setOptimisticMasterId(null);
    },
    onError: (error) => {
      toast.error('Failed to set master version');
      console.error('Set master version error:', error);
      setOptimisticMasterId(null);
    },
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No versions available for this track.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Versions</h3>
        <p className="text-sm text-muted-foreground">
          Manage different versions of this track. The master version is used by default.
        </p>
      </div>

      <div className="space-y-3">
        {versions.map((version) => {
          const isMaster = optimisticMasterId
            ? version.id === optimisticMasterId
            : version.is_master;

          return (
            <Card
              key={version.id}
              className={`p-4 ${isMaster ? 'border-primary' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      Version {version.version_number}
                    </h4>
                    {isMaster && (
                      <Badge variant="default" className="gap-1">
                        <Crown className="w-3 h-3" />
                        Master
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Created: {format(new Date(version.created_at), 'MMM dd, yyyy HH:mm')}</p>
                    <p>Size: {formatFileSize(version.file_size_bytes)}</p>
                    {version.notes && <p className="italic">"{version.notes}"</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {!isMaster && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMasterMutation.mutate(version.id)}
                      disabled={setMasterMutation.isPending}
                      className="gap-1 min-w-[120px]"
                    >
                      <Crown className="w-3 h-3" />
                      Set as Master
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1 min-w-[120px]"
                    onClick={() => {
                      // TODO: Implement use this version functionality
                      toast.info('Use version feature coming soon');
                    }}
                  >
                    <Play className="w-3 h-3" />
                    Use This
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 min-w-[120px]"
                    onClick={() => {
                      window.open(version.audio_url, '_blank');
                    }}
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
