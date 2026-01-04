import { motion } from '@/lib/motion';
import { Volume2, VolumeX, Headphones, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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

interface StemsMobilePanelProps {
  stems: Stem[];
  stemStates: Record<string, StemState>;
  masterVolume: number;
  masterMuted: boolean;
  onStemToggle: (stemId: string, type: 'mute' | 'solo') => void;
  onVolumeChange: (stemId: string, volume: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onMasterMuteToggle: () => void;
}

const stemLabels: Record<string, { label: string; color: string }> = {
  vocals: { label: 'Вокал', color: 'text-pink-500' },
  drums: { label: 'Ударные', color: 'text-orange-500' },
  bass: { label: 'Бас', color: 'text-blue-500' },
  other: { label: 'Другое', color: 'text-green-500' },
  instrumental: { label: 'Инструментал', color: 'text-purple-500' },
};

export function StemsMobilePanel({
  stems,
  stemStates,
  masterVolume,
  masterMuted,
  onStemToggle,
  onVolumeChange,
  onMasterVolumeChange,
  onMasterMuteToggle,
}: StemsMobilePanelProps) {
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
        {stems.map((stem, index) => {
          const state = stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 };
          const info = stemLabels[stem.stem_type] || { label: stem.stem_type, color: 'text-foreground' };

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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
