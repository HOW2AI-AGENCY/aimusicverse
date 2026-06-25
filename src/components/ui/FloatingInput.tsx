/**
 * Floating Label Input Component
 * Feature: 032-professional-ui
 *
 * Material-style floating label with smooth animations
 */

import React, { useState, forwardRef, InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Check, AlertCircle, Eye, EyeOff } from "lucide-react";

interface FloatingInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  error?: string;
  success?: boolean;
  hint?: string;
  size?: "sm" | "md" | "lg";
  showPasswordToggle?: boolean;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      size = "md",
      className,
      type = "text",
      showPasswordToggle,
      disabled,
      value,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const hasValue = value !== undefined && value !== "";
    const isFloating = isFocused || hasValue;
    const isPassword = type === "password";

    const sizeClasses = {
      sm: "h-10 text-sm",
      md: "h-12 text-base",
      lg: "h-14 text-lg",
    };

    const labelSizeClasses = {
      sm: isFloating ? "text-[10px] top-1" : "text-sm top-1/2 -translate-y-1/2",
      md: isFloating ? "text-xs top-1.5" : "text-base top-1/2 -translate-y-1/2",
      lg: isFloating ? "text-xs top-2" : "text-lg top-1/2 -translate-y-1/2",
    };

    const inputPaddingTop = {
      sm: "pt-4",
      md: "pt-5",
      lg: "pt-6",
    };

    return (
      <div className={cn("relative", className)}>
        <div className="relative">
          <input
            ref={ref}
            type={isPassword && showPassword ? "text" : type}
            value={value}
            disabled={disabled}
            className={cn(
              "w-full rounded-lg border bg-background",
              "px-4 pb-2 outline-none transition-all duration-200",
              inputPaddingTop[size],
              sizeClasses[size],
              // States
              isFocused && "ring-2 ring-primary/20 border-primary",
              error && "border-destructive ring-2 ring-destructive/20",
              success && "border-success",
              disabled && "opacity-50 cursor-not-allowed bg-muted",
              // Password padding
              isPassword && showPasswordToggle && "pr-12",
            )}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />

          {/* Floating label */}
          <motion.label
            className={cn(
              "absolute left-4 pointer-events-none",
              "transition-all duration-200 origin-left",
              labelSizeClasses[size],
              isFocused ? "text-primary" : "text-muted-foreground",
              error && "text-destructive",
              success && !isFocused && "text-success",
            )}
            animate={{
              scale: isFloating ? 0.85 : 1,
              y: isFloating ? 0 : 0,
            }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.label>

          {/* Password toggle */}
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "p-1.5 rounded-md",
                "text-muted-foreground hover:text-foreground",
                "transition-colors",
              )}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Status icon */}
          {!isPassword && (success || error) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {success && <Check className="w-4 h-4 text-success" />}
              {error && <AlertCircle className="w-4 h-4 text-destructive" />}
            </motion.div>
          )}
        </div>

        {/* Error/Hint message */}
        <AnimatePresence mode="wait">
          {(error || hint) && (
            <motion.p
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className={cn("text-xs mt-1 ml-1", error ? "text-destructive" : "text-muted-foreground")}
            >
              {error || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

FloatingInput.displayName = "FloatingInput";

/**
 * Floating Textarea Component
 */
interface FloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  success?: boolean;
  hint?: string;
  maxLength?: number;
  showCount?: boolean;
}

export const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ label, error, success, hint, maxLength, showCount, className, value, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== "";
    const isFloating = isFocused || hasValue;
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className={cn("relative", className)}>
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            maxLength={maxLength}
            className={cn(
              "w-full min-h-[120px] rounded-lg border bg-background",
              "px-4 pt-6 pb-3 outline-none transition-all duration-200",
              "resize-y",
              isFocused && "ring-2 ring-primary/20 border-primary",
              error && "border-destructive ring-2 ring-destructive/20",
              success && "border-success",
            )}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />

          {/* Floating label */}
          <motion.label
            className={cn(
              "absolute left-4 pointer-events-none",
              "transition-all duration-200 origin-left",
              isFloating ? "text-xs top-2" : "text-base top-4",
              isFocused ? "text-primary" : "text-muted-foreground",
              error && "text-destructive",
            )}
            animate={{
              scale: isFloating ? 0.85 : 1,
            }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.label>
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-1 px-1">
          <AnimatePresence mode="wait">
            {(error || hint) && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}
              >
                {error || hint}
              </motion.p>
            )}
          </AnimatePresence>

          {showCount && maxLength && (
            <p className={cn("text-xs ml-auto", charCount >= maxLength ? "text-destructive" : "text-muted-foreground")}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);

FloatingTextarea.displayName = "FloatingTextarea";

export default FloatingInput;
