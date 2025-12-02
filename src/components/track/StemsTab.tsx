import { useState } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Play, Wand2, Music, Mic, Drum, Guitar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface TrackStem {
  id: string;
  track_id: string;
  stem_type: 'vocals' | 'bass' | 'drums' | 'other';
  audio_url: string;
  file_size_bytes: number | null;
  format: string | null;
  created_at: string;
}

interface StemsTabProps {
  track: Track;
}

const stemIcons = {
  vocals: Mic,
  bass: Music,
  drums: Drum,
  other: Guitar,
};

const stemLabels = {
  vocals: 'Vocals',
  bass: 'Bass',
  drums: 'Drums',
  other: 'Other',
};

export function StemsTab({ track }: StemsTabProps) {
  const queryClient = useQueryClient();
  const [generatingStems, setGeneratingStems] = useState(false);

  const { data: stems, isLoading } = useQuery({
    queryKey: ['track-stems', track.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_stems')
        .select('*')
        .eq('track_id', track.id)
        .order('stem_type');

      if (error) throw error;
      return data as TrackStem[];
    },
  });

  const generateStemsMutation = useMutation({
    mutationFn: async () => {
      setGeneratingStems(true);
      
      // TODO: Integrate with actual stem separation service
      // For now, show a toast message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      throw new Error('Stem generation service not yet integrated');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['track-stems', track.id] });
      toast.success('Stems generated successfully');
      setGeneratingStems(false);
    },
    onError: (error) => {
      toast.error('Stem generation feature coming soon');
      console.error('Generate stems error:', error);
      setGeneratingStems(false);
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
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const hasStemst = stems && stems.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">Stems</h3>
          <p className="text-sm text-muted-foreground">
            Individual instrument and vocal tracks separated from the mix.
          </p>
        </div>

        {!hasStemst && (
          <Button
            onClick={() => generateStemsMutation.mutate()}
            disabled={generatingStems}
            className="gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Generate Stems
          </Button>
        )}
      </div>

      {!hasStemst ? (
        <Card className="p-8 text-center">
          <Wand2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            No stems available for this track yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Click "Generate Stems" to separate this track into individual components.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {stems.map((stem) => {
            const Icon = stemIcons[stem.stem_type];
            const label = stemLabels[stem.stem_type];

            return (
              <Card key={stem.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold">{label}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{formatFileSize(stem.file_size_bytes)}</span>
                      {stem.format && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {stem.format.toUpperCase()}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1 h-9 w-9 md:w-auto md:px-3"
                      onClick={() => {
                        // TODO: Implement stem preview
                        toast.info('Stem preview coming soon');
                      }}
                    >
                      <Play className="w-4 h-4" />
                      <span className="hidden md:inline">Preview</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-9 w-9 md:w-auto md:px-3"
                      onClick={() => {
                        window.open(stem.audio_url, '_blank');
                      }}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden md:inline">Download</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
