/**
 * MobileStemMixer - Mobile-optimized stem mixing panel
 * 
 * Displays vertical list of MobileStemCards with master volume
 */

import { Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { MobileStemCard } from './MobileStemCard';
import type { Tables } from '@/integrations/supabase/types';

interface StemState {
  volume: number;
  muted: boolean;
  solo: boolean;
}

interface MobileStemMixerProps {
  stems: Tables<'track_stems'>[];
  stemStates: Record<string, StemState>;
  masterVolume: number;
  onStemVolumeChange: (stemId: string, volume: number) => void;
  onStemMuteToggle: (stemId: string) => void;
  onStemSoloToggle: (stemId: string) => void;
  onMasterVolumeChange: (volume: number) => void;
}

export function MobileStemMixer({
  stems,
  stemStates,
  masterVolume,
  onStemVolumeChange,
  onStemMuteToggle,
  onStemSoloToggle,
  onMasterVolumeChange,
}: MobileStemMixerProps) {
  const anySoloActive = Object.values(stemStates).some(s => s.solo);

  return (
    <div className="p-4 space-y-4">
      {/* Master Volume */}
      <div className="p-3 rounded-xl border border-border/50 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary flex-shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Мастер</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[masterVolume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) => onMasterVolumeChange(v)}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Stem Cards */}
      <div className="space-y-2">
        {stems.map((stem) => {
          const state = stemStates[stem.id] || { volume: 1, muted: false, solo: false };
          
          return (
            <MobileStemCard
              key={stem.id}
              stem={stem}
              volume={state.volume}
              muted={state.muted}
              solo={state.solo}
              anySoloActive={anySoloActive}
              onVolumeChange={(v) => onStemVolumeChange(stem.id, v)}
              onMuteToggle={() => onStemMuteToggle(stem.id)}
              onSoloToggle={() => onStemSoloToggle(stem.id)}
            />
          );
        })}
      </div>
      
      {stems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Стемы не найдены</p>
        </div>
      )}
    </div>
  );
}
