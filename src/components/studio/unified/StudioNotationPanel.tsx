/**
 * StudioNotationPanel
 * Enhanced MIDI/MusicXML viewer with multiple visualization options
 * - Sheet music (MusicXML)
 * - Piano Roll (MIDI notes)
 * - File downloads
 * - Metadata display
 */

import { memo, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Music, FileText, Download, Play, Pause, 
  Loader2, AlertCircle, RefreshCw, ChevronDown,
  Guitar, Piano as PianoIcon, Drum, Mic2, Grid3X3,
  Music2, Sparkles, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MusicXMLViewer } from '@/components/guitar/MusicXMLViewer';
import { PianoRoll, type MidiNote } from './PianoRoll';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';

interface StudioNotationPanelProps {
  track: StudioTrack;
  trackId?: string;
  stemType?: string;
  versionId?: string;
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  onClose?: () => void;
  className?: string;
}

interface TranscriptionData {
  id: string;
  midi_url?: string;
  mxml_url?: string;
  gp5_url?: string;
  pdf_url?: string;
  bpm?: number;
  key_detected?: string;
  time_signature?: string;
  notes_count?: number;
  stem_type?: string;
  notes?: MidiNote[];
}

const STEM_ICONS: Record<string, typeof Guitar> = {
  guitar: Guitar,
  bass: Guitar,
  piano: PianoIcon,
  drums: Drum,
  vocal: Mic2,
  default: Music,
};

