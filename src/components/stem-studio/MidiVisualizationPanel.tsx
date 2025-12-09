import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, Pause, ZoomIn, ZoomOut, Download, Save, 
  Trash2, Music, Loader2, RefreshCw, Grid3X3
} from 'lucide-react';
import { MidiPianoRoll } from './MidiPianoRoll';
import { useMidiVisualization } from '@/hooks/useMidiVisualization';
import { useTrackVersions } from '@/hooks/useTrackVersions';
import { useStemMidi } from '@/hooks/useStemMidi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface MidiVisualizationPanelProps {
  trackId: string;
  stems?: Array<{ id: string; stem_type: string; audio_url: string }>;
  currentTime: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
}

const SNAP_OPTIONS = [
  { value: 1, label: '1 такт' },
  { value: 0.5, label: '1/2' },
  { value: 0.25, label: '1/4' },
  { value: 0.125, label: '1/8' },
  { value: 0.0625, label: '1/16' },
  { value: 0, label: 'Свободно' },
];

const MODEL_OPTIONS = [
  { value: 'mt3', label: 'MT3 (Multi-Instrument)', description: 'Drums, bass, guitar, synth' },
  { value: 'bytedance-piano', label: 'ByteDance Piano', description: 'High-res piano с педалями', isNew: true },
  { value: 'ismir2021', label: 'ISMIR2021 (Piano)', description: 'Specialized for piano' },
  { value: 'basic-pitch', label: 'Basic Pitch', description: 'Vocals, melody, guitar' },
] as const;

