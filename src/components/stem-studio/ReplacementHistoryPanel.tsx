import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Play, ChevronRight, Clock, Music, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { SectionComparePanel } from './SectionComparePanel';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ReplacementRecord {
  id: string;
  created_at: string;
  change_type: string;
  prompt_used: string | null;
  metadata: {
    infill_start_s?: number;
    infill_end_s?: number;
    tags?: string;
    new_version_id?: string;
    original_audio_url?: string;
    new_audio_url?: string;
  } | null;
  version_id: string | null;
  track_versions?: {
    audio_url: string;
    version_label: string | null;
  } | null;
}

interface ReplacementHistoryPanelProps {
  trackId: string;
  trackAudioUrl?: string | null;
}

export function ReplacementHistoryPanel({ trackId, trackAudioUrl }: ReplacementHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReplacementRecord | null>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ['replacement-history', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_change_log')
        .select(`
          id,
          created_at,
          change_type,
          prompt_used,
          metadata,
          version_id,
          track_versions (
            audio_url,
            version_label
          )
        `)
        .eq('track_id', trackId)
        .eq('change_type', 'section_replace')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReplacementRecord[];
    },
    enabled: open,
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">История</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            История замен секций
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Нет истории замен</p>
              <p className="text-xs mt-1">Замены секций будут отображаться здесь</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => {
                const isSelected = selectedRecord?.id === record.id;
                const startTime = record.metadata?.infill_start_s ?? 0;
                const endTime = record.metadata?.infill_end_s ?? 0;
                const newAudioUrl = record.track_versions?.audio_url || record.metadata?.new_audio_url;

                return (
                  <div key={record.id} className="space-y-3">
                    <button
                      onClick={() => setSelectedRecord(isSelected ? null : record)}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left transition-all',
                        'hover:border-primary/50 hover:bg-accent/50',
                        isSelected && 'border-primary bg-accent'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {formatTime(startTime)} - {formatTime(endTime)}
                            </Badge>
                            {record.track_versions?.version_label && (
                              <Badge variant="outline" className="text-xs">
                                {record.track_versions.version_label}
                              </Badge>
                            )}
                          </div>

                          {record.prompt_used && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                              {record.prompt_used}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(record.created_at), 'd MMM, HH:mm', { locale: ru })}
                            </span>
                            {record.metadata?.tags && (
                              <span className="flex items-center gap-1 truncate">
                                <Music className="w-3 h-3" />
                                {record.metadata.tags.slice(0, 30)}...
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className={cn(
                          'w-5 h-5 text-muted-foreground transition-transform',
                          isSelected && 'rotate-90'
                        )} />
                      </div>
                    </button>

                    {/* A/B Compare Panel */}
                    {isSelected && trackAudioUrl && newAudioUrl && (
                      <SectionComparePanel
                        originalUrl={trackAudioUrl}
                        replacedUrl={newAudioUrl}
                        sectionStart={startTime}
                        sectionEnd={endTime}
                        originalLabel="Оригинал"
                        replacedLabel={record.track_versions?.version_label || 'Замена'}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
