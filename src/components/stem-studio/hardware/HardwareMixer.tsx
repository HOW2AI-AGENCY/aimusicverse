/**
 * HardwareMixer - Full mixer with channel strips and master section
 */

import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { HardwareChannelStrip } from './HardwareChannelStrip';
import { MasterSection } from './MasterSection';
import { Mic2, Drum, Guitar, Music2, Layers } from 'lucide-react';
import type { StemState } from '@/hooks/studio/types';

// Stem type icons
const stemIcons: Record<string, React.ReactNode> = {
  vocals: <Mic2 className="w-3 h-3" />,
  drums: <Drum className="w-3 h-3" />,
  bass: <Guitar className="w-3 h-3" />,
  other: <Music2 className="w-3 h-3" />,
  instrumental: <Layers className="w-3 h-3" />,
};

const stemColors: Record<string, string> = {
  vocals: 'primary',
  drums: 'warning',
  bass: 'success',
  other: 'generate',
  instrumental: 'library',
};

export interface StemData {
  id: string;
  name: string;
  type: string;
  level?: number;
}

export interface HardwareMixerProps {
  stems: StemData[];
  stemStates: Record<string, StemState>;
  masterVolume: number;
  masterMuted: boolean;
  masterLeftLevel?: number;
  masterRightLevel?: number;
  onStemVolumeChange: (stemId: string, volume: number) => void;
  onStemMuteToggle: (stemId: string) => void;
  onStemSoloToggle: (stemId: string) => void;
  onMasterVolumeChange: (volume: number) => void;
  onMasterMuteToggle: () => void;
  onStemEffectsClick?: (stemId: string) => void;
  compact?: boolean;
  className?: string;
}

export const HardwareMixer = memo(function HardwareMixer({
  stems,
  stemStates,
  masterVolume,
  masterMuted,
  masterLeftLevel = 0,
  masterRightLevel = 0,
  onStemVolumeChange,
  onStemMuteToggle,
  onStemSoloToggle,
  onMasterVolumeChange,
  onMasterMuteToggle,
  onStemEffectsClick,
  compact = false,
  className,
}: HardwareMixerProps) {
  // Check if any stem is soloed
  const hasSolo = useMemo(() => 
    Object.values(stemStates).some(s => s.solo),
    [stemStates]
  );

  return (
    <div className={cn(
      'flex gap-2 p-3 rounded-xl',
      'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black',
      'border border-zinc-700',
      'shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.5)]',
      'overflow-x-auto',
      className
    )}>
      {/* Channel strips */}
      <div className={cn(
        'flex gap-2',
        compact ? 'gap-1' : 'gap-2'
      )}>
        {stems.map((stem) => {
          const state = stemStates[stem.id] || { volume: 80, muted: false, solo: false };
          const icon = stemIcons[stem.type] || <Music2 className="w-3 h-3" />;
          const color = stemColors[stem.type] || 'primary';
          
          // Calculate effective level based on solo state
          const effectiveLevel = hasSolo && !state.solo && !state.muted
            ? 0  // Dim if another stem is soloed
            : stem.level || 0;

          return (
            <HardwareChannelStrip
              key={stem.id}
              name={stem.name}
              icon={icon}
              color={color}
              volume={state.volume}
              muted={state.muted}
              solo={state.solo}
              level={effectiveLevel}
              hasEffects={true}
              onVolumeChange={(v) => onStemVolumeChange(stem.id, v)}
              onMuteToggle={() => onStemMuteToggle(stem.id)}
              onSoloToggle={() => onStemSoloToggle(stem.id)}
              onEffectsClick={() => onStemEffectsClick?.(stem.id)}
              compact={compact}
            />
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px bg-zinc-700 mx-1" />

      {/* Master section */}
      <MasterSection
        volume={masterVolume}
        muted={masterMuted}
        leftLevel={masterLeftLevel}
        rightLevel={masterRightLevel}
        onVolumeChange={onMasterVolumeChange}
        onMuteToggle={onMasterMuteToggle}
        compact={compact}
      />
    </div>
  );
});

export default HardwareMixer;