export function MidiVisualizationPanel({
  trackId,
  stems = [],
  currentTime,
  isPlaying,
  onSeek,
}: MidiVisualizationPanelProps) {
  const [selectedStem, setSelectedStem] = useState<string>('full');
  const [zoom, setZoom] = useState(100);
  const [snapValue, setSnapValue] = useState(0.25);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'mt3' | 'ismir2021' | 'bytedance-piano' | 'basic-pitch'>('mt3');

  const {
    notes,
    tracks: midiTracks,
    duration,
    tempo,
    isLoading,
    error,
    selectedNotes,
    loadMidi,
    selectNote,
    clearSelection,
    moveNote,
    resizeNote,
    deleteNote,
    deleteSelectedNotes,
    addNote,
    exportMidi,
    hasChanges,
  } = useMidiVisualization();

  const { data: versions } = useTrackVersions(trackId);
  const { transcribeToMidi, isTranscribing } = useStemMidi(trackId);

  // Find MIDI versions
  const midiVersions = versions?.filter(v => 
    v.version_type === 'midi' || 
    v.version_type === 'midi_edited' ||
    v.audio_url?.endsWith('.mid') ||
    v.audio_url?.endsWith('.midi')
  ) || [];

  const stemMidiVersions = stems.map(stem => {
    const midiVersion = midiVersions.find(v => 
      v.version_label?.toLowerCase().includes(stem.stem_type.toLowerCase())
    );
    return { stem, midiVersion };
  });

  // Load MIDI when selection changes
  useEffect(() => {
    if (selectedStem === 'full') {
      const fullMidi = midiVersions.find(v => !v.version_label?.includes('_'));
      if (fullMidi?.audio_url) {
        loadMidi(fullMidi.audio_url);
      }
    } else {
      const stemMidi = stemMidiVersions.find(s => s.stem.id === selectedStem);
      if (stemMidi?.midiVersion?.audio_url) {
        loadMidi(stemMidi.midiVersion.audio_url);
      }
    }
  }, [selectedStem, midiVersions.length]);

  // Handle transcription with MT3 or selected model
  const handleTranscribe = useCallback(async () => {
    const stemToTranscribe = selectedStem === 'full' 
      ? null 
      : stems.find(s => s.id === selectedStem);

    if (stemToTranscribe) {
      await transcribeToMidi(
        stemToTranscribe.audio_url, 
        selectedModel, 
        stemToTranscribe.stem_type
      );
    } else {
      // Transcribe full track - need audio URL
      const { data: track } = await supabase
        .from('tracks')
        .select('audio_url, local_audio_url')
        .eq('id', trackId)
        .single();

      const audioUrl = track?.local_audio_url || track?.audio_url;
      if (audioUrl) {
        await transcribeToMidi(audioUrl, selectedModel, 'full');
      }
    }
  }, [selectedStem, stems, trackId, transcribeToMidi, selectedModel]);

  // Save edited MIDI
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setIsSaving(true);

    try {
      const midiBlob = exportMidi();
      const fileName = `midi_edited_${Date.now()}.mid`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(`midi/${trackId}/${fileName}`, midiBlob, {
          contentType: 'audio/midi',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(`midi/${trackId}/${fileName}`);

      // Create track version
      const { error: versionError } = await supabase
        .from('track_versions')
        .insert({
          track_id: trackId,
          audio_url: publicUrl,
          version_type: 'midi_edited',
          version_label: `MIDI Edited ${new Date().toLocaleDateString()}`,
        });

      if (versionError) throw versionError;

      toast.success('MIDI сохранён');
      logger.info('MIDI saved', { trackId, fileName });
    } catch (err) {
      logger.error('Failed to save MIDI', err);
      toast.error('Ошибка сохранения MIDI');
    } finally {
      setIsSaving(false);
    }
  }, [trackId, hasChanges, exportMidi]);

  // Download MIDI
  const handleDownload = useCallback(() => {
    const blob = exportMidi();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `track_${trackId}_midi.mid`;
    a.click();
    URL.revokeObjectURL(url);
  }, [trackId, exportMidi]);

  const pixelsPerSecond = zoom;
  const hasMidi = notes.length > 0;
  const canTranscribe = selectedStem === 'full' || stems.some(s => s.id === selectedStem);

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Stem/Track selector */}
        <Select value={selectedStem} onValueChange={setSelectedStem}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Выберите источник" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                Полный трек
              </div>
            </SelectItem>
            {stems.map(stem => {
              const hasMidiVersion = stemMidiVersions.find(s => s.stem.id === stem.id)?.midiVersion;
              return (
                <SelectItem key={stem.id} value={stem.id}>
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{stem.stem_type}</span>
                    {hasMidiVersion && (
                      <Badge variant="secondary" className="text-xs">MIDI</Badge>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(z => Math.max(50, z - 25))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">
            {zoom}%
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(z => Math.min(300, z + 25))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Snap selector */}
        <Select value={snapValue.toString()} onValueChange={v => setSnapValue(parseFloat(v))}>
          <SelectTrigger className="w-[100px]">
            <Grid3X3 className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SNAP_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Model selector */}
        <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as typeof selectedModel)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Выберите модель" />
          </SelectTrigger>
          <SelectContent>
            {MODEL_OPTIONS.map(model => (
              <SelectItem key={model.value} value={model.value}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span>{model.label}</span>
                    {'isNew' in model && model.isNew && (
                      <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">NEW</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* Actions */}
        {hasMidi ? (
          <>
            {selectedNotes.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedNotes}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить ({selectedNotes.size})
              </Button>
            )}
            {hasChanges && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Сохранить
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Скачать
            </Button>
          </>
        ) : canTranscribe && (
          <Button
            variant="default"
            onClick={handleTranscribe}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Транскрибировать
              </>
            )}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <p>Ошибка загрузки MIDI</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Попробовать снова
            </Button>
          </div>
        ) : !hasMidi ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <Music className="w-12 h-12 opacity-50" />
            <p>MIDI ноты не найдены</p>
            {canTranscribe && (
              <Button onClick={handleTranscribe} disabled={isTranscribing}>
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Транскрибирую...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Создать MIDI транскрипцию
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <MidiPianoRoll
            notes={notes}
            duration={duration}
            currentTime={currentTime}
            isPlaying={isPlaying}
            selectedNotes={selectedNotes}
            pixelsPerSecond={pixelsPerSecond}
            snapValue={snapValue}
            tempo={tempo}
            onNoteSelect={selectNote}
            onNoteMove={moveNote}
            onNoteResize={resizeNote}
            onNoteDelete={deleteNote}
            onNoteAdd={addNote}
            onSeek={onSeek}
          />
        )}
      </div>

      {/* Footer info */}
      {hasMidi && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{notes.length} нот</span>
          <span>{midiTracks.length} треков</span>
          <span>{tempo.toFixed(0)} BPM</span>
          <span>{duration.toFixed(1)}s</span>
          {hasChanges && (
            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
              Несохранённые изменения
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
