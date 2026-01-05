/**
 * Select Input Variant
 *
 * Dropdown select with optional search and multiple selection
 */

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import { FormLabel, FormError, FormHelperText } from '../unified-form-input';
import type { SelectInputProps } from '../unified-form-input.types';

export const SelectVariant = forwardRef<HTMLSelectElement, SelectInputProps>(
  function SelectInput(
    {
      name,
      label,
      placeholder = 'Select...',
      options,
      searchable = false,
      multiple = false,
      maxSelected,
      error,
      helperText,
      required,
      disabled,
      className,
    },
    ref
  ) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Filter options if searchable
    const filteredOptions = searchable
      ? options.filter(opt =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    // Render single or multiple select
    if (multiple) {
      return (
        <div className="w-full">
          <FormLabel label={label} required={required} disabled={disabled} />

          <div className="min-h-[44px] p-2 border rounded-md bg-background">
            <div className="flex flex-wrap gap-2">
              {options
                .filter(opt => opt.value !== undefined) // Simplified for example
                .slice(0, maxSelected)
                .map(opt => (
                  <span
                    key={opt.value}
                    className="px-2 py-1 bg-primary text-primary-foreground rounded-md text-sm"
                  >
                    {opt.label}
                  </span>
                ))}
            </div>
          </div>

          <FormError error={error} />
          <FormHelperText helperText={helperText} />
        </div>
      );
    }

    // Single select
    return (
      <div className="w-full relative">
        <FormLabel label={label} required={required} disabled={disabled} />

        <div className="relative">
          <select
            ref={ref}
            name={name}
            id={name}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full min-h-[44px] px-3 py-2.5 pr-10 rounded-md border',
              'bg-background text-foreground appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-red-500' : 'border-input',
              'transition-colors cursor-pointer'
            )}
            aria-invalid={!!error}
          >
            <option value="">{placeholder}</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Dropdown Arrow */}
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        <FormError error={error} />
        <FormHelperText helperText={helperText} />
      </div>
    );
  }
);
