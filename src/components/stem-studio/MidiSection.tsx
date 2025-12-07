import { useState } from 'react';
import { Music2, Download, Loader2, FileMusic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMidi } from '@/hooks/useMidi';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MidiSectionProps {
  trackId: string;
  trackTitle: string;
  audioUrl: string;
}

export const MidiSection = ({ trackId, trackTitle, audioUrl }: MidiSectionProps) => {
  const [open, setOpen] = useState(false);
  const [modelType, setModelType] = useState<'mt3' | 'basic-pitch'>('mt3');
  
  const { 
    midiVersions, 
    isLoading, 
    isTranscribing, 
    transcribeToMidi, 
    downloadMidi,
    hasMidi,
    latestMidi,
  } = useMidi(trackId);

  const handleTranscribe = async () => {
    try {
      await transcribeToMidi(audioUrl, modelType);
    } catch (error) {
      console.error('Transcription error:', error);
    }
  };

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^\\w\\s-]/g, '').replace(/\\s+/g, '_');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            hasMidi && "border-primary/50 text-primary"
          )}
        >
          <Music2 className="w-4 h-4" />
          MIDI
          {hasMidi && (
            <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded">
              {midiVersions?.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileMusic className="w-5 h-5 text-primary" />
            MIDI Транскрипция
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new MIDI */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Создать MIDI</span>
              <Select value={modelType} onValueChange={(v) => setModelType(v as any)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mt3">MT3 (точный)</SelectItem>
                  <SelectItem value="basic-pitch">Basic Pitch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {modelType === 'mt3' 
                ? 'MT3 модель обеспечивает высокую точность транскрипции'
                : 'Basic Pitch быстрее, но менее точный'}
            </p>

            <Button 
              onClick={handleTranscribe} 
              disabled={isTranscribing}
              className="w-full gap-2"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Создание MIDI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Создать MIDI файл
                </>
              )}
            </Button>
          </div>

          {/* Existing MIDI files */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : midiVersions && midiVersions.length > 0 ? (
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">
                Созданные MIDI файлы
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {midiVersions.map((midi) => (
                  <div 
                    key={midi.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileMusic className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {trackTitle}.mid
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {midi.metadata?.model_type?.toUpperCase() || 'MT3'} • {' '}
                          {format(new Date(midi.created_at), 'd MMM, HH:mm', { locale: ru })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadMidi(midi.audio_url, sanitizeFilename(trackTitle))}
                      className="h-9 w-9"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Music2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">MIDI файлы ещё не созданы</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
