import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronRight, Clock, Music, Loader2, CheckCircle2, XCircle } from 'lucide-react';
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
    infillStartS?: number;
    infillEndS?: number;
    infill_start_s?: number;
    infill_end_s?: number;
    taskId?: string;
    tags?: string;
    new_version_id?: string;
    original_audio_url?: string;
    new_audio_url?: string;
    audioUrl?: string;
    versionLabel?: string;
  } | null;
  version_id: string | null;
  track_versions?: {
    audio_url: string;
    version_label: string | null;
  } | null;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -20 },
};

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
        .in('change_type', ['replace_section_started', 'replace_section_completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Group by taskId to show both started and completed
      const grouped = new Map<string, ReplacementRecord[]>();
      for (const record of (data as ReplacementRecord[]) || []) {
        const taskId = record.metadata?.taskId || record.id;
        if (!grouped.has(taskId)) {
          grouped.set(taskId, []);
        }
        grouped.get(taskId)!.push(record);
      }
      
      // Return latest record per task
      return Array.from(grouped.values()).map(records => {
        const completed = records.find(r => r.change_type === 'replace_section_completed');
        return completed || records[0];
      });
    },
    enabled: open,
    refetchInterval: 5000,
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
            <motion.div 
              className="space-y-3"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.05 } }
              }}
            >
              <AnimatePresence mode="popLayout">
                {history.map((record) => {
                  const isSelected = selectedRecord?.id === record.id;
                  const startTime = record.metadata?.infillStartS ?? record.metadata?.infill_start_s ?? 0;
                  const endTime = record.metadata?.infillEndS ?? record.metadata?.infill_end_s ?? 0;
                  const newAudioUrl = record.track_versions?.audio_url || 
                    record.metadata?.audioUrl || 
                    record.metadata?.new_audio_url;
                  const isCompleted = record.change_type === 'replace_section_completed';
                  const isPending = record.change_type === 'replace_section_started';

                  return (
                    <motion.div 
                      key={record.id} 
                      className="space-y-3"
                      variants={itemVariants}
                      layout
                    >
                      <motion.button
                        onClick={() => setSelectedRecord(isSelected ? null : record)}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-all',
                          'hover:border-primary/50 hover:bg-accent/50',
                          isSelected && 'border-primary bg-accent',
                          isPending && 'border-warning/50 bg-warning/5',
                          isCompleted && 'border-success/50'
                        )}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isPending ? (
                                <Badge variant="secondary" className="text-xs bg-warning/10 text-warning border-warning/30 gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Обработка...
                                </Badge>
                              ) : isCompleted ? (
                                <Badge variant="secondary" className="text-xs bg-success/10 text-success border-success/30 gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {formatTime(startTime)} - {formatTime(endTime)}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  {formatTime(startTime)} - {formatTime(endTime)}
                                </Badge>
                              )}
                              {(record.track_versions?.version_label || record.metadata?.versionLabel) && (
                                <Badge variant="outline" className="text-xs">
                                  {record.track_versions?.version_label || record.metadata?.versionLabel}
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

                          <motion.div
                            animate={{ rotate: isSelected ? 90 : 0 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </motion.button>

                      {/* A/B Compare Panel */}
                      <AnimatePresence>
                        {isSelected && trackAudioUrl && newAudioUrl && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <SectionComparePanel
                              originalUrl={trackAudioUrl}
                              replacedUrl={newAudioUrl}
                              sectionStart={startTime}
                              sectionEnd={endTime}
                              originalLabel="Оригинал"
                              replacedLabel={record.track_versions?.version_label || record.metadata?.versionLabel || 'Замена'}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
