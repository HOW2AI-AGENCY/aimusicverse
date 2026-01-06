/**
 * MobileSearchBar - Mobile-optimized search with keyboard handling
 * Features: auto-focus, clear button, safe area support
 */

import { memo, useState, useRef, useEffect, forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MobileSearchBarProps {
  /** Search value */
  value: string;
  /** Value change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Show cancel button (iOS style) */
  showCancel?: boolean;
  /** Cancel handler */
  onCancel?: () => void;
  /** Additional className */
  className?: string;
}

export const MobileSearchBar = memo(forwardRef<HTMLInputElement, MobileSearchBarProps>(
  function MobileSearchBar({
    value,
    onChange,
    placeholder = 'Поиск...',
    autoFocus = false,
    showCancel = false,
    onCancel,
    className,
  }, ref) {
    const { patterns } = useHaptic();
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle keyboard visibility
    useEffect(() => {
      if (!inputRef.current) return;

      const handleFocus = () => setIsFocused(true);
      const handleBlur = () => setIsFocused(false);

      inputRef.current.addEventListener('focus', handleFocus);
      inputRef.current.addEventListener('blur', handleBlur);

      return () => {
        inputRef.current?.removeEventListener('focus', handleFocus);
        inputRef.current?.removeEventListener('blur', handleBlur);
      };
    }, []);

    const handleClear = () => {
      patterns.tap();
      onChange('');
      inputRef.current?.focus();
    };

    const handleCancel = () => {
      patterns.tap();
      onChange('');
      inputRef.current?.blur();
      onCancel?.();
    };

    return (
      <div className={cn("flex items-center gap-2 w-full", className)}>
        <div className="relative flex-1">
          {/* Search Icon */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

          {/* Input */}
          <Input
            ref={ref || inputRef}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={cn(
              "h-11 pl-10 pr-10 rounded-full",
              "bg-secondary/50 border-0",
              "placeholder:text-muted-foreground/60",
              "focus-visible:ring-2 focus-visible:ring-primary/30",
              "transition-all duration-200",
              isFocused && "bg-secondary"
            )}
          />

          {/* Clear Button */}
          {value && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Cancel Button (iOS style) */}
        {showCancel && isFocused && (
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-sm font-medium text-primary shrink-0"
          >
            Отмена
          </Button>
        )}
      </div>
    );
  }
));

export default MobileSearchBar;
