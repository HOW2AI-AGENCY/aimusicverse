import { useTrackVersions } from '@/hooks/useTrackVersions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music2, Clock, Play, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TrackVersionsTabProps {
  trackId: string;
}

export function TrackVersionsTab({ trackId }: TrackVersionsTabProps) {
  const { data: versions, isLoading } = useTrackVersions(trackId);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVersionLabel = (type: string) => {
    const labels: Record<string, string> = {
      initial: 'Оригинал',
      remix: 'Ремикс',
      extend: 'Продление',
      cover: 'Кавер',
      instrumental: 'Инструментал',
      vocal: 'Вокал добавлен',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Music2 className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Версии отсутствуют</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

      <div className="space-y-6">
        {versions.map((version, index) => (
          <div key={version.id} className="relative pl-16 group">
            {/* Timeline dot */}
            <div
              className={`absolute left-4 top-6 w-5 h-5 rounded-full border-4 transition-all ${
                version.is_primary
                  ? 'bg-primary border-primary shadow-lg shadow-primary/50'
                  : 'bg-background border-primary/50 group-hover:border-primary'
              }`}
            />

            {/* Version card */}
            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {version.cover_url ? (
                    <img
                      src={version.cover_url}
                      alt="Version cover"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Music2 className="w-8 h-8 text-primary/40" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={version.is_primary ? 'default' : 'secondary'}>
                        {getVersionLabel(version.version_type)}
                      </Badge>
                      {version.is_primary && (
                        <Badge variant="outline" className="border-primary text-primary">
                          Текущая
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {version.created_at &&
                        format(new Date(version.created_at), 'dd MMM yyyy, HH:mm', {
                          locale: ru,
                        })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{formatDuration(version.duration_seconds)}</span>
                </div>
              </div>

              {/* Metadata */}
              {version.metadata && (
                <div className="mb-3 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    {JSON.stringify(version.metadata, null, 2)}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Play className="w-3 h-3 mr-1" />
                  Прослушать
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Connection line to parent */}
            {version.parent_version_id && index > 0 && (
              <div className="absolute left-6 top-0 w-10 h-6 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
