/**
 * RealisticKnob - Professional DJ-style rotary knob with vertical drag control
 * Features metallic texture, LED indicator, and optimized mobile touch handling
 */

import { memo, useRef, useCallback, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface RealisticKnobProps {
  value: number; // 0-1
  label: string;
  sublabel?: string;
  color: string;
  enabled: boolean;
  isActive?: boolean;
  onChange: (value: number) => void;
  onLabelClick?: () => void;
  onChangeStart?: () => void;
  onChangeEnd?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const DISABLED_COLOR = '#4b5563';
const NOTCH_COUNT = 11; // Number of grip notches on knob

export const RealisticKnob = memo(function RealisticKnob({
  value,
  label,
  sublabel,
  color,
  enabled,
  isActive = false,
  onChange,
  onLabelClick,
  onChangeStart,
  onChangeEnd,
  size = 'md',
}: RealisticKnobProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  
  // Motion values for smooth animation - use initial value only
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, { stiffness: 300, damping: 30 });
  const lastExternalValue = useRef(value);
  
  // Size configuration - larger touch targets for mobile
  const sizeConfig = {
    sm: { outer: 72, inner: 52, grip: 44, fontSize: 'text-[10px]', labelWidth: 'w-20', touchArea: 88 },
    md: { outer: 88, inner: 64, grip: 54, fontSize: 'text-xs', labelWidth: 'w-24', touchArea: 104 },
    lg: { outer: 104, inner: 76, grip: 64, fontSize: 'text-sm', labelWidth: 'w-28', touchArea: 120 },
  }[size];

  // Convert value to rotation angle (300 degree range, starting from -150)
  const angle = useTransform(springValue, [0, 1], [-150, 150]);
  const arcProgress = useTransform(springValue, [0, 1], [0, 0.833]); // 300/360 = 0.833
  
  const activeColor = enabled ? color : DISABLED_COLOR;

  // Update motion value only when external value changes significantly and not dragging
  useEffect(() => {
    // Skip if dragging or if value hasn't actually changed
    if (isDragging || Math.abs(value - lastExternalValue.current) < 0.001) {
      return;
    }
    lastExternalValue.current = value;
    motionValue.set(value);
  }, [value, isDragging]); // Remove motionValue from deps to prevent loops

  // Calculate new value from vertical movement - MUCH better for mobile
  const calculateNewValue = useCallback((currentY: number) => {
    // Vertical movement: drag up = increase, drag down = decrease
    // Sensitivity: 200px for full range
    const deltaY = startY.current - currentY;
    const sensitivity = 200;
    const deltaValue = deltaY / sensitivity;
    const newValue = Math.max(0, Math.min(1, startValue.current + deltaValue));
    return newValue;
  }, []);

  // Haptic feedback
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const durations = { light: 5, medium: 15, heavy: 30 };
      navigator.vibrate(durations[intensity]);
    }
  }, []);

  // Pointer handlers for desktop and mobile
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    startY.current = e.clientY;
    startValue.current = value;
    setIsDragging(true);
    onChangeStart?.();
    triggerHaptic('light');
    
    // Capture pointer for reliable tracking
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [enabled, value, onChangeStart, triggerHaptic]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const newValue = calculateNewValue(e.clientY);
    motionValue.set(newValue);
    onChange(newValue);
    
    // Haptic on value change at key points
    if (Math.abs(newValue - value) > 0.1) {
      triggerHaptic('light');
    }
  }, [isDragging, calculateNewValue, motionValue, onChange, value, triggerHaptic]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    setIsDragging(false);
    onChangeEnd?.();
    triggerHaptic('medium');
    
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [isDragging, onChangeEnd, triggerHaptic]);

  // Double-tap to reset
  const lastTapRef = useRef(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onChange(0.5);
      triggerHaptic('heavy');
    }
    lastTapRef.current = now;
  }, [onChange, triggerHaptic]);

  // Generate notch positions for metallic grip
  const notches = Array.from({ length: NOTCH_COUNT }, (_, i) => {
    const notchAngle = -150 + (300 / (NOTCH_COUNT - 1)) * i;
    return notchAngle;
  });

  // SVG arc path for progress indicator
  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <div 
      className="flex flex-col items-center gap-2 select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Touch area container - larger than visible knob */}
      <div
        ref={containerRef}
        className={cn(
          'relative cursor-grab active:cursor-grabbing',
          !enabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          width: sizeConfig.touchArea,
          height: sizeConfig.touchArea,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleDoubleTap}
      >
        {/* Centered knob visual */}
        <div
          className="absolute"
          style={{
            width: sizeConfig.outer,
            height: sizeConfig.outer,
            top: (sizeConfig.touchArea - sizeConfig.outer) / 2,
            left: (sizeConfig.touchArea - sizeConfig.outer) / 2,
          }}
        >
          {/* Background ring with tick marks */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {/* Track background */}
            <path
              d={createArcPath(-150, 150, 46)}
              fill="none"
              stroke="rgba(60, 60, 70, 0.6)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            
            {/* Active arc */}
            <motion.path
              d={createArcPath(-150, -150 + value * 300, 46)}
              fill="none"
              stroke={activeColor}
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                filter: enabled && isActive ? `drop-shadow(0 0 6px ${color})` : 'none',
              }}
              initial={false}
              animate={{ d: createArcPath(-150, -150 + value * 300, 46) }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            />
            
            {/* Tick marks */}
            {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
              const tickAngle = (-150 + tick * 300 - 90) * Math.PI / 180;
              const inner = 38;
              const outer = 42;
              return (
                <line
                  key={i}
                  x1={50 + inner * Math.cos(tickAngle)}
                  y1={50 + inner * Math.sin(tickAngle)}
                  x2={50 + outer * Math.cos(tickAngle)}
                  y2={50 + outer * Math.sin(tickAngle)}
                  stroke={tick <= value ? activeColor : 'rgba(100,100,110,0.5)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Inner metallic knob body */}
          <motion.div
            className="absolute rounded-full overflow-hidden"
            style={{
              width: sizeConfig.inner,
              height: sizeConfig.inner,
              top: (sizeConfig.outer - sizeConfig.inner) / 2,
              left: (sizeConfig.outer - sizeConfig.inner) / 2,
              background: `
                radial-gradient(ellipse 80% 50% at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 70% 80%, rgba(0,0,0,0.3) 0%, transparent 50%),
                linear-gradient(145deg, #3a3a42 0%, #28282e 50%, #1e1e22 100%)
              `,
              boxShadow: `
                0 4px 12px rgba(0,0,0,0.5),
                inset 0 1px 2px rgba(255,255,255,0.1),
                inset 0 -2px 4px rgba(0,0,0,0.2)
                ${enabled && isActive ? `, 0 0 20px ${color}40` : ''}
              `,
            }}
            animate={{
              scale: isDragging ? 1.02 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Grip texture - ridges around edge */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                width: sizeConfig.grip,
                height: sizeConfig.grip,
                top: (sizeConfig.inner - sizeConfig.grip) / 2,
                left: (sizeConfig.inner - sizeConfig.grip) / 2,
              }}
              animate={{ rotate: -150 + value * 300 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
              {/* Grip notches */}
              {notches.map((notchAngle, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    width: 2,
                    height: 6,
                    backgroundColor: 'rgba(80,80,90,0.8)',
                    borderRadius: 1,
                    top: 2,
                    left: '50%',
                    marginLeft: -1,
                    transformOrigin: `center ${sizeConfig.grip / 2 - 2}px`,
                    transform: `rotate(${notchAngle}deg)`,
                  }}
                />
              ))}
              
              {/* Center indicator line */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 3,
                  height: sizeConfig.grip / 3,
                  backgroundColor: activeColor,
                  top: 4,
                  left: '50%',
                  marginLeft: -1.5,
                  boxShadow: enabled ? `0 0 8px ${color}` : 'none',
                }}
              />
            </motion.div>

            {/* Center cap with value display */}
            <div
              className="absolute rounded-full flex items-center justify-center"
              style={{
                width: sizeConfig.grip * 0.6,
                height: sizeConfig.grip * 0.6,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'linear-gradient(145deg, #2a2a30 0%, #1a1a1e 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 1px rgba(255,255,255,0.05)',
              }}
            >
              <span 
                className={cn('font-bold tabular-nums', sizeConfig.fontSize)}
                style={{ color: activeColor }}
              >
                {Math.round(value * 100)}
              </span>
            </div>
          </motion.div>

          {/* Glow effect when active */}
          {enabled && isActive && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${color}15 0%, transparent 60%)`,
              }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* Drag hint indicator (shows on touch start) */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center text-muted-foreground/50 text-[10px]">
              <span className="-mt-1">↑</span>
              <span className="mt-8">↓</span>
            </div>
          </div>
        )}
      </div>

      {/* Label button */}
      <button
        className={cn(
          'text-center truncate transition-all rounded-lg px-2 py-1',
          'hover:bg-white/5 active:scale-95',
          sizeConfig.labelWidth,
          sizeConfig.fontSize,
          !enabled && 'opacity-50'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onLabelClick?.();
        }}
      >
        <div className="font-medium truncate">{label}</div>
        {sublabel && (
          <div className="text-[9px] opacity-60 truncate">{sublabel}</div>
        )}
      </button>

      {/* LED indicator */}
      <div
        className="w-3 h-3 rounded-full transition-all"
        style={{
          backgroundColor: enabled ? `${color}40` : 'rgba(75,85,99,0.3)',
          boxShadow: enabled && isActive 
            ? `0 0 10px ${color}, 0 0 20px ${color}60, 0 0 0 2px ${color}` 
            : enabled 
            ? `0 0 4px ${color}40, 0 0 0 2px ${color}`
            : `0 0 0 2px ${DISABLED_COLOR}`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onLabelClick?.();
        }}
      />
    </div>
  );
});
