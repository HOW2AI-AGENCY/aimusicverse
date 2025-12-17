/**
 * PromptKnobEnhanced - Professional rotary knob with touch support
 * Inspired by Google PromptDJ/Lyria RealTime MIDI controllers
 */

import { memo, useRef, useCallback, useState, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface PromptKnobEnhancedProps {
  value: number; // 0-1
  label: string;
  sublabel?: string;
  color: string;
  enabled: boolean;
  isActive?: boolean;
  onChange: (value: number) => void;
  onLabelClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const PromptKnobEnhanced = memo(function PromptKnobEnhanced({
  value,
  label,
  sublabel,
  color,
  enabled,
  isActive = false,
  onChange,
  onLabelClick,
  size = 'md',
}: PromptKnobEnhancedProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startAngleRef = useRef(0);
  const startValueRef = useRef(0);
  const centerRef = useRef({ x: 0, y: 0 });

  // Size configuration
  const sizeConfig = {
    sm: { outer: 64, inner: 48, indicator: 4, fontSize: 'text-[10px]', labelWidth: 'w-16' },
    md: { outer: 80, inner: 60, indicator: 5, fontSize: 'text-xs', labelWidth: 'w-20' },
    lg: { outer: 96, inner: 72, indicator: 6, fontSize: 'text-sm', labelWidth: 'w-24' },
  }[size];

  // Convert value to angle (270 degree range, starting from -135)
  const angle = value * 270 - 135;
  const arcLength = value * 0.75; // 0.75 = 270/360

  // Calculate angle from center
  const getAngleFromCenter = useCallback((clientX: number, clientY: number) => {
    const rect = knobRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  }, []);

  // Handle pointer down
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    e.preventDefault();
    
    const rect = knobRef.current?.getBoundingClientRect();
    if (rect) {
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    
    startAngleRef.current = getAngleFromCenter(e.clientX, e.clientY);
    startValueRef.current = value;
    setIsDragging(true);
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [enabled, value, getAngleFromCenter]);

  // Handle pointer move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const currentAngle = getAngleFromCenter(e.clientX, e.clientY);
    let deltaAngle = currentAngle - startAngleRef.current;
    
    // Handle angle wraparound
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    
    // Convert angle delta to value delta (270 degrees = 1.0)
    const deltaValue = deltaAngle / 270;
    const newValue = Math.max(0, Math.min(1, startValueRef.current + deltaValue));
    
    onChange(newValue);
  }, [isDragging, getAngleFromCenter, onChange]);

  // Handle pointer up
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // Handle touch events for mobile
  useEffect(() => {
    const knob = knobRef.current;
    if (!knob) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !enabled) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      const currentAngle = Math.atan2(
        touch.clientY - centerRef.current.y,
        touch.clientX - centerRef.current.x
      ) * (180 / Math.PI);
      
      let deltaAngle = currentAngle - startAngleRef.current;
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;
      
      const deltaValue = deltaAngle / 270;
      const newValue = Math.max(0, Math.min(1, startValueRef.current + deltaValue));
      onChange(newValue);
    };

    knob.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => knob.removeEventListener('touchmove', handleTouchMove);
  }, [isDragging, enabled, onChange]);

  return (
    <div className="flex flex-col items-center gap-2 select-none touch-none">
      {/* Knob container */}
      <motion.div
        ref={knobRef}
        className={cn(
          'relative cursor-pointer rounded-full',
          !enabled && 'opacity-40 cursor-not-allowed'
        )}
        style={{
          width: sizeConfig.outer,
          height: sizeConfig.outer,
        }}
        animate={{
          scale: isDragging ? 1.05 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Background ring */}
        <svg 
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'rotate(-135deg)' }}
        >
          {/* Track background */}
          <circle
            cx="50%"
            cy="50%"
            r={(sizeConfig.outer / 2) - 6}
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth="4"
            strokeDasharray={`${0.75 * Math.PI * (sizeConfig.outer - 12)} ${Math.PI * (sizeConfig.outer - 12)}`}
            strokeLinecap="round"
          />
          {/* Active arc */}
          <motion.circle
            cx="50%"
            cy="50%"
            r={(sizeConfig.outer / 2) - 6}
            fill="none"
            stroke={enabled ? color : 'hsl(var(--muted-foreground))'}
            strokeWidth="4"
            strokeLinecap="round"
            initial={false}
            animate={{
              strokeDasharray: `${arcLength * Math.PI * (sizeConfig.outer - 12)} ${Math.PI * (sizeConfig.outer - 12)}`,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{
              filter: enabled && isActive ? `drop-shadow(0 0 8px ${color})` : 'none',
            }}
          />
        </svg>

        {/* Inner knob */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: sizeConfig.inner,
            height: sizeConfig.inner,
            top: (sizeConfig.outer - sizeConfig.inner) / 2,
            left: (sizeConfig.outer - sizeConfig.inner) / 2,
            background: enabled
              ? `radial-gradient(circle at 30% 30%, hsl(var(--card)), hsl(var(--muted)))`
              : 'hsl(var(--muted))',
            boxShadow: enabled && isActive
              ? `0 0 20px ${color}60, inset 0 2px 4px rgba(255,255,255,0.1)`
              : 'inset 0 2px 4px rgba(255,255,255,0.05), 0 4px 8px rgba(0,0,0,0.2)',
          }}
        >
          {/* Rotation indicator */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: sizeConfig.indicator,
              height: sizeConfig.inner / 3,
              backgroundColor: enabled ? color : 'hsl(var(--muted-foreground))',
              top: 6,
              transformOrigin: 'center bottom',
              boxShadow: enabled ? `0 0 4px ${color}` : 'none',
            }}
            animate={{ rotate: angle }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
          
          {/* Value display */}
          <span 
            className={cn('font-bold tabular-nums mt-2', sizeConfig.fontSize)}
            style={{ color: enabled ? color : 'hsl(var(--muted-foreground))' }}
          >
            {Math.round(value * 100)}
          </span>
        </div>

        {/* Glow effect when active */}
        {enabled && isActive && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>

      {/* Label */}
      <button
        className={cn(
          'text-center truncate transition-all rounded-lg px-2 py-0.5',
          'hover:bg-muted/30 active:scale-95',
          sizeConfig.labelWidth,
          sizeConfig.fontSize,
          !enabled && 'text-muted-foreground'
        )}
        onClick={onLabelClick}
      >
        <div className="font-medium truncate">{label}</div>
        {sublabel && (
          <div className="text-[9px] text-muted-foreground truncate">{sublabel}</div>
        )}
      </button>

      {/* Enable indicator */}
      <button
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center transition-all',
          'hover:scale-110 active:scale-95',
        )}
        style={{
          backgroundColor: enabled ? `${color}30` : 'hsl(var(--muted) / 0.3)',
          boxShadow: enabled ? `0 0 0 2px ${color}` : 'none',
        }}
        onClick={onLabelClick}
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