export const StudioNotationPanel = memo(function StudioNotationPanel({
  track,
  trackId,
  stemType,
  versionId,
  currentTime = 0,
  isPlaying = false,
  onSeek,
  onClose,
  className,
}: StudioNotationPanelProps) {
  const [activeTab, setActiveTab] = useState<'sheet' | 'piano-roll' | 'files'>('sheet');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [pianoRollNotes, setPianoRollNotes] = useState<MidiNote[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Fetch transcription data
  const { data: transcription, isLoading, error, refetch } = useQuery({
    queryKey: ['studio-transcription', trackId, stemType || null, versionId, track.id],
    queryFn: async () => {
      // First try to get from track_versions.transcription_data (cached)
      if (versionId) {
        const { data: version } = await supabase
          .from('track_versions')
          .select('transcription_data')
          .eq('id', versionId)
          .maybeSingle();

        if (version?.transcription_data && typeof version.transcription_data === 'object') {
          const td = version.transcription_data as Record<string, unknown>;
          return {
            id: String(td.transcription_id || ''),
            midi_url: td.midi_url as string | undefined,
            mxml_url: td.mxml_url as string | undefined,
            gp5_url: td.gp5_url as string | undefined,
            pdf_url: td.pdf_url as string | undefined,
            bpm: typeof td.bpm === 'number' ? td.bpm : undefined,
            key_detected: td.key as string | undefined,
            time_signature: td.time_signature as string | undefined,
            notes_count: typeof td.notes_count === 'number' ? td.notes_count : undefined,
            notes: Array.isArray(td.notes) ? td.notes as MidiNote[] : undefined,
          } as TranscriptionData;
        }
      }

      // Fall back to stem_transcriptions
      // If we have trackId + stemType, first find the stem, then get transcription
      if (trackId && stemType) {
        const { data: stem } = await supabase
          .from('track_stems')
          .select('id')
          .eq('track_id', trackId)
          .eq('stem_type', stemType)
          .maybeSingle();

        if (stem) {
          const { data, error } = await supabase
            .from('stem_transcriptions')
            .select('*')
            .eq('stem_id', stem.id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (error) throw error;
          if (!data || data.length === 0) return null;
          const item = data[0];
          
          // Parse notes from JSON if available
          let notes: MidiNote[] | undefined;
          if (item.notes && typeof item.notes === 'object') {
            try {
              const notesData = item.notes as any;
              if (Array.isArray(notesData)) {
                notes = notesData;
              }
            } catch (e) {
              console.error('Failed to parse MIDI notes:', e);
            }
          }
          
          return {
            id: item.id,
            midi_url: item.midi_url ?? undefined,
            mxml_url: item.mxml_url ?? undefined,
            gp5_url: item.gp5_url ?? undefined,
            pdf_url: item.pdf_url ?? undefined,
            bpm: item.bpm ? Number(item.bpm) : undefined,
            key_detected: item.key_detected ?? undefined,
            time_signature: item.time_signature ?? undefined,
            notes_count: item.notes_count ?? undefined,
            notes,
          } as TranscriptionData;
        }
      }

      // Fallback: query by trackId or stem track.id
      const query = trackId 
        ? supabase.from('stem_transcriptions').select('*').eq('track_id', trackId)
        : supabase.from('stem_transcriptions').select('*').eq('stem_id', track.id);

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      const item = data[0];
      
      // Parse notes from JSON if available
      let notes: MidiNote[] | undefined;
      if (item.notes && typeof item.notes === 'object') {
        try {
          const notesData = item.notes as any;
          if (Array.isArray(notesData)) {
            notes = notesData;
          }
        } catch (e) {
          console.error('Failed to parse MIDI notes:', e);
        }
      }
      
      return {
        id: item.id,
        midi_url: item.midi_url ?? undefined,
        mxml_url: item.mxml_url ?? undefined,
        gp5_url: item.gp5_url ?? undefined,
        pdf_url: item.pdf_url ?? undefined,
        bpm: typeof item.bpm === 'number' ? item.bpm : undefined,
        key_detected: item.key_detected ?? undefined,
        time_signature: item.time_signature ?? undefined,
        notes_count: item.notes_count ?? undefined,
        notes,
      } as TranscriptionData;
    },
    enabled: !!(trackId || track.id),
  });

  // Update piano roll notes when transcription data changes
  useEffect(() => {
    if (transcription?.notes) {
      setPianoRollNotes(transcription.notes);
    }
  }, [transcription]);

  // Download file helper
  const downloadFile = useCallback(async (url: string, filename: string) => {
    setIsDownloading(filename);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success(`${filename} скачан`);
    } catch (err) {
      toast.error('Ошибка скачивания');
    } finally {
      setIsDownloading(null);
    }
  }, []);

  // Get stem icon
  const StemIcon = STEM_ICONS[track.type] || STEM_ICONS.default;

  // Available files
  const availableFiles = transcription ? [
    { key: 'midi', url: transcription.midi_url, label: 'MIDI', ext: '.mid' },
    { key: 'mxml', url: transcription.mxml_url, label: 'MusicXML', ext: '.xml' },
    { key: 'gp5', url: transcription.gp5_url, label: 'Guitar Pro', ext: '.gp5' },
    { key: 'pdf', url: transcription.pdf_url, label: 'PDF', ext: '.pdf' },
  ].filter(f => f.url) : [];

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !transcription) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
        <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-2 text-center">
          {error ? 'Ошибка загрузки' : 'Нет транскрипции'}
        </p>
        <p className="text-xs text-muted-foreground mb-4 text-center max-w-xs">
          {error 
            ? 'Не удалось загрузить данные транскрипции' 
            : 'Выполните транскрипцию трека для отображения нот'}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <StemIcon className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">{track.name}</span>
          {transcription.bpm && (
            <Badge variant="secondary" className="text-xs">
              {transcription.bpm} BPM
            </Badge>
          )}
          {transcription.key_detected && (
            <Badge variant="outline" className="text-xs">
              {transcription.key_detected}
            </Badge>
          )}
        </div>

        {/* Download menu */}
        {availableFiles.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1.5" />
                Скачать
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableFiles.map(file => (
                <DropdownMenuItem
                  key={file.key}
                  onClick={() => downloadFile(file.url!, `${track.name}${file.ext}`)}
                  disabled={isDownloading === `${track.name}${file.ext}`}
                >
                  {isDownloading === `${track.name}${file.ext}` ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  {file.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-2 grid grid-cols-3 w-auto">
          <TabsTrigger value="sheet" className="text-xs">
            <Music className="w-3 h-3 mr-1.5" />
            Ноты
          </TabsTrigger>
          <TabsTrigger value="piano-roll" className="text-xs" disabled={!transcription?.notes || transcription.notes.length === 0}>
            <Grid3X3 className="w-3 h-3 mr-1.5" />
            Piano Roll
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs">
            <FileText className="w-3 h-3 mr-1.5" />
            Файлы ({availableFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sheet" className="flex-1 min-h-0 p-3">
          {transcription.mxml_url ? (
            <div className="h-full overflow-hidden rounded-lg border border-border/50">
              <MusicXMLViewer
                url={transcription.mxml_url}
                className="h-full"
                showControls
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">MusicXML недоступен</p>
                <p className="text-xs mt-1">Используйте транскрипцию для получения нотной записи</p>
              </div>
            </div>
          )}
        </TabsContent>

         <TabsContent value="piano-roll" className="flex-1 min-h-0 p-3">
           {transcription?.notes && transcription.notes.length > 0 ? (
             <div className="h-full overflow-hidden rounded-lg border border-border/50 bg-background">
               <PianoRoll
                 notes={pianoRollNotes}
                 onNotesChange={setPianoRollNotes}
                 duration={(track as any).duration || track.clips?.[0]?.duration || 60}
                 bpm={transcription.bpm}
                 timeSignature={transcription.time_signature}
                 currentTime={currentTime}
                 onSeek={onSeek}
                 isPlaying={isPlaying}
                 readOnly={true}
                 className="h-full"
               />
             </div>
           ) : (
             <div className="flex items-center justify-center h-full text-muted-foreground">
               <div className="text-center">
                 <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                 <p className="text-sm">MIDI данные недоступны</p>
                 <p className="text-xs mt-1">Выполните транскрипцию трека для просмотра нот в Piano Roll</p>
               </div>
             </div>
           )}
         </TabsContent>

        <TabsContent value="files" className="flex-1 min-h-0 p-3">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {availableFiles.length > 0 ? (
                availableFiles.map(file => (
                  <motion.div
                    key={file.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{file.label}</p>
                        <p className="text-xs text-muted-foreground">{file.ext}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file.url!, `${track.name}${file.ext}`)}
                      disabled={isDownloading === `${track.name}${file.ext}`}
                    >
                      {isDownloading === `${track.name}${file.ext}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Нет файлов транскрипции</p>
                </div>
              )}

              {/* Metadata */}
              {(transcription.bpm || transcription.key_detected || transcription.time_signature) && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Метаданные</p>
                  <div className="flex flex-wrap gap-2">
                    {transcription.bpm && (
                      <Badge variant="secondary">{transcription.bpm} BPM</Badge>
                    )}
                    {transcription.key_detected && (
                      <Badge variant="secondary">{transcription.key_detected}</Badge>
                    )}
                    {transcription.time_signature && (
                      <Badge variant="secondary">{transcription.time_signature}</Badge>
                    )}
                    {transcription.notes_count && (
                      <Badge variant="outline">{transcription.notes_count} нот</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
});
