import { useMemo } from 'react';
import { motion } from '@/lib/motion';
import { Volume2, VolumeX, Headphones, Music2, FileMusic, FileText, Guitar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface Stem {
  id: string;
  stem_type: string;
  audio_url: string;
}

interface StemTranscription {
  id: string;
  stem_id: string;
  midi_url?: string | null;
  pdf_url?: string | null;
  gp5_url?: string | null;
  mxml_url?: string | null;
  notes?: any[] | null;
  notes_count?: number | null;
  bpm?: number | null;
  key_detected?: string | null;
}

interface StemsMobilePanelProps {
  stems: Stem[];
  stemStates: Record<string, StemState>;
  transcriptionsByStem?: Record<string, StemTranscription>;
  masterVolume: number;
  masterMuted: boolean;
  onStemToggle: (stemId: string, type: 'mute' | 'solo') => void;
  onVolumeChange: (stemId: string, volume: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onMasterMuteToggle: () => void;
}

const stemLabels: Record<string, { label: string; color: string }> = {
  vocals: { label: 'Вокал', color: 'text-pink-500' },
  vocal: { label: 'Вокал', color: 'text-pink-500' },
  voice: { label: 'Голос', color: 'text-pink-500' },
  lead_vocal: { label: 'Вокал', color: 'text-pink-500' },
  main_vocal: { label: 'Вокал', color: 'text-pink-500' },
  backing_vocals: { label: 'Бэк-вокал', color: 'text-pink-400' },
  drums: { label: 'Ударные', color: 'text-orange-500' },
  bass: { label: 'Бас', color: 'text-blue-500' },
  guitar: { label: 'Гитара', color: 'text-amber-500' },
  piano: { label: 'Пианино', color: 'text-indigo-500' },
  keyboard: { label: 'Клавишные', color: 'text-indigo-500' },
  synth: { label: 'Синтезатор', color: 'text-cyan-500' },
  strings: { label: 'Струнные', color: 'text-rose-500' },
  other: { label: 'Другое', color: 'text-green-500' },
  instrumental: { label: 'Инструментал', color: 'text-purple-500' },
};

export function StemsMobilePanel({
  stems,
  stemStates,
  transcriptionsByStem = {},
  masterVolume,
  masterMuted,
  onStemToggle,
  onVolumeChange,
  onMasterVolumeChange,
  onMasterMuteToggle,
}: StemsMobilePanelProps) {
  // Sort stems: vocals always first
  const sortedStems = useMemo(() => {
    const priority: Record<string, number> = {
      vocals: 0, vocal: 0, voice: 0, lead_vocal: 0, main_vocal: 0,
      backing_vocals: 1, backing_vocal: 1, harmonies: 1,
      instrumental: 2,
      bass: 3, drums: 4, guitar: 5, piano: 6, keyboard: 6,
      synth: 7, strings: 8, other: 99,
    };
    
    return [...stems].sort((a, b) => {
      const typeA = a.stem_type.toLowerCase();
      const typeB = b.stem_type.toLowerCase();
      
      const isVocalA = typeA.includes('vocal') || typeA === 'voice';
      const isVocalB = typeB.includes('vocal') || typeB === 'voice';
      
      if (isVocalA && !isVocalB) return -1;
      if (!isVocalA && isVocalB) return 1;
      
      const pA = priority[typeA] ?? 50;
      const pB = priority[typeB] ?? 50;
      return pA - pB;
    });
  }, [stems]);

  return (
    <div className="p-4 space-y-4">
      {/* Master Volume */}
      <div className="p-3 rounded-xl bg-card border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music2 className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-sm">Общая громкость</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMasterMuteToggle}
            className={cn("h-8 w-8 rounded-full", masterMuted && "text-destructive")}
          >
            {masterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
        <Slider
          value={[masterVolume * 100]}
          onValueChange={([v]) => onMasterVolumeChange(v / 100)}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* Stems List */}
      <div className="space-y-2">
        {sortedStems.map((stem, index) => {
          const state = stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 };
          const stemType = stem.stem_type.toLowerCase();
          const info = stemLabels[stemType] || { label: stem.stem_type, color: 'text-foreground' };
          const transcription = transcriptionsByStem[stem.id];
          const hasTranscription = transcription && (
            transcription.midi_url || 
            transcription.pdf_url || 
            transcription.gp5_url || 
            transcription.mxml_url ||
            transcription.notes_count
          );

          return (
            <motion.div
              key={stem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "p-3 rounded-xl bg-card border border-border/50 transition-colors",
                state.solo && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium text-sm", info.color)}>
                    {info.label}
                  </span>
                  {/* Transcription badges */}
                  {hasTranscription && (
                    <div className="flex gap-1">
                      {transcription.midi_url && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-0.5">
                          <FileMusic className="w-3 h-3" />
                          MIDI
                        </Badge>
                      )}
                      {transcription.pdf_url && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-0.5">
                          <FileText className="w-3 h-3" />
                          PDF
                        </Badge>
                      )}
                      {transcription.gp5_url && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-0.5">
                          <Guitar className="w-3 h-3" />
                          GP
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={state.muted ? "destructive" : "ghost"}
                    size="icon"
                    onClick={() => onStemToggle(stem.id, 'mute')}
                    className="h-8 w-8 rounded-full"
                  >
                    {state.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant={state.solo ? "default" : "ghost"}
                    size="icon"
                    onClick={() => onStemToggle(stem.id, 'solo')}
                    className="h-8 w-8 rounded-full"
                  >
                    <Headphones className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[state.volume * 100]}
                onValueChange={([v]) => onVolumeChange(stem.id, v / 100)}
                max={100}
                step={1}
                disabled={state.muted}
                className={cn("w-full", state.muted && "opacity-50")}
              />
              {/* Metadata row */}
              {hasTranscription && (transcription.bpm || transcription.key_detected) && (
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  {transcription.bpm && (
                    <span className="bg-muted/50 px-1.5 py-0.5 rounded">
                      {transcription.bpm} BPM
                    </span>
                  )}
                  {transcription.key_detected && (
                    <span className="bg-muted/50 px-1.5 py-0.5 rounded">
                      {transcription.key_detected}
                    </span>
                  )}
                  {transcription.notes_count && (
                    <span className="bg-muted/50 px-1.5 py-0.5 rounded">
                      {transcription.notes_count} нот
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
