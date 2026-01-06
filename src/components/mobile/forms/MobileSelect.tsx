/**
 * MobileSelect - Mobile-optimized select with bottom sheet picker
 * Better UX than native select on mobile
 */

import { memo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { MobileBottomSheet } from '../MobileBottomSheet';
import { Button } from '@/components/ui/button';

export interface MobileSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface MobileSelectProps {
  /** Current value */
  value: string;
  /** Value change handler */
  onChange: (value: string) => void;
  /** Available options */
  options: MobileSelectOption[];
  /** Placeholder */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

export const MobileSelect = memo(function MobileSelect({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  disabled = false,
  className,
}: MobileSelectProps) {
  const { patterns } = useHaptic();
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    patterns.select();
    onChange(optionValue);
    setOpen(false);
  };

  const handleOpen = () => {
    if (disabled) return;
    patterns.tap();
    setOpen(true);
  };

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between gap-2",
          "h-11 px-4 rounded-lg",
          "bg-secondary/50 border border-border/50",
          "text-sm font-medium text-left",
          "transition-colors touch-manipulation",
          !disabled && "active:bg-secondary hover:bg-secondary",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className={cn(
            "truncate",
            !selectedOption && "text-muted-foreground"
          )}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {/* Bottom Sheet Picker */}
      <MobileBottomSheet
        open={open}
        onOpenChange={setOpen}
        snapPoints={[0.6]}
      >
        <div className="p-4">
          <h3 className="text-base font-semibold mb-4">
            {placeholder}
          </h3>
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full flex items-center justify-between gap-3",
                  "p-3 rounded-lg text-left",
                  "transition-colors touch-manipulation",
                  "hover:bg-accent active:bg-accent/80",
                  option.value === value && "bg-accent"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {option.icon && (
                    <span className="shrink-0">{option.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {option.label}
                    </p>
                    {option.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
                {option.value === value && (
                  <Check className="w-5 h-5 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </MobileBottomSheet>
    </>
  );
});

export default MobileSelect;
