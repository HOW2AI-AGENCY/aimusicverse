/**
 * MobileMixerTab - Stem mixer for mobile
 *
 * Features:
 * - Volume/Mute/Solo controls for each stem
 * - Master volume
 * - Touch-optimized sliders
 */

import { useState } from 'react';
import { Sliders, Volume2, VolumeX, Mic, Mic2, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStudioData } from '@/hooks/useStudioData';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface MobileMixerTabProps {
  trackId?: string;
  mode: 'track' | 'project';
}

interface StemState {
  volume: number;
  muted: boolean;
  solo: boolean;
}

export default function MobileMixerTab({ trackId, mode }: MobileMixerTabProps) {
  const { stems, sortedStems } = useStudioData(trackId || '');

  const [stemStates, setStemStates] = useState<Record<string, StemState>>({});
  const [masterVolume, setMasterVolume] = useState(0.85);
  const [masterMuted, setMasterMuted] = useState(false);

  // Initialize stem states
  const getStemState = (stemId: string): StemState => {
    return stemStates[stemId] || { volume: 0.85, muted: false, solo: false };
  };

  const updateStemState = (stemId: string, updates: Partial<StemState>) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: { ...getStemState(stemId), ...updates }
    }));
  };

  const toggleMute = (stemId: string) => {
    const state = getStemState(stemId);
    updateStemState(stemId, { muted: !state.muted });
  };

  const toggleSolo = (stemId: string) => {
    const state = getStemState(stemId);
    const wasSolo = state.solo;

    // If activating solo, disable solo on all other stems
    if (!wasSolo) {
      const newStates = { ...stemStates };
      Object.keys(newStates).forEach(id => {
        if (id !== stemId) {
          newStates[id] = { ...newStates[id], solo: false };
        }
      });
      setStemStates(newStates);
    }

    updateStemState(stemId, { solo: !wasSolo });
  };

  if (mode === 'track' && !stems) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stems || stems.length === 0) {
    return (
      <div className="p-4">
        <Alert>
          <AlertDescription className="text-xs">
            Сначала разделите трек на стемы, чтобы использовать микшер.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            Микшер
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stems.length} стемов
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // TODO: Add track
          }}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Трек
        </Button>
      </div>

      {/* Master Volume */}
      <div className="p-4 bg-card rounded-lg border border-border/50">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMasterMuted(!masterMuted)}
            className="h-10 w-10 rounded-full shrink-0"
          >
            {masterMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Master</span>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[masterVolume]}
              max={1}
              step={0.01}
              onValueChange={(val) => setMasterVolume(val[0])}
              disabled={masterMuted}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Stem Tracks */}
      <div className="space-y-3">
        {sortedStems?.map((stem, index) => {
          const state = getStemState(stem.id);
          const hasSolo = Object.values(stemStates).some(s => s.solo);

          return (
            <motion.div
              key={stem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "p-4 rounded-lg border",
                state.solo
                  ? "bg-primary/5 border-primary/50"
                  : state.muted || (hasSolo && !state.solo)
                  ? "bg-muted/50 border-border/30 opacity-60"
                  : "bg-card border-border/50"
              )}
            >
              {/* Stem Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {stem.stem_type === 'vocal' || stem.stem_type === 'vocals' ? (
                    <Mic2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize truncate">
                    {stem.stem_type}
                  </p>
                  <Badge variant="secondary" className="text-[9px] h-4 mt-0.5">
                    Stem
                  </Badge>
                </div>

                {/* Mute/Solo */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant={state.muted ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMute(stem.id)}
                    className={cn(
                      "h-7 w-7 p-0",
                      state.muted && "bg-destructive hover:bg-destructive/90"
                    )}
                  >
                    M
                  </Button>
                  <Button
                    variant={state.solo ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSolo(stem.id)}
                    className={cn(
                      "h-7 w-7 p-0",
                      state.solo && "bg-primary hover:bg-primary/90"
                    )}
                  >
                    S
                  </Button>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleMute(stem.id)}
                  className="h-8 w-8 shrink-0"
                >
                  {state.muted ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </Button>

                <div className="flex-1">
                  <Slider
                    value={[state.volume]}
                    max={1}
                    step={0.01}
                    onValueChange={(val) => updateStemState(stem.id, { volume: val[0] })}
                    disabled={state.muted}
                    className="w-full"
                  />
                </div>

                <span className="text-xs font-mono text-muted-foreground w-10 text-right shrink-0">
                  {Math.round(state.volume * 100)}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setStemStates({});
          setMasterVolume(0.85);
          setMasterMuted(false);
        }}
      >
        Сбросить микшер
      </Button>
    </div>
  );
}
