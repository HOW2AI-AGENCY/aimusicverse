/**
 * KnobCell - Memoized knob cell for PromptDJ grid
 * Prevents re-renders when other channels change
 */

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PromptKnobEnhanced } from './PromptKnobEnhanced';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { CHANNEL_TYPES, ChannelType, PromptChannel } from '@/hooks/usePromptDJEnhanced';

interface KnobCellProps {
  channel: PromptChannel;
  isSelected: boolean;
  isActive: boolean;
  size: 'sm' | 'md' | 'lg';
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<PromptChannel>) => void;
  onTypeChange: (id: string, type: ChannelType) => void;
}

// Get channel config by type
const getChannelConfig = (type: ChannelType) => {
  return CHANNEL_TYPES.find(c => c.type === type) || CHANNEL_TYPES[0];
};

export const KnobCell = memo(function KnobCell({
  channel,
  isSelected,
  isActive,
  size,
  onSelect,
  onUpdate,
  onTypeChange,
}: KnobCellProps) {
  const config = getChannelConfig(channel.type);
  
  // Stable callbacks
  const handleWeightChange = useCallback((val: number) => {
    onUpdate(channel.id, { weight: val });
  }, [channel.id, onUpdate]);
  
  const handleLabelClick = useCallback(() => {
    onSelect(channel.id);
  }, [channel.id, onSelect]);
  
  const handleOpenChange = useCallback((open: boolean) => {
    onSelect(open ? channel.id : null);
  }, [channel.id, onSelect]);
  
  const handlePresetSelect = useCallback((preset: string) => {
    onUpdate(channel.id, { value: preset, enabled: true });
    onSelect(null);
  }, [channel.id, onUpdate, onSelect]);
  
  const handleToggleEnabled = useCallback(() => {
    onUpdate(channel.id, { enabled: !channel.enabled });
  }, [channel.id, channel.enabled, onUpdate]);
  
  const handleTypeChangeClick = useCallback((newType: ChannelType) => {
    onTypeChange(channel.id, newType);
  }, [channel.id, onTypeChange]);

  return (
    <div className="flex flex-col items-center">
      <DropdownMenu 
        open={isSelected} 
        onOpenChange={handleOpenChange}
      >
        <DropdownMenuTrigger asChild>
          <div>
            <PromptKnobEnhanced
              value={channel.weight}
              label={channel.value || config.label}
              sublabel={channel.value ? config.label : undefined}
              color={config.color}
              enabled={channel.enabled}
              isActive={isActive && channel.enabled && channel.weight > 0}
              size={size}
              onChange={handleWeightChange}
              onLabelClick={handleLabelClick}
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="max-h-72 overflow-y-auto bg-popover">
          {/* Change type submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-xs">
              🎛️ Тип: {config.label}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-60 overflow-y-auto bg-popover">
              {CHANNEL_TYPES.map((typeConfig) => (
                <DropdownMenuItem
                  key={typeConfig.type}
                  onClick={() => handleTypeChangeClick(typeConfig.type)}
                  className={cn(
                    'text-xs',
                    channel.type === typeConfig.type && 'bg-accent'
                  )}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: typeConfig.color }} 
                  />
                  {typeConfig.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">{config.label}</DropdownMenuLabel>
          
          {/* Presets for current type */}
          {config.presets.length > 0 ? (
            config.presets.map((preset) => (
              <DropdownMenuItem
                key={preset}
                onClick={() => handlePresetSelect(preset)}
                className="text-xs"
              >
                {preset}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
              Введите своё значение
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleToggleEnabled}
            className="text-xs"
          >
            {channel.enabled ? '🔇 Выключить' : '🔊 Включить'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.channel.id === nextProps.channel.id &&
    prevProps.channel.type === nextProps.channel.type &&
    prevProps.channel.value === nextProps.channel.value &&
    prevProps.channel.weight === nextProps.channel.weight &&
    prevProps.channel.enabled === nextProps.channel.enabled &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.size === nextProps.size
  );
});
