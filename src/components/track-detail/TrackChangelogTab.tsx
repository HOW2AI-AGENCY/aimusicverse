import { useTrackChangelog } from '@/hooks/useTrackChangelog';
import { Badge } from '@/components/ui/badge';
import { FileEdit, Sparkles, Upload, Download, Music2, User } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TrackChangelogTabProps {
  trackId: string;
}

export function TrackChangelogTab({ trackId }: TrackChangelogTabProps) {
  const { data: changelog, isLoading } = useTrackChangelog(trackId);

  const getChangeIcon = (type: string) => {
    const icons: Record<string, any> = {
      edit: FileEdit,
      ai_generation: Sparkles,
      upload: Upload,
      download: Download,
      create: Music2,
    };
    const Icon = icons[type] || FileEdit;
    return <Icon className="w-4 h-4" />;
  };

  const getChangeLabel = (type: string) => {
    const labels: Record<string, string> = {
      edit: 'Изменение',
      ai_generation: 'AI Генерация',
      upload: 'Загрузка',
      download: 'Скачивание',
      create: 'Создание',
      remix: 'Ремикс',
      extend: 'Продление',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!changelog || changelog.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileEdit className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">История изменений пуста</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {changelog.map((log) => (
        <div
          key={log.id}
          className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {getChangeIcon(log.change_type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{getChangeLabel(log.change_type)}</Badge>
                {log.ai_model_used && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    {log.ai_model_used}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <User className="w-3 h-3" />
                <span>{log.changed_by}</span>
                <span>•</span>
                <span>
                  {log.created_at &&
                    format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                </span>
              </div>

              {/* Field changes */}
              {log.field_name && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Поле: {log.field_name}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {log.old_value && (
                      <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                        <p className="text-muted-foreground mb-1">Было:</p>
                        <p className="font-mono line-through opacity-75">{log.old_value}</p>
                      </div>
                    )}
                    {log.new_value && (
                      <div className="p-2 rounded bg-primary/10 border border-primary/20">
                        <p className="text-muted-foreground mb-1">Стало:</p>
                        <p className="font-mono">{log.new_value}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Prompt */}
              {log.prompt_used && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Промпт:</p>
                  <p className="text-sm">{log.prompt_used}</p>
                </div>
              )}

              {/* Additional metadata */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-2 p-2 rounded bg-muted/30">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      Дополнительная информация
                    </summary>
                    <pre className="mt-2 text-xs overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
