/**
 * PromptKnob - Rotary knob with editable prompt label
 * Inspired by Google PromptDJ MIDI
 */

import { memo, useRef, useCallback, useState } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface PromptKnobProps {
  value: number; // 0-1 weight
  label: string; // Editable prompt text
  color: string;
  enabled: boolean;
  isActive?: boolean;
  onChange: (value: number) => void;
  onLabelChange: (label: string) => void;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const PromptKnob = memo(function PromptKnob({
  value,
  label,
  color,
  enabled,
  isActive = false,
  onChange,
  onLabelChange,
  onToggle,
  size = 'md',
}: PromptKnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  // Size variants
  const sizeConfig = {
    sm: { knob: 'w-16 h-16', ring: 24, text: 'text-[10px]', label: 'w-20 text-[10px]' },
    md: { knob: 'w-20 h-20', ring: 30, text: 'text-xs', label: 'w-24 text-xs' },
    lg: { knob: 'w-24 h-24', ring: 36, text: 'text-sm', label: 'w-28 text-sm' },
  }[size];

  // Convert value to rotation angle (0-270 degrees, starting from bottom-left)
  const angle = value * 270 - 135;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [enabled, value]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = startYRef.current - e.clientY;
    const sensitivity = 0.004;
    const newValue = Math.max(0, Math.min(1, startValueRef.current + deltaY * sensitivity));
    onChange(newValue);
  }, [isDragging, onChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleLabelClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleLabelBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const newLabel = e.target.value.trim();
    if (newLabel) onLabelChange(newLabel);
    setIsEditing(false);
  }, [onLabelChange]);

  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newLabel = e.currentTarget.value.trim();
      if (newLabel) onLabelChange(newLabel);
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, [onLabelChange]);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Knob */}
      <motion.div
        className={cn(
          'relative rounded-full cursor-pointer',
          sizeConfig.knob,
          !enabled && 'opacity-40 cursor-not-allowed'
        )}
        style={{
          background: enabled
            ? `radial-gradient(circle at 30% 30%, hsl(var(--card)), hsl(var(--muted)))`
            : 'hsl(var(--muted))',
          boxShadow: enabled
            ? isActive
              ? `0 0 30px ${color}, 0 0 60px ${color}40, inset 0 2px 4px rgba(255,255,255,0.1)`
              : `0 0 ${value * 20 + 5}px ${color}30, inset 0 2px 4px rgba(255,255,255,0.1)`
            : 'inset 0 2px 4px rgba(0,0,0,0.2)',
        }}
        animate={{
          scale: isActive && enabled ? [1, 1.02, 1] : 1,
        }}
        transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Outer ring track */}
        <svg className="absolute inset-0 w-full h-full -rotate-[135deg]">
          {/* Background track */}
          <circle
            cx="50%"
            cy="50%"
            r={sizeConfig.ring}
            fill="none"
            stroke="hsl(var(--muted-foreground) / 0.15)"
            strokeWidth="3"
            strokeDasharray={`${0.75 * 2 * Math.PI * sizeConfig.ring} ${2 * Math.PI * sizeConfig.ring}`}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <motion.circle
            cx="50%"
            cy="50%"
            r={sizeConfig.ring}
            fill="none"
            stroke={enabled ? color : 'hsl(var(--muted-foreground))'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${value * 0.75 * 2 * Math.PI * sizeConfig.ring} ${2 * Math.PI * sizeConfig.ring}`}
            style={{
              filter: enabled ? `drop-shadow(0 0 4px ${color})` : 'none',
            }}
          />
        </svg>

        {/* Center indicator dot */}
        <motion.div
          className="absolute inset-3 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)',
          }}
        >
          {/* Rotation indicator line */}
          <motion.div
            className="absolute w-0.5 h-[40%] rounded-full top-1"
            style={{ 
              backgroundColor: enabled ? color : 'hsl(var(--muted-foreground))',
              transformOrigin: 'center bottom',
            }}
            animate={{ rotate: angle }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
          
          {/* Value display */}
          <span 
            className={cn('font-bold tabular-nums', sizeConfig.text)}
            style={{ color: enabled ? color : 'hsl(var(--muted-foreground))' }}
          >
            {Math.round(value * 100)}
          </span>
        </motion.div>
      </motion.div>

      {/* Editable label */}
      {isEditing ? (
        <input
          type="text"
          defaultValue={label}
          className={cn(
            'bg-muted/50 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-1',
            sizeConfig.label
          )}
          style={{ borderColor: color }}
          autoFocus
          onBlur={handleLabelBlur}
          onKeyDown={handleLabelKeyDown}
        />
      ) : (
        <button
          className={cn(
            'rounded-lg px-2 py-1 text-center truncate transition-all',
            'hover:bg-muted/50 active:scale-95',
            sizeConfig.label,
            !enabled && 'text-muted-foreground'
          )}
          onClick={handleLabelClick}
          title="Нажмите для редактирования"
        >
          {label}
        </button>
      )}

      {/* Enabled indicator */}
      <button
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center transition-all',
          'hover:scale-110 active:scale-95',
          enabled ? 'ring-2' : 'bg-muted/30'
        )}
        style={{
          backgroundColor: enabled ? `${color}30` : undefined,
          boxShadow: enabled ? `0 0 0 2px ${color}` : undefined,
        }}
        onClick={onToggle}
      >
        <motion.div
          className="w-2 h-2 rounded-full"
          animate={{
            backgroundColor: enabled ? color : 'hsl(var(--muted-foreground))',
            scale: enabled ? 1 : 0.6,
          }}
        />
      </button>
    </div>
  );
});
