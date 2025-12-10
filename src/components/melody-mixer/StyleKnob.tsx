/**
 * StyleKnob - Rotary control for style weight
 * DJ-style knob with glow effects
 */

import { memo, useRef, useCallback, useState } from 'react';
import { motion } from '@/lib/motion';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface StyleKnobProps {
  value: number; // 0-1
  color: string;
  label: string;
  enabled: boolean;
  isActive?: boolean; // For audio-reactive glow
  onChange: (value: number) => void;
  onToggle: () => void;
  onLabelChange?: (label: string) => void;
  className?: string;
}

export const StyleKnob = memo(function StyleKnob({
  value,
  color,
  label,
  enabled,
  isActive = false,
  onChange,
  onToggle,
  onLabelChange,
  className,
}: StyleKnobProps) {
  const haptic = useHapticFeedback();
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  // Convert value to angle (0-270 degrees)
  const angle = value * 270 - 135;

  // Handle drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    haptic.impact('light');
  }, [enabled, value, haptic]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaY = startYRef.current - e.clientY;
    const sensitivity = 0.005;
    const newValue = Math.max(0, Math.min(1, startValueRef.current + deltaY * sensitivity));
    
    onChange(newValue);
  }, [isDragging, onChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    haptic.tap();
  }, [haptic]);

  // Handle double-click to edit label
  const handleDoubleClick = useCallback(() => {
    if (onLabelChange) {
      setIsEditing(true);
    }
  }, [onLabelChange]);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Knob container */}
      <motion.div
        ref={knobRef}
        className={cn(
          'relative w-20 h-20 rounded-full cursor-pointer',
          'bg-gradient-to-b from-muted to-muted/50',
          'border-2',
          !enabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          borderColor: enabled ? color : 'hsl(var(--muted-foreground))',
          boxShadow: isActive && enabled
            ? `0 0 30px ${color}, 0 0 60px ${color}50`
            : enabled 
              ? `0 0 ${value * 20}px ${color}50`
              : 'none',
        }}
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 0.3,
          repeat: isActive ? Infinity : 0,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={e => {
          if (e.detail === 2) return; // Ignore double-clicks
          // Toggle on single click if not dragging
        }}
      >
        {/* Track ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="35"
            fill="none"
            stroke="hsl(var(--muted-foreground) / 0.2)"
            strokeWidth="4"
            strokeDasharray={`${0.75 * 2 * Math.PI * 35} ${2 * Math.PI * 35}`}
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="35"
            fill="none"
            stroke={enabled ? color : 'hsl(var(--muted-foreground))'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${value * 0.75 * 2 * Math.PI * 35} ${2 * Math.PI * 35}`}
            initial={false}
            animate={{ strokeDasharray: `${value * 0.75 * 2 * Math.PI * 35} ${2 * Math.PI * 35}` }}
          />
        </svg>

        {/* Knob indicator */}
        <motion.div
          className="absolute inset-2 rounded-full bg-card flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 30% 30%, hsl(var(--card)), hsl(var(--muted)))`,
          }}
        >
          <motion.div
            className="absolute w-1 h-4 rounded-full top-3"
            style={{ backgroundColor: enabled ? color : 'hsl(var(--muted-foreground))' }}
            animate={{ rotate: angle }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          
          {/* Value display */}
          <span className="text-xs font-bold mt-2" style={{ color: enabled ? color : undefined }}>
            {Math.round(value * 100)}
          </span>
        </motion.div>
      </motion.div>

      {/* Label */}
      {isEditing ? (
        <input
          type="text"
          defaultValue={label}
          className="w-20 text-xs text-center bg-muted rounded px-1 py-0.5"
          autoFocus
          onBlur={e => {
            onLabelChange?.(e.target.value);
            setIsEditing(false);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onLabelChange?.(e.currentTarget.value);
              setIsEditing(false);
            }
            if (e.key === 'Escape') {
              setIsEditing(false);
            }
          }}
        />
      ) : (
        <button
          className={cn(
            'text-xs text-center truncate w-20 px-1 py-0.5 rounded',
            'hover:bg-muted/50 transition-colors',
            !enabled && 'text-muted-foreground'
          )}
          onClick={onToggle}
          onDoubleClick={handleDoubleClick}
          title={label}
        >
          {label}
        </button>
      )}

      {/* Enabled indicator */}
      <motion.div
        className="w-2 h-2 rounded-full"
        animate={{
          backgroundColor: enabled ? color : 'hsl(var(--muted-foreground))',
          scale: enabled && value > 0 ? 1 : 0.7,
        }}
      />
    </div>
  );
});
