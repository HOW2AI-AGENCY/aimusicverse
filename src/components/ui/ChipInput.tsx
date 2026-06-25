/**
 * Chip Input Component
 * Feature: 032-professional-ui
 *
 * Tag/chip input with autocomplete support
 */

import React, { useState, useRef, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { X, Plus } from "@/lib/icons";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

interface ChipInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxChips?: number;
  allowCustom?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
}

export function ChipInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Добавить тег...",
  maxChips,
  allowCustom = true,
  disabled = false,
  error,
  label,
  className,
}: ChipInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions
    .filter((s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s))
    .slice(0, 5);

  const showSuggestions = isFocused && inputValue && filteredSuggestions.length > 0;

  const addChip = useCallback(
    (chip: string) => {
      const trimmed = chip.trim();
      if (!trimmed) return;
      if (value.includes(trimmed)) return;
      if (maxChips && value.length >= maxChips) return;

      triggerHapticFeedback("light");
      onChange([...value, trimmed]);
      setInputValue("");
    },
    [value, onChange, maxChips],
  );

  const removeChip = useCallback(
    (chipToRemove: string) => {
      triggerHapticFeedback("light");
      onChange(value.filter((chip) => chip !== chipToRemove));
    },
    [value, onChange],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (allowCustom && inputValue.trim()) {
        addChip(inputValue);
      } else if (filteredSuggestions.length > 0) {
        addChip(filteredSuggestions[0]);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeChip(value[value.length - 1]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addChip(suggestion);
    inputRef.current?.focus();
  };

  const canAddMore = !maxChips || value.length < maxChips;

  return (
    <div className={cn("relative", className)}>
      {label && <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>}

      {/* Input container */}
      <div
        className={cn(
          "flex flex-wrap gap-1.5 p-2 rounded-lg border bg-background",
          "min-h-[44px] cursor-text transition-all duration-200",
          isFocused && "ring-2 ring-primary/20 border-primary",
          error && "border-destructive ring-2 ring-destructive/20",
          disabled && "opacity-50 cursor-not-allowed bg-muted",
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Chips */}
        <AnimatePresence mode="popLayout">
          {value.map((chip) => (
            <motion.span
              key={chip}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              layout
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1",
                "bg-primary/10 text-primary rounded-md",
                "text-sm font-medium",
              )}
            >
              {chip}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(chip);
                  }}
                  className={cn("p-0.5 rounded-sm hover:bg-primary/20", "transition-colors focus:outline-none")}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Input */}
        {canAddMore && !disabled && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder={value.length === 0 ? placeholder : ""}
            className={cn(
              "flex-1 min-w-[100px] bg-transparent",
              "text-sm outline-none",
              "placeholder:text-muted-foreground",
            )}
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "absolute left-0 right-0 mt-1 z-20",
              "bg-popover border border-border rounded-lg shadow-lg",
              "overflow-hidden",
            )}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm",
                  "hover:bg-accent transition-colors",
                  "flex items-center gap-2",
                  index === 0 && "bg-accent/50",
                )}
              >
                <Plus className="w-3 h-3 text-muted-foreground" />
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && <p className="text-xs text-destructive mt-1 ml-1">{error}</p>}

      {/* Chip count */}
      {maxChips && (
        <p className={cn("text-xs text-muted-foreground mt-1 ml-1", value.length >= maxChips && "text-warning")}>
          {value.length}/{maxChips}
        </p>
      )}
    </div>
  );
}

/**
 * Preset Chip Selector
 * For selecting from predefined options
 */
interface ChipSelectorProps {
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ChipSelector({ options, value, onChange, multiple = true, size = "md", className }: ChipSelectorProps) {
  const handleSelect = (optionValue: string) => {
    triggerHapticFeedback("light");

    if (multiple) {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    } else {
      onChange(value.includes(optionValue) ? [] : [optionValue]);
    }
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = value.includes(option.value);

        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "inline-flex items-center rounded-full font-medium",
              "border transition-all duration-200",
              sizeClasses[size],
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50",
            )}
          >
            {option.icon}
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}

export default ChipInput;
