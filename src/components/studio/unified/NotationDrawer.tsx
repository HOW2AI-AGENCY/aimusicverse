/**
 * NotationDrawer
 * Mobile bottom drawer for viewing notation + piano roll + notes list.
 * Uses the same implementation as the old studio (UnifiedNotesViewer) to keep
 * MusicXML parsing + note list consistent.
 */

import { memo, useCallback, useMemo, useState } from 'react';
import { ChevronDown, Download, FileText, Loader2, Music2, X } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { UnifiedNotesViewer } from '@/components/studio/UnifiedNotesViewer';

import type { StudioTrack } from '@/stores/useUnifiedStudioStore';
import type { MidiNote } from './PianoRoll';

export interface NotationDrawerProps {
  open: boolean;
  onClose: () => void;
  track: StudioTrack | null;
  transcriptionData?: {
    midi_url?: string;
    mxml_url?: string;
    gp5_url?: string;
    pdf_url?: string;
    bpm?: number;
    key?: string;
    time_signature?: string;
    notes?: MidiNote[];
    notes_count?: number;
  };
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
}

export const NotationDrawer = memo(function NotationDrawer({
  open,
  onClose,
  track,
  transcriptionData,
  currentTime = 0,
  duration = 0,
  isPlaying = false,
}: NotationDrawerProps) {
  const haptic = useHapticFeedback();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Telegram safe area padding
  const safeAreaTop = `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.5rem, env(safe-area-inset-top, 0px) + 0.5rem))`;
  const safeAreaBottom = `calc(max(var(--tg-safe-area-inset-bottom, 0px) + 1rem, env(safe-area-inset-bottom, 0px) + 1rem))`;

  const effectiveDuration = duration || (track as any)?.duration || track?.clips?.[0]?.duration || 60;

  const availableFiles = useMemo(() => {
    if (!transcriptionData) return [];
    return [
      { key: 'midi', url: transcriptionData.midi_url, label: 'MIDI', ext: '.mid' },
      { key: 'mxml', url: transcriptionData.mxml_url, label: 'MusicXML', ext: '.xml' },
      { key: 'gp5', url: transcriptionData.gp5_url, label: 'Guitar Pro', ext: '.gp5' },
      { key: 'pdf', url: transcriptionData.pdf_url, label: 'PDF', ext: '.pdf' },
    ].filter((f) => !!f.url);
  }, [transcriptionData]);

  const handleDownload = useCallback(
    async (url: string, filename: string) => {
      haptic.tap();
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
      } catch {
        toast.error('Ошибка скачивания');
      } finally {
        setIsDownloading(null);
      }
    },
    [haptic]
  );

  const handleClose = useCallback(() => {
    haptic.tap();
    onClose();
  }, [haptic, onClose]);

  if (!track) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent
        side="bottom"
        className={cn('h-[85vh] rounded-t-2xl p-0 flex flex-col')}
        style={{ paddingBottom: safeAreaBottom }}
      >
        <SheetHeader
          className="flex-shrink-0 px-4 py-3 border-b border-border/50"
          style={{ paddingTop: safeAreaTop }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <SheetTitle className="text-left text-base truncate flex items-center gap-2">
                <Music2 className="w-5 h-5 text-primary shrink-0" />
                <span className="truncate">{track.name}</span>
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {transcriptionData?.bpm && (
                  <Badge variant="secondary" className="text-xs h-5">
                    {Math.round(transcriptionData.bpm)} BPM
                  </Badge>
                )}
                {transcriptionData?.key && (
                  <Badge variant="outline" className="text-xs h-5">
                    {transcriptionData.key}
                  </Badge>
                )}
                {typeof transcriptionData?.notes_count === 'number' && transcriptionData.notes_count > 0 && (
                  <Badge variant="outline" className="text-xs h-5">
                    {transcriptionData.notes_count} нот
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {availableFiles.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-3">
                      <Download className="w-4 h-4 mr-1.5" />
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {availableFiles.map((file) => (
                      <DropdownMenuItem
                        key={file.key}
                        onClick={() => handleDownload(file.url!, `${track.name}${file.ext}`)}
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

              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 p-4">
          <UnifiedNotesViewer
            notes={transcriptionData?.notes as any}
            duration={effectiveDuration}
            bpm={transcriptionData?.bpm ?? 120}
            timeSignature={transcriptionData?.time_signature}
            keySignature={transcriptionData?.key}
            notesCount={transcriptionData?.notes_count}
            files={{
              midiUrl: transcriptionData?.midi_url,
              pdfUrl: transcriptionData?.pdf_url,
              gp5Url: transcriptionData?.gp5_url,
              musicXmlUrl: transcriptionData?.mxml_url,
            }}
            midiUrl={transcriptionData?.midi_url}
            musicXmlUrl={transcriptionData?.mxml_url}
            currentTime={currentTime}
            isPlaying={isPlaying}
            enablePlayback={false}
            trackTitle={track.name}
            height={560}
            className="h-full"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
});
