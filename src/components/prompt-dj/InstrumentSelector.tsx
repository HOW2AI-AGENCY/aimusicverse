/**
 * InstrumentSelector - Multi-select instrument picker (up to 4)
 */

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { INSTRUMENT_PRESETS, PresetItem } from '@/lib/prompt-dj-presets';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InstrumentSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxSelection?: number;
  disabled?: boolean;
}

export const InstrumentSelector = memo(function InstrumentSelector({
  selectedIds,
  onChange,
  maxSelection = 4,
  disabled,
}: InstrumentSelectorProps) {
  const selectedInstruments = INSTRUMENT_PRESETS.filter(i => selectedIds.includes(i.id));

  const handleToggle = useCallback((id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < maxSelection) {
      onChange([...selectedIds, id]);
    }
  }, [selectedIds, onChange, maxSelection]);

  const handleRemove = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(i => i !== id));
  }, [selectedIds, onChange]);

  return (
    <div className="p-3 rounded-xl bg-card/30 border border-border/30 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Инструменты</span>
        <span className="text-[10px] text-muted-foreground">
          {selectedIds.length}/{maxSelection}
        </span>
      </div>

      {/* Selected instruments display */}
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {selectedInstruments.length > 0 ? (
          selectedInstruments.map((inst) => (
            <Badge
              key={inst.id}
              variant="secondary"
              className="h-6 px-2 text-[10px] gap-1 bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
            >
              {inst.label}
              <button
                onClick={(e) => handleRemove(inst.id, e)}
                className="hover:text-white transition-colors"
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-[10px] text-muted-foreground italic">
            Выберите до {maxSelection} инструментов
          </span>
        )}
      </div>

      {/* Instrument picker popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs justify-start"
            disabled={disabled}
          >
            + Добавить инструмент
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <ScrollArea className="h-64">
            <div className="p-2 grid grid-cols-2 gap-1">
              {INSTRUMENT_PRESETS.map((inst) => {
                const isSelected = selectedIds.includes(inst.id);
                const isDisabled = !isSelected && selectedIds.length >= maxSelection;
                
                return (
                  <button
                    key={inst.id}
                    onClick={() => handleToggle(inst.id)}
                    disabled={isDisabled || disabled}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all',
                      isSelected 
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                        : 'bg-muted/20 hover:bg-muted/40',
                      isDisabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    <span className="truncate">{inst.label}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
});
