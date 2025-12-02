import { Track } from '@/hooks/useTracksOptimized';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Activity, Gauge, Key, Smile, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface TrackAnalysis {
  id: string;
  track_id: string;
  bpm: number | null;
  key: string | null;
  mood: string | null;
  energy: number | null;
  danceability: number | null;
  valence: number | null;
  acousticness: number | null;
  instrumentalness: number | null;
  genre_tags: string[] | null;
  technical_metadata: Record<string, unknown> | null;
  created_at: string;
}

interface AnalysisTabProps {
  track: Track;
}

export function AnalysisTab({ track }: AnalysisTabProps) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['track-analysis', track.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_analysis')
        .select('*')
        .eq('track_id', track.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No analysis found
          return null;
        }
        throw error;
      }
      return data as TrackAnalysis;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-8 text-center">
        <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">No analysis available for this track.</p>
        <p className="text-sm text-muted-foreground">
          AI analysis will be generated automatically after the track is created.
        </p>
      </Card>
    );
  }

  const renderMetric = (
    label: string,
    value: number | null,
    icon: React.ReactNode,
    max: number = 100
  ) => {
    if (value === null) return null;

    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <div className="flex items-center gap-3">
              <Progress value={(value / max) * 100} className="flex-1" />
              <span className="text-sm font-medium min-w-[3ch]">
                {Math.round(value)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Automated analysis of musical characteristics and metadata.
        </p>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.bpm && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">BPM (Tempo)</p>
                <p className="text-2xl font-bold">{Math.round(analysis.bpm)}</p>
              </div>
            </div>
          </Card>
        )}

        {analysis.key && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Key</p>
                <p className="text-2xl font-bold">{analysis.key}</p>
              </div>
            </div>
          </Card>
        )}

        {analysis.mood && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Smile className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mood</p>
                <p className="text-xl font-semibold capitalize">{analysis.mood}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Musical Characteristics */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Musical Characteristics</h4>
        <div className="space-y-3">
          {renderMetric(
            'Energy',
            analysis.energy,
            <Zap className="w-5 h-5 text-primary" />
          )}
          {renderMetric(
            'Danceability',
            analysis.danceability,
            <Music className="w-5 h-5 text-primary" />
          )}
          {renderMetric(
            'Valence (Positivity)',
            analysis.valence,
            <Smile className="w-5 h-5 text-primary" />
          )}
          {renderMetric(
            'Acousticness',
            analysis.acousticness,
            <Music className="w-5 h-5 text-primary" />
          )}
          {renderMetric(
            'Instrumentalness',
            analysis.instrumentalness,
            <Gauge className="w-5 h-5 text-primary" />
          )}
        </div>
      </div>

      {/* Genre Tags */}
      {analysis.genre_tags && analysis.genre_tags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Genre Tags</h4>
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {analysis.genre_tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Technical Metadata */}
      {analysis.technical_metadata && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Technical Metadata</h4>
          <Card className="p-4">
            <pre className="text-xs text-muted-foreground overflow-x-auto">
              {JSON.stringify(analysis.technical_metadata, null, 2)}
            </pre>
          </Card>
        </div>
      )}
    </div>
  );
}
