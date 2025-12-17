/**
 * EssentialsKnobGrid - Compact 4-knob grid (Genre, Instrument, Mood, Energy)
 * With toggle to show all 9 knobs
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KnobCell } from './KnobCell';
import type { PromptChannel, ChannelType } from '@/hooks/usePromptDJEnhanced';
import { useIsMobile } from '@/hooks/use-mobile';

interface EssentialsKnobGridProps {
  channels: PromptChannel[];
  isActive: boolean;
  selectedChannel: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<PromptChannel>) => void;
  onTypeChange: (id: string, type: ChannelType) => void;
  onChangeStart?: () => void;
  onChangeEnd?: () => void;
}

// Essential channel types that should be shown in compact mode
const ESSENTIAL_TYPES: ChannelType[] = ['genre', 'instrument', 'mood', 'energy'];

export const EssentialsKnobGrid = memo(function EssentialsKnobGrid({
  channels,
  isActive,
  selectedChannel,
  onSelect,
  onUpdate,
  onTypeChange,
  onChangeStart,
  onChangeEnd,
}: EssentialsKnobGridProps) {
  const [showAll, setShowAll] = useState(false);
  const isMobile = useIsMobile();

  // Get essential channels (first 4 matching essential types)
  const essentialChannels = channels.filter(ch => 
    ESSENTIAL_TYPES.includes(ch.type)
  ).slice(0, 4);

  // Get advanced channels (remaining)
  const advancedChannels = channels.filter(ch => 
    !essentialChannels.includes(ch)
  );

  const knobSize = isMobile ? 'sm' : 'md';

  return (
    <div className="space-y-3">
      {/* Essential knobs - always visible */}
      <div className={cn(
        'grid gap-3 p-3 rounded-xl bg-card/30 border border-border/30',
        'grid-cols-4'
      )}>
        {essentialChannels.map((channel) => (
          <KnobCell
            key={channel.id}
            channel={channel}
            isSelected={selectedChannel === channel.id}
            isActive={isActive}
            size={knobSize}
            onSelect={onSelect}
            onUpdate={onUpdate}
            onTypeChange={onTypeChange}
            onChangeStart={onChangeStart}
            onChangeEnd={onChangeEnd}
          />
        ))}
      </div>

      {/* Toggle for advanced knobs */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-8 text-xs text-muted-foreground"
        onClick={() => setShowAll(!showAll)}
      >
        <Sliders className="w-3 h-3 mr-1.5" />
        {showAll ? 'Скрыть' : 'Расширенные'} ({advancedChannels.length})
        {showAll ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
      </Button>

      {/* Advanced knobs - collapsible */}
      <AnimatePresence>
        {showAll && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={cn(
              'grid gap-3 p-3 rounded-xl bg-card/20 border border-border/20',
              isMobile ? 'grid-cols-3' : 'grid-cols-5'
            )}>
              {advancedChannels.map((channel) => (
                <KnobCell
                  key={channel.id}
                  channel={channel}
                  isSelected={selectedChannel === channel.id}
                  isActive={isActive}
                  size={knobSize}
                  onSelect={onSelect}
                  onUpdate={onUpdate}
                  onTypeChange={onTypeChange}
                  onChangeStart={onChangeStart}
                  onChangeEnd={onChangeEnd}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
