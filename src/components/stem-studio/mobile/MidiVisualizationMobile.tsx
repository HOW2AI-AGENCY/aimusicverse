import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Music, 
  ZoomIn, 
  ZoomOut, 
  Download,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMidiVisualization, MidiNote } from '@/hooks/useMidiVisualization';
import { useStemMidi, MidiModelType } from '@/hooks/useStemMidi';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MidiVisualizationMobileProps {
  trackId: string;
  stems?: Array<{ id: string; stem_type: string; audio_url: string }>;
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  midiVersions?: Array<{ id: string; audio_url: string; version_label: string; version_type: string }>;
}

export const MidiVisualizationMobile = ({
  trackId,
  stems = [],
  currentTime = 0,
  isPlaying = false,
  onSeek,
  midiVersions = [],
}: MidiVisualizationMobileProps) => {
  const haptic = useHapticFeedback();
  const { transcribeToMidi, isTranscribing } = useStemMidi(trackId);
  const {
    notes,
    duration,
    isLoading,
    loadMidi,
    exportMidi,
  } = useMidiVisualization();

  const [selectedStemId, setSelectedStemId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pixelsPerSecond = 60 * zoom;
  const noteHeight = 6;
  const minPitch = notes.length > 0 ? Math.min(...notes.map(n => n.pitch)) - 2 : 48;
  const maxPitch = notes.length > 0 ? Math.max(...notes.map(n => n.pitch)) + 2 : 72;
  const pitchRange = maxPitch - minPitch;
  const canvasHeight = pitchRange * noteHeight;

  // Auto-scroll to playhead
  useEffect(() => {
    if (isPlaying && scrollRef.current) {
      const playheadX = currentTime * pixelsPerSecond;
      const containerWidth = scrollRef.current.clientWidth;
      const scrollLeft = playheadX - containerWidth / 2;
      scrollRef.current.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [currentTime, isPlaying, pixelsPerSecond]);

  // Load MIDI when version selected
  useEffect(() => {
    if (selectedVersionId) {
      const version = midiVersions.find(v => v.id === selectedVersionId);
      if (version?.audio_url) {
        loadMidi(version.audio_url);
      }
    }
  }, [selectedVersionId, midiVersions, loadMidi]);

  const handleTranscribe = async () => {
    if (!selectedStemId) {
      toast.error('Выберите стем для транскрипции');
      return;
    }
    
    haptic.impact('medium');
    const stem = stems.find(s => s.id === selectedStemId);
    if (stem) {
      await transcribeToMidi(stem.audio_url, 'basic-pitch' as MidiModelType, stem.stem_type);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    haptic.tap();
    setZoom(prev => {
      if (direction === 'in') return Math.min(prev * 1.5, 4);
      return Math.max(prev / 1.5, 0.25);
    });
  };

  const handleDownload = () => {
    haptic.impact('medium');
    const blob = exportMidi();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `track_${trackId}_midi.mid`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('MIDI скачан');
  };

  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!onSeek || !scrollRef.current) return;
    
    const rect = scrollRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left + scrollRef.current.scrollLeft;
    const time = x / pixelsPerSecond;
    
    if (time >= 0 && time <= duration) {
      haptic.tap();
      onSeek(time);
    }
  }, [onSeek, pixelsPerSecond, duration, haptic]);

  const getNoteColor = (note: MidiNote) => {
    const hue = (note.pitch % 12) * 30;
    const lightness = 50 + (note.velocity / 127) * 20;
    return `hsl(${hue}, 70%, ${lightness}%)`;
  };

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card 
          className="p-3 cursor-pointer active:bg-muted/50"
          onClick={() => {
            haptic.tap();
            setIsExpanded(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              <span className="font-medium">MIDI Ноты</span>
              {notes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {notes.length} нот
                </Badge>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3"
    >
      <Card className="p-3">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => {
            haptic.tap();
            setIsExpanded(false);
          }}
        >
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <span className="font-medium">MIDI Ноты</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground rotate-180" />
        </div>

        {/* Selectors */}
        <div className="flex gap-2 mb-3">
          <Select value={selectedStemId || ''} onValueChange={setSelectedStemId}>
            <SelectTrigger className="flex-1 h-9">
              <SelectValue placeholder="Выбрать стем" />
            </SelectTrigger>
            <SelectContent>
              {stems.map(stem => (
                <SelectItem key={stem.id} value={stem.id}>
                  {stem.stem_type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {midiVersions.length > 0 && (
            <Select value={selectedVersionId || ''} onValueChange={setSelectedVersionId}>
              <SelectTrigger className="flex-1 h-9">
                <SelectValue placeholder="MIDI версия" />
              </SelectTrigger>
              <SelectContent>
                {midiVersions.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.version_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9"
            onClick={handleTranscribe}
            disabled={!selectedStemId || isTranscribing}
          >
            {isTranscribing ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Music className="w-4 h-4 mr-1.5" />
            )}
            Создать
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => handleZoom('out')}
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => handleZoom('in')}
            disabled={zoom >= 4}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          {notes.length > 0 && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Piano Roll Visualization */}
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length > 0 ? (
          <div 
            ref={scrollRef}
            className="relative overflow-x-auto overflow-y-hidden rounded-lg bg-muted/30"
            style={{ height: Math.min(canvasHeight + 20, 150) }}
            onTouchStart={handleTap}
            onClick={handleTap}
          >
            <div
              className="relative"
              style={{
                width: duration * pixelsPerSecond,
                height: canvasHeight,
              }}
            >
              {/* Grid lines */}
              {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-border/30"
                  style={{ left: i * pixelsPerSecond }}
                />
              ))}

              {/* Notes */}
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  className="absolute rounded-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: currentTime >= note.time && currentTime <= note.time + note.duration ? 1 : 0.7,
                    scale: 1,
                  }}
                  style={{
                    left: note.time * pixelsPerSecond,
                    bottom: (note.pitch - minPitch) * noteHeight,
                    width: Math.max(note.duration * pixelsPerSecond, 3),
                    height: noteHeight - 1,
                    backgroundColor: getNoteColor(note),
                    boxShadow: currentTime >= note.time && currentTime <= note.time + note.duration 
                      ? `0 0 8px ${getNoteColor(note)}`
                      : 'none',
                  }}
                />
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                style={{ left: currentTime * pixelsPerSecond }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center text-muted-foreground">
            <Music className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Выберите стем и создайте MIDI</p>
          </div>
        )}

        {/* Stats */}
        {notes.length > 0 && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{notes.length} нот</span>
            <span>•</span>
            <span>{Math.round(duration)}с</span>
            <span>•</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
