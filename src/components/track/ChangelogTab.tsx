import type { Track } from '@/types/track';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Edit, Plus, Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from '@/lib/date-utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ChangelogTabProps {
  track: Track;
}

const changeTypeIcons: Record<string, typeof Plus> = {
  created: Plus,
  updated: Edit,
  version_added: Plus,
  master_changed: Crown,
  metadata_updated: Edit,
};

const changeTypeLabels: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  version_added: 'Version Added',
  master_changed: 'Master Changed',
  metadata_updated: 'Metadata Updated',
};

export function ChangelogTab({ track }: ChangelogTabProps) {
  const { data: changelog, isLoading } = useQuery({
    queryKey: ['track-change-log', track.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_change_log')
        .select('*')
        .eq('track_id', track.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!changelog || changelog.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No changelog entries for this track.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Version History</h3>
        <p className="text-sm text-muted-foreground">
          Timeline of changes and updates to this track.
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-6">
          {changelog.map((entry) => {
            const Icon = changeTypeIcons[entry.change_type] || Edit;
            const label = changeTypeLabels[entry.change_type] || entry.change_type;

            return (
              <div key={entry.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          {label}
                        </Badge>
                        {entry.field_name && (
                          <p className="text-sm font-medium">
                            Changed: {entry.field_name}
                          </p>
                        )}
                      </div>
                      {entry.created_at && (
                        <time className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}
                        </time>
                      )}
                    </div>

                    {entry.changed_by && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <User className="w-3 h-3" />
                        <span>{entry.changed_by}</span>
                      </div>
                    )}

                    {(entry.old_value || entry.new_value) && (
                      <div className="mt-3 pt-3 border-t space-y-1">
                        {entry.old_value && (
                          <p className="text-xs">
                            <span className="font-medium text-muted-foreground">Old:</span>{' '}
                            <span className="text-destructive">{entry.old_value}</span>
                          </p>
                        )}
                        {entry.new_value && (
                          <p className="text-xs">
                            <span className="font-medium text-muted-foreground">New:</span>{' '}
                            <span className="text-primary">{entry.new_value}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
