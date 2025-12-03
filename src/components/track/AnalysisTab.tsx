import { Track } from '@/hooks/useTracksOptimized';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Activity, Gauge, Key, Smile, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface AnalysisTabProps {
  track: Track;
}

export function AnalysisTab({ track }: AnalysisTabProps) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['audio-analysis', track.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_analysis')
        .select('*')
        .eq('track_id', track.id)
        .maybeSingle();

      if (error) throw error;
      return data;
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
                <p className="text-2xl font-bold">{Math.round(Number(analysis.bpm))}</p>
              </div>
            </div>
          </Card>
        )}

        {analysis.key_signature && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Key</p>
                <p className="text-2xl font-bold">{analysis.key_signature}</p>
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

        {analysis.genre && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Genre</p>
                <p className="text-xl font-semibold capitalize">{analysis.genre}</p>
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
            'Arousal',
            analysis.arousal ? Number(analysis.arousal) * 100 : null,
            <Zap className="w-5 h-5 text-primary" />
          )}
          {renderMetric(
            'Valence (Positivity)',
            analysis.valence ? Number(analysis.valence) * 100 : null,
            <Smile className="w-5 h-5 text-primary" />
          )}
        </div>
      </div>

      {/* Instruments */}
      {analysis.instruments && analysis.instruments.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Instruments</h4>
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {analysis.instruments.map((instrument, index) => (
                <Badge key={index} variant="secondary">
                  {instrument}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Structure */}
      {analysis.structure && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Structure</h4>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">{analysis.structure}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
